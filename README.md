# gkj-eh-be

Go REST API backend for GKJ church content management system.

## Tech Stack

- **Go 1.23** with chi router
- **PostgreSQL** with pgx driver
- **JWT** authentication (access + refresh tokens)
- **Docker** for local development

## Project Structure

```
cmd/server/main.go           # Entry point
internal/
├── config/config.go         # Environment variables
├── db/db.go                 # PostgreSQL connection
├── migrate/migrate.go       # Custom migration runner
├── jwt/jwt.go               # Token signing/verification
├── middleware/auth.go       # Route protection
├── model/                   # Data structures
│   ├── user.go
│   ├── content.go
│   └── pelayan.go
├── store/                   # Database layer
│   ├── user_store.go
│   ├── content_store.go
│   └── pelayan_store.go
└── handler/                 # HTTP handlers
    ├── respond.go
    ├── auth_handler.go
    ├── content_handler.go
    └── pelayan_handler.go
migrations/                  # SQL migrations
```

## API Routes

### Auth (public)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/google` | Login/register via Google |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |

### Content
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/content/public` | none |
| GET | `/api/content/public/slug/:slug` | none |
| GET/POST | `/api/content` | JWT |
| GET/PUT/DELETE | `/api/content/:id` | JWT |

### Pelayan (service scheduling)
All endpoints require JWT:
- `/api/pelayan/roles` — List / Create / Update / Delete
- `/api/pelayan/persons` — List / Create / Delete
- `/api/pelayan/services` — List / Create / Update / Delete
- `/api/pelayan/assignments` — List / Upsert / Delete

## Quick Start

```bash
# Start database
make db-up

# Copy and fill env
cp .env.example .env

# Install air for live reload
make setup

# Run with live reload
make dev
```

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make run` | Run server without live reload |
| `make dev` | Run with live reload |
| `make build` | Build binary to `bin/server` |
| `make tidy` | Update dependencies |
| `make db-up` | Start PostgreSQL container |
| `make db-down` | Stop PostgreSQL container |
| `make db-reset` | Reset database |
| `make setup` | Install air |

## Environment Variables

```
DATABASE_URL=postgres://postgres:password@localhost:5432/gkj_eh?sslmode=disable
JWT_SECRET=your-secret-key
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=720h
PORT=8080
GOOGLE_CLIENT_ID=
ALLOWED_ORIGINS=http://localhost:3000
```

## Token Strategy

| Token | TTL | Purpose |
|-------|-----|---------|
| access | 15 min | Bearer header on API calls |
| refresh | 30 days | Sent to `/api/auth/refresh` |

## More

- Architecture notes for Claude / new contributors: [`CLAUDE.md`](./CLAUDE.md)
- Auth flow + how to add a new CRUD: [`docs/developer-guide.md`](./docs/developer-guide.md)
