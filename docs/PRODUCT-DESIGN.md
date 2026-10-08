# Talix Product Design

## Status

**Design status:** Confirmed product-level workflows; no approved detailed UI or visual design.

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

No detailed customer-facing design has yet been approved in the current Talix repository.

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
