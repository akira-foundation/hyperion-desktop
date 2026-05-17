package application

import (
	"hyperion-desktop/internal/infrastructure/settings"
)

type SettingsService struct {
	store *settings.Store
}

func NewSettingsService(store *settings.Store) *SettingsService {
	return &SettingsService{store: store}
}

func (s *SettingsService) Get() settings.Settings {
	return s.store.Get()
}

func (s *SettingsService) Save(next settings.Settings) error {
	return s.store.Set(next)
}

func (s *SettingsService) MarkOnboardingDone() (settings.Settings, error) {
	return s.store.Update(func(cur settings.Settings) settings.Settings {
		cur.OnboardingDone = true
		return cur
	})
}
