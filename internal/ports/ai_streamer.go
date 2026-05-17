package ports

import (
	"context"

	"hyperion-desktop/internal/domain/ai"
)

type StreamHandler interface {
	OnChunk(requestID, delta string)
	OnDone(requestID string)
	OnError(requestID, message string)
}

type AIStreamer interface {
	GenerateStream(ctx context.Context, requestID string, in ai.GenerateInput, h StreamHandler) error
}
