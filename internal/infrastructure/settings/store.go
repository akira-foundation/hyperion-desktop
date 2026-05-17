package settings

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
)

type Settings struct {
	Theme              string `json:"theme"`              // light | dark | system
	OnboardingDone     bool   `json:"onboardingDone"`
	DefaultAIProvider  string `json:"defaultAiProvider"`
	DefaultImageProvider string `json:"defaultImageProvider"`
	DefaultModel       string `json:"defaultModel"`
}

func defaults() Settings {
	return Settings{
		Theme:               "dark",
		OnboardingDone:      false,
		DefaultAIProvider:   "claude-cli",
		DefaultImageProvider: "openai-image",
	}
}

type Store struct {
	mu   sync.RWMutex
	path string
	data Settings
}

func NewStore(path string) (*Store, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, err
	}
	s := &Store{path: path, data: defaults()}
	if err := s.load(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *Store) Get() Settings {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.data
}

func (s *Store) Set(next Settings) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data = next
	return s.persist()
}

func (s *Store) Update(fn func(Settings) Settings) (Settings, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data = fn(s.data)
	if err := s.persist(); err != nil {
		return s.data, err
	}
	return s.data, nil
}

func (s *Store) load() error {
	data, err := os.ReadFile(s.path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	var parsed Settings
	if err := json.Unmarshal(data, &parsed); err != nil {
		return err
	}
	// Merge defaults for missing fields
	d := defaults()
	if parsed.Theme == "" {
		parsed.Theme = d.Theme
	}
	if parsed.DefaultAIProvider == "" {
		parsed.DefaultAIProvider = d.DefaultAIProvider
	}
	if parsed.DefaultImageProvider == "" {
		parsed.DefaultImageProvider = d.DefaultImageProvider
	}
	s.data = parsed
	return nil
}

func (s *Store) persist() error {
	data, err := json.MarshalIndent(s.data, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.path, data, 0o644)
}
