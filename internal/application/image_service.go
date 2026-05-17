package application

import (
	"context"
	"fmt"

	"hyperion-desktop/internal/domain/image"
	driverimage "hyperion-desktop/internal/drivers/image"
	"hyperion-desktop/internal/infrastructure/assets"
)

type ImageService struct {
	registry *driverimage.Registry
	store    *assets.Store
}

func NewImageService(registry *driverimage.Registry, store *assets.Store) *ImageService {
	return &ImageService{registry: registry, store: store}
}

type GenerateImageRequest struct {
	Provider string        `json:"provider"`
	Model    string        `json:"model"`
	Prompt   string        `json:"prompt"`
	Size     string        `json:"size"`
	Quality  image.Quality `json:"quality"`
	Kind     image.Kind    `json:"kind"`
}

func (s *ImageService) Generate(ctx context.Context, req GenerateImageRequest) (*image.GeneratedImage, error) {
	if req.Provider == "" {
		return nil, fmt.Errorf("provider required")
	}
	if req.Prompt == "" {
		return nil, fmt.Errorf("prompt required")
	}
	p, err := s.registry.Get(req.Provider)
	if err != nil {
		return nil, err
	}
	if err := p.IsAvailable(ctx); err != nil {
		return nil, fmt.Errorf("provider %q unavailable: %w", req.Provider, err)
	}

	in := image.GenerateInput{
		Model:   req.Model,
		Prompt:  req.Prompt,
		Size:    req.Size,
		Quality: req.Quality,
		Kind:    req.Kind,
	}
	data, mime, err := p.Generate(ctx, in)
	if err != nil {
		return nil, err
	}

	meta := image.GeneratedImage{
		Prompt:   req.Prompt,
		Model:    req.Model,
		Provider: req.Provider,
		Size:     req.Size,
		Quality:  req.Quality,
		Kind:     req.Kind,
	}
	return s.store.Save(data, mime, meta)
}

func (s *ImageService) List() []image.GeneratedImage {
	return s.store.List()
}

func (s *ImageService) Get(id string) (*image.GeneratedImage, error) {
	return s.store.Get(id)
}

func (s *ImageService) Delete(id string) error {
	return s.store.Delete(id)
}

func (s *ImageService) ListProviders(ctx context.Context) []driverimage.ProviderInfo {
	return s.registry.List(ctx)
}
