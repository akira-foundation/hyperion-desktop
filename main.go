package main

import (
	"context"
	"embed"
	"io/fs"
	"log"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"

	"hyperion-desktop/internal/application"
	driverai "hyperion-desktop/internal/drivers/ai"
	"hyperion-desktop/internal/drivers/ai/anthropic"
	"hyperion-desktop/internal/drivers/ai/claudecli"
	"hyperion-desktop/internal/drivers/ai/openai"
	"hyperion-desktop/internal/drivers/renderer/rod"
	skillclaudecli "hyperion-desktop/internal/drivers/skills/claudecli"
	"hyperion-desktop/internal/infrastructure/renderserver"
	"hyperion-desktop/internal/infrastructure/sqlite"
	"hyperion-desktop/internal/infrastructure/usertemplates"
	"hyperion-desktop/internal/skills"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	dataDir, err := userDataDir()
	if err != nil {
		log.Fatalf("data dir: %v", err)
	}
	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		log.Fatalf("mkdir data: %v", err)
	}

	db, err := sqlite.Open(filepath.Join(dataDir, "hyperion.db"))
	if err != nil {
		log.Fatalf("sqlite: %v", err)
	}
	defer db.Close()

	distFS, err := fs.Sub(assets, "frontend/dist")
	if err != nil {
		log.Fatalf("dist fs: %v", err)
	}
	renderSrv, err := renderserver.New(distFS)
	if err != nil {
		log.Fatalf("render server: %v", err)
	}
	defer renderSrv.Close()

	userTemplateStore, err := usertemplates.NewStore(filepath.Join(dataDir, "templates"))
	if err != nil {
		log.Fatalf("usertemplates: %v", err)
	}
	renderSrv.MountUserTemplates(userTemplateStore.Dir())
	log.Printf("[hyperion] user templates dir: %s", userTemplateStore.Dir())

	renderer := rod.New(renderSrv.BaseURL())
	renderService := application.NewRenderService(renderer)
	templateService := application.NewTemplateService(userTemplateStore, renderer, renderSrv.BaseURL())

	draftRepo := sqlite.NewDraftRepository(db)
	draftService := application.NewDraftService(draftRepo)

	aiRegistry := driverai.NewRegistry()
	aiRegistry.Register(claudecli.New())
	aiRegistry.Register(anthropic.New(os.Getenv("ANTHROPIC_API_KEY")))
	aiRegistry.Register(openai.New(os.Getenv("OPENAI_API_KEY")))
	log.Printf("[hyperion] AI providers registered: %v", aiRegistry.List(context.Background()))
	aiService := application.NewAIService(aiRegistry)

	skillRegistry := skills.NewRegistry()
	skillRunner := skillclaudecli.New()
	skillService := application.NewSkillService(skillRegistry, skillRunner)
	log.Printf("[hyperion] Skills bundled: %v", skillRegistry.List())

	app := NewApp(draftService, aiService, renderService, skillService, templateService, renderSrv.BaseURL())

	if err := wails.Run(&options.App{
		Title:                    "Hyperion",
		Width:                    1280,
		Height:                   820,
		MinWidth:                 960,
		MinHeight:                640,
		AssetServer:              &assetserver.Options{Assets: assets},
		BackgroundColour:         &options.RGBA{R: 0, G: 0, B: 0, A: 0},
		OnStartup:                app.startup,
		Frameless:                false,
		EnableDefaultContextMenu: false,
		Mac: &mac.Options{
			TitleBar:             mac.TitleBarHiddenInset(),
			Appearance:           mac.NSAppearanceNameDarkAqua,
			WebviewIsTransparent: true,
			WindowIsTranslucent:  true,
		},
		Bind: []interface{}{app},
	}); err != nil {
		log.Fatalf("wails: %v", err)
	}
}

func userDataDir() (string, error) {
	base, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(base, "hyperion"), nil
}
