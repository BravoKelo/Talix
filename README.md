# Talix

Business-neutral online ordering and fulfillment. Restaurants are the first audience; industry-specific behavior comes after the shared core.

This branch implements the approved initial core using Next.js, Supabase, and Vercel. Payments and refunds are **simulated**. No card data is collected and no money moves.

## Development

Use Node.js 24, then:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the existing Talix development project. Never use a service-role/secret key in the browser.

See [setup](docs/SETUP.md), [current state](docs/CURRENT-STATE.md), [architecture](docs/ARCHITECTURE.md), and [governance](AGENTS.md). The application shows a configuration notice until Supabase is connected.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Database tests apply the actual migration to embedded PostgreSQL with minimal Auth/Storage fixtures. Browser tests bridge customer RPCs to that database. They do not claim to verify live Supabase Auth, PostgREST, Storage, or deployment configuration.
