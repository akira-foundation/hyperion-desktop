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
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	Platform  Platform  `json:"platform"`
	Status    Status    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
