package openai

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"hyperion-desktop/internal/domain/image"
)

const endpoint = "https://api.openai.com/v1/images/generations"

type Provider struct {
	apiKey string
	http   *http.Client
}

func New(apiKey string) *Provider {
	return &Provider{
		apiKey: apiKey,
		http:   &http.Client{Timeout: 120 * time.Second},
	}
}

func (p *Provider) Name() string        { return "openai-image" }
func (p *Provider) DisplayName() string { return "OpenAI Image" }

func (p *Provider) IsAvailable(_ context.Context) error {
	if p.apiKey == "" {
		return errors.New("openai-image: missing OPENAI_API_KEY")
	}
	return nil
}

func (p *Provider) Capabilities() image.Capabilities {
	return image.Capabilities{Quality: true, Variants: true, Inpaint: false}
}

func (p *Provider) Models(_ context.Context) ([]image.ModelInfo, error) {
	return []image.ModelInfo{
		{
			ID:        "gpt-image-1",
			Name:      "GPT Image 1",
			Sizes:     []string{"1024x1024", "1024x1536", "1536x1024", "auto"},
			Qualities: []string{"auto", "low", "medium", "high"},
			Default:   true,
		},
	}, nil
}

type generateRequest struct {
	Model   string `json:"model"`
	Prompt  string `json:"prompt"`
	Size    string `json:"size,omitempty"`
	Quality string `json:"quality,omitempty"`
	N       int    `json:"n,omitempty"`
}

type generateResponse struct {
	Data []struct {
		B64JSON string `json:"b64_json"`
	} `json:"data"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	} `json:"error,omitempty"`
}

func (p *Provider) Generate(ctx context.Context, in image.GenerateInput) ([]byte, string, error) {
	if p.apiKey == "" {
		return nil, "", errors.New("openai-image: missing api key")
	}
	if in.Prompt == "" {
		return nil, "", errors.New("openai-image: prompt required")
	}

	model := in.Model
	if model == "" {
		model = "gpt-image-1"
	}
	size := in.Size
	if size == "" {
		size = "1024x1024"
	}
	quality := string(in.Quality)
	if quality == "" {
		quality = string(image.QualityAuto)
	}

	body, err := json.Marshal(generateRequest{
		Model:   model,
		Prompt:  in.Prompt,
		Size:    size,
		Quality: quality,
		N:       1,
	})
	if err != nil {
		return nil, "", fmt.Errorf("marshal: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return nil, "", fmt.Errorf("request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+p.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := p.http.Do(req)
	if err != nil {
		return nil, "", fmt.Errorf("openai-image: http: %w", err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode >= 400 {
		var apiErr generateResponse
		_ = json.Unmarshal(raw, &apiErr)
		if apiErr.Error != nil && apiErr.Error.Message != "" {
			return nil, "", fmt.Errorf("openai-image: %s", apiErr.Error.Message)
		}
		return nil, "", fmt.Errorf("openai-image: status %d: %s", resp.StatusCode, string(raw))
	}

	var parsed generateResponse
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, "", fmt.Errorf("parse response: %w", err)
	}
	if len(parsed.Data) == 0 || parsed.Data[0].B64JSON == "" {
		return nil, "", errors.New("openai-image: empty response")
	}

	pngBytes, err := base64.StdEncoding.DecodeString(parsed.Data[0].B64JSON)
	if err != nil {
		return nil, "", fmt.Errorf("decode b64: %w", err)
	}

	return pngBytes, "image/png", nil
}
