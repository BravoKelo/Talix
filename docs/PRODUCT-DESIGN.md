# Talix Product Design

## Status

**Design status:** Confirmed workflows and owner-approved October 16 visual direction; implementation remains for review.

## Purpose

This document is the durable source of truth for approved Talix customer-facing experience decisions.

It separates approved design from implemented-but-unapproved experiments, planned ideas, and unresolved questions.

## Design Authority Categories

Customer-facing elements should be classified as one of:

- **Approved / Established** — explicitly accepted product design that implementation must preserve unless changed through product-owner approval.
- **Implemented but Not Specifically Approved** — code exists, but implementation does not establish design authority.
- **Planned** — intended future behavior that has not yet been designed/approved.
- **Undecided** — no accepted design exists.

## Current Approved Design

The owner approved the October 16 design direction below. Existing detailed layouts remain reviewable implementations, not authority to change unrelated workflows.

The product vision establishes that Talix is intended to include:

- a business-owner back-office experience; and
- a business-specific customer-facing commerce/POS experience driven by managed data/settings.

Those are product requirements, not approval of a particular layout, navigation system, visual style, responsive hierarchy, or interaction model.

## Confirmed Product-Level Experience

The October 6, 2026 discovery established user journeys and operating behaviors, owned by `docs/PRODUCT-VISION.md`. Preserve those requirements when proposing the POC and later design.

