package ports

import (
	"context"

	"hyperion-desktop/internal/domain/ai"
)

type AIProvider interface {
	Name() string
	DisplayName() string
	IsAvailable(ctx context.Context) error
	Capabilities() ai.Capabilities
	Models(ctx context.Context) ([]ai.ModelInfo, error)
	Generate(ctx context.Context, in ai.GenerateInput) (*ai.GenerateOutput, error)
}
