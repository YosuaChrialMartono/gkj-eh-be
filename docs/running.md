# Running locally

## Repos

| | Path | Default branch | Stack |
|---|---|---|---|
| Backend | `~/projects/gkj-eh-be` | `master` | NestJS 11 + TypeORM/Postgres + JWT |
| Frontend | `~/projects/gkj-eh-web` | `main` | Next.js 16 (App Router) + React 19 + Tailwind 4 + shadcn/ui |

Both on GitHub under `YosuaChrialMartono/`.

## Backend

```bash
cd ~/projects/gkj-eh-be
# 1. Postgres
docker compose up -d           # exposes :5434 (matches config.yaml)

# 2. Edit config.yaml — jwt.secret should be replaced with a real value;
#    google.clientId stays empty until you wire Google sign-in.

# 3. Run
npm install
npm run start:dev              # watch mode on :8080
npm run seed                   # one-time, populates sample data (idempotent)
```

## Frontend

```bash
cd ~/projects/gkj-eh-web
# .env.local must contain: API_URL=http://localhost:8080  (no /api suffix)
npm install
npm run dev                    # :3000
```

## Seed data + test logins

After `npm run seed` on backend:

| Email | Password | Role |
|---|---|---|
| `admin@gkj.test` | `admin123` | admin |
| `editor@gkj.test` | `editor123` | editor |
| `viewer@gkj.test` | `viewer123` | viewer |

Seed also creates: 4 published + 1 draft content items, 4 pelayan roles, 6 persons, 3 upcoming Sunday services with assignments.

## Useful one-liners

```bash
# Restart backend (after pulling main)
pkill -f "node dist/main"; npm run build && npm run start:prod &

# Token for curl
TOK=$(curl -s -X POST http://localhost:8080/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@gkj.test","password":"admin123"}' \
  | jq -r .accessToken)
curl -s http://localhost:8080/reports -H "Authorization: Bearer $TOK" | jq

# Reset DB (wipes everything; re-seed after)
cd ~/projects/gkj-eh-be && docker compose down -v && docker compose up -d && sleep 3 && npm run seed
```
