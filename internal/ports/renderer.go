package ports

import (
	"context"

	"hyperion-desktop/internal/domain/template"
)

type Renderer interface {
	Name() string
	Render(ctx context.Context, req template.RenderRequest) ([]byte, error)
}
