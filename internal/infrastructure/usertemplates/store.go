package usertemplates

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"

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
		return nil, err
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

func (s *Store) SetGeneration(id string, gen *template.GenerationRecord) error {
	t, err := s.Get(id)
	if err != nil {
		return err
	}
	t.Generation = gen
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.writeManifest(t)
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
