# Talix Architecture

## Accepted foundation

The owner approved a bounded business-neutral commerce and fulfillment core, followed by explicitly selecting Next.js, Supabase and Vercel on October 7, 2026. Restaurants remain the first audience, not the core domain model. [Issue #1](https://github.com/BravoKelo/Talix/issues/1) owns implementation scope.

## Implemented boundaries

- Next.js App Router and TypeScript provide the owner/employee workspace, shared business storefront, and private order tracking. Supabase SSR clients maintain Auth sessions; workspace entry checks the current authenticated user. PostgreSQL remains the authorization boundary even if a browser bypasses UI controls.
- Supabase PostgreSQL holds client/subscription/location relationships, membership and location roles, general/local products with generic optional extras, order snapshots, and payment/fulfillment histories. No business-type behavior or plugin framework is encoded now.
- Supabase Auth supplies owner/employee identity. In this slice each owner is a client with multiple subscriptions; shared ownership/client administration is not implemented. A signed-in owner can create subscriptions. Employees require an existing Auth account; owners or authorized managers grant subscription membership and separate location roles through Users. Invitation delivery is not implemented.
- Supabase Storage holds public product images. Uploads require effective product-management permission and a subscription-ID folder; only JPEG/PNG/WebP up to 5 MB are allowed.
- Vercel is the approved deployment target. Configuration and actual deployment state are recorded in `CURRENT-STATE.md`.

## Data and trust

RLS covers every application table. Owners retain full access. Employees require subscription membership and separately configured roles for shared tools and each location. Predefined and custom roles grant explicit permissions; database policies and checked RPCs enforce them. See ADR 0003. Direct browser writes cannot mutate memberships, orders, totals, payment state or histories.

Narrow security-definer RPCs, fixed empty search paths, explicit execution grants, and checked ownership handle privileged transactions. Anonymous access is limited to active Talix business-type/offering reads and subscription quotes, the published business catalog, validated simulated checkout, private order tracking, and private-token simulated payment retry. No service-role key exists in the application.

Checkout calculates prices/options from stored products, validates location/product availability and contact details, and atomically snapshots purchased names/prices/options. Integer cents avoid rounding ambiguity. Request IDs and transaction locks make payment retries idempotent; changing the payload for an existing key fails. Refunds lock the order, require the location refund permission and a reason, and cannot exceed the remaining payment.

Private random UUID order tokens are bearer secrets and are not granted as readable order columns to business users. Public tracking excludes contact information and uses no-referrer/no-index behavior. Historical order snapshots survive product edits. Fulfillment and payment are separate states; declined payments cannot progress, full refunds cancel only uncompleted orders.

## Payment boundary

Only simulated approved/declined payments and full/partial refunds exist. There are no card fields, processor SDKs, API keys, payment webhooks or money movements. Processor selection is deferred; the current simulator is not a production payment integration.

## Verification and development infrastructure

Migration history is append-only in `supabase/migrations`. Nine migrations are applied to development: core commerce, trigger execution restriction, access-query tuning, customer onboarding, catalog-policy tuning, signup validation, generated ordering addresses, configurable Users, and the membership-role index. The additional client-profile preservation migration is prepared but unapplied; see CURRENT-STATE for the exact pending file. Embedded PostgreSQL tests execute migration SQL/RLS with Auth/Storage fixtures; browser tests use an adapter to that database. Those checks do not establish live service configuration or full deployed end-to-end behavior.

Preserve the evidence-driven governance in `AGENTS.md`: build only demonstrated requirements; avoid speculative module frameworks; protected changes require owner approval; acceptance precedes merge.

## Customer signup and Talix sales catalog — Issue #3

See ADR 0002 for the accepted scope and resulting boundaries. New public `business_types`, `talix_offerings` and `subscription_purchases` tables have RLS and explicit grants. Public catalog reads expose only active offerings with active compatible business types. Private `talix_admins` has RLS and no client-table grants; an internal lookup checks the authenticated user ID, never user-editable metadata. Staff catalog edits remain subject to RLS even when UI controls are bypassed.

`subscription_quote` validates business type/plan/addon compatibility and billing interval, obtains ordered share locks and calculates integer-cent totals from catalog values. `start_subscription` requires a confirmed Auth user, serializes owner creation and idempotent confirmation, rechecks the entire reviewed quote, and creates the client/subscription/membership/location/purchase atomically. Purchase terms/details are snapshots. Business owners cannot rewrite purchased terms or change subscription type directly. Existing core drafts are preserved; client access to the old `create_workspace` shortcut is revoked.

Signup credentials go directly to Auth. Only business form input and the reviewed selection/request ID are persisted as non-authoritative resumable user metadata. A verified session is checked at server entry; database authorization remains the final boundary. The confirmation route exchanges a PKCE code or verifies an email token hash, always redirects internally, and reports failure in plain customer language. Email service/redirect provisioning is tracked in CURRENT-STATE. The explicitly approved development-only confirmation exception below supersedes the original verification requirement for development; no live provider or mailbox verification is established.

### Deferred development confirmation

ADR 0002 records the explicitly approved no-mail development mode. A server environment switch enables an authenticated `/signup/confirmation` page outside Vercel production. Supported Auth automatic confirmation supplies the real account/session; no custom session or verification API exists. A public-settings preflight blocks signup rather than triggering mail if development automatic confirmation is not configured. Existing email-token/PKCE callbacks remain intact for later live use. Production requires both the flag disabled and mandatory email confirmation enabled in its Auth project; automatically confirmed development identities do not establish mailbox ownership.

Signup correction: the reviewed draft is completed directly by the confirmation Continue action. Error routing distinguishes business details, changed/unavailable selections, and retryable failures. Credentials live only in component memory while editing; existing purchase snapshots and idempotent replay are preserved. The canonical contact/address boundary is enforced by `20261007041833_validate_signup_details`; no table or authorization change.

## Automatic ordering address — October 7, 2026

The owner confirmed that prospective customers should not choose an internal ordering address at signup. The address field and review row are removed. The purchase transaction derives an address from the business name, uses `store` for names without a usable ASCII form, and adds a numeric suffix when needed. A shared transaction lock serializes competing allocations; prior purchase retries retain their original address. Saved draft address input is ignored for new allocation. No new table, role, or external domain configuration is involved. Existing ordering links remain unchanged. Owner customization in Settings is a later follow-up, not part of this correction.

Development migration `20261007043143_generate_ordering_address` is applied. Database checks verify duplicate-name allocation and repeat-safe completion. The live check used a rolled-back transaction and left no records. Customer signup no longer exposes this internal requirement.

## Shared client profile correction — Issue #10

The owner approved preserving the existing client profile when purchasing another subscription. The prepared additive migration changes only `start_subscription`: insert a client if absent; on conflict retain its fields and select its existing ID. Existing owner transaction locking, confirmed-user checks, quote validation, generated address allocation, purchase snapshots, idempotency, grants and permission seeding remain intact. No existing business rows are rewritten, and no table, policy or function signature changes. Do not describe this behavior as active on the development service until the pending migration is approved, applied and verified.

## Decision provenance

ADRs 0001–0003 record implemented boundaries. Explicit stack, core-first and simulation approvals are established. The Users feature was authorized in Issue #9, but separate prior approval of each specific schema/security choice is not established by the durable evidence. Issue #10 authorizes reconciliation and stabilization, not retrospective blanket architecture/security acceptance. Present the implemented role mapping and delegation boundaries for explicit baseline acceptance before merge.
