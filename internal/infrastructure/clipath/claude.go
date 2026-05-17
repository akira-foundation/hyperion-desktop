package clipath

import (
	"os"
	"path/filepath"
	"runtime"

	"github.com/akira-io/desktopkit/shell"
)

func ResolveClaude() (string, error) {
	candidates := shell.NewCandidates()
	for _, name := range claudeNames() {
		candidates = candidates.WithName(name)
	}
	for _, path := range claudeCandidatePaths() {
		candidates = candidates.WithCandidate(path)
	}
	resolved, err := candidates.Resolve()
	if err != nil {
		return "", err
	}
	return resolved.AbsolutePath(), nil
}

func claudeNames() []string {
	if runtime.GOOS == "windows" {
		return []string{"claude.exe", "claude.cmd", "claude"}
	}
	return []string{"claude"}
}

func claudeCandidatePaths() []string {
	home, _ := os.UserHomeDir()
	switch runtime.GOOS {
	case "windows":
		out := []string{}
		if localAppData := os.Getenv("LOCALAPPDATA"); localAppData != "" {
			out = append(out,
				filepath.Join(localAppData, "Programs", "claude", "claude.exe"),
				filepath.Join(localAppData, "Programs", "claude-code", "claude.exe"),
			)
		}
		if appData := os.Getenv("APPDATA"); appData != "" {
			out = append(out,
				filepath.Join(appData, "npm", "claude.cmd"),
				filepath.Join(appData, "npm", "claude.exe"),
			)
		}
		if programFiles := os.Getenv("ProgramFiles"); programFiles != "" {
			out = append(out, filepath.Join(programFiles, "claude", "claude.exe"))
		}
		return out
	case "linux":
		out := []string{}
		if home != "" {
			out = append(out,
				filepath.Join(home, ".local/bin/claude"),
				filepath.Join(home, ".claude/local/claude"),
				filepath.Join(home, "bin/claude"),
			)
		}
		return append(out, "/usr/local/bin/claude", "/usr/bin/claude")
	default:
		out := []string{}
		if home != "" {
			out = append(out,
				filepath.Join(home, ".local/bin/claude"),
				filepath.Join(home, ".claude/local/claude"),
				filepath.Join(home, "bin/claude"),
			)
		}
		return append(out, "/usr/local/bin/claude", "/opt/homebrew/bin/claude")
	}
}
