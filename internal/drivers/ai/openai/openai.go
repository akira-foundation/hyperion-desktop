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

func (p *Provider) Name() string        { return "openai-api" }
func (p *Provider) DisplayName() string { return "OpenAI API" }

func (p *Provider) IsAvailable(_ context.Context) error {
	if p.apiKey == "" {
		return errors.New("openai: missing OPENAI_API_KEY")
	}
	return errors.New("openai: driver not implemented yet")
}

func (p *Provider) Capabilities() ai.Capabilities {
	return ai.Capabilities{
		Streaming:   true,
		Vision:      true,
		Tools:       true,
		Thinking:    false,
		PromptCache: false,
	}
}

func (p *Provider) Models(_ context.Context) ([]ai.ModelInfo, error) {
	return []ai.ModelInfo{
		{ID: "gpt-5.1", Name: "GPT-5.1", ContextSize: 400_000, Default: true},
		{ID: "gpt-5.1-mini", Name: "GPT-5.1 Mini", ContextSize: 400_000},
	}, nil
}

func (p *Provider) Generate(_ context.Context, _ ai.GenerateInput) (*ai.GenerateOutput, error) {
	return nil, errors.New("openai: not implemented")
}
