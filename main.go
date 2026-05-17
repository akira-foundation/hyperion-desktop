package main

import (
	"embed"
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
	"hyperion-desktop/internal/drivers/ai/openai"
	"hyperion-desktop/internal/infrastructure/sqlite"
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

	draftRepo := sqlite.NewDraftRepository(db)
	draftService := application.NewDraftService(draftRepo)

	aiRegistry := driverai.NewRegistry()
	aiRegistry.Register(openai.New(os.Getenv("OPENAI_API_KEY")))
	aiRegistry.Register(anthropic.New(os.Getenv("ANTHROPIC_API_KEY")))
	aiService := application.NewAIService(aiRegistry)

	app := NewApp(draftService, aiService)

	if err := wails.Run(&options.App{
		Title:  "Hyperion",
		Width:  1280,
		Height: 820,
		MinWidth:  960,
		MinHeight: 640,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour:  &options.RGBA{R: 0, G: 0, B: 0, A: 0},
		OnStartup:         app.startup,
		Frameless:         false,
		EnableDefaultContextMenu: false,
		Mac: &mac.Options{
			TitleBar:             mac.TitleBarHiddenInset(),
			Appearance:           mac.NSAppearanceNameDarkAqua,
			WebviewIsTransparent: true,
			WindowIsTranslucent:  true,
		},
		Bind: []interface{}{
			app,
		},
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
