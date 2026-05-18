package clipath

import (
	"os"
	"path/filepath"

	"github.com/akira-io/onyx/osinfo"
	"github.com/akira-io/onyx/shell"
)

const binaryStem = "claude"

func ResolveClaude() (string, error) {
	resolved, err := shell.NewResolver().
		Lookup(binaryStem + osinfo.ExecutableExtension()).
		Lookup(binaryStem).
		Lookups(claudeCandidatePaths()).
		Resolve()
	if err != nil {
		return "", err
	}
	return resolved, nil
}

func claudeCandidatePaths() []string {
	binary := binaryStem + osinfo.ExecutableExtension()
	dirs := []string{}
	dirs = append(dirs, vendorSpecificDirs()...)
	dirs = append(dirs, shell.ListNpmGlobalBinDirs()...)
	dirs = append(dirs, shell.ListUserLocalBinDirs()...)
	dirs = append(dirs, shell.ListSystemBinDirs()...)
	dirs = append(dirs, shell.ListWindowsApplicationDirs(binaryStem)...)
	dirs = append(dirs, shell.ListWindowsApplicationDirs(binaryStem+"-code")...)

	paths := make([]string, 0, len(dirs))
	for _, dir := range dirs {
		paths = append(paths, filepath.Join(dir, binary))
	}
	return paths
}

func vendorSpecificDirs() []string {
	home, err := os.UserHomeDir()
	if err != nil || home == "" {
		return []string{}
	}
	return []string{
		filepath.Join(home, ".claude", "local"),
	}
}
