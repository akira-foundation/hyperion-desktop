package claudecli

import (
	"bufio"
	"bytes"
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"hyperion-desktop/internal/domain/ai"
	"hyperion-desktop/internal/ports"
)

type Provider struct{}

func New() *Provider { return &Provider{} }

func (p *Provider) Name() string        { return "claude-cli" }
func (p *Provider) DisplayName() string { return "Claude Code CLI" }

func (p *Provider) IsAvailable(_ context.Context) error {
	if _, err := resolveBinary(); err != nil {
		return err
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
		{ID: "claude-opus-4-7", Name: "Claude Opus 4.7", ContextSize: 1_000_000, Default: true},
		{ID: "claude-sonnet-4-6", Name: "Claude Sonnet 4.6", ContextSize: 1_000_000},
		{ID: "claude-haiku-4-5", Name: "Claude Haiku 4.5", ContextSize: 200_000},
	}, nil
}

func (p *Provider) Generate(ctx context.Context, in ai.GenerateInput) (*ai.GenerateOutput, error) {
	bin, err := resolveBinary()
	if err != nil {
		return nil, err
	}
	prompt := buildPrompt(in)
	if prompt == "" {
		return nil, errors.New("claude-cli: empty prompt")
	}

	args := []string{"-p", prompt}
	if in.Model != "" {
		args = append(args, "--model", in.Model)
	}

	var stdout, stderr bytes.Buffer
	cmd := exec.CommandContext(ctx, bin, args...)
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

func (p *Provider) GenerateStream(ctx context.Context, requestID string, in ai.GenerateInput, h ports.StreamHandler) error {
	bin, err := resolveBinary()
	if err != nil {
		h.OnError(requestID, err.Error())
		return err
	}
	prompt := buildPrompt(in)
	if prompt == "" {
		err := errors.New("claude-cli: empty prompt")
		h.OnError(requestID, err.Error())
		return err
	}

	args := []string{"-p", prompt}
	if in.Model != "" {
		args = append(args, "--model", in.Model)
	}

	cmd := exec.CommandContext(ctx, bin, args...)
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		h.OnError(requestID, err.Error())
		return err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		h.OnError(requestID, err.Error())
		return err
	}

	if err := cmd.Start(); err != nil {
		h.OnError(requestID, err.Error())
		return err
	}

	go func() {
		scanner := bufio.NewScanner(stdout)
		scanner.Buffer(make([]byte, 64*1024), 4*1024*1024)
		for scanner.Scan() {
			h.OnChunk(requestID, scanner.Text()+"\n")
		}
		errBytes, _ := readAll(stderr)
		if err := cmd.Wait(); err != nil {
			msg := strings.TrimSpace(string(errBytes))
			if msg == "" {
				msg = err.Error()
			}
			h.OnError(requestID, msg)
			return
		}
		h.OnDone(requestID)
	}()

	return nil
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

func resolveBinary() (string, error) {
	if p, err := exec.LookPath("claude"); err == nil {
		return p, nil
	}
	home, err := os.UserHomeDir()
	if err == nil {
		candidates := []string{
			filepath.Join(home, ".local/bin/claude"),
			filepath.Join(home, ".claude/local/claude"),
			filepath.Join(home, "bin/claude"),
		}
		for _, c := range candidates {
			if info, err := os.Stat(c); err == nil && !info.IsDir() {
				return c, nil
			}
		}
	}
	for _, c := range []string{"/usr/local/bin/claude", "/opt/homebrew/bin/claude"} {
		if info, err := os.Stat(c); err == nil && !info.IsDir() {
			return c, nil
		}
	}
	return "", errors.New("claude-cli: binary not found (install Claude Code or add to PATH)")
}

func readAll(r interface{ Read(p []byte) (int, error) }) ([]byte, error) {
	var buf bytes.Buffer
	chunk := make([]byte, 4096)
	for {
		n, err := r.Read(chunk)
		if n > 0 {
			buf.Write(chunk[:n])
		}
		if err != nil {
			if err.Error() == "EOF" {
				return buf.Bytes(), nil
			}
			return buf.Bytes(), err
		}
	}
}
