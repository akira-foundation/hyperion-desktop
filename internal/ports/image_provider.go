package ports

import (
	"context"

	"hyperion-desktop/internal/domain/image"
)

type ImageProvider interface {
	Name() string
	DisplayName() string
	IsAvailable(ctx context.Context) error
	Capabilities() image.Capabilities
	Models(ctx context.Context) ([]image.ModelInfo, error)
	Generate(ctx context.Context, in image.GenerateInput) (data []byte, mime string, err error)
}
