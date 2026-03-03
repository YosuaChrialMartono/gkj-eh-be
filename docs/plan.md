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
├── docker-compose.yml           ← PostgreSQL container
├── air.toml                     ← Live reload config
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

## Quick Start

```bash
# 1. Start database
make db-up

# 2. Copy and fill env
cp .env.example .env

# 3. Install air for live reload (one-time)
make setup

# 4. Run with live reload
make dev

# 5. Test
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"t@t.com","password":"secret"}'
```

### Makefile Commands

| Command | Description |
|---------|-------------|
| `make run` | Run server without live reload |
| `make dev` | Run with live reload (requires air) |
| `make build` | Build binary to `bin/server` |
| `make tidy` | Update Go dependencies |
| `make db-up` | Start PostgreSQL container |
| `make db-down` | Stop PostgreSQL container |
| `make db-reset` | Reset database (removes volume) |
| `make setup` | Install air tool |

---

## Image Storage Options

### Pricing Comparison (IDR, 1 USD = ~17,000 IDR)

| Provider | Free | 100GB/mo | 1TB/mo |
|----------|------|----------|--------|
| **AWS S3** | 5GB | ~₨75,000 | ~₨400,000 |
| **Alibaba OSS** | 5GB | ~₨50,000 | ~₨294,000 |
| **Cloudinary** | 25 credits | ₨1,500,000 | ₨4,200,000 |
| **Google Drive** | 15GB | ~₨50,000 | ~₨170,000 |
| **Dropbox** | 2GB | ~₨204,000 | ~₨204,000 |

**Storage only (no bandwidth):**

| Provider | Price/GB |
|----------|----------|
| **Alibaba OSS** | ~₨290/GB |
| **AWS S3** | ~₨350/GB |
| **Google Drive** | ~₨500/GB (100GB plan) |

### Details

#### Cloudinary
- **Free tier:** 25 credits/month (OR 25GB storage OR 25GB bandwidth)
- **Paid:** Starts at ₨1.5M/mo (Plus plan)
- **Pros:** Easiest integration, built-in CDN, transformations, image optimization
- **Cons:** Gets expensive quickly, credit-based system is confusing

#### Alibaba OSS
- **Free tier:** 5GB
- **Pricing:** ~₨290/GB/month
- **Pros:** Cheapest option, Indonesia region available (Jakarta)
- **Cons:** More complex setup, no built-in CDN (need to add separately)

#### AWS S3
- **Free tier:** 5GB (12 months)
- **Pricing:** ~₨350/GB/month
- **Pros:** Most mature, works well with CloudFront CDN
- **Cons:** More expensive than Alibaba

### Recommendation

For a church CMS with minimal images:

1. **Start with Cloudinary free tier** — 25 credits is ~25GB, likely enough for years
2. **Migrate to Alibaba OSS** if costs become an issue
3. **Migration is simple** — just update URL strings in database (CMS stores URLs, not files)

---

## MVP Prototype Branch

Branch: `mvp-prototype`

Changes from main:
- Auth middleware removed — all endpoints are public
- Suitable for rapid prototyping without authentication

---

## Frontend Changes (`gkj-eh-web`)

Six files only:

1. `lib/types/auth.ts` — add `refreshToken?: string` to `AuthResponse`
2–5. `app/api/auth/{login,register,google,refresh}/route.ts` — cookie set from `data.refreshToken ?? data.accessToken`
6. `middleware.ts` — add `/pelayan` to `PROTECTED_PATHS`

---

## Database Storage Estimate

| Content | Estimate |
|---------|----------|
| 500 articles @ 5KB each | ~2.5 MB |
| Users table | < 1 MB |
| Pelayan (service schedule) | < 1 MB |
| **Total** | **~5 MB** |

**Conclusion:** Text-based CMS, no file storage concerns. Even with 10+ years of content, you'll be under 100MB. PostgreSQL docker volume (default 20GB) will last practically forever.
