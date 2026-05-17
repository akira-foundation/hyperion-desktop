package application

import (
	"bytes"
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	nethttp "net/http"
	neturl "net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"hyperion-desktop/internal/domain/template"
	"hyperion-desktop/internal/infrastructure/usertemplates"
	"hyperion-desktop/internal/ports"
)

var timeSecond = time.Second

func ioReadAllLimited(r io.Reader, max int64) ([]byte, error) {
	return io.ReadAll(io.LimitReader(r, max))
}

type TemplateService struct {
	store    *usertemplates.Store
	renderer ports.Renderer
	baseURL  string
}

func NewTemplateService(store *usertemplates.Store, renderer ports.Renderer, baseURL string) *TemplateService {
	return &TemplateService{store: store, renderer: renderer, baseURL: baseURL}
}

type SaveTemplateInput struct {
	SourceDir   string        `json:"sourceDir"`
	Name        string        `json:"name"`
	Description string        `json:"description"`
	Category    string        `json:"category"`
	Source      string        `json:"source"` // skill | import | ai-gen
	Size        template.Size `json:"size"`
}

func (s *TemplateService) Save(in SaveTemplateInput) (*template.RuntimeTemplate, error) {
	if in.SourceDir == "" {
		return nil, fmt.Errorf("sourceDir required")
	}
	if in.Name == "" {
		in.Name = filepath.Base(in.SourceDir)
		in.Name = strings.TrimPrefix(in.Name, "marketing.")
		in.Name = strings.ReplaceAll(in.Name, "-", " ")
		in.Name = strings.Title(in.Name) //nolint:staticcheck
	}
	if in.Source == "" {
		in.Source = "import"
	}
	return s.store.ImportFromFolder(in.SourceDir, in.Name, in.Description, in.Category, in.Source, in.Size)
}

func (s *TemplateService) List() ([]template.RuntimeTemplate, error) {
	return s.store.List()
}

func (s *TemplateService) Get(id string) (*template.RuntimeTemplate, error) {
	return s.store.Get(id)
}

func (s *TemplateService) Delete(id string) error {
	return s.store.Delete(id)
}

func (s *TemplateService) Dir() string {
	return s.store.Dir()
}

func (s *TemplateService) ReadFile(id, filename string) (string, error) {
	return s.store.ReadFile(id, filename)
}

func (s *TemplateService) WriteFile(id, filename, content string) error {
	return s.store.WriteFile(id, filename, content)
}

func (s *TemplateService) RenderUserSlide(ctx context.Context, id string, slideIndex int) ([]byte, error) {
	t, err := s.store.Get(id)
	if err != nil {
		return nil, err
	}
	if slideIndex < 0 || slideIndex >= len(t.Slides) {
		return nil, fmt.Errorf("slide index out of range")
	}
	url := fmt.Sprintf("%s/user-templates/%s/%s", s.baseURL, t.Slug, t.Slides[slideIndex].Filename)
	return s.renderer.RenderURL(ctx, url, t.Size)
}

type Attachment struct {
	Filename string `json:"filename"`
	Base64   string `json:"base64"`
}

type GenerateTemplateInput struct {
	Name        string       `json:"name"`
	Description string       `json:"description"`
	Prompt      string       `json:"prompt"`
	Width       int          `json:"width"`
	Height      int          `json:"height"`
	SlideCount  int          `json:"slideCount"`
	Category    string       `json:"category"`
	Attachments []Attachment `json:"attachments"`
	LocalRefs   []string     `json:"localRefs"`
	URLs        []string     `json:"urls"`
}

