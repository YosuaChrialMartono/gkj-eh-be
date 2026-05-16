# Gotchas (don'ts)

- **Don't add `app.setGlobalPrefix('api')` to `src/main.ts`** without coordinating with frontend. FE's `API_URL` is `http://localhost:8080` (no `/api`) and BFF paths in `app/api/**/route.ts` use bare `/reports`, `/content`, etc. Adding prefix breaks every page.
- **Don't merge `lib/api/reports-server.ts` and `lib/api/reports.ts` back together.** See [architecture › Client vs. server](./architecture.md#client-vs-server-in-libapi). Merging triggers "server-only cannot be imported from a Client Component".
- **Don't bypass BFF from client components.** Browser has no direct CORS/auth setup for backend; everything client-side goes through `app/api/**`.
- **Don't seed reports from `src/scripts/seed.ts`.** Seed does users / content / pelayan only on purpose — reports are user-generated.
- **Don't push directly to `main`/`master`.** Claude Code policy blocks it; always open PR.
