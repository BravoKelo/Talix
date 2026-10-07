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

Automated tests use Supabase Auth/Storage scaffolding and an RPC adapter. Additional live development checks exercised real Supabase password authentication and SSR workspace entry, owner onboarding/configuration, two locations, a general product/image upload, location-restricted employee access, guest checkout/private tracking, employee fulfillment to ready, and a partial refund. Full refunds, cancelled-order tracking without contact details, public image retrieval and revoked employee access also passed. Disposable Auth accounts and application rows were removed after verification. Two synthetic 1×1 PNG images remain in Storage folders `a76900bf-1d6c-45c9-ade8-ad5a71a832d7` and `081c7e39-61b7-428c-a313-f8b234f2c1b3`; owner dashboard cleanup is pending because this slice deliberately has no Storage delete policy. Browser requests were forwarded through Node fetch to the actual Supabase service because direct Chromium networking fails in this runtime; service responses were not mocked. This does not claim the full workflow ran on Vercel. A temporary npm-distributed Chromium executable was used locally; CI uses standard Playwright installation. Production dependency audit found zero reported vulnerabilities.

## Connected development infrastructure

The Supabase connection now exposes the existing Talix project `lzepujggusieapablzhn` in organization `geynfrdnzxyklsuuwcte`. Its application schema and migration history were empty before applying the approved core. AMZ-PSE was not changed. The three checked-in migrations match remote history: core commerce, removal of client execution on the platform event-trigger helper, and access-query performance corrections. All nine public application tables have RLS enabled.

Vercel project `talix` (`prj_Xmg24E6djhGtCFIJsmP9EblkLDym`) has the Talix URL and publishable key configured for development and the `feature/core-commerce` preview branch. No service-role key is used. Production variables remain unset. Default deployment protection remains enabled. Initial repository linking automatically created a production-labelled deployment with no database connection; no manual production promotion occurred.

[Draft PR #2](https://github.com/BravoKelo/Talix/pull/2) targets the foundation branch. Governance is unchanged. Next.js automatic agent-rule generation is disabled to preserve `AGENTS.md`. Repository operations used GitHub APIs because ordinary authenticated clone was unavailable.

Security advisors flag the intentionally exposed, narrowly checked security-definer RPCs and disabled leaked-password protection. These are recorded review items, not authorization to change Auth plans or the security model. Performance advisor findings for access-query initplans and composite foreign-key indexes were corrected. Unused-index notices are expected in a fresh development database.

## Exact restart

1. Inspect this branch, Issue #1, PR, latest checks and deployment status; preserve foundation governance/history.
2. Product owner creates their own account in the Talix Supabase Auth dashboard, signs into the connected preview, creates a subscription, adds products and publishes a location. No public signup or automatic email invitation exists.
3. Review the complete diff and provisional experience with the owner. Acceptance is required before merge under `AGENTS.md`.

## Deferred

Business-type modules, restaurant specifics, inventory/BOM/COGS, custom roles, CRM/reporting, customer accounts, tax/shipping/scheduling, notifications/marketing, billing, external integrations and real payment processors. These remain overall vision, not this implementation slice.

Advisor references: [anonymous security-definer execution](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [authenticated security-definer execution](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), and [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
