package main

import (
	"hyperion-desktop/internal/application"
	"hyperion-desktop/internal/domain/draft"
)

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

func (a *App) UpdateDraft(id, title, body, platform, status string) (*draft.Draft, error) {
	return a.drafts.Update(a.ctx, id, title, body, platform, status)
}
