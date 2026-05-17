package main

import (
	"context"

	"hyperion-desktop/internal/application"
	"hyperion-desktop/internal/domain/draft"
)

type App struct {
	ctx     context.Context
	drafts  *application.DraftService
	ai      *application.AIService
}

func NewApp(drafts *application.DraftService, ai *application.AIService) *App {
	return &App{drafts: drafts, ai: ai}
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

func (a *App) AIProviders() []string {
	return a.ai.Providers()
}
