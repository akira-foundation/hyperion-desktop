package application

import (
	"context"
	"fmt"

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

func (s *RenderService) RenderCarousel(
	ctx context.Context,
	req template.CarouselRenderRequest,
) ([][]byte, error) {
	if req.SlideCount <= 0 {
		return nil, fmt.Errorf("carousel: slide count must be > 0")
	}
	out := make([][]byte, 0, req.SlideCount)
	for i := 0; i < req.SlideCount; i++ {
		png, err := s.renderer.Render(ctx, template.RenderRequest{
			TemplateID: req.TemplateID,
			Props:      req.Payload,
			Size:       req.Size,
			SlideIndex: i,
		})
		if err != nil {
			return nil, fmt.Errorf("carousel slide %d: %w", i, err)
		}
		out = append(out, png)
	}
	return out, nil
}
