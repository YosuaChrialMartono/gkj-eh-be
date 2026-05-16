# Known follow-ups

- **`config.yaml` placeholders**: `jwt.secret` is `"your-super-secret-jwt-key-change-in-production"` and `google.clientId` is `""`. Both must be real for prod / Google sign-in. File checked in; treat secrets-in-yaml as dev-only.
- **TypeORM `synchronize: true`**: in `src/app.module.ts`. Drops/rebuilds tables as entities change. Switch to migrations before real data exists. (Use `typeorm migration:generate`.)
- **Laporan print page** (`app/(dashboard)/laporan/[id]/print/page.tsx`) hard-codes `grid-cols-2 gap-8` — intentional for paper output; not mobile-responsive. Won't fix.
- **Pelayan table** (`components/pelayan/pelayan-table.tsx`) on mobile scrolls horizontally inside `overflow-x-auto`. Cramped but not page-breaking. Card layout below `sm` is a separate task.
- **Google sign-in endpoint**: `POST /auth/google` wired and verifies via `google-auth-library`, but `google.clientId` is empty → 500 on any real call. Frontend has been calling `/auth/google` since Go era; works once clientId set.
- **CI**: no GitHub Actions workflows. Tests run locally only.
- **`migrate/` directory in BE** is Go-era leftover and should be deleted; nothing references it.
