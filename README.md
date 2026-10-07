# Talix

Business-neutral online ordering and fulfillment. Restaurants are the first audience; industry-specific behavior comes after the shared core.

This branch implements the approved shared core and self-service customer signup using Next.js, Supabase, and Vercel. Business types, sample plans and optional Talix products are editable in Talix admin. Payments and refunds are **simulated**. No card data is collected and no money moves.

## Development

Use Node.js 24, then:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the existing Talix development project. Never use a service-role/secret key in the browser.

See [setup](docs/SETUP.md), [current state](docs/CURRENT-STATE.md), [architecture](docs/ARCHITECTURE.md), and [governance](AGENTS.md). Customers enter through Sign up, review their sample selection and confirm their email before starting a subscription. See setup for email delivery and explicit Talix staff access.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Database tests apply all checked-in migrations to embedded PostgreSQL with minimal Auth/Storage fixtures. Browser tests exercise commerce, signup/resume and admin editing through a test-only Auth/PostgREST gateway backed by the migration SQL/RLS. They do not claim to verify live Supabase Auth, PostgREST, Storage, or deployment configuration.
