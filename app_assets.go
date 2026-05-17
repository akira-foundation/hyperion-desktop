package main

import (
	"fmt"
	"os"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"

	"hyperion-desktop/internal/application"
	imagedom "hyperion-desktop/internal/domain/image"
	driverimage "hyperion-desktop/internal/drivers/image"
)

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
