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

Migration history is append-only in `supabase/migrations`. See [CURRENT-STATE](CURRENT-STATE.md) for the current applied development versions (eighteen at the assessment baseline), rather than treating historical counts as current. Embedded PostgreSQL tests execute migration SQL/RLS with Auth/Storage fixtures; browser tests use an adapter to that database. Those checks do not establish live service configuration or full deployed end-to-end behavior. [Engineering standards](standards/README.md) govern new work without adding module or entitlement infrastructure.

Preserve the evidence-driven governance in `AGENTS.md`: build only demonstrated requirements; avoid speculative module frameworks; protected changes require owner approval; acceptance precedes merge.

## Customer signup and Talix sales catalog — Issue #3

See ADR 0002 for the accepted scope and resulting boundaries. New public `business_types`, `talix_offerings` and `subscription_purchases` tables have RLS and explicit grants. Public catalog reads expose only active offerings with active compatible business types. Private `talix_admins` has RLS and no client-table grants; an internal lookup checks the authenticated user ID, never user-editable metadata. Staff catalog edits remain subject to RLS even when UI controls are bypassed.

`subscription_quote` validates business type/plan/addon compatibility and billing interval, obtains ordered share locks and calculates integer-cent totals from catalog values. `start_subscription` requires a confirmed Auth user, serializes owner creation and idempotent confirmation, rechecks the entire reviewed quote, and creates the client/subscription/membership/location/purchase atomically. Purchase terms/details are snapshots. Business owners cannot rewrite original purchased terms or directly update subscription type. The later approved checked Owner industry-change transaction records current selections separately; see the activated follow-up section below. Existing core drafts are preserved; client access to the old `create_workspace` shortcut is revoked.

Signup credentials go directly to Auth. Only business form input and the reviewed selection/request ID are persisted as non-authoritative resumable user metadata. A verified session is checked at server entry; database authorization remains the final boundary. The confirmation route exchanges a PKCE code or verifies an email token hash, always redirects internally, and reports failure in plain customer language. Email service/redirect provisioning is tracked in CURRENT-STATE. The explicitly approved development-only confirmation exception below supersedes the original verification requirement for development; no live provider or mailbox verification is established.

### Deferred development confirmation

ADR 0002 records the explicitly approved no-mail development mode. A server environment switch enables an authenticated `/signup/confirmation` page outside Vercel production. Supported Auth automatic confirmation supplies the real account/session; no custom session or verification API exists. A public-settings preflight blocks signup rather than triggering mail if development automatic confirmation is not configured. Existing email-token/PKCE callbacks remain intact for later live use. Production requires both the flag disabled and mandatory email confirmation enabled in its Auth project; automatically confirmed development identities do not establish mailbox ownership.

Signup correction: the reviewed draft is completed directly by the confirmation Continue action. Error routing distinguishes business details, changed/unavailable selections, and retryable failures. Credentials live only in component memory while editing; existing purchase snapshots and idempotent replay are preserved. The canonical contact/address boundary is enforced by `20261007041833_validate_signup_details`; no table or authorization change.

## Automatic ordering address — October 7, 2026

The owner confirmed that prospective customers should not choose an internal ordering address at signup. The address field and review row are removed. The purchase transaction derives an address from the business name, uses `store` for names without a usable ASCII form, and adds a numeric suffix when needed. A shared transaction lock serializes competing allocations; prior purchase retries retain their original address. Saved draft address input is ignored for new allocation. No new table, role, or external domain configuration is involved. Existing ordering links remain unchanged. Owner customization in Settings is a later follow-up, not part of this correction.

Development migration `20261007043143_generate_ordering_address` is applied. Database checks verify duplicate-name allocation and repeat-safe completion. The live check used a rolled-back transaction and left no records. Customer signup no longer exposes this internal requirement.

## Shared client profile correction — Issue #10

The owner approved preserving the existing client profile when purchasing another subscription. The approved and applied additive migration changes only `start_subscription`: insert a client if absent; on conflict retain its fields and select its existing ID. Existing owner transaction locking, confirmed-user checks, quote validation, generated address allocation, purchase snapshots, idempotency, grants and permission seeding remain intact. No existing business rows are rewritten, and no table, policy or function signature changes. The corrected behavior is active and SQL-verified on development; complete deployed browser acceptance remains separate.

## Decision provenance

