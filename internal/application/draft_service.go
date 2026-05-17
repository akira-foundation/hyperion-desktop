package application

import (
	"context"
	"time"

	"github.com/google/uuid"

	"hyperion-desktop/internal/domain/draft"
	"hyperion-desktop/internal/ports"
)

type DraftService struct {
	repo ports.DraftRepository
}

func NewDraftService(repo ports.DraftRepository) *DraftService {
	return &DraftService{repo: repo}
}

type CreateDraftInput struct {
	Title    string
	Body     string
	Platform draft.Platform
}

func (s *DraftService) Create(ctx context.Context, in CreateDraftInput) (*draft.Draft, error) {
	now := time.Now().UTC()
	d := &draft.Draft{
		ID:        uuid.NewString(),
		Title:     in.Title,
		Body:      in.Body,
		Platform:  in.Platform,
		Status:    draft.StatusDraft,
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := s.repo.Create(ctx, d); err != nil {
		return nil, err
	}
	return d, nil
}

func (s *DraftService) List(ctx context.Context) ([]*draft.Draft, error) {
	return s.repo.List(ctx)
}

func (s *DraftService) Get(ctx context.Context, id string) (*draft.Draft, error) {
	return s.repo.Get(ctx, id)
}

func (s *DraftService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
