# Website onboarding sprint #89

## Scope and baseline

Owner requested unattended implementation and preview verification of bounded corrections on October 20, 2026 Pacific. Baseline main: `a7d4fc7` (merged PR #80). Existing `feature/website-owner-onboarding` was fast-forwarded to that baseline and reused for the focused UI corrections and its existing branch-scoped development preview. No merge, production deployment, migration or service configuration change is authorized or performed.

Prepared corrections: #86 asset/color/action clarity; #87 redundant domain card removal; #85 live-state public action labels; #82 prominent save feedback; #88 inline Go Live preview and authoritative publication confirmation. `PRODUCT-DESIGN.md` owns the resulting UI behavior. The retained database contract means #85/#88 do not claim #83's future storefront-only transition is implemented.

## Protected decisions remaining

### #83 — Publish storefront-only mode

The applied `save_website_setup` deliberately leaves `website_live_template` unchanged. `launch_website_template` activates a saved template and cannot clear it. Direct client updates to these owner-only fields are not granted. The prior accepted one-step Decide later path explicitly preserves a live website.

Proposed bounded decision for owner approval: add one owner-checked atomic operation that locks the subscription, verifies the pending deferred path, clears only the active template and its publication timestamp, and returns authoritative state. Retain the saved draft template, all business/catalog data, existing storefront URL, tenant checks and current grants. Repeating an already committed transition must be safe. UI for previously launched sites would become Save to continue → explicit Go Live storefront-only confirmation; never-launched subscribers retain the current one-step path. Define the unknown-response recovery and return shape with the operation. Prepare an additive migration and owner/outsider/retry tests only after approval; development execution is a separate decision. No migration or partial UI transition is prepared in this sprint.

### #84 — Separate homepage goals from shopping

Current approved Home/Shop destinations are in-page anchors on the canonical `/shop/<slug>` homepage, which renders the shared active catalog. Homepage Product structured data currently describes those visible products. The requested separation changes that accepted customer navigation and visible-content contract; the issue requires bounded implementation approval.

Proposed minimal decision for owner approval: retain the single canonical URL and existing Home/Shop anchors, use them to switch the presentation between homepage and the same shared storefront, keep cart/location state in the current component, and make Back/Forward and direct Shop links work. Order First continues to include shopping on its homepage. Visit & Order shows saved visit information; Browse & Shop shows a bounded sample of real eligible products without unsupported popularity claims; Story & Shop shows the saved business description and contact details without invented testimonials. All homepages retain an accessible Shop entry even when custom navigation omits one. Preview must reproduce the same presentation. Update homepage structured data to include only products actually visible there. No new routes, slugs, schema, popularity ranking, ordering engine or custom-domain work. The owner must accept this changed Home/Shop and preview behavior before implementation; stable product/location routes remain their separate protected review.

## Validation and manual acceptance

Exact-head CI, final preview URL and deployment evidence belong in PR and issue #89 handoff; local tests are not live-service evidence. Physical-device and real assistive-technology checks retain the approved deferral in `SUPPORTED-ENVIRONMENTS.md`.

Local Node 24 validation: lint has zero errors and the existing design-script unused-variable warning; TypeScript, all 89 unit/isolated SQL tests and the production build pass. The complete browser run passed 55 of 58 cases; three WebKit dialog focus-return failures were diagnosed as pointer activation not focusing the opener. Explicitly focusing the existing product, cart and navigation triggers fixes those cases; all three targeted regressions then pass. The same navigation primitive serves the inline preview. No dialog, commerce or authorization contract changes. Final full-suite CI remains required before review readiness.

Owner review steps:

1. Open the supplied Vercel preview, sign in and open Website Appearance for a development subscription.
2. Select a Talix template; inspect Business identity with and without saved images. Check swatch/hex, optional fallbacks and gold Edit Website Branding action; verify it opens the existing editor.
3. Open Web address: the Future option card is absent and custom-domain unavailability remains clear.
4. Open Go live: inspect checks/live details on the left and inline preview on the right at desktop width; check sensible stacking at tablet/phone widths. Switch preview device sizes and inspect branding/navigation/content. There is no Open customer preview modal.
5. Publish a designated development fixture only. Verify the prominent business-name/timestamp confirmation, gold Open website action and the actual public destination. Existing published timestamps can remain unchanged for idempotent publication of the same template.
6. Save Decide later for an already launched fixture. Verify the prominent confirmation and preserved live website, including Open website in the workspace. This preservation is intentional until #83 is separately authorized.
7. For a never-launched subscription, verify Open storefront remains the action even after saving a draft template. Check keyboard navigation, focus after save and 200% zoom/reflow.

Do not merge until owner acceptance of the exact reviewed commit. No production testing or release is part of this handoff.
