package main

import (
	"context"
	"fmt"
	"os"
	"time"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"

	"hyperion-desktop/internal/application"
	"hyperion-desktop/internal/domain/ai"
	"hyperion-desktop/internal/domain/draft"
	tmpl "hyperion-desktop/internal/domain/template"
	driverai "hyperion-desktop/internal/drivers/ai"
)

type App struct {
	ctx     context.Context
	drafts  *application.DraftService
	ai      *application.AIService
	renders *application.RenderService
}

func NewApp(drafts *application.DraftService, ai *application.AIService, renders *application.RenderService) *App {
	return &App{drafts: drafts, ai: ai, renders: renders}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) ListDrafts() ([]*draft.Draft, error) {
	return a.drafts.List(a.ctx)
}

func (a *App) CreateDraft(title, body, platform string) (*draft.Draft, error) {
	return a.drafts.Create(a.ctx, application.CreateDraftInput{
		Title:    title,
		Body:     body,
		Platform: draft.Platform(platform),
	})
}

func (a *App) DeleteDraft(id string) error {
	return a.drafts.Delete(a.ctx, id)
}

func (a *App) ListAIProviders() []driverai.ProviderInfo {
	return a.ai.ListProviders(a.ctx)
}

func (a *App) GenerateContent(req application.GenerateRequest) (*ai.GenerateOutput, error) {
	return a.ai.Generate(a.ctx, req)
}

func (a *App) RenderTemplate(req tmpl.RenderRequest) (*tmpl.RenderResult, error) {
	png, err := a.renders.Render(a.ctx, req)
	if err != nil {
		return nil, err
	}

	defaultName := fmt.Sprintf("%s-%s.png", req.TemplateID, time.Now().UTC().Format("20060102-150405"))

	path, err := wailsruntime.SaveFileDialog(a.ctx, wailsruntime.SaveDialogOptions{
		Title:           "Save rendered asset",
		DefaultFilename: defaultName,
		Filters: []wailsruntime.FileFilter{
			{DisplayName: "PNG image (*.png)", Pattern: "*.png"},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("save dialog: %w", err)
	}
	if path == "" {
		return nil, nil
	}

	if err := os.WriteFile(path, png, 0o644); err != nil {
		return nil, fmt.Errorf("write png: %w", err)
	}

	return &tmpl.RenderResult{
		Path:      path,
		Width:     req.Size.Width,
		Height:    req.Size.Height,
		SizeBytes: int64(len(png)),
	}, nil
}
