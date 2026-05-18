package template

import "time"

type RuntimeKind string

const (
	RuntimeKindCarousel RuntimeKind = "carousel"
	RuntimeKindSingle   RuntimeKind = "single"
)

type Format string

const (
	FormatFeed   Format = "feed"
	FormatStory  Format = "story"
	FormatSquare Format = "square"
)

func DefaultFormats() []Format { return []Format{FormatFeed} }

type RuntimeTemplate struct {
	ID          string            `json:"id"`
	Slug        string            `json:"slug"`
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Category    string            `json:"category"`
	Kind        RuntimeKind       `json:"kind"`
	Size        Size              `json:"size"`
	Source      string            `json:"source"`
	Slides      []RuntimeSlide    `json:"slides"`
	Assets      []string          `json:"assets"`
	Formats     []Format          `json:"formats,omitempty"`
	FormatSizes map[Format]Size   `json:"formatSizes,omitempty"`
	CreatedAt   time.Time         `json:"createdAt"`
	Generation  *GenerationRecord `json:"generation,omitempty"`
}

type GenerationRecord struct {
	Prompt      string   `json:"prompt"`
	URLs        []string `json:"urls,omitempty"`
	LocalRefs   []string `json:"localRefs,omitempty"`
	Attachments []string `json:"attachments,omitempty"`
	Formats     []Format `json:"formats,omitempty"`
}

type RuntimeSlide struct {
	Index    int               `json:"index"`
	Filename string            `json:"filename"`
	Files    map[Format]string `json:"files,omitempty"`
}

func (t *RuntimeTemplate) FilenameFor(slideIndex int, format Format) string {
	if slideIndex < 0 || slideIndex >= len(t.Slides) {
		return ""
	}
	s := t.Slides[slideIndex]
	if format == FormatFeed || format == "" {
		return s.Filename
	}
	if f, ok := s.Files[format]; ok && f != "" {
		return f
	}
	return s.Filename
}

func (t *RuntimeTemplate) SizeFor(format Format) Size {
	if format == FormatFeed || format == "" {
		return t.Size
	}
	if s, ok := t.FormatSizes[format]; ok && s.Width > 0 && s.Height > 0 {
		return s
	}
	switch format {
	case FormatStory:
		return Size{Width: 1080, Height: 1920}
	case FormatSquare:
		return Size{Width: 1080, Height: 1080}
	}
	return t.Size
}
