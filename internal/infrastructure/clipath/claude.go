package clipath

import (
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

// ResolveClaude returns the absolute path to the `claude` CLI binary
// across macOS, Linux, and Windows.
func ResolveClaude() (string, error) {
	names := []string{"claude"}
	if runtime.GOOS == "windows" {
		names = []string{"claude.exe", "claude.cmd", "claude"}
	}
	for _, n := range names {
		if p, err := exec.LookPath(n); err == nil {
			return p, nil
		}
	}
	for _, c := range claudeCandidates() {
		if info, err := os.Stat(c); err == nil && !info.IsDir() {
			return c, nil
		}
	}
	return "", errors.New("claude CLI binary not found (install Claude Code or add to PATH)")
}

func claudeCandidates() []string {
	home, _ := os.UserHomeDir()
	switch runtime.GOOS {
	case "windows":
		appData := os.Getenv("APPDATA")
		localAppData := os.Getenv("LOCALAPPDATA")
		programFiles := os.Getenv("ProgramFiles")
		out := []string{}
		if localAppData != "" {
			out = append(out,
				filepath.Join(localAppData, "Programs", "claude", "claude.exe"),
				filepath.Join(localAppData, "Programs", "claude-code", "claude.exe"),
			)
		}
		if appData != "" {
			out = append(out,
				filepath.Join(appData, "npm", "claude.cmd"),
				filepath.Join(appData, "npm", "claude.exe"),
			)
		}
		if programFiles != "" {
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
	default: // darwin and others
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
