# Architecture

## Backend

NestJS modules in `src/`:
- `auth/` — JWT (access + refresh) signed with `jwt.secret` from `config.yaml`; `JwtAuthGuard` from `src/auth/guards/jwt-auth.guard.ts` protects routes
- `users/` — User entity, `createGoogleUser`, hash + validate passwords
- `content/` — public + protected CRUD
- `pelayan/` — roles / persons / services / assignments
- `reports/` — service-report form, stored as `{ id, tanggal, jenis_kebaktian, data jsonb, created_at, updated_at }`
- `members/` — `GET /members` → string[] of pelayan persons' names (for form autocomplete)
- `migrate/` (legacy from Go era) — not used; TypeORM `synchronize: true` is in dev. Switch to migrations before prod.

**No global `/api` prefix.** Controllers serve at `/auth`, `/content`, `/pelayan`, `/reports`, `/members`. Frontend's `API_URL` matches.

## Frontend

- `app/(auth)/` — login + register pages
- `app/(content)/` — public-facing pages (`/`, `/news`, `/sermons`, `/[slug]`)
- `app/(dashboard)/` — protected (refresh_token cookie required)
- `app/api/*` — BFF routes (Next.js handlers proxying to backend)
- `components/ui/` — shadcn/ui (new-york style)
- `lib/api/*` — typed clients

## Auth flow

1. POST `/api/auth/login` (FE BFF) → calls backend `/auth/login` → BFF sets `refresh_token` cookie (httpOnly) and returns `accessToken` in JSON
2. Server components mint access token from refresh cookie via `lib/auth/server-utils.getAccessToken()` (cached per render with `React.cache`)
3. Server components call backend directly via `apiClient` / `authenticatedApiClient` (`lib/api/client.ts`)
4. Client components use BFF, which calls `proxyToBackend` (`lib/api/proxy.ts`); BFF gets access token itself, so browser never sees it

## Client vs. server in lib/api

A `"use client"` component cannot import anything pulling `server-only` or `next/headers`. So:

| File | Mode | Used from |
|---|---|---|
| `lib/api/client.ts` | shared (pure http) | both |
| `lib/api/content.ts` | server-only (`getAccessToken`) | server components |
| `lib/api/pelayan.ts` | server-only | server components |
| `lib/api/reports-server.ts` | server-only | server components (laporan/* pages, statistik) |
| `lib/api/reports.ts` | client-only (BFF `/api/...`) | `components/forms/service-report/form-tabs.tsx` |
| `lib/api/proxy.ts` | server-only (BFF helper) | `app/api/**/route.ts` |
| `lib/api/auth.ts` | server-only | login/register/refresh BFF routes |

Splitting reports into two files is deliberate. See [gotchas](./gotchas.md).

## Public content cache

`getPublicContentList` and `getContentBySlug` (`lib/api/content.ts`) pass `{ next: { revalidate: 60 } }`. Repeat visits to `/news` ↔ `/sermons` within 60s serve from Next.js's data cache (zero backend hits) — kills `loading.tsx` flash. Dashboard edits can be up to 60s stale on public pages.
