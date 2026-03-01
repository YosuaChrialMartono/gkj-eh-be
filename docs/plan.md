# Plan: Go Backend (`gkj-eh-be`) + Frontend Wiring

## Context
The frontend (`gkj-eh-web`) already has BFF routes that proxy to `process.env.API_URL`
(`http://localhost:8080/api`), but the backend never existed. This plan creates a full
Go REST API in a new sibling repo (`gkj-eh-be`), implements all endpoints consumed by the
frontend, and makes the minimal frontend changes to wire it up properly (dual JWT tokens +
`/pelayan` middleware protection).

---

## Assumptions / Constraints
- PostgreSQL database
- Go already installed
- New repo lives at `C:\Users\BMAX\projects\gkj-eh-be`
- No `golang-migrate` — custom idempotent migration runner (see Phase 1)
- No external framework beyond `chi` router; all else is stdlib + thin drivers

---

## Repo Layout

```
gkj-eh-be/
├── cmd/server/main.go           ← entry point (runs migrations then starts HTTP)
├── docs/
│   └── plan.md                  ← this file
├── internal/
│   ├── config/config.go         ← env vars (DB URL, JWT secret, port, Google client ID)
│   ├── db/db.go                 ← pgx stdlib driver setup
│   ├── migrate/migrate.go       ← custom migration runner
│   ├── jwt/jwt.go               ← sign/verify access & refresh tokens
│   ├── model/
│   │   ├── user.go
│   │   ├── content.go
│   │   └── pelayan.go
│   ├── store/
│   │   ├── user_store.go
│   │   ├── content_store.go
│   │   └── pelayan_store.go
│   ├── handler/
│   │   ├── respond.go           ← respondJSON / respondError helpers
│   │   ├── auth_handler.go
│   │   ├── content_handler.go
│   │   └── pelayan_handler.go
│   └── middleware/auth.go       ← JWT validation middleware
├── migrations/
│   ├── 001_create_users.sql
│   ├── 002_create_content.sql
│   └── 003_create_pelayan.sql
├── go.mod
├── .env.example
└── Makefile
```

---

## Migration System

On every server start, `migrate.Run(db, "migrations")` runs before the HTTP server.

1. Creates `schema_migrations(version, name, applied_at)` table if absent
2. Reads all `*.sql` files in `migrations/`, parses `NNN` prefix as version
3. Queries DB for already-applied versions
4. Applies pending migrations in ascending order, each inside its own transaction
5. Records each applied migration — safe to re-run, never double-applies

---

## Token Strategy

Two JWT types differentiated by `"type"` claim:

| Token | TTL | Claims | Used for |
|---|---|---|---|
| access | 15 min | sub, role, email, type=access | Bearer header on all API calls |
| refresh | 30 days | sub, type=refresh | Sent in body to `POST /api/auth/refresh` |

The Next.js BFF stores the refresh token in an httpOnly cookie named `refresh_token`.
The Go backend is stateless — no token table needed.

---

## API Routes

### Auth (public)
| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/login` | bcrypt verify → `{user, accessToken, refreshToken}` |
| POST | `/api/auth/register` | hash pw, insert → same response |
| POST | `/api/auth/google` | verify via tokeninfo endpoint → upsert user → same response |
| POST | `/api/auth/refresh` | body `{refreshToken}` → verify type=refresh → new pair |
| POST | `/api/auth/logout` | stateless → `{success:true}` |

### Content
| Method | Path | Auth |
|---|---|---|
| GET | `/api/content/public` | none |
| GET | `/api/content/public/slug/:slug` | none |
| GET/POST | `/api/content` | access JWT |
| GET/PUT/DELETE | `/api/content/:id` | access JWT |

### Pelayan (all require access JWT)
Roles, Persons, Services (`?month=YYYY-MM`), Assignments (`?serviceId=`, upsert via ON CONFLICT)

---

## Environment Variables

```
DATABASE_URL=postgres://postgres:password@localhost:5432/gkj_eh?sslmode=disable
JWT_SECRET=change-me-to-a-random-32-byte-hex-string
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=720h
PORT=8080
GOOGLE_CLIENT_ID=
ALLOWED_ORIGINS=http://localhost:3000
```

---

## Frontend Changes (`gkj-eh-web`)

Six files only:

1. `lib/types/auth.ts` — add `refreshToken?: string` to `AuthResponse`
2–5. `app/api/auth/{login,register,google,refresh}/route.ts` — cookie set from `data.refreshToken ?? data.accessToken`
6. `middleware.ts` — add `/pelayan` to `PROTECTED_PATHS`

---

## Quick Start

```bash
# 1. Create database
createdb gkj_eh

# 2. Copy and fill env
cp .env.example .env

# 3. Fetch deps
go mod tidy

# 4. Run (applies migrations automatically)
make run

# 5. Test
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"t@t.com","password":"secret"}'
```
