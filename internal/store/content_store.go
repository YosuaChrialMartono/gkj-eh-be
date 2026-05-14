package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/gkj-eben-haezer/gkj-eh-be/internal/model"
)

type ContentStore struct {
	db *sql.DB
}

func NewContentStore(db *sql.DB) *ContentStore {
	return &ContentStore{db: db}
}

func scanContent(row interface {
	Scan(...any) error
}) (*model.Content, error) {
	c := &model.Content{}
	return c, row.Scan(
		&c.ID, &c.Title, &c.Slug, &c.Type, &c.Status, &c.Body, &c.BodyHtml,
		&c.AuthorID, &c.AuthorName,
		&c.FeaturedImageURL, &c.PublishedAt,
		&c.CreatedAt, &c.UpdatedAt,
	)
}

func scanListItem(row interface {
	Scan(...any) error
}) (*model.ContentListItem, error) {
	c := &model.ContentListItem{}
	return c, row.Scan(
		&c.ID, &c.Title, &c.Slug, &c.Type, &c.Status,
		&c.AuthorID, &c.AuthorName,
		&c.FeaturedImageURL, &c.PublishedAt,
		&c.CreatedAt, &c.UpdatedAt,
	)
}

const listItemCols = `
	c.id, c.title, c.slug, c.type, c.status,
	c.author_id, u.name AS author_name,
	c.featured_image_url, c.published_at,
	c.created_at, c.updated_at`

func (s *ContentStore) List(ctx context.Context, p model.ContentListParams, publicOnly bool) (*model.PaginatedResponse[model.ContentListItem], error) {
	where := []string{}
	args := []any{}
	n := 1

	if publicOnly {
		where = append(where, fmt.Sprintf("c.status = $%d", n))
		args = append(args, "published")
		n++
	} else if p.Status != "" {
		where = append(where, fmt.Sprintf("c.status = $%d", n))
		args = append(args, p.Status)
		n++
	}
	if p.Type != "" {
		where = append(where, fmt.Sprintf("c.type = $%d", n))
		args = append(args, p.Type)
		n++
	}
	if p.Search != "" {
		where = append(where, fmt.Sprintf("(c.title ILIKE $%d OR c.slug ILIKE $%d)", n, n))
		args = append(args, "%"+p.Search+"%")
		n++
	}

	clause := ""
	if len(where) > 0 {
		clause = "WHERE " + strings.Join(where, " AND ")
	}

	var total int
	if err := s.db.QueryRowContext(ctx,
		fmt.Sprintf(`SELECT COUNT(*) FROM content c JOIN users u ON u.id = c.author_id %s`, clause),
		args...,
	).Scan(&total); err != nil {
		return nil, err
	}

	limit := p.Limit
	if limit <= 0 {
		limit = 20
	}
	page := p.Page
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	totalPages := (total + limit - 1) / limit

	args = append(args, limit, offset)
	rows, err := s.db.QueryContext(ctx,
		fmt.Sprintf(`SELECT %s FROM content c JOIN users u ON u.id = c.author_id %s
		ORDER BY c.updated_at DESC LIMIT $%d OFFSET $%d`,
			listItemCols, clause, n, n+1),
		args...,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model.ContentListItem
	for rows.Next() {
		item, err := scanListItem(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *item)
	}
	if items == nil {
		items = []model.ContentListItem{}
	}

	return &model.PaginatedResponse[model.ContentListItem]{
		Data: items, Total: total, Page: page, Limit: limit, TotalPages: totalPages,
	}, rows.Err()
}

func (s *ContentStore) GetByID(ctx context.Context, id string) (*model.Content, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT c.id, c.title, c.slug, c.type, c.status, c.body, c.body_html,
		        c.author_id, u.name, c.featured_image_url, c.published_at,
		        c.created_at, c.updated_at
		 FROM content c JOIN users u ON u.id = c.author_id WHERE c.id = $1`, id)
	c, err := scanContent(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return c, err
}

func (s *ContentStore) GetBySlug(ctx context.Context, slug string, publicOnly bool) (*model.Content, error) {
	q := `SELECT c.id, c.title, c.slug, c.type, c.status, c.body, c.body_html,
	             c.author_id, u.name, c.featured_image_url, c.published_at,
	             c.created_at, c.updated_at
	      FROM content c JOIN users u ON u.id = c.author_id WHERE c.slug = $1`
	if publicOnly {
		q += " AND c.status = 'published'"
	}
	row := s.db.QueryRowContext(ctx, q, slug)
	c, err := scanContent(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return c, err
}

func (s *ContentStore) Create(ctx context.Context, in model.ContentCreateInput, authorID string) (*model.Content, error) {
	var publishedAt *time.Time
	if in.PublishedAt != nil {
		t, err := time.Parse(time.RFC3339, *in.PublishedAt)
		if err != nil {
			return nil, fmt.Errorf("invalid publishedAt: %w", err)
		}
		publishedAt = &t
	}

	var id string
	err := s.db.QueryRowContext(ctx,
		`INSERT INTO content (title, slug, type, status, body, body_html, author_id, featured_image_url, published_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
		in.Title, in.Slug, in.Type, in.Status, in.Body, in.BodyHtml, authorID, in.FeaturedImageURL, publishedAt,
	).Scan(&id)
	if err != nil {
		return nil, err
	}
	return s.GetByID(ctx, id)
}

func (s *ContentStore) Update(ctx context.Context, id string, in model.ContentUpdateInput) (*model.Content, error) {
	var publishedAt *time.Time
	if in.PublishedAt != nil {
		t, err := time.Parse(time.RFC3339, *in.PublishedAt)
		if err != nil {
			return nil, fmt.Errorf("invalid publishedAt: %w", err)
		}
		publishedAt = &t
	}

	_, err := s.db.ExecContext(ctx,
		`UPDATE content SET title=$1, slug=$2, type=$3, status=$4, body=$5, body_html=$6,
		 featured_image_url=$7, published_at=$8, updated_at=NOW()
		 WHERE id=$9`,
		in.Title, in.Slug, in.Type, in.Status, in.Body, in.BodyHtml,
		in.FeaturedImageURL, publishedAt, id,
	)
	if err != nil {
		return nil, err
	}
	return s.GetByID(ctx, id)
}

func (s *ContentStore) Delete(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM content WHERE id = $1`, id)
	return err
}
