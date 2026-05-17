package main

import (
	"fmt"
	"os"
	"strings"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"

	"hyperion-desktop/internal/application"
	tmpl "hyperion-desktop/internal/domain/template"
)

type ImportFile struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}

func (a *App) ListUserTemplates() ([]tmpl.RuntimeTemplate, error) {
	return a.templates.List()
}

func (a *App) ImportTemplate(in application.SaveTemplateInput) (*tmpl.RuntimeTemplate, error) {
	if in.SourceDir == "" {
		path, err := wailsruntime.OpenDirectoryDialog(a.ctx, wailsruntime.OpenDialogOptions{
			Title: "Select template folder",
		})
		if err != nil {
			return nil, fmt.Errorf("dir dialog: %w", err)
		}
		if path == "" {
			return nil, nil
		}
		in.SourceDir = path
	}
	if in.Source == "" {
		in.Source = "import"
	}
	return a.templates.Save(in)
}

func (a *App) ImportTemplateFromFiles(name, description, category string, size tmpl.Size, files []ImportFile) (*tmpl.RuntimeTemplate, error) {
	if len(files) == 0 {
		return nil, fmt.Errorf("no files provided")
	}
	if name == "" {
		return nil, fmt.Errorf("name required")
	}

	tmpDir, err := os.MkdirTemp("", "hyperion-import-*")
	if err != nil {
		return nil, fmt.Errorf("tmp dir: %w", err)
	}
	defer os.RemoveAll(tmpDir)

	for _, f := range files {
		fname := f.Path
		if idx := strings.LastIndex(fname, "/"); idx >= 0 {
			fname = fname[idx+1:]
		}
		dst := tmpDir + string(os.PathSeparator) + fname
		if err := os.WriteFile(dst, []byte(f.Content), 0o644); err != nil {
			return nil, fmt.Errorf("write %s: %w", fname, err)
		}
	}

	if size.Width == 0 || size.Height == 0 {
		size = tmpl.Size{Width: 1080, Height: 1080}
	}

	return a.templates.Save(application.SaveTemplateInput{
		SourceDir:   tmpDir,
		Name:        name,
		Description: description,
		Category:    category,
		Source:      "import",
		Size:        size,
	})
}

func (a *App) SaveSkillResultAsTemplate(outputDir, name, description, category string, size tmpl.Size) (*tmpl.RuntimeTemplate, error) {
	if size.Width == 0 || size.Height == 0 {
		size = tmpl.Size{Width: 1080, Height: 1080}
	}
	return a.templates.Save(application.SaveTemplateInput{
		SourceDir:   outputDir,
		Name:        name,
		Description: description,
		Category:    category,
		Source:      "skill",
		Size:        size,
	})
}

func (a *App) DeleteUserTemplate(id string) error {
	return a.templates.Delete(id)
}

func (a *App) GenerateTemplateFromAI(in application.GenerateTemplateInput) (*tmpl.RuntimeTemplate, error) {
	return a.templates.GenerateFromAI(a.ctx, in)
}

func (a *App) EditTemplateWithAI(in application.EditTemplateInput) (*tmpl.RuntimeTemplate, error) {
	return a.templates.EditWithAI(a.ctx, in)
}

func (a *App) PickReferenceFiles() ([]string, error) {
	return wailsruntime.OpenMultipleFilesDialog(a.ctx, wailsruntime.OpenDialogOptions{
		Title: "Pick reference files",
		Filters: []wailsruntime.FileFilter{
			{DisplayName: "All supported", Pattern: "*.png;*.jpg;*.jpeg;*.webp;*.gif;*.pdf;*.md;*.txt;*.html;*.css"},
			{DisplayName: "Images", Pattern: "*.png;*.jpg;*.jpeg;*.webp;*.gif"},
			{DisplayName: "Documents", Pattern: "*.pdf;*.md;*.txt"},
		},
	})
}

func (a *App) GetUserTemplateFile(id, filename string) (string, error) {
	return a.templates.ReadFile(id, filename)
}

func (a *App) SaveUserTemplateFile(id, filename, content string) error {
	return a.templates.WriteFile(id, filename, content)
}
