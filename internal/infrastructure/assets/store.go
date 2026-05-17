package assets

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"

	"hyperion-desktop/internal/domain/image"
)

const manifestName = "manifest.json"

type Store struct {
	mu       sync.RWMutex
	dir      string
	manifest map[string]image.GeneratedImage
}

func NewStore(dir string) (*Store, error) {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, fmt.Errorf("assets mkdir: %w", err)
	}
	s := &Store{dir: dir, manifest: make(map[string]image.GeneratedImage)}
	if err := s.loadManifest(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *Store) Dir() string { return s.dir }

func (s *Store) Save(data []byte, mime string, meta image.GeneratedImage) (*image.GeneratedImage, error) {
	if len(data) == 0 {
		return nil, errors.New("empty image data")
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	id := uuid.NewString()
	ext := extFromMime(mime)
	filename := fmt.Sprintf("%s%s", id, ext)
	path := filepath.Join(s.dir, filename)
	if err := os.WriteFile(path, data, 0o644); err != nil {
		return nil, fmt.Errorf("write: %w", err)
	}

	meta.ID = id
	meta.Filename = filename
	meta.Path = path
	meta.URL = "/assets/" + filename
	meta.MimeType = mime
	meta.SizeBytes = int64(len(data))
	if meta.CreatedAt.IsZero() {
		meta.CreatedAt = time.Now().UTC()
	}

	s.manifest[id] = meta
	if err := s.persistManifest(); err != nil {
		return nil, err
	}
	return &meta, nil
}

func (s *Store) List() []image.GeneratedImage {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]image.GeneratedImage, 0, len(s.manifest))
	for _, v := range s.manifest {
		out = append(out, v)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].CreatedAt.After(out[j].CreatedAt) })
	return out
}

func (s *Store) Get(id string) (*image.GeneratedImage, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	v, ok := s.manifest[id]
	if !ok {
		return nil, fmt.Errorf("asset %q not found", id)
	}
	return &v, nil
}

func (s *Store) Delete(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	v, ok := s.manifest[id]
	if !ok {
		return fmt.Errorf("asset %q not found", id)
	}
	_ = os.Remove(v.Path)
	delete(s.manifest, id)
	return s.persistManifest()
}

func (s *Store) loadManifest() error {
	path := filepath.Join(s.dir, manifestName)
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return fmt.Errorf("read manifest: %w", err)
	}
	var entries []image.GeneratedImage
	if err := json.Unmarshal(data, &entries); err != nil {
		return fmt.Errorf("parse manifest: %w", err)
	}
	for _, e := range entries {
		s.manifest[e.ID] = e
	}
	return nil
}

func (s *Store) persistManifest() error {
	entries := make([]image.GeneratedImage, 0, len(s.manifest))
	for _, v := range s.manifest {
		entries = append(entries, v)
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].CreatedAt.After(entries[j].CreatedAt) })
	data, err := json.MarshalIndent(entries, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(s.dir, manifestName), data, 0o644)
}

func extFromMime(mime string) string {
	switch strings.ToLower(mime) {
	case "image/png":
		return ".png"
	case "image/jpeg", "image/jpg":
		return ".jpg"
	case "image/webp":
		return ".webp"
	case "image/gif":
		return ".gif"
	default:
		return ".bin"
	}
}
