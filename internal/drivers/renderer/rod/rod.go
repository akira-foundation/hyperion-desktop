package rod

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/url"
	"time"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/launcher"
	"github.com/go-rod/rod/lib/proto"

	"hyperion-desktop/internal/domain/template"
)

type Driver struct {
	baseURL string
}

func New(baseURL string) *Driver {
	return &Driver{baseURL: baseURL}
}

func (d *Driver) Name() string { return "rod" }

func (d *Driver) Render(ctx context.Context, req template.RenderRequest) ([]byte, error) {
	if req.Size.Width <= 0 || req.Size.Height <= 0 {
		return nil, fmt.Errorf("renderer: invalid size %dx%d", req.Size.Width, req.Size.Height)
	}

	propsJSON, err := json.Marshal(req.Props)
	if err != nil {
		return nil, fmt.Errorf("renderer: marshal props: %w", err)
	}
	encoded := base64.RawURLEncoding.EncodeToString(propsJSON)

	target := fmt.Sprintf("%s/?render=%s&props=%s",
		d.baseURL,
		url.QueryEscape(req.TemplateID),
		url.QueryEscape(encoded),
	)

	launcher := launcher.New().
		Headless(true).
		Set("disable-gpu").
		Set("hide-scrollbars").
		Set("force-device-scale-factor", "2")

	u, err := launcher.Launch()
	if err != nil {
		return nil, fmt.Errorf("renderer: launch: %w", err)
	}
	defer launcher.Cleanup()

	browser := rod.New().ControlURL(u).Context(ctx)
	if err := browser.Connect(); err != nil {
		return nil, fmt.Errorf("renderer: connect: %w", err)
	}
	defer browser.Close()

	page, err := browser.Page(proto.TargetCreateTarget{URL: "about:blank"})
	if err != nil {
		return nil, fmt.Errorf("renderer: page: %w", err)
	}
	if err := page.SetViewport(&proto.EmulationSetDeviceMetricsOverride{
		Width:             req.Size.Width,
		Height:            req.Size.Height,
		DeviceScaleFactor: 2,
		Mobile:            false,
	}); err != nil {
		return nil, fmt.Errorf("renderer: viewport: %w", err)
	}

	if err := page.Navigate(target); err != nil {
		return nil, fmt.Errorf("renderer: navigate: %w", err)
	}
	if err := page.WaitLoad(); err != nil {
		return nil, fmt.Errorf("renderer: wait load: %w", err)
	}

	if _, err := page.Timeout(10 * time.Second).
		Element(`[data-render-ready="true"]`); err != nil {
		return nil, fmt.Errorf("renderer: wait ready: %w", err)
	}

	img, err := page.Screenshot(true, &proto.PageCaptureScreenshot{
		Format: proto.PageCaptureScreenshotFormatPng,
		Clip: &proto.PageViewport{
			X:      0,
			Y:      0,
			Width:  float64(req.Size.Width),
			Height: float64(req.Size.Height),
			Scale:  1,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("renderer: screenshot: %w", err)
	}
	return img, nil
}
