# Developer Guide

## How Auth Works

### Flow
1. `POST /api/auth/login` or `/register` → returns `{user, accessToken, refreshToken}`
2. Client stores tokens (access in memory, refresh in httpOnly cookie)
3. Every protected request includes `Authorization: Bearer <accessToken>`
4. `middleware/auth.go` validates token and stores claims in request context
5. `POST /api/auth/refresh` exchanges refresh token for new access+refresh pair

### Token Types
Defined in `internal/jwt/jwt.go`:

| Token | TTL | Claims |
|-------|-----|--------|
| access | 15 min | sub, role, email, type=access |
| refresh | 30 days | sub, type=refresh |

### Key Files
- `internal/jwt/jwt.go` - Sign/verify tokens
- `internal/middleware/auth.go` - Route protection
- `internal/handler/auth_handler.go` - Login, register, refresh, logout

---

## Creating a New CRUD

Example: Creating an "Announcements" feature.

### 1. Create Migration

File: `migrations/004_create_announcements.sql`

```sql
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Create Model

File: `internal/model/announcement.go`

```go
package model

import "time"

type Announcement struct {
    ID        string    `json:"id"`
    Title     string    `json:"title"`
    Body      string    `json:"body"`
    CreatedAt time.Time `json:"createdAt"`
}

type AnnouncementCreateInput struct {
    Title string `json:"title"`
    Body  string `json:"body"`
}

type AnnouncementUpdateInput = AnnouncementCreateInput
```

### 3. Create Store

File: `internal/store/announcement_store.go`

```go
package store

import (
    "context"
    "database/sql"
    "errors"

    "github.com/gkj-eben-haezer/gkj-eh-be/internal/model"
)

type AnnouncementStore struct {
    db *sql.DB
}

func NewAnnouncementStore(db *sql.DB) *AnnouncementStore {
    return &AnnouncementStore{db: db}
}

func (s *AnnouncementStore) List(ctx context.Context) ([]model.Announcement, error) {
    rows, err := s.db.QueryContext(ctx,
        "SELECT id, title, body, created_at FROM announcements ORDER BY created_at DESC")
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var items []model.Announcement
    for rows.Next() {
        var a model.Announcement
        if err := rows.Scan(&a.ID, &a.Title, &a.Body, &a.CreatedAt); err != nil {
            return nil, err
        }
        items = append(items, a)
    }
    return items, rows.Err()
}

func (s *AnnouncementStore) GetByID(ctx context.Context, id string) (*model.Announcement, error) {
    var a model.Announcement
    err := s.db.QueryRowContext(ctx,
        "SELECT id, title, body, created_at FROM announcements WHERE id = $1", id).
        Scan(&a.ID, &a.Title, &a.Body, &a.CreatedAt)
    if errors.Is(err, sql.ErrNoRows) {
        return nil, nil
    }
    return &a, err
}

func (s *AnnouncementStore) Create(ctx context.Context, in model.AnnouncementCreateInput) (*model.Announcement, error) {
    var a model.Announcement
    err := s.db.QueryRowContext(ctx,
        "INSERT INTO announcements (title, body) VALUES ($1, $2) RETURNING id, title, body, created_at",
        in.Title, in.Body).
        Scan(&a.ID, &a.Title, &a.Body, &a.CreatedAt)
    return &a, err
}

func (s *AnnouncementStore) Update(ctx context.Context, id string, in model.AnnouncementUpdateInput) (*model.Announcement, error) {
    var a model.Announcement
    err := s.db.QueryRowContext(ctx,
        "UPDATE announcements SET title = $1, body = $2 WHERE id = $3 RETURNING id, title, body, created_at",
        in.Title, in.Body, id).
        Scan(&a.ID, &a.Title, &a.Body, &a.CreatedAt)
    return &a, err
}

func (s *AnnouncementStore) Delete(ctx context.Context, id string) error {
    _, err := s.db.ExecContext(ctx, "DELETE FROM announcements WHERE id = $1", id)
    return err
}
```

### 4. Create Handler

File: `internal/handler/announcement_handler.go`

```go
package handler

