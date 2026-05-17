package main

import (
	"fmt"
	"os"
	"time"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"

	tmpl "hyperion-desktop/internal/domain/template"
)

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
