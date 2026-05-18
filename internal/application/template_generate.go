package application

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"strings"

	"hyperion-desktop/internal/domain/template"
	"hyperion-desktop/internal/infrastructure/clipath"
)

type Attachment struct {
	Filename string `json:"filename"`
	Base64   string `json:"base64"`
}

type GenerateTemplateInput struct {
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Prompt      string            `json:"prompt"`
	Width       int               `json:"width"`
	Height      int               `json:"height"`
	SlideCount  int               `json:"slideCount"`
	Category    string            `json:"category"`
	Attachments []Attachment      `json:"attachments"`
	LocalRefs   []string          `json:"localRefs"`
	URLs        []string          `json:"urls"`
	Formats     []template.Format `json:"formats,omitempty"`
}

func (in *GenerateTemplateInput) wantsStory() bool {
	for _, f := range in.Formats {
		if f == template.FormatStory {
			return true
		}
	}
	return false
}

func (s *TemplateService) GenerateFromAI(ctx context.Context, in GenerateTemplateInput) (*template.RuntimeTemplate, error) {
	if in.Name == "" {
		return nil, errors.New("name required")
	}
	if in.Prompt == "" {
		return nil, errors.New("prompt required")
	}
	applyGenerationDefaults(&in)

	bin, err := resolveClaudeBinary()
	if err != nil {
		return nil, err
	}

	tmpDir, err := os.MkdirTemp("", "hyperion-tpl-*")
	if err != nil {
		return nil, fmt.Errorf("tmp dir: %w", err)
	}
	defer os.RemoveAll(tmpDir)

	refPaths, err := stageReferences(ctx, tmpDir, in)
	if err != nil {
		return nil, err
	}

	if err := runClaude(ctx, bin, tmpDir, buildTemplatePrompt(in, refPaths)); err != nil {
		return nil, err
	}

	if err := verifyHTMLOutput(tmpDir); err != nil {
		return nil, err
	}

	created, err := s.store.ImportFromFolder(
		tmpDir,
		in.Name,
		in.Description,
		in.Category,
		"ai-generated",
		template.Size{Width: in.Width, Height: in.Height},
	)
	if err != nil {
		return nil, err
	}

	gen := buildGenerationRecord(in)
	if err := s.store.SetGeneration(created.ID, gen); err != nil {
		return created, nil
	}
	created.Generation = gen
	return created, nil
}

func applyGenerationDefaults(in *GenerateTemplateInput) {
	if in.Width <= 0 {
		in.Width = 1080
	}
	if in.Height <= 0 {
		in.Height = 1080
	}
	if in.SlideCount <= 0 {
		in.SlideCount = 1
	}
	if in.Category == "" {
		in.Category = "Custom"
	}
}

func buildGenerationRecord(in GenerateTemplateInput) *template.GenerationRecord {
	attachmentNames := make([]string, 0, len(in.Attachments))
	for _, a := range in.Attachments {
		if a.Filename != "" {
			attachmentNames = append(attachmentNames, a.Filename)
		}
	}
	formats := in.Formats
	if len(formats) == 0 {
		formats = []template.Format{template.FormatFeed}
	}
	return &template.GenerationRecord{
		Prompt:      in.Prompt,
		URLs:        in.URLs,
		LocalRefs:   in.LocalRefs,
		Attachments: attachmentNames,
		Formats:     formats,
	}
}

func runClaude(ctx context.Context, bin, workDir, prompt string) error {
	var stdout, stderr bytes.Buffer
	cmd := exec.CommandContext(ctx, bin, "-p", prompt)
	cmd.Dir = workDir
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		msg := strings.TrimSpace(stderr.String())
		if msg == "" {
			msg = err.Error()
		}
		return fmt.Errorf("claude: %s", msg)
	}
	return nil
}

func verifyHTMLOutput(dir string) error {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return fmt.Errorf("read tmp: %w", err)
	}
	for _, e := range entries {
		if strings.HasSuffix(strings.ToLower(e.Name()), ".html") {
			return nil
		}
	}
	return fmt.Errorf("claude did not produce any HTML files")
}

func resolveClaudeBinary() (string, error) {
	return clipath.ResolveClaude()
}

func buildTemplatePrompt(in GenerateTemplateInput, refPaths []string) string {
	var b strings.Builder
	b.WriteString("You are generating an HTML/CSS template for the Hyperion content OS.\n\n")
	b.WriteString("OUTPUT: Write files directly to the current working directory. Do not ask questions. Work without stopping.\n\n")
	b.WriteString("FILES TO PRODUCE:\n")
	if in.SlideCount > 1 {
		for i := 1; i <= in.SlideCount; i++ {
			b.WriteString(fmt.Sprintf("- slide-%d.html (feed format, %dx%d)\n", i, in.Width, in.Height))
		}
	} else {
		b.WriteString(fmt.Sprintf("- slide-1.html (feed format, %dx%d)\n", in.Width, in.Height))
	}
	if in.wantsStory() {
		if in.SlideCount > 1 {
			for i := 1; i <= in.SlideCount; i++ {
				b.WriteString(fmt.Sprintf("- slide-%d-story.html (story format, 1080x1920)\n", i))
			}
		} else {
			b.WriteString("- slide-1-story.html (story format, 1080x1920)\n")
		}
	}
	b.WriteString("- styles.css (shared)\n\n")
	b.WriteString("CONSTRAINTS:\n")
	b.WriteString(fmt.Sprintf("- Feed viewport: %dx%d (set on html/body)\n", in.Width, in.Height))
	if in.wantsStory() {
		b.WriteString("- Story viewport: 1080x1920 (fullscreen vertical)\n")
		b.WriteString("- Story variants reuse styles.css; adapt layout for 9:16 (larger headings, vertical stacking, safe top/bottom margins for IG overlays)\n")
	}
	b.WriteString("- Self-contained: only external network resources allowed are Google Fonts via <link>\n")
	b.WriteString("- Each slide imports styles.css\n")
	b.WriteString("- No emojis\n")
	b.WriteString("- Modern typographic design, deterministic layout, no animations needed\n")
	b.WriteString("- Use semantic class names (.hero, .title, .accent, etc.)\n")
	b.WriteString("- Mobile-first: text large enough to read on small previews\n\n")
	if len(refPaths) > 0 {
		b.WriteString("REFERENCE FILES (read them to ground your design; extract palette, mood, subjects, content):\n")
		for _, p := range refPaths {
			b.WriteString(fmt.Sprintf("- @%s\n", p))
		}
		b.WriteString("\n")
	}
	b.WriteString(fmt.Sprintf("DESIGN BRIEF:\n%s\n\n", in.Prompt))
	if in.Description != "" {
		b.WriteString(fmt.Sprintf("CONTEXT: %s\n\n", in.Description))
	}
	b.WriteString("Use Read/Write tools to create the files. Read any reference files first. Verify each file is well-formed HTML/CSS before finishing.")
	return b.String()
}
