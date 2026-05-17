package application

import (
	"context"
	"fmt"

	"hyperion-desktop/internal/domain/ai"
	"hyperion-desktop/internal/ports"
)

func (s *AIService) GenerateStream(
	ctx context.Context,
	requestID string,
	req GenerateRequest,
	h ports.StreamHandler,
) error {
	if req.Provider == "" {
		return fmt.Errorf("provider required")
	}
	if len(req.Messages) == 0 {
		return fmt.Errorf("messages required")
	}

	p, err := s.registry.Get(req.Provider)
	if err != nil {
		return err
	}
	if err := p.IsAvailable(ctx); err != nil {
		return fmt.Errorf("provider %q unavailable: %w", req.Provider, err)
	}

	streamer, ok := p.(ports.AIStreamer)
	if !ok {
		return fmt.Errorf("provider %q does not support streaming", req.Provider)
	}

	in := ai.GenerateInput{
		Model:     req.Model,
		System:    req.System,
		Messages:  req.Messages,
		MaxTokens: req.MaxTokens,
	}
	return streamer.GenerateStream(ctx, requestID, in, h)
}
