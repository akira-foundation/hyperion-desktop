package ports

import (
	"context"

	"hyperion-desktop/internal/domain/ai"
)

type AIProvider interface {
	Name() string
	Generate(ctx context.Context, in ai.GenerateInput) (*ai.GenerateOutput, error)
}
