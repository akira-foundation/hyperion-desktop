package main

import (
	"fmt"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"

	skilldom "hyperion-desktop/internal/domain/skill"
)

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
