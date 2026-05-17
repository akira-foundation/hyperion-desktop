package image

import "time"

type Quality string

const (
	QualityAuto   Quality = "auto"
	QualityLow    Quality = "low"
	QualityMedium Quality = "medium"
	QualityHigh   Quality = "high"
)

type Kind string

const (
	KindSubject     Kind = "subject"
	KindBackground  Kind = "background"
	KindOverlay     Kind = "overlay"
	KindDecorative  Kind = "decorative"
	KindIllustration Kind = "illustration"
	KindOther       Kind = "other"
)

type GenerateInput struct {
	Model   string  `json:"model"`
	Prompt  string  `json:"prompt"`
	Size    string  `json:"size"`
	Quality Quality `json:"quality"`
	Kind    Kind    `json:"kind"`
}

type GeneratedImage struct {
	ID         string    `json:"id"`
	Filename   string    `json:"filename"`
	Path       string    `json:"path"`
	URL        string    `json:"url"`
	Prompt     string    `json:"prompt"`
	Model      string    `json:"model"`
	Provider   string    `json:"provider"`
	Size       string    `json:"size"`
	Quality    Quality   `json:"quality"`
	Kind       Kind      `json:"kind"`
	MimeType   string    `json:"mimeType"`
	SizeBytes  int64     `json:"sizeBytes"`
	Width      int       `json:"width"`
	Height     int       `json:"height"`
	CreatedAt  time.Time `json:"createdAt"`
}

type ModelInfo struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Sizes       []string `json:"sizes"`
	Qualities   []string `json:"qualities"`
	Default     bool     `json:"default"`
}

type Capabilities struct {
	Quality bool `json:"quality"`
	Variants bool `json:"variants"`
	Inpaint bool `json:"inpaint"`
}
