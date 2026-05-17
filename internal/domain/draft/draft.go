package draft

import "time"

type Status string

const (
	StatusDraft     Status = "draft"
	StatusReady     Status = "ready"
	StatusArchived  Status = "archived"
)

type Platform string

const (
	PlatformX         Platform = "x"
	PlatformLinkedIn  Platform = "linkedin"
	PlatformBluesky   Platform = "bluesky"
	PlatformMastodon  Platform = "mastodon"
	PlatformInstagram Platform = "instagram"
)

type Draft struct {
	ID        string
	Title     string
	Body      string
	Platform  Platform
	Status    Status
	CreatedAt time.Time
	UpdatedAt time.Time
}
