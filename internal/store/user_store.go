package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/gkj-eben-haezer/gkj-eh-be/internal/model"
)

type UserStore struct {
	db *sql.DB
}

func NewUserStore(db *sql.DB) *UserStore {
	return &UserStore{db: db}
}

func (s *UserStore) GetByEmail(ctx context.Context, email string) (*model.User, error) {
	u := &model.User{}
	err := s.db.QueryRowContext(ctx,
		`SELECT id, name, email, password, avatar, role, created_at, updated_at
		 FROM users WHERE email = $1`, email,
	).Scan(&u.ID, &u.Name, &u.Email, &u.Password, &u.Avatar, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return u, err
}

func (s *UserStore) GetByID(ctx context.Context, id string) (*model.User, error) {
	u := &model.User{}
	err := s.db.QueryRowContext(ctx,
		`SELECT id, name, email, password, avatar, role, created_at, updated_at
		 FROM users WHERE id = $1`, id,
	).Scan(&u.ID, &u.Name, &u.Email, &u.Password, &u.Avatar, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return u, err
}

func (s *UserStore) Create(ctx context.Context, name, email string, passwordHash *string, avatar *string) (*model.User, error) {
	u := &model.User{}
	err := s.db.QueryRowContext(ctx,
		`INSERT INTO users (name, email, password, avatar)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, name, email, password, avatar, role, created_at, updated_at`,
		name, email, passwordHash, avatar,
	).Scan(&u.ID, &u.Name, &u.Email, &u.Password, &u.Avatar, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	return u, err
}

// UpsertGoogleUser inserts or updates a user authenticated via Google OAuth.
func (s *UserStore) UpsertGoogleUser(ctx context.Context, name, email string, avatar *string) (*model.User, error) {
	u := &model.User{}
	err := s.db.QueryRowContext(ctx,
		`INSERT INTO users (name, email, avatar)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (email) DO UPDATE
		   SET name   = EXCLUDED.name,
		       avatar = COALESCE(EXCLUDED.avatar, users.avatar),
		       updated_at = NOW()
		 RETURNING id, name, email, password, avatar, role, created_at, updated_at`,
		name, email, avatar,
	).Scan(&u.ID, &u.Name, &u.Email, &u.Password, &u.Avatar, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	return u, err
}

// ErrEmailTaken is returned when a unique constraint violation is detected on email.
var ErrEmailTaken = fmt.Errorf("email already taken")
