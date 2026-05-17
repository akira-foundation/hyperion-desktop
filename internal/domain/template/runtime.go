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
	Source      string         `json:"source"`
	Slides      []RuntimeSlide `json:"slides"`
	Assets      []string       `json:"assets"`
	CreatedAt   time.Time      `json:"createdAt"`
	Generation  *GenerationRecord `json:"generation,omitempty"`
}

type GenerationRecord struct {
	Prompt     string   `json:"prompt"`
	URLs       []string `json:"urls,omitempty"`
	LocalRefs  []string `json:"localRefs,omitempty"`
	Attachments []string `json:"attachments,omitempty"`
}

type RuntimeSlide struct {
	Index    int    `json:"index"`
	Filename string `json:"filename"`
}
