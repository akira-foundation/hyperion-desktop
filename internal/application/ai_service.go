package application

import (
	"context"
	"fmt"

	"hyperion-desktop/internal/domain/ai"
	driverai "hyperion-desktop/internal/drivers/ai"
)

type AIService struct {
	registry *driverai.Registry
}

func NewAIService(registry *driverai.Registry) *AIService {
	return &AIService{registry: registry}
}

func (s *AIService) Generate(ctx context.Context, providerName string, in ai.GenerateInput) (*ai.GenerateOutput, error) {
	p, err := s.registry.Get(providerName)
	if err != nil {
		return nil, fmt.Errorf("ai generate: %w", err)
	}
	return p.Generate(ctx, in)
}

func (s *AIService) Providers() []string {
	return s.registry.Names()
}
