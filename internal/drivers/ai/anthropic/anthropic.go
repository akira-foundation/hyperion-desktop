package anthropic

import (
	"context"
	"errors"

	"hyperion-desktop/internal/domain/ai"
)

type Provider struct {
	apiKey string
}

func New(apiKey string) *Provider {
	return &Provider{apiKey: apiKey}
}

func (p *Provider) Name() string { return "anthropic" }

func (p *Provider) Generate(_ context.Context, _ ai.GenerateInput) (*ai.GenerateOutput, error) {
	if p.apiKey == "" {
		return nil, errors.New("anthropic: missing api key")
	}
	return nil, errors.New("anthropic: not implemented")
}
