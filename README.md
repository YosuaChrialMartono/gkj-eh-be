# gkj-eh-be

NestJS REST API backend for GKJ Eben-Haezer church content + service-scheduling system.

## Tech Stack

- **NestJS 11** (TypeScript) with `@nestjs/platform-express`
- **PostgreSQL** via TypeORM (`synchronize: true` in dev)
- **JWT** auth (access + refresh) using `@nestjs/jwt` + `passport-jwt`
- **bcrypt** for password hashing
- **Docker** for local Postgres

## Project Structure

```
src/
├── main.ts                      # Bootstrap, CORS, global validation pipe
├── app.module.ts                # Root module, TypeORM setup
├── config/configuration.ts      # Loads config.yaml
├── auth/
│   ├── auth.controller.ts       # register/login/refresh/logout
│   ├── auth.service.ts
│   ├── strategies/jwt.strategy.ts
│   ├── guards/jwt-auth.guard.ts
│   └── dto/auth.dto.ts
├── users/                       # User entity + /users/me
├── content/                     # Content CRUD (+ public read)
└── pelayan/                     # Roles / Persons / Services / Assignments
test/                            # Jest e2e
config.yaml                      # Local config (DB, JWT, CORS, port)
```

## API Routes

> No global `/api` prefix is set; routes are served at the controller path directly. Frontend uses `API_URL=http://localhost:8080`.

### Auth (public) — `/auth`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Login with email/password |
| POST | `/google` | Login/register via Google ID token (`{ credential }`) |
| POST | `/refresh` | Refresh tokens (JWT-guarded) |
| POST | `/logout` | Logout |

### Users — `/users`
| Method | Path | Auth |
|--------|------|------|
| GET | `/me` | JWT |

### Content — `/content`
| Method | Path | Auth |
|--------|------|------|
| GET | `/public` | none |
| GET | `/public/slug/:slug` | none |
| GET/POST | `/` | JWT |
| GET/PUT/DELETE | `/:id` | JWT |

### Pelayan — `/pelayan` (all JWT)
- `/roles` — List / Create / Update / Delete
- `/persons` — List / Create / Delete
- `/services` — List / Create / Update / Delete
- `/assignments` — List / Upsert / Delete

### Google sign-in
`POST /auth/google` accepts `{ credential: "<google-id-token>" }`, verifies it against `google.clientId` from `config.yaml`, and upserts the user (`createGoogleUser` in `users.service.ts`). The same access + refresh token pair as `/login` is returned. Set `google.clientId` in `config.yaml` to enable.

## Quick Start

```bash
# 1. Install deps
npm install

# 2. Start Postgres (exposes 5434 → matches config.yaml)
docker compose up -d

# 3. Edit config.yaml — set jwt.secret to a real value
#    (32-byte random hex: `openssl rand -hex 32`)

# 4. Run with live reload
npm run start:dev
```

Server listens on `:8080`. TypeORM `synchronize: true` auto-creates schema in dev — disable for prod.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start` | Run (no watch) |
| `npm run start:dev` | Watch mode |
| `npm run start:prod` | Run compiled `dist/main` |
| `npm run build` | Compile to `dist/` |
| `npm run lint` | ESLint + autofix |
| `npm run format` | Prettier |
| `npm run test` | Unit tests |
| `npm run test:e2e` | E2E tests |
| `npm run test:cov` | Coverage |

## Config (`config.yaml`)

```yaml
database:
  host: localhost
  port: 5434
  username: postgres
  password: password
  name: gkj_eh
jwt:
  secret: ...        # CHANGE for prod
  accessTtl: 15m
  refreshTtl: 720h
server:
  port: "8080"
  allowedOrigins:
    - http://localhost:3000
```

## Token Strategy

| Token | TTL | Purpose |
|-------|-----|---------|
| access | 15 min | `Authorization: Bearer <token>` on API calls |
| refresh | 30 days | POST `/auth/refresh` |

## More

- Architecture notes for Claude / contributors: [`CLAUDE.md`](./CLAUDE.md)
- Auth flow + adding a new CRUD: [`docs/developer-guide.md`](./docs/developer-guide.md)
