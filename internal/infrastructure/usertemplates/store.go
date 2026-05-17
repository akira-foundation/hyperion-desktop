package usertemplates

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"

	"hyperion-desktop/internal/domain/template"
)

const manifestName = "manifest.json"

type Store struct {
	mu  sync.RWMutex
	dir string
}

func NewStore(dir string) (*Store, error) {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, fmt.Errorf("usertemplates mkdir: %w", err)
	}
	return &Store{dir: dir}, nil
}

func (s *Store) Dir() string { return s.dir }

func (s *Store) List() ([]template.RuntimeTemplate, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	entries, err := os.ReadDir(s.dir)
	if err != nil {
		return nil, fmt.Errorf("read user templates dir: %w", err)
	}

	out := make([]template.RuntimeTemplate, 0, len(entries))
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		t, err := s.readManifest(e.Name())
		if err != nil {
			continue
		}
		out = append(out, *t)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].CreatedAt.After(out[j].CreatedAt) })
	return out, nil
}

func (s *Store) Get(id string) (*template.RuntimeTemplate, error) {
	list, err := s.List()
	if err != nil {
		return nil, err
	}
	for _, t := range list {
		if t.ID == id {
			return &t, nil
		}
	}
	return nil, fmt.Errorf("template %q not found", id)
}

func (s *Store) Delete(id string) error {
	t, err := s.Get(id)
	if err != nil {
		return err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	return os.RemoveAll(filepath.Join(s.dir, t.Slug))
}

func (s *Store) FilePath(slug, file string) string {
	return filepath.Join(s.dir, slug, file)
}

func (s *Store) ReadFile(id, filename string) (string, error) {
	t, err := s.Get(id)
	if err != nil {
		return "", err
	}
	if !s.fileBelongs(t, filename) {
		return "", fmt.Errorf("file %q not part of template", filename)
	}
	data, err := os.ReadFile(filepath.Join(s.dir, t.Slug, filename))
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func (s *Store) WriteFile(id, filename, content string) error {
	t, err := s.Get(id)
	if err != nil {
		return err
	}
	if !s.fileBelongs(t, filename) {
		return fmt.Errorf("file %q not part of template", filename)
	}
	return os.WriteFile(filepath.Join(s.dir, t.Slug, filename), []byte(content), 0o644)
}

func (s *Store) fileBelongs(t *template.RuntimeTemplate, filename string) bool {
	if strings.Contains(filename, "/") || strings.Contains(filename, "..") {
		return false
	}
	for _, slide := range t.Slides {
		if slide.Filename == filename {
			return true
		}
	}
	for _, a := range t.Assets {
		if a == filename {
			return true
		}
	}
	return false
}

// ImportFromFolder copies HTML/CSS files from sourceDir into a new user template.
// Detects slide-N.html pattern, sets size from first slide if specified via meta size param.
func (s *Store) ImportFromFolder(sourceDir, name, description, category, source string, size template.Size) (*template.RuntimeTemplate, error) {
	if _, err := os.Stat(sourceDir); err != nil {
		return nil, fmt.Errorf("source dir: %w", err)
	}

	slug := slugify(name)
	if slug == "" {
		return nil, errors.New("invalid name")
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	destDir := filepath.Join(s.dir, slug)
	if _, err := os.Stat(destDir); err == nil {
		slug = fmt.Sprintf("%s-%s", slug, uuid.NewString()[:6])
		destDir = filepath.Join(s.dir, slug)
	}
	if err := os.MkdirAll(destDir, 0o755); err != nil {
		return nil, fmt.Errorf("create template dir: %w", err)
	}

	slides, assets, err := copyTemplateFiles(sourceDir, destDir)
	if err != nil {
		_ = os.RemoveAll(destDir)
		return nil, err
	}

	if len(slides) == 0 {
		_ = os.RemoveAll(destDir)
		return nil, errors.New("no slide-*.html files found")
	}

	kind := template.RuntimeKindCarousel
	if len(slides) == 1 {
		kind = template.RuntimeKindSingle
	}

	if size.Width == 0 || size.Height == 0 {
		size = template.Size{Width: 1080, Height: 1080}
	}

	t := &template.RuntimeTemplate{
		ID:          uuid.NewString(),
		Slug:        slug,
		Name:        name,
		Description: description,
		Category:    category,
		Kind:        kind,
		Size:        size,
		Source:      source,
		Slides:      slides,
		Assets:      assets,
		CreatedAt:   time.Now().UTC(),
	}

	if err := s.writeManifest(t); err != nil {
		_ = os.RemoveAll(destDir)
		return nil, err
	}
	return t, nil
}

func (s *Store) readManifest(slug string) (*template.RuntimeTemplate, error) {
	path := filepath.Join(s.dir, slug, manifestName)
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var t template.RuntimeTemplate
	if err := json.Unmarshal(data, &t); err != nil {
		return nil, err
	}
	return &t, nil
}

func (s *Store) writeManifest(t *template.RuntimeTemplate) error {
	path := filepath.Join(s.dir, t.Slug, manifestName)
	data, err := json.MarshalIndent(t, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0o644)
}

var slideRe = regexp.MustCompile(`^slide-(\d+)\.html?$`)

func copyTemplateFiles(src, dst string) ([]template.RuntimeSlide, []string, error) {
	entries, err := os.ReadDir(src)
	if err != nil {
		return nil, nil, fmt.Errorf("read source: %w", err)
	}

	var slides []template.RuntimeSlide
	var assets []string
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		name := e.Name()
		ext := strings.ToLower(filepath.Ext(name))
		if ext != ".html" && ext != ".htm" && ext != ".css" {
			continue
		}
		if err := copyFile(filepath.Join(src, name), filepath.Join(dst, name)); err != nil {
			return nil, nil, fmt.Errorf("copy %s: %w", name, err)
		}
		if m := slideRe.FindStringSubmatch(strings.ToLower(name)); m != nil {
			slides = append(slides, template.RuntimeSlide{Filename: name})
		} else {
			assets = append(assets, name)
		}
	}
	sort.Slice(slides, func(i, j int) bool { return slides[i].Filename < slides[j].Filename })
	for i := range slides {
		slides[i].Index = i
	}
	return slides, assets, nil
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, in)
	return err
}

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = regexp.MustCompile(`[^a-z0-9]+`).ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if len(s) > 60 {
		s = s[:60]
	}
	return s
}