ADRs 0001–0003 record implemented boundaries. Explicit stack, core-first and simulation approvals are established. The Users feature was authorized in Issue #9, but separate prior approval of each specific schema/security choice is not established by the durable evidence. Issue #10 authorizes reconciliation and stabilization, not retrospective blanket architecture/security acceptance. The owner subsequently explicitly directed merging the existing implementation on October 16 and continuing testing afterward. ADR 0003 records that integration authorization without inventing earlier approval; future changes remain governed by AGENTS.md.

## Visual storefront presentation — Issue #32

The shared `/shop/<slug>` client continues to consume the existing `public_catalog` RPC, filter general/location products by explicit selected location and submit the unchanged `checkout_simulated` payload. Product images/cards and the existing native task dialog provide a presentation layer for full descriptions and generic options. Search is local to the already returned location-scoped catalog; it adds no endpoint or data model. Cart/customer state stays in component memory; authoritative pricing and availability remain in PostgreSQL.

An ordinary hosted storefront URL is the initial existing-website entry strategy. The same business introduction/catalog is the foundation for Talix-as-primary-website, subject to the gaps/proposal in STOREFRONT-ROADMAP. No industry dispatch, entitlement framework, new persistence, public permission or deployment change is introduced. Subscription-wide branding and independent location authorization remain unchanged.

## Figma storefront settings — activated additive change

Owner-approved implementation adds constrained subscription appearance columns, nullable default-location reference with a same-subscription composite foreign key, and an optional bounded product collection label. Existing subscriptions and products keep defaults; no data migration/rewrite is needed. The public catalog whitelist gains only these presentation fields and a published-only default-location identifier. Existing settings.manage/products.manage RLS and column grants govern edits. Existing business-logos storage handles header photos; the existing private cleanup helper now protects saved header references. There are no new public RPCs, roles, buckets, services or entitlement structures. The owner-approved migration is applied to development; exact recorded version and verification are in CURRENT-STATE.


## Header preset persistence and cart presentation

Header presets use one constrained subscription-wide header_layout value, default centered; existing settings.manage RLS/column grants and public_catalog whitelist remain the boundary. The separately approved additive header-choice migration is applied to development; CURRENT-STATE records its version and verification. No new roles, RPCs, buckets or entitlement structures are required. The shared StorefrontHeader renders storefront and owner preview identity/assets. Old databases omit the new field: Centered identity remains the fallback, preset writes stay disabled and existing appearance fields still save without sending an unknown column.

Cart remains component memory, with identical product/option merging and existing checkout RPC payload. Existing native TaskDialog supplies modal focus/Escape behavior; the cart variant adds right-side/full-height presentation, backdrop dismissal and scroll isolation. Checkout appears only after the cart action. Neither carts nor shopper details gain persistence.


## Header navigation — prepared activation, issue #35

The application now shares Standard/Custom navigation between the storefront and appearance preview. Standard uses centered identity and built-in storefront/About/selected-location Contact destinations; Custom uses the saved preset and ordered website/storefront links. Responsive width measurement keeps fitting links inline and moves overflow into the native dialog. The collapsed centered/mobile header uses a tap menu. No new endpoint, client persistence or checkout behavior is introduced.

The prepared-only migration and its exact validation/grants/catalog proposal are in `HEADER-NAVIGATION-MIGRATION.md`. Database execution requires separate owner approval. Until activation, the editor disables the unavailable mode/link writes, strips unknown columns from the payload and retains prior preset/branding saves. The existing public catalog continues to work without the new fields.


### Navigation activation — October 18, 2026

Owner separately approved development execution. The reviewed navigation SQL is applied unchanged as `20261018174618_storefront_header_navigation`. This supersedes prepared-activation wording above. Existing RLS/catalog boundaries were verified with rolled-back synthetic records; security-advisor categories/counts are unchanged. Application source remains the reviewed 4de7914 implementation. No merge or production release is authorized.

## Approved activated follow-up — subscription changes and private tracking

The October 18 owner approval accepts the bounded persistence proposal in DEFERRED-FOLLOWUP-REVIEW.md. The prepared TRACKING-INDUSTRY-MIGRATIONS.md records an additive private-token tracking whitelist and Owner-checked industry change transactions. Original subscription_purchases remains immutable; latest subscription_changes selection represents current terms, with version/request checks and row locking. Existing protected Owner membership and Talix administrator read allowlist remain the authorities; no manager write power, new role, real billing or industry module is added. Actual activation evidence belongs in CURRENT-STATE; these migrations were applied unchanged to development on October 18, 2026; see TRACKING-INDUSTRY-MIGRATIONS.md for service versions and verification.
