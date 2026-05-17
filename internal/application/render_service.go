package application

import (
	"context"

	"hyperion-desktop/internal/domain/template"
	"hyperion-desktop/internal/ports"
)

type RenderService struct {
	renderer ports.Renderer
}

func NewRenderService(renderer ports.Renderer) *RenderService {
	return &RenderService{renderer: renderer}
}

func (s *RenderService) Render(ctx context.Context, req template.RenderRequest) ([]byte, error) {
	return s.renderer.Render(ctx, req)
}