The [Talix FigJam](https://www.figma.com/board/WtSucgcWZBc29V8SXToWKS/Talix?node-id=0-1) is a product-discovery map and visual companion. Its boxes, colors, connections, and supplemental detail cards do not approve screen layouts, navigation widgets, service decomposition, or database relationships.

Product-level choices are confirmed; detailed interface design remains undecided. The subsequent approved core slice is implemented for review; full vision capabilities remain deferred unless included in Issue #1.

## Design Principles for the Core

When design work begins:

1. start from the approved core workflow;
2. design the minimum complete experience required to demonstrate that workflow;
3. distinguish business-owner tasks from customer tasks;
4. make loading, empty, error, and incomplete states explicit where relevant;
5. validate responsive behavior appropriate to the intended users;
6. avoid adding dashboard surfaces or controls merely because a future SaaS platform might need them;
7. obtain product-owner approval before treating material customer-facing decisions as established.

## Protection Rule

An approved design must not be materially redesigned, removed, or replaced for implementation convenience.

Newer code does not automatically supersede an approved design.

Diagnostic, administrative, or engineering interfaces do not become customer-experience authority merely because they exist.

## Next Design Boundary

The approved bounded core is now implemented. Screen layouts and visual styling are provisional for product-owner acceptance; implementation does not establish final design authority.

## Implemented for review — October 7, 2026

Owner/employee sign-in leads to subscription/location selectors and orders, products, settings and Users areas. Effective permissions determine management controls. Customers enter `/shop/<slug>`, choose a location before seeing products, select generic optional extras, and check out as guests with name/email/phone. A clearly labeled simulated outcome selector replaces card collection. The resulting private order link shows fulfillment/payment/refund state and allows declined-payment retry. No transactional messages are sent yet.

The workspace polls the latest 100 location orders, shows contact and item snapshots, advances the sequential generic statuses, and records permission-authorized refunds with reasons and history. Subscription-level branding applies across locations. Product image upload and general/local scope are included. Owner, Manager, Supervisor, Lead, Fulfillment and Viewer roles are shown with explicit allowed/denied permissions; custom roles are now included in Issue #9.

## Customer signup and Talix admin — Issue #3

Approved journey: landing-page Sign up → business/contact and first-location details → business type, tier and optional extras → price and billing-frequency review → account creation/email confirmation → Continue → business workspace. Additional subscriptions use the selection/review flow. No manual database-dashboard business creation is part of the customer journey. All customer copy uses plain business language. Sample pricing and no charges must remain clear.

The three-step responsive layout is implemented for review, not final visual approval. Loading/empty/withdrawn-selection states, confirmation resend in the future real-confirmation mode, duplicate-account-safe messaging, failed confirmation, changed-price review, duplicate-safe subscription confirmation and signed-in resume are included. Owners see their saved subscription selection in Settings. Their first location starts unpublished until they configure products and enable ordering.

Talix staff separately manage business types, plans and optional extras, including availability, name, description, price and monthly/yearly billing frequency. A customer-account view displays contacts and subscription snapshots. Staff authorization is explicit; business-owner signup never creates a Talix administrator. Full CRM tickets/support/reporting, real billing and industry-specific benefits are not part of this slice. Email delivery/redirect configuration must be verified before public signup is described as live.

## Approved confirmation amendment — October 6, 2026 (Pacific)

The owner explicitly deferred email delivery and verification for current development. After signup display a separate confirmation page: `Email confirmation sent to: <account email>` with `(Feature coming soon)` underneath. Do not label this journey as a demonstration. Continue completes the saved purchase and opens the business workspace. Only a changed price or unavailable selection requires another review. Reload/sign-in resume the saved input; neither passwords nor the email address are stored in URL parameters. No email is sent in this mode. The existing real-confirmation path remains for live launch, which requires verification and delivery configuration. This supersedes required email confirmation in the earlier development journey; other signup/catalog decisions remain.

## Automatic ordering address — October 7, 2026

The owner confirmed that prospective customers should not choose an internal ordering address at signup. The address field and review row are removed. The purchase transaction derives an address from the business name, uses `store` for names without a usable ASCII form, and adds a numeric suffix when needed. A shared transaction lock serializes competing allocations; prior purchase retries retain their original address. Saved draft address input is ignored for new allocation. No new table, role, or external domain configuration is involved. Existing ordering links remain unchanged. Owner customization in Settings is a later follow-up, not part of this correction.

Customer signup no longer exposes this internal requirement. Migration application and operational verification belong in CURRENT-STATE and PROJECT-HISTORY.


## Review corrections — October 8, 2026

Issues #5–9 implement the owner-requested batch. Logged-out navigation offers Sign in and Sign up. Logout clears the Auth session and opens sign-in with a full navigation; workspace/admin entry verifies the current user and private responses are not cached. Duplicate-email feedback appears beside the signup action with a sign-in link and preserves typed values. Owners have a visible Add subscription action alongside subscription selection, using their existing account.

Users starts with configured users, protected Owner, subscription roles and separately assigned location roles. Managers with user-management permission may edit users within their own authority, but cannot change the Owner, their own access or grant access they lack. The permission matrix explicitly shows Allowed/Denied for every current section/action. Owners can create and edit custom roles with checkboxes; built-in roles are fixed. Unassigned locations remain inaccessible. Existing accounts are required; invitation delivery and owner transfer remain deferred. Layouts remain provisional for acceptance.

## Reconciliation checkpoint — October 7, 2026 (Pacific; October 8 UTC)

The owner closed Issues #5–9 after review. Preserve those corrected workflows; closure does not approve merging or the complete visual design. Issue #10 authorizes focused stabilization: successful custom-role creation keeps that role selected for later saves; a failed removal retains the selected user's editor and location choices, while successful removal returns to Add a user. Adding a subscription preserves the shared client profile and retains its own purchase details. This profile correction is applied and verified on development after separate execution approval.


## October 16 design batch — Issues #11–13

The owner requested an original Talix design using blue, white and gold. Preserve current core behavior and use original branding, assets and text. Missing applicable capabilities must say Feature coming soon.

Implemented for review: sign-in/signup use a white form column and blue feature/resource column, gold accents, public-resource placeholders and honest support/announcement/recovery placeholders. Existing signup/review/account/confirmation logic remains intact. The business workspace uses a grouped blue sidebar with gold active navigation, subscription/location selectors, settings category cards and responsive navigation. Access visibility continues to use the existing permission model.

The storefront editor exposes existing subscription-wide business name/introduction/brand color with an adjacent layout preview, unsaved/saved feedback, cancel and persisted save. Logo/header uploads, navigation editing, detailed element colors and slideshow remain clearly labeled placeholders. Preview is a non-interactive layout representation, not a full checkout or website builder. No schema, policies, migrations, authentication methods or new integrations are introduced.

All seven appearance screenshots were reviewed. Observed references include settings discovery, header/contact/mode choices, logo upload, editable/reorderable links, grouped color controls with preview and Save/Cancel; slideshow contents were not supplied. Only existing Talix settings work in this first design slice; other controls are placeholders rather than inferred implementation. Talix application colors do not restrict an owner's saved storefront brand color.


## Public homepage extension — October 16, 2026

The owner authorized extending Issue #11/PR #14 to redesign the public landing page. The original Talix blue/white/gold page introduces ordering and fulfillment, an explicitly illustrative workspace visual, core capabilities, the customer-to-team workflow, a clearly planned capabilities section, FAQs and signup/signin links. Use original assets and copy; do not invent testimonials, metrics or certifications. Sample plans and simulated payments are disclosed before signup; industry tools and integrations are described as future capabilities. Existing onboarding and global authentication navigation are preserved.


### Readability revision — October 16, 2026

Owner review requested larger navigation and descriptive text across every refreshed page. Navigation and descriptions now use 16px text, general copy uses a 17px base, and supporting labels have a 14px minimum, including mobile. Line spacing and wrapping are increased; forms, resource links, sidebar navigation, settings and appearance previews retain their workflows. Illustrative product content also uses larger labels rather than the previous 7–12px sizes. This correction remains within Issue #11/PR #14.


### Mobile navigation and touch revision — October 16, 2026

The owner rejected wrapping mobile navigation/controls and approved compact navigation menus and touch-friendly controls. Public and workspace sections now use accessible mobile disclosure menus with single-column choices; desktop navigation remains visible. Mobile actions, subscription/location selectors, resource placeholders and signup steps have deliberate single-column layouts rather than wrapped rows. Controls keep readable type and single-line labels. Buttons, primary navigation, selects and disclosure summaries have at least 48px targets; checkbox/radio labels provide larger activation areas. Paragraph text still wraps naturally. This supersedes the earlier control-wrapping approach and remains within Issue #11/PR #14.


## Review corrections #15–21 — October 16, 2026

The owner authorized this testing batch and requested a final review before merge. These changes supersede the earlier mobile dropdown and long settings-page approach:

- Homepage has a touch-friendly fixed Back to top link. Mobile public/workspace navigation remains visible in a single horizontally scrollable row, without dropdowns, line wrapping or reduced type.
- Workspace uses a consistent header with permission-aware Orders, Products, Settings and Users shortcuts; storefront/add-subscription actions remain available. Current subscription/location dropdowns occupy the top-right on desktop and dedicated full-width controls on mobile. The duplicate Business workspace entry button and old page-level selector panel are removed inside the workspace.
- Sidebar identity uses the selected business logo or a business-name initial fallback. Planned CRM, inventory/materials, financial reporting, employee scheduling/time, marketing, communications, integrations, website-builder, industry and support areas are explicitly labeled Feature coming soon; menu presence does not implement them.
- Orders use compact ledger rows. Selecting a row opens a modal with the existing detail, fulfillment and simulated-refund actions. Escape/Close return to the list; keyboard focus returns to the order control.
- Settings has searchable tiles with names/descriptions and no-match feedback. Selecting a tile opens one tool instead of all settings in a long page. Hidden tool panels retain drafts.
- Users has internal Users, Add/Edit user and Permissions tabs. Tabs have keyboard navigation and clear selected state; user/role drafts survive internal tab changes. Existing protected Owner, custom roles and delegation rules remain enforced.

Business-logo upload/save is implemented against a prepared additive migration, not yet applied to development. The nullable logo URL and public business-logos bucket use existing settings.manage authority; public images are limited to JPEG/PNG/WebP up to 5 MB, uploaded under the subscription's folder without overwrites. No logo means a business initial, not another Talix logo. Public catalog output adds only the logo URL. Until database activation, logo input is disabled and existing branding can still save. Storage/image URLs and retained uploads follow the existing product-image approach; orphan cleanup is not part of this batch.


## Accepted design baseline — PR #14, October 16, 2026 Pacific

Owner accepted the final reviewed design and authorized merging PR #14 at 62d17846d6d298d1a1844c03e63b2e6aa3966771. This supersedes earlier provisional/pending descriptions and initial unsupported-logo placeholders above.

Final behavior: visible horizontally scrollable mobile navigation; consistent workspace header/context; business-logo identity; ledger orders with modal details; searchable Settings tiles; internal Users tabs; compact uniform resting tiles; shared Add/Edit product modal; explicit Cancel actions where applicable. Order numbers start at 100001 per location with Date/time beside them. Order cancellation requires fulfillment authority and does not refund automatically. Confirmed product deletion preserves historical snapshots.

Product images and business logos support staged deletion and local selection until Save; Cancel restores saved content. Saved references protect shared images and failed cleanup offers retry. Both pickers show the active selected/saved filename; No file chosen appears only with no image. New uploads retain original filenames, while older uploads show their stored name. Future header templates, links, independent element colors and slideshow remain labeled placeholders. Permissions and simulated payments remain in place.

## Core visual storefront — Issue #32

**Authority:** owner approved the bounded scope on October 17, 2026. The detailed design and implementation below are prepared for review; final visual acceptance and merge are separate. This section governs the storefront changes in #32 and preserves the accepted workspace and checkout workflows.

### Layout and interaction

- Business welcome: saved subscription logo, name and introduction, with a clear Explore products action. No invented claims, promotional badges or external example identities. Existing Talix application navigation remains; this is not yet a white-label website shell.
- Storefront navigation: Welcome, Products and a live cart item count. In-page links retain the current cart and remain available while scrolling; on narrow screens navigation stays on one horizontally scrollable row. A keyboard skip link reaches location selection.
- Location: an explicit published-location selector remains before catalog browsing, including for a single location. Display saved address, phone and descriptive hours. Explain before selection that changing location clears the cart; reset product search/detail state too. Do not infer open/closed status, availability by hours, stock or fulfillment methods.
- Discovery: two equal-height card columns on wider screens, one on phones. Use real catalog images at a consistent 4:3 ratio, readable product names, two-line description summaries, base prices and a View product action. Missing/failed images use an honest neutral placeholder. No categories, popularity ranking or new product metadata are invented.
- Search: case-insensitive name/description filtering of the current location's existing catalog only. Show result count and a clear-search action when nothing matches. Distinguish no products, no published locations, loading and unavailable-business states.
- Product detail: reuse the native modal/focus-return pattern. Show the full description, a contained larger image, base price and existing optional extras with their price increments. Add to cart displays the selected total, closes the dialog and returns focus to its product button. Escape/Close discard option selections without changing the cart; reopening starts unselected. Existing identical-product/option cart merging remains.
- Cart/checkout: a right-hand panel on desktop, following products on smaller screens. Navigation provides a direct cart jump. Keep cart line removal, totals, guest fields, Cancel checkout, simulation disclosure/outcomes, request identity and private order navigation. Announce additions. No persistence of carts/customer details is added. Tall checkout panels scroll with the document instead of obscuring controls in a sticky panel.
- Readability: 17px storefront body, 16px labels/controls and at least 48px primary touch targets. Subscription accent is retained as a decorative brand detail; dark readable primary buttons avoid white text becoming invisible with a light saved accent. Dialogs use native modal keyboard containment, Close/Escape and focus restoration. Long business/product text wraps rather than expanding the viewport.

### Scope boundaries and website adoption

The existing `/shop/<slug>` is the common hosted entry for both adoption paths. An existing business website can use an ordinary link to it; no script, new endpoint, iframe, domain setup or provider integration is required. Validate the actual business link and published catalog before handing it to customers. Location must still be selected and payments remain simulated.

For a business using Talix as its primary website, this slice supplies a single-page foundation: business identity/introduction, location/contact/hours, visual products and ordering. It does **not** establish a complete business website service. See the bounded follow-up proposal in `docs/STOREFRONT-ROADMAP.md`. Neither adoption path bypasses subscription or location rules.

### Owner storefront review corrections — October 17, 2026

Supersedes the initial #32 layout above: a compact sticky business header keeps identity and the live cart count/total at the top right and reduces its padding/logo size after scrolling. The introduction is brief and disappears in the collapsed header. Location selection/contact details form a compact bar. Small square-image cards use a dense responsive grid (two columns on phones), with a short description beneath the image. The image/name/description area is one keyboard-accessible details button; the separate Add to cart button adds the base product immediately with no optional extras. Extras remain explicitly selectable in the product dialog. Cart/guest checkout follows the catalog, reached from the persistent cart link. Existing checkout payload and location clearing remain unchanged.

The owner also requested a workspace-configurable initial storefront location. This requires a separately approved schema/catalog change; it is not implemented by the presentation correction. Proposed bounded design: nullable `default_location_id` on the subscription, restricted to a location in that subscription; editing uses existing subscription settings.manage authority. Workspace offers published locations; catalog exposes only a valid published default. Initial load selects that default, or a deterministic first published location if none is set/unpublished, and shows the chosen location prominently. Shoppers can change it, clearing their cart as today. No geolocation, new roles, entitlement changes or cross-location products. Existing subscriptions need no backfill. Prepare and test the additive migration and workspace control after owner approval of this specific boundary; obtain separate approval before applying it to development.

## Approved Figma storefront direction — October 17, 2026

Owner accepted the collaborative layout study and instructed implementation. This supersedes the earlier rejected storefront presentation revisions above. Source: https://www.figma.com/design/NsJQpQsR2YNjTwNHdWPWu7 — desktop 1:262, collapsed header 1:263, mobile 1:264, product detail 1:265, tablet 7:801, owner settings 7:904, header-photo option 7:942.

One pinned business header replaces the Talix application header on shopping pages. Logo/initial is at left, business name or optional uploaded photo stays centered, and account/cart icons are at right. Header height reduces from 88px (72px mobile) to 56px on scroll. The account popover links to existing business sign-in/workspace; guest shopping remains available. Customer accounts, loyalty and POS workflows are not introduced.

Location and search occupy a compact row. Initial load selects the configured published default location, falling back to the first published name/ID; customers can change location and doing so clears the cart/search/collection/details. Contact/hours/introduction live under Location information rather than a large hero. The desktop left menu filters existing product collection labels; empty labels remain in All products. No sample collections or industry metadata are persisted. Products has a single optional collection label editable with existing product-management authority.

Desktop has three image-led product columns beside the menu, tablet has two, mobile has two with a Menu toggle, and very narrow phones have one. Every interactive target is at least 48px. Direct Add to cart adds the base product; selecting the tile opens full details and optional extras. Existing guest checkout/payment simulation/private order tracking remain. Native buttons and existing TaskDialog are reused; the Figma community-kit Button has no installed repository implementation. Exact approved icon vectors are exported as local SVGs. Figma's Inter is a provisional study font; implementation exposes existing system sans, serif and monospace choices without external font services or dependencies.

Appearance settings retain staged Save/Cancel and logo handling, adding centered photo/name, header background, product text/button colors, three font families, standard/large text, square/subtle/rounded image/button corners, compact/comfortable spacing, and default published location. Header/button foregrounds adapt for contrast. Photo uploads reuse the existing public business-logos bucket, 5 MB JPEG/PNG/WebP limits and settings permissions; saved header references are protected from cleanup alongside logo/product references. Preview reflects drafts only until Save. New controls and collection entry are disabled/hidden against the older database until activation; the layout works with existing catalog output.

The additive migration is applied to development after explicit owner execution approval; CURRENT-STATE records the version and live database verification. Reloading the workspace enables the new controls. Final visual/merge acceptance remains required. No subscription tiers, industry modules, custom domains, arbitrary CSS/scripts, provider integration or production release are included.


## Approved cart popup, header presets and tabbed design settings — October 17, 2026 Pacific

Owner rejected the permanent cart/checkout block retained from the older storefront. Cart design acceptance (“That looks like what I was expecting”) supersedes every earlier inline-cart or cart-jump description above. Figma source: desktop 20:333, mobile 20:434, empty 20:524 in NsJQpQsR2YNjTwNHdWPWu7. Click/tap the header cart to open a right-side desktop modal (440px maximum) or full-width mobile modal, with dim backdrop, Close/Escape/outside dismissal, focus return and background scroll lock. Show product thumbnail, name/options, unit and line price, quantity 1–99, explicit removal, empty state and a pinned subtotal/checkout/continue-shopping footer. No cart, customer form or simulation controls appear in the browsing page. Go to checkout exposes the existing guest/simulated-payment form as a separate step; Back to cart/Cancel preserve the cart. Existing authoritative pricing, location clearing, idempotency and private tracking remain.

Owner approved the header/settings proposals (“Those will work for now”), specified the first preset as default and explicitly directed implementation. Source comparison 23:629: Centered identity (default), Left-aligned brand, Two-row, Search-focused and Minimal; desktop expanded/collapsed and mobile examples are included. Preserve logo, business name or uploaded identity photo, account/cart actions and responsive sticky collapse. Name/photo stays centered in the centered preset; other layouts align identity with the logo. Search-focused puts search in the expanded desktop header; mobile/compact states retain search in the page toolbar. Header choices do not introduce arbitrary navigation, industry controls or customer identity.

Settings use the existing Users tab interaction pattern: Branding (name/introduction/logo/header photo/default location), Header (five visual presets and name/photo identity), Products (corners/spacing) and Style (accent/header/text/button colors, system font/text size). Source frames: 24:912, 24:1001, 24:1198, 24:1280, mobile 24:1371. Drafts survive tab changes, Save applies all tabs and Cancel restores saved values. Desktop/mobile preview is non-interactive. Revisit presets after the owner creates a complete demo business; no speculative option expansion is authorized. Header-choice persistence is applied after separate execution approval; exact activation evidence belongs in CURRENT-STATE. No merge/production release is authorized.

## Header navigation — proposal under review, Issue #35

Owner added website-matching header links to the current scope and approved an interactive browser prototype while Figma access is rate-limited. This authorizes the review approach, not acceptance of its visual/behavior details or a new persistence boundary. Prototype: public/prototypes/header-navigation.html.

Proposed: manually configured link labels, HTTPS website destinations or the current storefront, and link order; all five preset layouts; Menu in compact centered/mobile headers and More for desktop overflow; 48px targets and modal focus/Escape behavior. Name/photo identity and cart/account actions remain available. Prototype links show destinations, Save/Cancel uses only a separate browser-local proposal draft, and cart actions do not submit purchases. These are review interactions, not live owner settings or an automatic website-navigation import. Final design, link limits and required data-model/security changes await review and separate implementation/execution approval. Recreate the accepted design in editable Figma layers when access resumes.

Owner requested tightening the prototype's left settings section while keeping it touch-friendly. Revised proposal uses a 300px review sidebar, compact navigation rows, one expanded link editor at a time and 48px reorder actions. Intended application placement is the existing Storefront design → Header tab; the surrounding design-review toolbar is not part of the business workspace. Final visual acceptance remains pending.

Owner explicitly agreed that Talix settings and business branding must be separate. Header settings controls and the review wrapper use the established Talix workspace blue/white/gold palette; only the storefront preview uses the business's saved branding. Prototype styling now demonstrates that separation without changing the embedded storefront source. This is an accepted color-ownership rule, not acceptance of the entire pending navigation proposal.

### Accepted header navigation design — October 18, 2026

Owner explicitly approved the final interactive prototype at ccdc50fcb2d1948d8a34ae0895232f349e363109: https://talix-rew9tzss6-bravokelo.vercel.app/prototypes/header-navigation.html. This supersedes pending visual-review language for that prototype above.

Implement configurable navigation labels, website/current-storefront destinations and order under the existing Header settings tab. Retain the five presets, expanded/collapsed/mobile navigation, tap menu and desktop overflow/More. Use compact link summary rows with one editor expanded at a time, explicit reorder/add/remove and 48px targets. The 300px sidebar demonstrates density; fit the controls into the existing workspace settings structure rather than introducing the outer review shell. Talix workspace colors govern controls; business branding governs shopper-facing navigation/preview. Browser-local Save proposal, the outer review toolbar, mock identity photo and demonstration cart are not production requirements. Existing Save/Cancel, upload and checkout workflows remain.

Design acceptance does not activate persistence: present the minimal validated subscription-wide navigation data/catalog change for separate protected-boundary approval before execution. No database migration has been prepared/applied for navigation, and no application navigation is implemented yet. Figma recreation remains deferred until tool allowance returns. No merge or production release is authorized.

### Standard versus custom header setup — October 18, 2026

Owner added and approved a Standard/Custom radio-mode distinction under Header settings. Standard is the initial default with automatic Home, Shop, About and Contact navigation; editable website navigation belongs only in Custom mode. Switching modes must preserve custom settings and retain existing Save/Cancel behavior. This supersedes the earlier prototype's always-visible custom controls.

The revised review prototype proposes Standard as the centered identity preset: Home returns to the storefront top, Shop scrolls to products, About opens the saved business introduction, and Contact opens the selected published location's address/phone/hours. It requires no external website or missing standalone pages. These destination presentations remain for visual review; the mock location values are explicitly fictional. Custom reveals the five presets and prior approved link editor; its values survive Standard/Custom switching and browser-local Save/Cancel. Standard uses business branding from Branding/Style rather than the Talix settings palette. No application mode/persistence has been implemented or applied to development.

### Final Header tab approval — October 18, 2026

Owner explicitly approved the updated Header tab prototype at 0ff643c2417585498200cff2de495531cfa1fdbf: https://talix-f12jadei3-bravokelo.vercel.app/prototypes/header-navigation.html. This supersedes the pending destination-presentation/visual-review wording above for this revision. Standard is the initial default with Home/Shop/About/Contact using the storefront top, products, business-introduction dialog and selected-location contact dialog. Custom alone exposes the editable presets/navigation. Switching preserves custom values; existing Save/Cancel governs activation. Compact editing, touch targets and separate Talix-settings/business-brand colors are accepted.

This is design acceptance for issue #35. Prototype scaffolding and browser-local storage remain review-only. Navigation application implementation/persistence is not yet prepared or applied. Database/security execution, final merge and production release remain separate approvals. Unrelated workspace/tablet/sign-in/tracking follow-ups are not silently added to this slice.


### Header implementation prepared — October 18, 2026

The approved Header prototype is now implemented in the existing application editor and shared storefront header. Custom link rows preserve one expanded editor, explicit reorder/add/remove and 48px targets. Save validates all retained custom values, including while Standard is selected; an unfinished hidden custom link must be corrected or removed before saving. Standard/Custom switching otherwise preserves custom settings. Existing non-centered layouts are proposed to retain their selection on migration by entering Custom mode; no sample website links are inserted. The exact additive persistence proposal is `HEADER-NAVIGATION-MIGRATION.md`, prepared for separate owner database approval. Final application acceptance, migration execution, merge and production release remain separate.


## Storefront phase accepted and merged — October 18, 2026

The owner accepted the reviewed application with “Everything looks good lets roll” and authorized the merge. PR #33 merged into main as bf923ca78387ae32d1a0e69cc77275f5090f9ce2, preserving feature history. Reviewed head 83526d374415d47b74b0e69f2344dca957f8a025 passed Core checks run 39157484444 (lint, TypeScript, 59 unit/SQL tests, build, and 24 desktop/mobile browser tests); its feature preview was READY.

Acceptance covers the storefront product layout, popup cart, five header presets, tabbed appearance settings, and Standard/Custom header navigation. Issues #32 and #35 are complete. The sixteen development migrations, through 20261018174618_storefront_header_navigation, were already applied and were not replayed for the merge. Earlier pending acceptance/merge statements below are historical and superseded by this record.

Automatic production deployment from main remains disabled in vercel.json; this acceptance does not release production. Retain the feature branch while its review preview is in use. Live owner-workspace saving was not independently automated; do not infer that coverage from the shopper checks. Figma recreation remains deferred until allowance is available. Deferred issues #36, #38, #40, #41, #42, and #43 remain outside this phase; demo tracking issues are not closed by this acceptance.

