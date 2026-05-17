package main

import (
	"context"

	"github.com/akira-io/desktopkit/files"
	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"

	"hyperion-desktop/internal/application"
	settingsdom "hyperion-desktop/internal/infrastructure/settings"
)

type App struct {
	ctx           context.Context
	drafts        *application.DraftService
	ai            *application.AIService
	renders       *application.RenderService
	skills        *application.SkillService
	templates     *application.TemplateService
	images        *application.ImageService
	settings      *application.SettingsService
	exports       *application.ExportService
	renderBaseURL string
}

func NewApp(
	drafts *application.DraftService,
	ai *application.AIService,
	renders *application.RenderService,
	skills *application.SkillService,
	templates *application.TemplateService,
	images *application.ImageService,
	settings *application.SettingsService,
	exports *application.ExportService,
	renderBaseURL string,
) *App {
	return &App{
		drafts:        drafts,
		ai:            ai,
		renders:       renders,
		skills:        skills,
		templates:     templates,
		images:        images,
		settings:      settings,
		exports:       exports,
		renderBaseURL: renderBaseURL,
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) GetSettings() settingsdom.Settings {
	return a.settings.Get()
}

func (a *App) SaveSettings(next settingsdom.Settings) error {
	return a.settings.Save(next)
}

func (a *App) MarkOnboardingDone() (settingsdom.Settings, error) {
	return a.settings.MarkOnboardingDone()
}

func (a *App) CopyToClipboard(text string) error {
	wailsruntime.ClipboardSetText(a.ctx, text)
	return nil
}

func (a *App) RevealInFinder(path string) error {
	return files.RevealInFileManager(path)
}

func (a *App) OpenPath(path string) error {
	return files.OpenPath(path)
}

func (a *App) PickProjectFolder() (string, error) {
	return wailsruntime.OpenDirectoryDialog(a.ctx, wailsruntime.OpenDialogOptions{
		Title: "Select project folder",
	})
}

func (a *App) RenderBaseURL() string {
	return a.renderBaseURL
}
