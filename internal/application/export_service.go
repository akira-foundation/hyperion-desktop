package application

import (
	"archive/zip"
	"bytes"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

type ExportService struct{}

func NewExportService() *ExportService { return &ExportService{} }

// BundleZIP creates a zip archive from the given file paths.
// All files go into the root of the archive (no nested folders).
func (s *ExportService) BundleZIP(paths []string) ([]byte, error) {
	if len(paths) == 0 {
		return nil, fmt.Errorf("no files provided")
	}

	var buf bytes.Buffer
	w := zip.NewWriter(&buf)

	for _, p := range paths {
		f, err := os.Open(p)
		if err != nil {
			return nil, fmt.Errorf("open %s: %w", p, err)
		}
		info, err := f.Stat()
		if err != nil {
			f.Close()
			return nil, fmt.Errorf("stat %s: %w", p, err)
		}
		header, err := zip.FileInfoHeader(info)
		if err != nil {
			f.Close()
			return nil, fmt.Errorf("zip header %s: %w", p, err)
		}
		header.Name = filepath.Base(p)
		header.Method = zip.Deflate

		writer, err := w.CreateHeader(header)
		if err != nil {
			f.Close()
			return nil, fmt.Errorf("zip create %s: %w", p, err)
		}
		if _, err := io.Copy(writer, f); err != nil {
			f.Close()
			return nil, fmt.Errorf("zip copy %s: %w", p, err)
		}
		f.Close()
	}

	if err := w.Close(); err != nil {
		return nil, fmt.Errorf("zip close: %w", err)
	}
	return buf.Bytes(), nil
}
