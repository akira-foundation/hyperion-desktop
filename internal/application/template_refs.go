package application

import (
	"context"
	"encoding/base64"
	"fmt"
	"io"
	nethttp "net/http"
	neturl "net/url"
	"os"
	"path/filepath"
	"strings"
	"time"
)

var timeSecond = time.Second

func stageReferences(ctx context.Context, tmpDir string, in GenerateTemplateInput) ([]string, error) {
	refsDir := filepath.Join(tmpDir, ".refs")
	if err := os.MkdirAll(refsDir, 0o755); err != nil {
		return nil, fmt.Errorf("refs dir: %w", err)
	}
	refPaths := make([]string, 0, len(in.Attachments)+len(in.LocalRefs)+len(in.URLs))

	for _, a := range in.Attachments {
		if a.Filename == "" || a.Base64 == "" {
			continue
		}
		safe := filepath.Base(a.Filename)
		path := filepath.Join(refsDir, safe)
		data, err := decodeBase64(a.Base64)
		if err != nil {
			return nil, fmt.Errorf("decode attachment %s: %w", safe, err)
		}
		if err := os.WriteFile(path, data, 0o644); err != nil {
			return nil, fmt.Errorf("write attachment %s: %w", safe, err)
		}
		refPaths = append(refPaths, path)
	}

	for _, p := range in.LocalRefs {
		if p == "" {
			continue
		}
		if info, err := os.Stat(p); err != nil || info.IsDir() {
			return nil, fmt.Errorf("local ref %s: not accessible", p)
		}
		refPaths = append(refPaths, p)
	}

	for i, u := range in.URLs {
		u = strings.TrimSpace(u)
		if u == "" {
			continue
		}
		body, err := fetchURL(ctx, u)
		if err != nil {
			return nil, fmt.Errorf("fetch %s: %w", u, err)
		}
		path := filepath.Join(refsDir, fmt.Sprintf("url-%02d.html", i+1))
		header := fmt.Sprintf("<!-- Source URL: %s -->\n", u)
		if err := os.WriteFile(path, append([]byte(header), body...), 0o644); err != nil {
			return nil, fmt.Errorf("write url %s: %w", u, err)
		}
		refPaths = append(refPaths, path)
	}

	return refPaths, nil
}

func fetchURL(ctx context.Context, raw string) ([]byte, error) {
	u, err := neturl.Parse(raw)
	if err != nil {
		return nil, fmt.Errorf("invalid url: %w", err)
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return nil, fmt.Errorf("unsupported scheme %q", u.Scheme)
	}
	req, err := nethttp.NewRequestWithContext(ctx, nethttp.MethodGet, u.String(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Hyperion/1.0 (template generator)")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,*/*")
	client := &nethttp.Client{Timeout: 30 * timeSecond}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("status %d", resp.StatusCode)
	}
	return ioReadAllLimited(resp.Body, 1024*1024)
}

func ioReadAllLimited(r io.Reader, max int64) ([]byte, error) {
	return io.ReadAll(io.LimitReader(r, max))
}

func decodeBase64(s string) ([]byte, error) {
	if i := strings.Index(s, ","); i >= 0 && strings.Contains(s[:i], ";base64") {
		s = s[i+1:]
	}
	return base64.StdEncoding.DecodeString(s)
}
