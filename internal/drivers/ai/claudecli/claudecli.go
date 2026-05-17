package claudecli

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os/exec"
	"strings"

	"hyperion-desktop/internal/domain/ai"
)

type Provider struct {
	binary string
}

func New() *Provider {
	return &Provider{binary: "claude"}
}

func (p *Provider) Name() string        { return "claude-cli" }
func (p *Provider) DisplayName() string { return "Claude Code CLI" }

func (p *Provider) IsAvailable(_ context.Context) error {
	if _, err := exec.LookPath(p.binary); err != nil {
		return fmt.Errorf("claude binary not found in PATH")
	}
	return nil
}

func (p *Provider) Capabilities() ai.Capabilities {
	return ai.Capabilities{
		Streaming:   false,
		Vision:      true,
		Tools:       true,
		Thinking:    true,
		PromptCache: true,
	}
}

func (p *Provider) Models(_ context.Context) ([]ai.ModelInfo, error) {
	return []ai.ModelInfo{
		{ID: "claude-opus-4-7", Name: "Claude Opus 4.7", ContextSize: 1_000_000, Default: true},
		{ID: "claude-sonnet-4-6", Name: "Claude Sonnet 4.6", ContextSize: 1_000_000},
		{ID: "claude-haiku-4-5", Name: "Claude Haiku 4.5", ContextSize: 200_000},
	}, nil
}

func (p *Provider) Generate(ctx context.Context, in ai.GenerateInput) (*ai.GenerateOutput, error) {
	prompt := buildPrompt(in)
	if prompt == "" {
		return nil, errors.New("claude-cli: empty prompt")
	}

	args := []string{"-p", prompt}
	if in.Model != "" {
		args = append(args, "--model", in.Model)
	}

	var stdout, stderr bytes.Buffer
	cmd := exec.CommandContext(ctx, p.binary, args...)
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		msg := strings.TrimSpace(stderr.String())
		if msg == "" {
			msg = err.Error()
		}
		return nil, fmt.Errorf("claude-cli: %s", msg)
	}

	return &ai.GenerateOutput{
		Content: strings.TrimSpace(stdout.String()),
		Model:   in.Model,
	}, nil
}

func buildPrompt(in ai.GenerateInput) string {
	var b strings.Builder
	if in.System != "" {
		b.WriteString(in.System)
		b.WriteString("\n\n")
	}
	for _, m := range in.Messages {
		switch m.Role {
		case ai.RoleUser:
			b.WriteString(m.Content)
			b.WriteString("\n")
		case ai.RoleAssistant:
			b.WriteString("Assistant: ")
			b.WriteString(m.Content)
			b.WriteString("\n")
		}
	}
	return strings.TrimSpace(b.String())
}
