package anthropic

import (
	"context"
	"errors"
	"fmt"

	sdk "github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"

	"hyperion-desktop/internal/domain/ai"
)

type Provider struct {
	apiKey string
	client *sdk.Client
}

func New(apiKey string) *Provider {
	p := &Provider{apiKey: apiKey}
	if apiKey != "" {
		c := sdk.NewClient(option.WithAPIKey(apiKey))
		p.client = &c
	}
	return p
}

func (p *Provider) Name() string        { return "anthropic-api" }
func (p *Provider) DisplayName() string { return "Anthropic API" }

func (p *Provider) IsAvailable(_ context.Context) error {
	if p.apiKey == "" {
		return errors.New("anthropic: missing ANTHROPIC_API_KEY")
	}
	return nil
}

func (p *Provider) Capabilities() ai.Capabilities {
	return ai.Capabilities{
		Streaming:   true,
		Vision:      true,
		Tools:       true,
		Thinking:    true,
		PromptCache: true,
	}
}

func (p *Provider) Models(_ context.Context) ([]ai.ModelInfo, error) {
	return []ai.ModelInfo{
		{ID: string(sdk.ModelClaudeOpus4_7), Name: "Claude Opus 4.7", ContextSize: 1_000_000, Default: true},
		{ID: string(sdk.ModelClaudeSonnet4_6), Name: "Claude Sonnet 4.6", ContextSize: 1_000_000},
		{ID: string(sdk.ModelClaudeHaiku4_5_20251001), Name: "Claude Haiku 4.5", ContextSize: 200_000},
	}, nil
}

func (p *Provider) Generate(ctx context.Context, in ai.GenerateInput) (*ai.GenerateOutput, error) {
	if p.client == nil {
		return nil, errors.New("anthropic: missing api key")
	}

	model := in.Model
	if model == "" {
		model = string(sdk.ModelClaudeOpus4_7)
	}

	maxTokens := in.MaxTokens
	if maxTokens <= 0 {
		maxTokens = 16000
	}

	params := sdk.MessageNewParams{
		Model:     sdk.Model(model),
		MaxTokens: int64(maxTokens),
		Messages:  toSDKMessages(in.Messages),
	}

	if in.System != "" {
		params.System = []sdk.TextBlockParam{{
			Text:         in.System,
			CacheControl: sdk.NewCacheControlEphemeralParam(),
		}}
	}

	resp, err := p.client.Messages.New(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("anthropic: %w", err)
	}

	var content string
	for _, block := range resp.Content {
		if tb, ok := block.AsAny().(sdk.TextBlock); ok {
			content += tb.Text
		}
	}

	return &ai.GenerateOutput{
		Content:      content,
		InputTokens:  int(resp.Usage.InputTokens),
		OutputTokens: int(resp.Usage.OutputTokens),
		CacheRead:    int(resp.Usage.CacheReadInputTokens),
		CacheWrite:   int(resp.Usage.CacheCreationInputTokens),
		Model:        string(resp.Model),
	}, nil
}

func toSDKMessages(msgs []ai.Message) []sdk.MessageParam {
	out := make([]sdk.MessageParam, 0, len(msgs))
	for _, m := range msgs {
		switch m.Role {
		case ai.RoleUser:
			out = append(out, sdk.NewUserMessage(sdk.NewTextBlock(m.Content)))
		case ai.RoleAssistant:
			out = append(out, sdk.NewAssistantMessage(sdk.NewTextBlock(m.Content)))
		}
	}
	return out
}
