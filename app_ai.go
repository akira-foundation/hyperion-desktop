package main

import (
	"context"
	"fmt"
	"log"
	"time"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"

	"hyperion-desktop/internal/application"
	"hyperion-desktop/internal/domain/ai"
	driverai "hyperion-desktop/internal/drivers/ai"
)

func (a *App) ListAIProviders() []driverai.ProviderInfo {
	list := a.ai.ListProviders(a.ctx)
	log.Printf("[hyperion] ListAIProviders called, returning %d providers", len(list))
	return list
}

func (a *App) GenerateContent(req application.GenerateRequest) (*ai.GenerateOutput, error) {
	return a.ai.Generate(a.ctx, req)
}

func (a *App) GenerateContentStream(req application.GenerateRequest) (string, error) {
	requestID := fmt.Sprintf("req_%d", time.Now().UnixNano())
	emitter := &wailsStreamEmitter{ctx: a.ctx}
	if err := a.ai.GenerateStream(a.ctx, requestID, req, emitter); err != nil {
		return "", err
	}
	return requestID, nil
}

type wailsStreamEmitter struct {
	ctx context.Context
}

func (e *wailsStreamEmitter) OnChunk(requestID, delta string) {
	wailsruntime.EventsEmit(e.ctx, "ai:chunk", map[string]any{
		"requestId": requestID,
		"delta":     delta,
	})
}

func (e *wailsStreamEmitter) OnDone(requestID string) {
	wailsruntime.EventsEmit(e.ctx, "ai:done", map[string]any{"requestId": requestID})
}

func (e *wailsStreamEmitter) OnError(requestID, message string) {
	wailsruntime.EventsEmit(e.ctx, "ai:error", map[string]any{
		"requestId": requestID,
		"message":   message,
	})
}
