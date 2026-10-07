# Talix Architecture

## Accepted foundation

The owner approved a bounded business-neutral commerce and fulfillment core, followed by explicitly selecting Next.js, Supabase and Vercel on October 7, 2026. Restaurants remain the first audience, not the core domain model. [Issue #1](https://github.com/BravoKelo/Talix/issues/1) owns implementation scope.

## Implemented boundaries

- Next.js App Router and TypeScript provide the owner/employee workspace, shared business storefront, and private order tracking. Supabase SSR clients maintain Auth sessions; workspace entry checks verified claims. PostgreSQL remains the authorization boundary even if a browser bypasses UI controls.
- Supabase PostgreSQL holds client/subscription/location relationships, membership and location roles, general/local products with generic optional extras, order snapshots, and payment/fulfillment histories. No business-type behavior or plugin framework is encoded now.
- Supabase Auth supplies owner/employee identity. In this slice each owner is a client with multiple subscriptions; shared ownership/client administration is not implemented. A signed-in owner can create subscriptions. Employee accounts are explicitly provisioned in Auth, then granted location access by an owner.
- Supabase Storage holds public product images. Uploads require subscription owner access and a subscription-ID folder; only JPEG/PNG/WebP up to 5 MB are allowed.
- Vercel is the approved deployment target. Configuration and actual deployment state are recorded in `CURRENT-STATE.md`.

## Data and trust

RLS covers every application table. Owners manage their subscriptions/locations/products and refunds. Employees require subscription membership plus the assigned location role: viewer reads; fulfillment also advances orders. Custom roles are a later requirement. Direct browser writes cannot mutate memberships, orders, totals, payment state or histories.

Narrow security-definer RPCs, fixed empty search paths, explicit execution grants, and checked ownership handle privileged transactions. Anonymous access is limited to the published catalog, validated simulated checkout, private order tracking, and private-token simulated payment retry. No service-role key exists in the application.

Checkout calculates prices/options from stored products, validates location/product availability and contact details, and atomically snapshots purchased names/prices/options. Integer cents avoid rounding ambiguity. Request IDs and transaction locks make payment retries idempotent; changing the payload for an existing key fails. Refunds lock the order, require owner access and a reason, and cannot exceed the remaining payment.

Private random UUID order tokens are bearer secrets and are not granted as readable order columns to business users. Public tracking excludes contact information and uses no-referrer/no-index behavior. Historical order snapshots survive product edits. Fulfillment and payment are separate states; declined payments cannot progress, full refunds cancel only uncompleted orders.

## Payment boundary

Only simulated approved/declined payments and full/partial refunds exist. There are no card fields, processor SDKs, API keys, payment webhooks or money movements. Processor selection is deferred; the current simulator is not a production payment integration.

## Verification and development infrastructure

Versioned migration: `supabase/migrations/20261007005603_core_commerce.sql`. Embedded PostgreSQL tests verify real SQL/RLS using small Auth/Storage fixtures; browser tests adapt RPC requests to that database. They do not verify Supabase service configuration. The core and two corrective migrations are applied to the existing Talix development project. The corrections revoke client execution on the platform-only event-trigger function and tune existing access policies/indexes without changing authorization behavior. Live service verification is recorded in `CURRENT-STATE.md`.

Preserve the evidence-driven governance in `AGENTS.md`: build only demonstrated requirements; avoid speculative module frameworks; protected changes require owner approval; acceptance precedes merge.
