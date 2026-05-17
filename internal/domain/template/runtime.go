package template

import "time"

type RuntimeKind string

const (
	RuntimeKindCarousel RuntimeKind = "carousel"
	RuntimeKindSingle   RuntimeKind = "single"
)

type RuntimeTemplate struct {
	ID          string         `json:"id"`
	Slug        string         `json:"slug"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Category    string         `json:"category"`
	Kind        RuntimeKind    `json:"kind"`
	Size        Size           `json:"size"`
	Source      string         `json:"source"` // skill | import | ai-gen
	Slides      []RuntimeSlide `json:"slides"`
	Assets      []string       `json:"assets"` // shared assets (e.g. styles.css)
	CreatedAt   time.Time      `json:"createdAt"`
}

type RuntimeSlide struct {
	Index    int    `json:"index"`
	Filename string `json:"filename"`
}
