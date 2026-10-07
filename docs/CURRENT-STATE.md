# Talix Current State

## Verified checkpoint — October 7, 2026

Repository: `BravoKelo/Talix`. Implementation branch: `feature/core-commerce`, based on `foundation/project-governance` at `4d547496998c50a30ee20afec5ef423b7145381d`. `main` remains the initial README commit until accepted merge. [Issue #1](https://github.com/BravoKelo/Talix/issues/1) owns the approved implementation scope. Governance remains in `AGENTS.md`.

## Approved direction

Talix primarily provides online ordering and fulfillment. Build the business-neutral core first; restaurants are the first audience and industry modules come later. The owner approved Next.js, Supabase and Vercel. Payments/refunds must be simulated; processor selection is deferred. No real card data or money movement.

## Implemented on this branch

- Next.js App Router/TypeScript with Supabase SSR Auth clients and guarded workspace.
- Owner onboarding; multiple subscriptions per client; authorized subscription/location switching; predefined viewer/fulfillment location access for explicitly provisioned employee accounts.
- Subscription branding and location details/publication.
- General/location-specific products with images, descriptions, integer-cent prices, availability and generic optional extras.
- Location-first storefront, cart and guest online checkout requiring name/email/phone.
- Database-priced order snapshots, approved/declined simulated payments, duplicate-safe checkout/retry, private customer order status.
- Location order queue and sequential received/in-progress/ready/completed fulfillment; owner partial/full simulated refunds, reasons and histories.
- Versioned migration, RLS/least-privilege grants, public catalog and narrow checked RPCs; read-only GitHub Actions checks.

This is implementation for review, not full-product completion or production launch. Detailed final layout/design remains subject to product-owner acceptance.

## Validation evidence

Local lint and TypeScript checks pass. Production build passes. GitHub Actions run `37552938983` passed the complete suite for application commit `9b0e35ea24223e4dc7b145e89524250ca650f175`. Final review narrowed private-function revocations to this migration's helpers and recorded refund cancellations in the fulfillment audit. Local database/browser checks also pass after those corrections; GitHub Actions run `37553263375` passed the full suite for corrected application commit `ee29781ed9b097cc16433dc8270a294dd9ec2b97`. The latest preview was also fetched successfully with the expected connection notice. Eleven embedded PostgreSQL tests pass for schema/RLS, tenant/location restrictions, server pricing, snapshots, retry/idempotency, fulfillment/refunds and image-upload permissions. Desktop and mobile Playwright customer flows pass against the actual migration through a test-only RPC adapter.

Tests mock Supabase Auth/Storage scaffolding and the RPC transport. They do not claim live Supabase Auth/PostgREST/Storage, deployed checkout, concurrency load, or workspace UI verification. The standard browser download failed in this runtime; an npm-distributed Chromium executable was used locally through `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. CI uses normal Playwright browser installation. Production dependency audit found zero reported vulnerabilities.

## External infrastructure and blockers

The earlier foundation records an existing Talix Supabase project. The connected account currently exposes only `AMZ-PSE Development` (`ukihcsdiqfhtszcdgale`, inactive). It was not changed. No Talix migration has been applied, no production credentials set, and no replacement project created.

Vercel project `talix` (`prj_Xmg24E6djhGtCFIJsmP9EblkLDym`) exists in the `bravokelo` team using Node.js 24. Preview deployment `dpl_3sewxmjWPm1UJCoQzTTgPfVoqpJu` is READY for application commit `9b0e35ea24223e4dc7b145e89524250ca650f175`: https://talix-h2s0dc0j7-bravokelo.vercel.app . Home/login/workspace returned HTTP 200 through authenticated protected-preview access; the latter show the expected missing-connection state. Default deployment protection remains enabled. Vercel automatically created an initial production-labelled deployment (`dpl_7iN5PwrooZNVvJQN9Xzc9FRseaFo`) when the repository was linked; it has no database connection, no customer data or payment integration, and remains under default deployment protection. No manual production promotion was performed. The latest automatic feature preview is READY at https://talix-8afvjjpz1-bravokelo.vercel.app (`dpl_GU5f4LqqvBpThRLcAmvJXbeCNqq4`, application commit `ee29781ed9b097cc16433dc8270a294dd9ec2b97`). [Draft PR #2](https://github.com/BravoKelo/Talix/pull/2) targets the foundation branch, preserving its governance. The complete changed-file set was inspected; `AGENTS.md` and the ADR template are unchanged. The local source was reconstructed through GitHub APIs; ordinary git clone was unavailable in this runtime. Until the existing Talix development project is accessible and its URL/publishable key configured, sign-in/ordering cannot operate against live persistence.

## Exact restart

1. Inspect this branch, Issue #1, PR and latest checks/deployment status; preserve foundation governance/history.
2. Expose the existing Talix development project through the authorized Supabase connection. Verify its identity/schema/migration history before applying the reviewed migration. Follow `docs/SETUP.md`.
3. Configure preview public environment values, provision owner/employee accounts, and verify the full owner → customer → employee → refund flow against live Supabase, including image upload and tenant isolation.
4. Review the complete diff and provisional experience with the owner. Acceptance is required before merge under `AGENTS.md`.

## Deferred

Business-type modules, restaurant specifics, inventory/BOM/COGS, custom roles, CRM/reporting, customer accounts, tax/shipping/scheduling, notifications/marketing, billing, external integrations and real payment processors. These remain overall vision, not this implementation slice.
