package application

import (
	"context"
	"errors"
	"fmt"
	"path/filepath"
	"strings"

	"hyperion-desktop/internal/domain/template"
)

type EditTemplateInput struct {
	ID     string `json:"id"`
	Prompt string `json:"prompt"`
}

func (s *TemplateService) EditWithAI(ctx context.Context, in EditTemplateInput) (*template.RuntimeTemplate, error) {
	if in.ID == "" {
		return nil, errors.New("id required")
	}
	if strings.TrimSpace(in.Prompt) == "" {
		return nil, errors.New("prompt required")
	}

	t, err := s.store.Get(in.ID)
	if err != nil {
		return nil, err
	}

	bin, err := resolveClaudeBinary()
	if err != nil {
		return nil, err
	}

	templateDir := filepath.Join(s.store.Dir(), t.Slug)

	if err := runClaude(ctx, bin, templateDir, buildEditPrompt(t, in.Prompt)); err != nil {
		return nil, err
	}

	return s.store.Get(in.ID)
}

func buildEditPrompt(t *template.RuntimeTemplate, userPrompt string) string {
	var b strings.Builder
	b.WriteString("You are editing an existing HTML/CSS template for the Hyperion content OS.\n\n")
	b.WriteString("OUTPUT: Modify the files in the current working directory in place. Do not ask questions. Work without stopping.\n\n")
	b.WriteString("EXISTING FILES (read all of them first to understand current design):\n")
	for _, slide := range t.Slides {
		b.WriteString(fmt.Sprintf("- %s\n", slide.Filename))
	}
	for _, asset := range t.Assets {
		b.WriteString(fmt.Sprintf("- %s\n", asset))
	}
	b.WriteString("\nCONSTRAINTS:\n")
	b.WriteString(fmt.Sprintf("- Viewport: %dx%d (preserve)\n", t.Size.Width, t.Size.Height))
	b.WriteString("- Preserve filenames. Do not rename, do not delete.\n")
	b.WriteString("- Keep self-contained: only external network resources allowed are Google Fonts via <link>\n")
	b.WriteString("- Make focused, minimal edits. Only what the user asked for.\n")
	b.WriteString("- No emojis.\n\n")
	b.WriteString(fmt.Sprintf("USER REQUEST:\n%s\n\n", userPrompt))
	b.WriteString("Use Read tool on each existing file first. Then Write the edited contents. Verify each file is well-formed HTML/CSS before finishing.")
	return b.String()
}
