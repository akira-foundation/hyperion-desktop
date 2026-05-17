package sqlite

import (
	"context"
	"database/sql"
	"fmt"

	"hyperion-desktop/internal/domain/draft"
)

type DraftRepository struct {
	db *sql.DB
}

func NewDraftRepository(db *sql.DB) *DraftRepository {
	return &DraftRepository{db: db}
}

func (r *DraftRepository) Create(ctx context.Context, d *draft.Draft) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO drafts (id, title, body, platform, status, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		d.ID, d.Title, d.Body, string(d.Platform), string(d.Status), d.CreatedAt, d.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("draft create: %w", err)
	}
	return nil
}

func (r *DraftRepository) Get(ctx context.Context, id string) (*draft.Draft, error) {
	row := r.db.QueryRowContext(ctx,
		`SELECT id, title, body, platform, status, created_at, updated_at FROM drafts WHERE id = ?`, id)
	d := &draft.Draft{}
	var platform, status string
	if err := row.Scan(&d.ID, &d.Title, &d.Body, &platform, &status, &d.CreatedAt, &d.UpdatedAt); err != nil {
		return nil, fmt.Errorf("draft get: %w", err)
	}
	d.Platform = draft.Platform(platform)
	d.Status = draft.Status(status)
	return d, nil
}

func (r *DraftRepository) List(ctx context.Context) ([]*draft.Draft, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, title, body, platform, status, created_at, updated_at FROM drafts ORDER BY updated_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("draft list: %w", err)
	}
	defer rows.Close()

	var out []*draft.Draft
	for rows.Next() {
		d := &draft.Draft{}
		var platform, status string
		if err := rows.Scan(&d.ID, &d.Title, &d.Body, &platform, &status, &d.CreatedAt, &d.UpdatedAt); err != nil {
			return nil, fmt.Errorf("draft scan: %w", err)
		}
		d.Platform = draft.Platform(platform)
		d.Status = draft.Status(status)
		out = append(out, d)
	}
	return out, rows.Err()
}

func (r *DraftRepository) Update(ctx context.Context, d *draft.Draft) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE drafts SET title=?, body=?, platform=?, status=?, updated_at=? WHERE id=?`,
		d.Title, d.Body, string(d.Platform), string(d.Status), d.UpdatedAt, d.ID,
	)
	if err != nil {
		return fmt.Errorf("draft update: %w", err)
	}
	return nil
}

func (r *DraftRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM drafts WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("draft delete: %w", err)
	}
	return nil
}
