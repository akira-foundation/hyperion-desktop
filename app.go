package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/akira-io/desktopkit/files"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"

	"hyperion-desktop/internal/application"
	"hyperion-desktop/internal/domain/ai"
	"hyperion-desktop/internal/domain/draft"
	imagedom "hyperion-desktop/internal/domain/image"
	skilldom "hyperion-desktop/internal/domain/skill"
	tmpl "hyperion-desktop/internal/domain/template"
	driverai "hyperion-desktop/internal/drivers/ai"
	driverimage "hyperion-desktop/internal/drivers/image"
	settingsdom "hyperion-desktop/internal/infrastructure/settings"
)

type App struct {
	ctx       context.Context
	drafts    *application.DraftService
	ai        *application.AIService
	renders   *application.RenderService
	skills    *application.SkillService
	templates *application.TemplateService
	images    *application.ImageService
	settings  *application.SettingsService
	exports   *application.ExportService
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

func (a *App) ExportPathsAsZIP(paths []string, suggestedName string) (string, error) {
	if len(paths) == 0 {
		return "", fmt.Errorf("no paths provided")
	}
	data, err := a.exports.BundleZIP(paths)
	if err != nil {
		return "", err
	}
	if suggestedName == "" {
		suggestedName = "hyperion-bundle.zip"
	}
	out, err := wailsruntime.SaveFileDialog(a.ctx, wailsruntime.SaveDialogOptions{
		Title:           "Save bundle",
		DefaultFilename: suggestedName,
		Filters: []wailsruntime.FileFilter{
			{DisplayName: "ZIP archive (*.zip)", Pattern: "*.zip"},
		},
	})
	if err != nil {
		return "", err
	}
	if out == "" {
		return "", nil
	}
	if err := os.WriteFile(out, data, 0o644); err != nil {
		return "", err
	}
	return out, nil
}

func (a *App) ListAIProviders() []driverai.ProviderInfo {
	list := a.ai.ListProviders(a.ctx)
	log.Printf("[hyperion] ListAIProviders called, returning %d providers", len(list))
	return list
}

func (a *App) GenerateContent(req application.GenerateRequest) (*ai.GenerateOutput, error) {
	return a.ai.Generate(a.ctx, req)
}

func (a *App) GenerateContentStream(req application.GenerateRequest) (string, error) {
	requestID := fmt.Sprintf("req_%d", time.Now().UnixNano())
	emitter := &wailsStreamEmitter{ctx: a.ctx}
	if err := a.ai.GenerateStream(a.ctx, requestID, req, emitter); err != nil {
		return "", err
	}
	return requestID, nil
}

type wailsStreamEmitter struct {
	ctx context.Context
}

func (e *wailsStreamEmitter) OnChunk(requestID, delta string) {
	wailsruntime.EventsEmit(e.ctx, "ai:chunk", map[string]any{
		"requestId": requestID,
		"delta":     delta,
	})
}

func (e *wailsStreamEmitter) OnDone(requestID string) {
	wailsruntime.EventsEmit(e.ctx, "ai:done", map[string]any{"requestId": requestID})
}

func (e *wailsStreamEmitter) OnError(requestID, message string) {
	wailsruntime.EventsEmit(e.ctx, "ai:error", map[string]any{
		"requestId": requestID,
		"message":   message,
	})
}

func (a *App) RenderCarousel(req tmpl.CarouselRenderRequest) (*tmpl.CarouselRenderResult, error) {
	pngs, err := a.renders.RenderCarousel(a.ctx, req)
	if err != nil {
		return nil, err
	}

	dir, err := wailsruntime.OpenDirectoryDialog(a.ctx, wailsruntime.OpenDialogOptions{
		Title: "Choose folder for carousel slides",
	})
	if err != nil {
		return nil, fmt.Errorf("dir dialog: %w", err)
	}
	if dir == "" {
		return nil, nil
	}

	stamp := time.Now().UTC().Format("20060102-150405")
	files := make([]tmpl.RenderResult, 0, len(pngs))
	for i, png := range pngs {
		filename := fmt.Sprintf("%s-%s-%02d.png", req.TemplateID, stamp, i+1)
		path := dir + string(os.PathSeparator) + filename
		if err := os.WriteFile(path, png, 0o644); err != nil {
			return nil, fmt.Errorf("write slide %d: %w", i, err)
		}
		files = append(files, tmpl.RenderResult{
			Path:      path,
			Width:     req.Size.Width,
			Height:    req.Size.Height,
			SizeBytes: int64(len(png)),
		})
	}

	return &tmpl.CarouselRenderResult{Directory: dir, Files: files}, nil
}

func (a *App) ListSkills() []skilldom.Skill {
	return a.skills.List()
}

func (a *App) RunSkill(req skilldom.RunRequest) (*skilldom.RunResult, error) {
	if req.ProjectPath == "" {
		path, err := wailsruntime.OpenDirectoryDialog(a.ctx, wailsruntime.OpenDialogOptions{
			Title: "Select project folder",
		})
		if err != nil {
			return nil, fmt.Errorf("dir dialog: %w", err)
		}
		if path == "" {
			return nil, nil
		}
		req.ProjectPath = path
	}
	return a.skills.Run(a.ctx, req)
}

func (a *App) ListImageProviders() []driverimage.ProviderInfo {
	return a.images.ListProviders(a.ctx)
}

func (a *App) GenerateImage(req application.GenerateImageRequest) (*imagedom.GeneratedImage, error) {
	return a.images.Generate(a.ctx, req)
}

func (a *App) ListAssets() []imagedom.GeneratedImage {
	return a.images.List()
}

func (a *App) DeleteAsset(id string) error {
	return a.images.Delete(id)
}

func (a *App) PickProjectFolder() (string, error) {
	return wailsruntime.OpenDirectoryDialog(a.ctx, wailsruntime.OpenDialogOptions{
		Title: "Select project folder",
	})
}

func (a *App) RenderBaseURL() string {
	return a.renderBaseURL
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

type ImportFile struct {
	Path    string `json:"path"`
	Content string `json:"content"`
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

func (a *App) RenderUserTemplate(id string, slideIndex int) (*tmpl.RenderResult, error) {
	png, err := a.templates.RenderUserSlide(a.ctx, id, slideIndex)
	if err != nil {
		return nil, err
	}
	t, err := a.templates.Get(id)
	if err != nil {
		return nil, err
	}
	defaultName := fmt.Sprintf("%s-slide-%02d.png", t.Slug, slideIndex+1)
	path, err := wailsruntime.SaveFileDialog(a.ctx, wailsruntime.SaveDialogOptions{
		Title:           "Save rendered slide",
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
		Width:     t.Size.Width,
		Height:    t.Size.Height,
		SizeBytes: int64(len(png)),
	}, nil
}

func (a *App) RenderUserTemplateCarousel(id string) (*tmpl.CarouselRenderResult, error) {
	pngs, err := a.templates.RenderUserCarousel(a.ctx, id)
	if err != nil {
		return nil, err
	}
	t, err := a.templates.Get(id)
	if err != nil {
		return nil, err
	}

	dir, err := wailsruntime.OpenDirectoryDialog(a.ctx, wailsruntime.OpenDialogOptions{
		Title: "Choose folder for carousel slides",
	})
	if err != nil {
		return nil, fmt.Errorf("dir dialog: %w", err)
	}
	if dir == "" {
		return nil, nil
	}

	stamp := time.Now().UTC().Format("20060102-150405")
	files := make([]tmpl.RenderResult, 0, len(pngs))
	for i, png := range pngs {
		filename := fmt.Sprintf("%s-%s-%02d.png", t.Slug, stamp, i+1)
		path := dir + string(os.PathSeparator) + filename
		if err := os.WriteFile(path, png, 0o644); err != nil {
			return nil, fmt.Errorf("write slide %d: %w", i, err)
		}
		files = append(files, tmpl.RenderResult{
			Path:      path,
			Width:     t.Size.Width,
			Height:    t.Size.Height,
			SizeBytes: int64(len(png)),
		})
	}
	return &tmpl.CarouselRenderResult{Directory: dir, Files: files}, nil
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