import (
    "encoding/json"
    "net/http"

    "github.com/gkj-eben-haezer/gkj-eh-be/internal/model"
    "github.com/gkj-eben-haezer/gkj-eh-be/internal/store"
)

type AnnouncementHandler struct {
    announcements *store.AnnouncementStore
}

func NewAnnouncementHandler(a *store.AnnouncementStore) *AnnouncementHandler {
    return &AnnouncementHandler{announcements: a}
}

func (h *AnnouncementHandler) List(w http.ResponseWriter, r *http.Request) {
    items, err := h.announcements.List(r.Context())
    if err != nil {
        respondError(w, http.StatusInternalServerError, "failed to fetch announcements")
        return
    }
    if items == nil {
        items = []model.Announcement{}
    }
    respondJSON(w, http.StatusOK, items)
}

func (h *AnnouncementHandler) GetByID(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    item, err := h.announcements.GetByID(r.Context(), id)
    if err != nil {
        respondError(w, http.StatusInternalServerError, "failed to fetch announcement")
        return
    }
    if item == nil {
        respondError(w, http.StatusNotFound, "announcement not found")
        return
    }
    respondJSON(w, http.StatusOK, item)
}

func (h *AnnouncementHandler) Create(w http.ResponseWriter, r *http.Request) {
    var in model.AnnouncementCreateInput
    if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
        respondError(w, http.StatusBadRequest, "invalid request body")
        return
    }

    item, err := h.announcements.Create(r.Context(), in)
    if err != nil {
        respondError(w, http.StatusInternalServerError, "failed to create announcement")
        return
    }
    respondJSON(w, http.StatusCreated, item)
}

func (h *AnnouncementHandler) Update(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    var in model.AnnouncementUpdateInput
    if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
        respondError(w, http.StatusBadRequest, "invalid request body")
        return
    }

    item, err := h.announcements.Update(r.Context(), id, in)
    if err != nil {
        respondError(w, http.StatusInternalServerError, "failed to update announcement")
        return
    }
    respondJSON(w, http.StatusOK, item)
}

func (h *AnnouncementHandler) Delete(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    if err := h.announcements.Delete(r.Context(), id); err != nil {
        respondError(w, http.StatusInternalServerError, "failed to delete announcement")
        return
    }
    respondJSON(w, http.StatusOK, map[string]bool{"success": true})
}
```

Add the import:
```go
import (
    // ... other imports
    "github.com/go-chi/chi/v5"
)
```

### 5. Register Routes

In `cmd/server/main.go`:

```go
// Add store
announcements := store.NewAnnouncementStore(database)

// Add handler
announcementH := handler.NewAnnouncementHandler(announcements)

// Add routes (in the protected group)
r.Get("/announcements", announcementH.List)
r.Post("/announcements", announcementH.Create)
r.Get("/announcements/{id}", announcementH.GetByID)
r.Put("/announcements/{id}", announcementH.Update)
r.Delete("/announcements/{id}", announcementH.Delete)
```

---

## Frontend Integration

### What the Frontend Needs to Do

1. **Login/Register** → Call `/api/auth/login` or `/api/auth/register`
2. **Store Tokens**:
   - `accessToken` → in memory (state management)
   - `refreshToken` → httpOnly cookie (set by BFF)
3. **Protected Requests** → Add header:
   ```
   Authorization: Bearer <accessToken>
   ```
4. **Token Refresh** → On 401 response, call:
   ```json
   POST /api/auth/refresh
   { "refreshToken": "<from cookie>" }
   ```
   → Returns new `{accessToken, refreshToken}` pair

### Public vs Protected Routes

| Backend Route | Frontend Access |
|---------------|-----------------|
| `/api/content/public*` | No auth needed |
| `/api/content/*` | Requires JWT |
| `/api/pelayan/*` | Requires JWT |

### BFF Pattern

The frontend uses a Next.js BFF pattern:
- `app/api/auth/login/route.ts` → proxies to backend
- Sets httpOnly cookie for refresh token
- Returns access token to client

See `docs/plan.md` section "Frontend Changes" for details.
