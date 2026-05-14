# CLAUDE.md

Go REST API backend for GKJ Eben-Haezer church content + service-scheduling system.

## Stack
- Go 1.23, chi router, pgx/PostgreSQL, JWT (access + refresh), godotenv
- Local dev: `docker-compose` for Postgres, `air` for live reload

## Layout
- `cmd/server/main.go` — entry, wires config → db → migrate → stores → handlers → router
- `internal/config` — env loader
- `internal/db` — pgx pool connect
- `internal/migrate` — custom idempotent SQL migration runner (auto-runs on start)
- `internal/jwt` — sign/verify access + refresh tokens
- `internal/middleware/auth.go` — `RequireAuth` middleware, puts claims on request context
- `internal/model` — plain structs (`user`, `content`, `pelayan`)
- `internal/store` — DB layer per resource
- `internal/handler` — HTTP handlers per resource; `respond.go` shared JSON helpers
- `migrations/NNN_*.sql` — applied in lexical order

## Conventions
- Three-layer: handler → store → db. No business logic in stores; no SQL in handlers.
- Every request mutating data goes through `middleware.RequireAuth` except `/api/auth/*` and `/api/content/public/*`.
- Migrations are append-only and idempotent (`CREATE TABLE IF NOT EXISTS …`). Never edit a shipped migration; add a new file.
- New CRUD follows the pattern documented in `docs/developer-guide.md` (migration → model → store → handler → route).

## Routes
See `README.md` for the full table. Public: auth + `/api/content/public/*`. Everything else needs JWT.

## Env
Copy `.env.example` → `.env`. Required: `DATABASE_URL`, `JWT_SECRET`. Optional: `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `PORT`, `GOOGLE_CLIENT_ID`, `ALLOWED_ORIGINS`.

## Common commands
- `make db-up` — start Postgres
- `make dev` — air live reload (run `make setup` once to install air)
- `make run` — plain `go run`
- `make build` — binary to `bin/server`
- `make db-reset` — wipe + restart Postgres volume

## Notes for Claude
- This is NOT a Node project. No `package.json`, no `.nvmrc`. Go toolchain only.
- Build artifacts go in `tmp/` and are gitignored — don't commit them.
- Migrations run automatically on server start; don't write a separate CLI for them.
- When adding endpoints, register them inside the existing `r.Route("/api", …)` group in `cmd/server/main.go` and decide public vs protected explicitly.
