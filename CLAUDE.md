# CLAUDE.md

NestJS REST API backend for GKJ Eben-Haezer church content + service-scheduling system.

## Stack
- NestJS 11 (TypeScript), Express adapter
- TypeORM + Postgres (`synchronize: true` in dev — no separate migrations yet)
- `@nestjs/jwt` + `passport-jwt` for auth (access + refresh)
- bcrypt for passwords
- `config.yaml` (loaded via `js-yaml`) for local config — NOT `.env` despite an old `.env.example` lingering

## Layout
- `src/main.ts` — bootstrap, CORS, global `ValidationPipe`
- `src/app.module.ts` — root module, `TypeOrmModule.forRootAsync` reads `config.yaml`
- `src/config/configuration.ts` — `getConfig()` returns typed config
- Feature modules per resource: `auth/`, `users/`, `content/`, `pelayan/`
- Each feature folder: `*.controller.ts`, `*.service.ts`, `*.module.ts`, `dto/`, `entities/`
- `test/` — Jest e2e

## Conventions
- Layer: controller → service → TypeORM repository. No DB calls in controllers; no HTTP in services.
- Protected routes use `JwtAuthGuard` (`src/auth/guards/jwt-auth.guard.ts`). Public routes either live outside it or are explicitly exposed (`/auth/*`, `/content/public/*`).
- DTOs use `class-validator` decorators. Global `ValidationPipe` strips unknown fields (`whitelist: true`) and coerces types (`transform: true`).
- Entities use TypeORM decorators. Schema is auto-synced from entities in dev — when you change an entity, restart picks it up. For prod, write proper migrations (not set up yet).
- No `/api/auth/google` endpoint (was in the Go MVP; not in NestJS).

## Routes
See `README.md` for the full table. Public: `/api/auth/*`, `/api/content/public/*`. Everything else requires JWT.

## Config (`config.yaml`)
Keys: `database.{host,port,username,password,name}`, `jwt.{secret,accessTtl,refreshTtl}`, `server.{port,allowedOrigins[]}`. `config.yaml` is checked in but should be replaced with secrets-from-env (or `.env`) before production.

## Common commands
- `npm install`
- `docker compose up -d` — Postgres on `localhost:5434`
- `npm run start:dev` — watch mode
- `npm run build` / `npm run start:prod`
- `npm run lint` / `npm run format`
- `npm run test` / `npm run test:e2e`

## Notes for Claude
- This is a Node/NestJS project (was Go until commit `91c50f6`). Don't reach for Go tooling.
- `synchronize: true` is dev-only. If asked to add a migration, switch to `synchronize: false` and use TypeORM CLI migrations.
- `config.yaml` ships with placeholder secrets — flag if you see them being used in any deploy/prod context.
- When adding endpoints: create or extend the feature module, register controller + service in the module, ensure the module is imported in `app.module.ts`. Protect with `@UseGuards(JwtAuthGuard)` unless explicitly public.
- Stray Go-era leftovers may still exist in `docs/` and `.env.example` — verify before trusting them.
