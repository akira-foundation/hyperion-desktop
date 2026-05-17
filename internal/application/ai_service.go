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

type GenerateRequest struct {
	Provider  string       `json:"provider"`
	Model     string       `json:"model"`
	System    string       `json:"system"`
	Messages  []ai.Message `json:"messages"`
	MaxTokens int          `json:"maxTokens"`
}

func (s *AIService) Generate(ctx context.Context, req GenerateRequest) (*ai.GenerateOutput, error) {
	if req.Provider == "" {
		return nil, fmt.Errorf("provider required")
	}
	if len(req.Messages) == 0 {
		return nil, fmt.Errorf("messages required")
	}

	p, err := s.registry.Get(req.Provider)
	if err != nil {
		return nil, err
	}
	if err := p.IsAvailable(ctx); err != nil {
		return nil, fmt.Errorf("provider %q unavailable: %w", req.Provider, err)
	}

	return p.Generate(ctx, ai.GenerateInput{
		Model:     req.Model,
		System:    req.System,
		Messages:  req.Messages,
		MaxTokens: req.MaxTokens,
	})
}

func (s *AIService) ListProviders(ctx context.Context) []driverai.ProviderInfo {
	return s.registry.List(ctx)
}
