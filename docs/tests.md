# Tests

Playwright on **frontend** repo. Mobile project = Pixel 5 viewport (393px), Chromium.

```bash
cd ~/projects/gkj-eh-web
npm run test:e2e                                   # all suites
npx playwright test tests/e2e/mobile-overflow.spec.ts
npx playwright test tests/e2e/reports-persistence.spec.ts
npx playwright test tests/e2e/content-loading-flash.spec.ts
```

Suites:
- `mobile-overflow.spec.ts` — every dashboard route + login/register: `body.scrollWidth <= viewport`
- `reports-persistence.spec.ts` — create through BFF, list shows row, reload still shows, delete; update is read back; `/api/members` returns seeded names
- `content-loading-flash.spec.ts` — skeleton outer container rect == loaded rect; h1 stable through nav; 2nd visit cache hit (0 BE requests)

Backend must be running + seeded for last two. No backend tests yet.
