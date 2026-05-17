package openai

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

func (p *Provider) Name() string { return "openai" }

func (p *Provider) Generate(_ context.Context, _ ai.GenerateInput) (*ai.GenerateOutput, error) {
	if p.apiKey == "" {
		return nil, errors.New("openai: missing api key")
	}
	return nil, errors.New("openai: not implemented")
}
