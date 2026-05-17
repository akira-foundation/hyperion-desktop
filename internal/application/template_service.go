package application

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"

	"hyperion-desktop/internal/domain/template"
	"hyperion-desktop/internal/infrastructure/usertemplates"
	"hyperion-desktop/internal/ports"
)

type TemplateService struct {
	store    *usertemplates.Store
	renderer ports.Renderer
	baseURL  string
}

func NewTemplateService(store *usertemplates.Store, renderer ports.Renderer, baseURL string) *TemplateService {
	return &TemplateService{store: store, renderer: renderer, baseURL: baseURL}
}

type SaveTemplateInput struct {
	SourceDir   string        `json:"sourceDir"`
	Name        string        `json:"name"`
	Description string        `json:"description"`
	Category    string        `json:"category"`
	Source      string        `json:"source"`
	Size        template.Size `json:"size"`
}

func (s *TemplateService) Save(in SaveTemplateInput) (*template.RuntimeTemplate, error) {
	if in.SourceDir == "" {
		return nil, fmt.Errorf("sourceDir required")
	}
	if in.Name == "" {
		in.Name = filepath.Base(in.SourceDir)
		in.Name = strings.TrimPrefix(in.Name, "marketing.")
		in.Name = strings.ReplaceAll(in.Name, "-", " ")
		in.Name = strings.Title(in.Name) //nolint:staticcheck
	}
	if in.Source == "" {
		in.Source = "import"
	}
	return s.store.ImportFromFolder(in.SourceDir, in.Name, in.Description, in.Category, in.Source, in.Size)
}

func (s *TemplateService) List() ([]template.RuntimeTemplate, error) {
	return s.store.List()
}

func (s *TemplateService) Get(id string) (*template.RuntimeTemplate, error) {
	return s.store.Get(id)
}

func (s *TemplateService) Delete(id string) error {
	return s.store.Delete(id)
}

func (s *TemplateService) Dir() string {
	return s.store.Dir()
}

func (s *TemplateService) ReadFile(id, filename string) (string, error) {
	return s.store.ReadFile(id, filename)
}

func (s *TemplateService) WriteFile(id, filename, content string) error {
	return s.store.WriteFile(id, filename, content)
}

func (s *TemplateService) RenderUserSlide(ctx context.Context, id string, slideIndex int) ([]byte, error) {
	t, err := s.store.Get(id)
	if err != nil {
		return nil, err
	}
	if slideIndex < 0 || slideIndex >= len(t.Slides) {
		return nil, fmt.Errorf("slide index out of range")
	}
	url := fmt.Sprintf("%s/user-templates/%s/%s", s.baseURL, t.Slug, t.Slides[slideIndex].Filename)
	return s.renderer.RenderURL(ctx, url, t.Size)
}

func (s *TemplateService) RenderUserCarousel(ctx context.Context, id string) ([][]byte, error) {
	t, err := s.store.Get(id)
	if err != nil {
		return nil, err
	}
	out := make([][]byte, 0, len(t.Slides))
	for i, slide := range t.Slides {
		url := fmt.Sprintf("%s/user-templates/%s/%s", s.baseURL, t.Slug, slide.Filename)
		png, err := s.renderer.RenderURL(ctx, url, t.Size)
		if err != nil {
			return nil, fmt.Errorf("slide %d: %w", i, err)
		}
		out = append(out, png)
	}
	return out, nil
}
