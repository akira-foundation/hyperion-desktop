package ports

import (
	"context"

	"hyperion-desktop/internal/domain/draft"
)

type DraftRepository interface {
	Create(ctx context.Context, d *draft.Draft) error
	Get(ctx context.Context, id string) (*draft.Draft, error)
	List(ctx context.Context) ([]*draft.Draft, error)
	Update(ctx context.Context, d *draft.Draft) error
	Delete(ctx context.Context, id string) error
}
