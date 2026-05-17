package claudecli

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	skilldom "hyperion-desktop/internal/domain/skill"
	"hyperion-desktop/internal/ports"
)

type Runner struct{}

func New() *Runner { return &Runner{} }

func (r *Runner) Run(ctx context.Context, s ports.Skill, req skilldom.RunRequest) (*skilldom.RunResult, error) {
	bin, err := resolveBinary()
	if err != nil {
		return nil, err
	}

	if req.ProjectPath == "" {
		return nil, errors.New("project path required")
	}
	if _, err := os.Stat(req.ProjectPath); err != nil {
		return nil, fmt.Errorf("project path: %w", err)
	}

	prompt := s.SystemPrompt()
	if prompt == "" {
		return nil, errors.New("skill prompt empty")
	}

	prompt += "\n\nWork without stopping. Pick defaults and continue. Do not ask the user any questions."

	var stdout, stderr bytes.Buffer
	cmd := exec.CommandContext(ctx, bin, "-p", prompt)
	cmd.Dir = req.ProjectPath
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		msg := strings.TrimSpace(stderr.String())
		if msg == "" {
			msg = err.Error()
		}
		return nil, fmt.Errorf("claude-cli: %s", msg)
	}

	log := stdout.String()

	outDir, err := resolveOutputDir(req.ProjectPath)
	if err != nil {
		return &skilldom.RunResult{Log: log}, fmt.Errorf("locate output: %w", err)
	}

	files, err := listOutputFiles(outDir)
	if err != nil {
		return &skilldom.RunResult{OutputDir: outDir, Log: log}, fmt.Errorf("list files: %w", err)
	}

	caption := extractCaption(log)

	return &skilldom.RunResult{
		OutputDir: outDir,
		Files:     files,
		Caption:   caption,
		Log:       log,
	}, nil
}

func resolveOutputDir(projectPath string) (string, error) {
	slug := strings.ToLower(filepath.Base(projectPath))
	slug = strings.ReplaceAll(slug, "_", "-")
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	dir := filepath.Join(home, "Desktop", "marketing."+slug)
	if _, err := os.Stat(dir); err != nil {
		return "", fmt.Errorf("expected output %s: %w", dir, err)
	}
	return dir, nil
}

func listOutputFiles(dir string) ([]skilldom.GeneratedFile, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}
	out := make([]skilldom.GeneratedFile, 0, len(entries))
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		path := filepath.Join(dir, e.Name())
		info, err := e.Info()
		if err != nil {
			continue
		}
		kind := kindFromName(e.Name())
		out = append(out, skilldom.GeneratedFile{
			Path: path,
			Kind: kind,
			Size: info.Size(),
		})
	}
	return out, nil
}

func kindFromName(name string) string {
	ext := strings.ToLower(filepath.Ext(name))
	switch ext {
	case ".html", ".htm":
		return "html"
	case ".css":
		return "css"
	case ".png", ".jpg", ".jpeg", ".webp":
		return "image"
	case ".sh":
		return "script"
	case ".md", ".txt":
		return "text"
	default:
		return "other"
	}
}

func extractCaption(log string) string {
	idx := strings.LastIndex(log, "Caption")
	if idx < 0 {
		return ""
	}
	tail := log[idx:]
	if newline := strings.Index(tail, "\n"); newline >= 0 {
		return strings.TrimSpace(tail[newline:])
	}
	return ""
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
	return "", errors.New("claude CLI binary not found")
}
