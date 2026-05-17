package template

type AspectRatio string

const (
	RatioSquare    AspectRatio = "1:1"
	RatioStory     AspectRatio = "9:16"
	RatioLandscape AspectRatio = "16:9"
	RatioLinkedIn  AspectRatio = "1.91:1"
)

type Size struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

type Template struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Category    string      `json:"category"`
	AspectRatio AspectRatio `json:"aspectRatio"`
	Size        Size        `json:"size"`
}

type RenderRequest struct {
	TemplateID string         `json:"templateId"`
	Props      map[string]any `json:"props"`
	Size       Size           `json:"size"`
	SlideIndex int            `json:"slideIndex"`
}

type RenderResult struct {
	Path      string `json:"path"`
	Width     int    `json:"width"`
	Height    int    `json:"height"`
	SizeBytes int64  `json:"sizeBytes"`
}

type CarouselRenderRequest struct {
	TemplateID string         `json:"templateId"`
	Payload    map[string]any `json:"payload"`
	Size       Size           `json:"size"`
	SlideCount int            `json:"slideCount"`
}

type CarouselRenderResult struct {
	Directory string         `json:"directory"`
	Files     []RenderResult `json:"files"`
}
