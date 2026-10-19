# Tracking and industry changes — activated development migrations

Owner explicitly authorized applying the two reviewed migrations on October 18, 2026. Exact SQL from PR #45 head `68ee60d11979f9ae486770bc0b5f7f332bb229d9` applied successfully to development `lzepujggusieapablzhn`. Eighteen migrations are recorded; filenames match service-generated versions and SQL is unchanged. No production release is included.

## 1. Shopper tracking branding

File: `supabase/migrations/20261018214821_shopper_tracking_branding.sql`.

Replaces only the existing `track_order(uuid)` body, keeping its signature, existing order fields, private-token match, empty search path and anonymous/authenticated execution. Adds a `storefront` object containing only name, slug, logo URL, header background, text/button colors, font and text-size choice. No order token, customer contacts, client IDs or private business settings are added to the response. Invalid tokens still return null. No tables, policies, roles, Storage or Auth configuration change.

The application uses the existing branding contrast/fallback rules, a failed-logo initial, and a plain public-storefront anchor with no-referrer policy. A plain anchor avoids carrying an App Router current-route header containing the private order path. The existing no-index/no-referrer metadata, polling, retry, order/refund data and simulator remain. Loading/not-found states are neutral. If the RPC has not been upgraded, the existing tracking presentation remains after loading.

## 2. Subscription industry changes

File: `supabase/migrations/20261018214826_subscription_industry_changes.sql`.

Adds one append-only application history table, `subscription_changes`: subscription, sequential version, unique request identity/private payload, previous/new selection snapshots, actor and timestamp. A unique subscription/version index supports current-state lookup; the actor foreign key is indexed. Object-shape constraints apply to JSON payloads. Existing purchase rows are neither changed nor backfilled. The current plan is the latest change selection, otherwise the original purchase at version zero.

Three authenticated RPCs use fixed empty search paths and existing authority helpers:

- `subscription_change_state(uuid)`: current selection/version and history, limited to the existing subscription Owner or Talix administrator.
- `subscription_change_quote(uuid,uuid,uuid,uuid[],integer)`: Owner only; shared-locks the subscription, checks expected version and different target industry, and calls the existing database-priced catalog quote. It validates active industries/plans, compatible extras and billing frequency.
- `confirm_subscription_change(uuid,uuid,uuid,uuid,uuid[],jsonb,integer)`: confirmed Owner only. Locks the subscription for update; checks a prior request for identical payload/actor before retrying; rechecks version and current catalog quote; appends history and changes only `subscriptions.business_type_id` atomically. Reused requests with different input fail. An identical retry after a newer change returns actual current state without reverting it.

Owner means the existing protected Owner membership checked by `private.is_owner`, not a new role or client-profile rule. Administrators can read current/history through the existing allowlist but cannot quote/confirm for an owner. Employees/managers and outsiders cannot change or read this subscription history. RLS covers the new table; only named safe history columns are selectable by Owner/admin. No authenticated insert/update/delete grant or policy exists. Request payload/identity are excluded from direct reads. No new direct update grant on subscription industry is added.

The owner interface is Settings → Your subscription → Change industry. It reloads available database offerings, reviews current/new price and frequency, preserves inputs on Back, discards unconfirmed changes on Cancel, and retains request identity after ambiguous network failure for safe retry. Price/version/availability failures require review again; a stale subscription can be closed/reopened to reload current terms. Current state/history are visible to the owner and read-only to Talix staff; staff also retain a clearly labeled original purchase.

Products/options/images, locations, permissions, orders/refunds, client profile, subscription ID/slug and original purchase terms remain intact. All implemented business data is currently shared-core data; this does not convert industry-specific configuration or activate industry modules/entitlements. Before adding those modules, supported conversions and compatibility guards must be reviewed. No real billing, charges, proration, provider integration or general plan-only upgrade system is introduced.

## Activation and verification

These are independent additive changes compatible with the existing application. Without activation, industry controls stay unavailable and tracking retains its old response presentation. Use the new feature preview for current-plan review after industry changes; older clients still read the immutable original purchase.

After specific owner execution approval, apply the exact reviewed SQL to the development project only. Record service migration versions without altering SQL; align repository filenames/test exclusions to service records if needed. Verify recorded migration count, function grants/search paths, Owner/admin/employee/outsider boundaries, active quotes, atomic retry/stale-review behavior, immutable purchase/order data and private tracking whitelist. Use rolled-back fixtures and compare security advisors; do not change live demo subscriptions just to test conversion. Actual live-service verification and isolated tests must be reported separately. Recheck the deployed preview after activation. Production publishing stays disabled.


## Activation results — October 18, 2026

Applied `20261018214821_shopper_tracking_branding` and `20261018214826_subscription_industry_changes`. Live transactional fixtures passed owner confirmation, identical retry, changed-request rejection, stale-review rejection, outsider read/write denial, immutable purchase/product/location preservation, anonymous tracking privacy/invalid-token behavior and grant restrictions. Fixtures were rolled back; no demo subscription was converted. The first verification attempt used an unsupported JSON helper and rolled back on error; the corrected verification passed. Broader manager/admin/revoked-owner/catalog cases remain covered by the 65 isolated SQL/unit tests, not claimed as live browser tests.

Security advisors retain the existing private deny-all RLS notice (1), anonymous definer notices (5), and password-protection notice (1). Authenticated definer notices increase from 13 to 16 solely for the three intentionally checked industry RPCs. No new security category appeared. Live signed-in owner browser saving remains unverified. PR #45 stays open for final implementation acceptance; production deployment remains disabled.
