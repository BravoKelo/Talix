# Deferred follow-up review — October 18, 2026

Owner subsequently approved this review in full. PR #44 is merged; #38/#40 implementation and exact migration preparation continue separately. Earlier proposal-only and no-merge statements below are historical. See TRACKING-INDUSTRY-MIGRATIONS.md; live execution and final acceptance of the new implementation remain pending.

Owner directed “Please begin work on the deferred issues” after accepting PR #33. This opens a new follow-up branch; prior storefront boundaries remain historical. No merge, production release, schema activation or conversion of existing subscriptions is authorized.

## Implemented for application review

- #36: use saved product images on workspace cards, sharing storefront missing/failed-image behavior; preserve edit/hide/delete authority and sizing.
- #41: singular one-product count, plural zero/multiple, including search.
- #42: compact fixed workspace header after scrolling, sticky appearance/user tabs, return to top and denser aligned icon/text settings cards. Preserve drafts, permission filtering and 48px actions. A Business & account toggle exposes the subscription/location/account controls from the compact header; leaving the header closes that expansion.
- #43: verified-session Signed in indicator, Sign out and View Your Workspace in that order; hero Sign in beside Explore Talix becomes View Your Workspace for a verified returning user. No public email/account details. Existing getUser verification and signOut behavior are reused. No Auth configuration or authorization change.

## Concrete design proposals requiring review

Interactive fictional review: `/prototypes/deferred-review.html`. It writes no business data and uses no private tokens.

### #40 — Shopper tracking identity

Propose saved business logo/name/header styling and a Return to storefront action above the existing tracking body. Keep order state, polling, retry, no-index/no-referrer and private-token handling unchanged. Loading/unavailable orders show a neutral private-order message; never guess identity or derive a storefront from a name. Use the existing safe branding fallbacks and accessible foreground contrast. Do not add account/cart actions to tracking or persist tracking tokens in analytics, public links or browser storage.

The current track_order RPC exposes business/location names but no slug or branding. A separately reviewed additive migration must return a whitelist of subscription slug/name/logo and supported style fields alongside existing order data, only after a valid private token match. Return uses `/shop/<encoded slug>` with no token/query/referrer; missing or unpublished catalogs use existing unavailable-storefront behavior. No general order/table access or customer contact fields. Old-schema responses retain the current tracking experience until activation. Approval of design and exact migration execution remain separate.

### #38 — Subscription industry switching

Propose Settings → Your subscription → Change industry, visible only to the subscription owner. Select an active industry, compatible plan and extras, review old/new price and frequency plus what is retained, then explicitly confirm. Cancel/back preserve the current subscription. Initial release supports only subscriptions using shared-core configuration; do not claim unsupported industry-specific conversions. Current demo has no implemented industry data, real payment provider or entitlement engine.

Retain subscription ID, slug, locations, memberships/permissions, products/options/images and historical orders/refunds. Keep the original purchase snapshot immutable. An explicit change history must hold before/after selection, price/frequency, actor/time and request identity. The review prototype uses the requested sample four-tier monthly prices; application uses current database offerings/quote, not hard-coded commercial terms. Real billing/proration, entitlements and industry data transformations remain separate future requirements.

Before implementation, review a narrow owner-checked quote/confirm RPC and append-only change history proposal. Confirmation must validate current subscription version and active target offerings under transaction locks, require re-review when prices/availability change, atomically update current selection/industry and history, and be idempotent on retry. Do not overwrite subscription_purchases or silently change agreed purchase terms. Staff/admin read behavior and any required column grants/RLS must be reviewed explicitly. On failure retain old state and editable selection with retry/cancel. No direct industry updates or migrations prepared/applied in this batch.
