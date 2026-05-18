package usertemplates

import (
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"

	"hyperion-desktop/internal/domain/template"
)

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

	formats := []template.Format{template.FormatFeed}
	formatSizes := map[template.Format]template.Size{}
	hasStory := false
	for _, s := range slides {
		if _, ok := s.Files[template.FormatStory]; ok {
			hasStory = true
			break
		}
	}
	if hasStory {
		formats = append(formats, template.FormatStory)
		formatSizes[template.FormatStory] = template.Size{Width: 1080, Height: 1920}
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
		Formats:     formats,
		FormatSizes: formatSizes,
		CreatedAt:   time.Now().UTC(),
	}

	if err := s.writeManifest(t); err != nil {
		_ = os.RemoveAll(destDir)
		return nil, err
	}
	return t, nil
}

var (
	slideFeedRe  = regexp.MustCompile(`^slide-(\d+)\.html?$`)
	slideStoryRe = regexp.MustCompile(`^slide-(\d+)-story\.html?$`)
)

func copyTemplateFiles(src, dst string) ([]template.RuntimeSlide, []string, error) {
	entries, err := os.ReadDir(src)
	if err != nil {
		return nil, nil, fmt.Errorf("read source: %w", err)
	}

	feedByIndex := map[int]string{}
	storyByIndex := map[int]string{}
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
		lower := strings.ToLower(name)
		if m := slideStoryRe.FindStringSubmatch(lower); m != nil {
			idx, _ := atoi(m[1])
			storyByIndex[idx-1] = name
			continue
		}
		if m := slideFeedRe.FindStringSubmatch(lower); m != nil {
			idx, _ := atoi(m[1])
			feedByIndex[idx-1] = name
			continue
		}
		assets = append(assets, name)
	}

	keys := make([]int, 0, len(feedByIndex))
	for k := range feedByIndex {
		keys = append(keys, k)
	}
	sort.Ints(keys)

	slides := make([]template.RuntimeSlide, 0, len(keys))
	for i, k := range keys {
		slide := template.RuntimeSlide{
			Index:    i,
			Filename: feedByIndex[k],
		}
		if storyName, ok := storyByIndex[k]; ok {
			slide.Files = map[template.Format]string{
				template.FormatFeed:  feedByIndex[k],
				template.FormatStory: storyName,
			}
		}
		slides = append(slides, slide)
	}
	return slides, assets, nil
}

func atoi(s string) (int, error) {
	n := 0
	for _, c := range s {
		if c < '0' || c > '9' {
			return 0, fmt.Errorf("not numeric: %q", s)
		}
		n = n*10 + int(c-'0')
	}
	return n, nil
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
