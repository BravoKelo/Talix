# Header navigation: approved development activation

Owner approved execution on October 18, 2026. The exact reviewed SQL is applied to development as `20261018174618_storefront_header_navigation` (sixteen migrations). The prepared proposal below is retained as historical review context; its pending-execution wording is superseded. Live rolled-back verification passed defaults, owner/editor updates, constraints, retained custom values, catalog visibility/privacy and outsider/anonymous denial. No synthetic users remain; advisor categories/counts are unchanged. No merge or production release occurred.

Issue #35 / PR #33. The owner approved the Header tab design and application implementation. This proposal is ready for separate database approval under AGENTS.md; it has not been applied to any connected database.

## Demonstrated requirement

The accepted Standard/Custom choice, custom link labels, destinations and order must survive workspace saves and reach every location's public storefront. Current subscription settings have a layout value but nowhere to store those values.

## Minimal proposed change

Migration: `supabase/migrations/20261018174618_storefront_header_navigation.sql`.

| Subscription field | Proposed value |
|---|---|
| `header_mode` | Checked `standard` or `custom`; default `standard` |
| `header_links` | Ordered JSON list; default empty; at most eight links |

Each link contains only `label` (nonempty, up to 32 characters), `destination` (`storefront` or `website`) and `url` (empty for this storefront; bounded HTTPS address for a website). An immutable private invoker function validates the JSON shape and rejects unsafe protocols, credentials, whitespace and backslashes. The application additionally parses website URLs before saving/rendering. No HTML or script fields are accepted.

Existing non-centered header choices are marked Custom during migration so their selected layout remains in use. Centered businesses and newly created subscriptions use Standard. Existing saved layout, identity, photo, branding and all business/order/product data are retained. No sample website links are inserted.

The two fields receive column-level UPDATE grants under the existing subscriptions `settings.manage` row policies. The existing public catalog adds only mode and active custom links; inactive custom links remain saved for the owner but are omitted from the public response. Published-location scoping and the existing catalog function ACL stay intact. No new public endpoint, role, table, bucket, dependency or service is proposed.

## Validation

59 unit/SQL tests pass, including defaults, ordered link persistence, Standard-mode redaction with retained owner values, settings editor authorization, outsider/anonymous denial, invalid shapes/URLs/mode rejection and upgrade preservation of an existing non-centered layout. Browser settings saves use isolated Auth/Storage adapters and the actual migration SQL/RLS; 24 desktop/mobile scenarios and final focused corrections passed. No connected database was migrated to obtain this evidence.

## Compatibility and execution

Before activation the editor disables mode/navigation persistence, omits unavailable columns from updates and retains existing layout/branding saves. The shopper can use standard navigation with the previously saved layout. After activation Standard uses the centered layout and Home/Shop/About/Contact. Custom uses the saved preset and ordered custom links. Switching modes preserves custom values; Save/Cancel remains the activation boundary.

Approval requested: apply this reviewed additive migration to Talix development `lzepujggusieapablzhn`, then verify defaults, constrained updates, permissions and public catalog output with rolled-back synthetic records. That approval would not authorize merge or a production release.
