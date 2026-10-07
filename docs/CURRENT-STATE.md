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

Local lint and TypeScript checks pass. Production build passes. Eleven embedded PostgreSQL tests pass for schema/RLS, tenant/location restrictions, server pricing, snapshots, retry/idempotency, fulfillment/refunds and image-upload permissions. Desktop and mobile Playwright customer flows pass against the actual migration through a test-only RPC adapter.

Tests mock Supabase Auth/Storage scaffolding and the RPC transport. They do not claim live Supabase Auth/PostgREST/Storage, deployed checkout, concurrency load, or workspace UI verification. The standard browser download failed in this runtime; an npm-distributed Chromium executable was used locally through `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. CI uses normal Playwright browser installation. Production dependency audit found zero reported vulnerabilities.

## External infrastructure and blockers

The earlier foundation records an existing Talix Supabase project. The connected account currently exposes only `AMZ-PSE Development` (`ukihcsdiqfhtszcdgale`, inactive). It was not changed. No Talix migration has been applied, no production credentials set, and no replacement project created.

The Talix Vercel project/preview is being prepared from this branch. Until the existing Talix development project is accessible and its URL/publishable key configured, sign-in/ordering cannot operate against live persistence.

## Exact restart

1. Inspect this branch, Issue #1, PR and latest checks/deployment status; preserve foundation governance/history.
2. Expose the existing Talix development project through the authorized Supabase connection. Verify its identity/schema/migration history before applying the reviewed migration. Follow `docs/SETUP.md`.
3. Configure preview public environment values, provision owner/employee accounts, and verify the full owner → customer → employee → refund flow against live Supabase, including image upload and tenant isolation.
4. Review the complete diff and provisional experience with the owner. Acceptance is required before merge under `AGENTS.md`.

## Deferred

Business-type modules, restaurant specifics, inventory/BOM/COGS, custom roles, CRM/reporting, customer accounts, tax/shipping/scheduling, notifications/marketing, billing, external integrations and real payment processors. These remain overall vision, not this implementation slice.