func (s *TemplateService) GenerateFromAI(ctx context.Context, in GenerateTemplateInput) (*template.RuntimeTemplate, error) {
	if in.Name == "" {
		return nil, errors.New("name required")
	}
	if in.Prompt == "" {
		return nil, errors.New("prompt required")
	}
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

	bin, err := resolveClaudeBinary()
	if err != nil {
		return nil, err
	}

	tmpDir, err := os.MkdirTemp("", "hyperion-tpl-*")
	if err != nil {
		return nil, fmt.Errorf("tmp dir: %w", err)
	}
	defer os.RemoveAll(tmpDir)

	refsDir := filepath.Join(tmpDir, ".refs")
	if err := os.MkdirAll(refsDir, 0o755); err != nil {
		return nil, fmt.Errorf("refs dir: %w", err)
	}
	refPaths := make([]string, 0, len(in.Attachments)+len(in.LocalRefs)+len(in.URLs))

	for _, a := range in.Attachments {
		if a.Filename == "" || a.Base64 == "" {
			continue
		}
		safe := filepath.Base(a.Filename)
		path := filepath.Join(refsDir, safe)
		data, err := decodeBase64(a.Base64)
		if err != nil {
			return nil, fmt.Errorf("decode attachment %s: %w", safe, err)
		}
		if err := os.WriteFile(path, data, 0o644); err != nil {
			return nil, fmt.Errorf("write attachment %s: %w", safe, err)
		}
		refPaths = append(refPaths, path)
	}

	for _, p := range in.LocalRefs {
		if p == "" {
			continue
		}
		if info, err := os.Stat(p); err != nil || info.IsDir() {
			return nil, fmt.Errorf("local ref %s: not accessible", p)
		}
		refPaths = append(refPaths, p)
	}

	for i, u := range in.URLs {
		u = strings.TrimSpace(u)
		if u == "" {
			continue
		}
		body, err := fetchURL(ctx, u)
		if err != nil {
			return nil, fmt.Errorf("fetch %s: %w", u, err)
		}
		path := filepath.Join(refsDir, fmt.Sprintf("url-%02d.html", i+1))
		header := fmt.Sprintf("<!-- Source URL: %s -->\n", u)
		if err := os.WriteFile(path, append([]byte(header), body...), 0o644); err != nil {
			return nil, fmt.Errorf("write url %s: %w", u, err)
		}
		refPaths = append(refPaths, path)
	}

	prompt := buildTemplatePrompt(in, refPaths)

	var stdout, stderr bytes.Buffer
	cmd := exec.CommandContext(ctx, bin, "-p", prompt)
	cmd.Dir = tmpDir
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		msg := strings.TrimSpace(stderr.String())
		if msg == "" {
			msg = err.Error()
		}
		return nil, fmt.Errorf("claude: %s", msg)
	}

	entries, err := os.ReadDir(tmpDir)
	if err != nil {
		return nil, fmt.Errorf("read tmp: %w", err)
	}
	hasHTML := false
	for _, e := range entries {
		if strings.HasSuffix(strings.ToLower(e.Name()), ".html") {
			hasHTML = true
			break
		}
	}
	if !hasHTML {
		return nil, fmt.Errorf("claude did not produce any HTML files (stdout: %s)", strings.TrimSpace(stdout.String()))
	}

	return s.store.ImportFromFolder(
		tmpDir,
		in.Name,
		in.Description,
		in.Category,
		"ai-generated",
		template.Size{Width: in.Width, Height: in.Height},
	)
}

func fetchURL(ctx context.Context, raw string) ([]byte, error) {
	u, err := neturl.Parse(raw)
	if err != nil {
		return nil, fmt.Errorf("invalid url: %w", err)
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return nil, fmt.Errorf("unsupported scheme %q", u.Scheme)
	}
	req, err := nethttp.NewRequestWithContext(ctx, nethttp.MethodGet, u.String(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Hyperion/1.0 (template generator)")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,*/*")
	client := &nethttp.Client{Timeout: 30 * timeSecond}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("status %d", resp.StatusCode)
	}
	const maxBytes = 1024 * 1024 // 1 MB cap
	return ioReadAllLimited(resp.Body, maxBytes)
}

func decodeBase64(s string) ([]byte, error) {
	if i := strings.Index(s, ","); i >= 0 && strings.Contains(s[:i], ";base64") {
		s = s[i+1:]
	}
	return base64.StdEncoding.DecodeString(s)
}

func buildTemplatePrompt(in GenerateTemplateInput, refPaths []string) string {
	var b strings.Builder
	b.WriteString("You are generating an HTML/CSS template for the Hyperion content OS.\n\n")
	b.WriteString("OUTPUT: Write files directly to the current working directory. Do not ask questions. Work without stopping.\n\n")
	b.WriteString("FILES TO PRODUCE:\n")
	if in.SlideCount > 1 {
		for i := 1; i <= in.SlideCount; i++ {
			b.WriteString(fmt.Sprintf("- slide-%d.html\n", i))
		}
	} else {
		b.WriteString("- slide-1.html\n")
	}
	b.WriteString("- styles.css (shared)\n\n")
	b.WriteString("CONSTRAINTS:\n")
	b.WriteString(fmt.Sprintf("- Viewport: %dx%d (set on html/body)\n", in.Width, in.Height))
	b.WriteString("- Self-contained: only external network resources allowed are Google Fonts via <link>\n")
	b.WriteString("- Each slide imports styles.css\n")
	b.WriteString("- No emojis\n")
	b.WriteString("- Modern typographic design, deterministic layout, no animations needed\n")
	b.WriteString("- Use semantic class names (.hero, .title, .accent, etc.)\n")
	b.WriteString("- Mobile-first: text large enough to read on small previews\n\n")
	if len(refPaths) > 0 {
		b.WriteString("REFERENCE FILES (read them to ground your design — extract palette, mood, subjects, content):\n")
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

func resolveClaudeBinary() (string, error) {
	if p, err := exec.LookPath("claude"); err == nil {
		return p, nil
	}
	home, err := os.UserHomeDir()
	if err == nil {
		for _, c := range []string{
			filepath.Join(home, ".local/bin/claude"),
			filepath.Join(home, ".claude/local/claude"),
			filepath.Join(home, "bin/claude"),
		} {
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
	return "", errors.New("claude CLI binary not found")
}

func (s *TemplateService) RenderUserCarousel(ctx context.Context, id string) ([][]byte, error) {
	t, err := s.store.Get(id)
	if err != nil {
		return nil, err
	}
	out := make([][]byte, 0, len(t.Slides))
	for i, slide := range t.Slides {
		url := fmt.Sprintf("%s/user-templates/%s/%s", s.baseURL, t.Slug, slide.Filename)
		png, err := s.renderer.RenderURL(ctx, url, t.Size)
		if err != nil {
			return nil, fmt.Errorf("slide %d: %w", i, err)
		}
		out = append(out, png)
	}
	return out, nil
}

