# Talix Project History

## Purpose

This document records material project outcomes, durable decisions, major investigations, milestone transitions, and important rejected directions.

It is historical context, not the source of truth for current implementation state. Use `docs/CURRENT-STATE.md` for the current handoff.

## 1. Initial Product Concept

Talix was conceived as a web-based platform for business owners to manage products and business information through a back office and use that managed data/settings to generate a customer-facing point-of-sale / commerce experience.

The broader concept included business customization, reporting, customer/marketing capabilities, extensibility through future industry-specific modules, integrations/APIs, and Talix-side operational/customer-management capabilities.

Early planning considered a modern web stack and a proof-of-concept-first development path.

## 2. New Repository and Infrastructure Foundation

On October 6, 2026, the Talix GitHub repository was established at `BravoKelo/Talix`.

The verified repository starting point contained a single `README.md` and one initial commit:

`133cb2450a422ed550a8d646d3a7626d36c68519` — `Initial commit`

A new Supabase project named Talix was also created separately.

No application implementation or database architecture was treated as established merely because infrastructure existed.

## 3. Development-Governance Reset

Before beginning Talix implementation, the product owner chose to apply development lessons learned from a prior software project.

The key change was to preserve rigorous repository-first, evidence-driven development while eliminating unnecessary manual file-transfer and command-relay work.

Talix therefore adopted a controlled direct-GitHub workflow:

- repository/GitHub remains durable project truth;
- meaningful scope is diagnosed and proposed before implementation;
- the product owner approves protected decision boundaries;
- after approval, the AI agent may implement and iteratively correct work directly on the approved branch within that scope;
- the agent must stop when evidence requires a product, material UX, architecture, schema, security, infrastructure, integration, or material scope decision;
- automated CI should perform routine validation as the implementation gains tooling;
- complete diff review and product-owner acceptance remain required before merge.

This governance model is intended to keep product-owner attention focused on decisions and acceptance rather than mechanical development transport.

## 4. Overall Product Discovery and Vision Reconciliation — October 6, 2026

The entire initial Talix FigJam was reviewed, then refined through explicit owner clarifications before first-POC definition. The owner authorized updating the board and repository documentation, without implementation or architecture/schema/technology decisions.

Material outcomes include restaurant-first audience with a foundation for other industries; multiple subscriptions per client and multiple locations per single-business-type subscription; one login and location-specific predefined/custom roles; subscription-wide branding, CRM, and tool selection; shared/local products with local inventory; product-configured production timing; materials-only BOM contribution to COGS; restaurant ordering, tables/QR/tabs, preparation stations, own-driver delivery; and financial reporting without full bookkeeping or payroll processing.

Later clarifications superseded initial interpretations: production timing is product-configured rather than industry-fixed; online orders alone require email and phone, while in-person QR contact details are optional; marketing is separate from transactional communications.

Current product authority is `docs/PRODUCT-VISION.md`. Detailed UI, technical decisions, commercial terms, and first-POC scope remain open. This reconciliation does not authorize application implementation.

## 5. Shared core implementation — October 7, 2026

The owner clarified that Talix primarily serves online ordering/fulfillment and approved building the business-neutral core before industry modules, without extended theoretical POC work. A bounded core slice was approved, with simulated payments instead of a real processor. The owner selected Next.js, Supabase and Vercel. Issue #1 and branch `feature/core-commerce` record the implementation. Existing foundation governance is preserved. The Supabase connector exposed only unrelated AMZ-PSE Development; that project was not changed, and the Talix migration remains unapplied pending access.

## 6. Supabase development connection — October 7, 2026

The owner reconnected the Supabase plugin, exposing the existing healthy Talix project. Its empty application schema was inspected before applying the approved core migration. Preview/development public environment values were configured; production remains disconnected. Two corrective migrations address observed platform helper grants and access-query advisor findings. No processor or industry-specific behavior was introduced.

## 7. Self-service customer experience — October 6, 2026 (Pacific)

The owner corrected manual account provisioning and approved the next bounded scope: public signup, business information, subscription type/tier/optional-product selection, price review, simulated billing, and editable sample offerings in Talix admin. Signup data is intended to grow into the administrative CRM. Customer copy must use plain language. Issue #3 and feature/customer-onboarding build on the unmerged core draft, preserving foundation governance. No industry-specific behavior or real processor is added.

## 8. Deferred email confirmation — October 6, 2026 (Pacific)

The dashboard fallback was authorized but its remote-browser sign-in could not be completed with the owner’s GitHub/passkey method. The owner reported localhost as Site URL and no redirects; preview URL/callback instructions were supplied, but their save is not independently verified. A supplied screenshot established no custom SMTP sender. Rather than selecting a provider/domain now, the owner explicitly approved simulated confirmation, rejected demonstration labels and specified `Email confirmation sent to: <email>` with `(Feature coming soon)` underneath. A confirmation page and Continue journey are implemented for review, using the existing development Auth service’s supported automatic-confirmation setting; the owner must toggle that setting because the connector cannot edit Auth configuration and the remote dashboard session is unavailable. Mandatory email confirmation and delivery remain launch requirements. No industry-specific changes, real email or billing provider were introduced.

The owner then saved the development Confirm email toggle. Public settings verified automatic confirmation enabled. Actual no-mail Auth signup returned a session and saved draft, and actual subscription creation/repeat safety/owner-without-staff access passed. The disposable account signed out and all associated test rows were cleaned up. Current operational verification and limits are recorded in CURRENT-STATE; live email delivery remains deferred.

## Signup corrections — October 7, 2026

Owner feedback identified repeated setup, lost account entries on plan edits, insufficient field validation and confirmation returning to plan selection. Root cause of the reported loop was an invalid saved store slug handled as a plan error. Signup now reviews once; confirmation Continue invokes the same atomic, repeat-safe purchase and enters the workspace. Price changes require explicit re-review; business errors open business details and unknown failures stay retryable. Existing drafts can be repaired through `/onboarding?edit=1`; account creation is not repeated.

Email/password/confirmation inputs are controlled in component memory and survive plan/business edits, but passwords are never persisted in metadata, browser storage or URLs. Billing/location addresses use separate street/unit/city/region/postal/country fields, serialized to a consistent five-part address; region/unit are optional. Phone input accepts North American local formatting or an explicit international country code and is stored with `+` and digits. Contact names accept Unicode letters and common name punctuation. Store address is the lowercase `/shop/<slug>` suffix, not a full external URL. Validation establishes format/completeness, not address or phone deliverability. Field errors display beside invalid entries.

Migration `20261007041833_validate_signup_details` adds format checks to the existing purchase function without changing tables, permissions or prior purchase replay behavior. Applied to the existing development project; advisor findings remain the previously documented intentional endpoints/private allowlist and launch-hardening items. Local validation: 25 unit/database tests, six desktop/mobile browser scenarios, lint, typecheck and production build. Branch preview deployment and GitHub checks are verified separately; no production promotion or merge is authorized.

## Automatic ordering address — October 7, 2026

The owner confirmed that prospective customers should not choose an internal ordering address at signup. The address field and review row are removed. The purchase transaction derives an address from the business name, uses `store` for names without a usable ASCII form, and adds a numeric suffix when needed. A shared transaction lock serializes competing allocations; prior purchase retries retain their original address. Saved draft address input is ignored for new allocation. No new table, role, or external domain configuration is involved. Existing ordering links remain unchanged. Owner customization in Settings is a later follow-up, not part of this correction.

Development migration `20261007043143_generate_ordering_address` is applied. Database checks verify duplicate-name allocation and repeat-safe completion. The live check used a rolled-back transaction and left no records. Customer signup no longer exposes this internal requirement.


## Review batch — October 8, 2026

The owner authorized correcting five reported defects together and creating GitHub traceability (Issues #5–9). Implemented verified-user workspace entry/logout, logged-out navigation, adjacent duplicate-email feedback, prominent additional subscriptions and Users with protected Owner, leadership/custom roles and independent location assignments. The minimum permission schema and checked RPCs are recorded in ADR 0003; both development migrations are applied.

Validation: lint/typecheck, 33 unit/SQL tests, six desktop/mobile browser scenarios and production build passed. Actual Supabase disposable accounts verified role assignment, denied access, revocation/removal, duplicate signup and signout; associated records were removed. Draft PR #4 remains stacked on PR #2; no merge or production promotion.

## Controlled reconciliation preparation — October 7, 2026 (Pacific; October 8 UTC)

The owner closed Issues #5–9 and requested a controlled repository, governance, implementation and infrastructure assessment. Phases 1–6 confirmed main still contained only the initial README, with linear foundation → core → onboarding ancestry and two draft PRs. Governance principles remain intact; stale documentation and incomplete separate approval provenance for specific Users schema/security choices were surfaced.

The owner approved the bounded Phase 7 reconciliation plan and preservation of the shared client profile when adding a subscription. Issue #10 records the authorized scope. Regression checks reproduced repeat custom-role creation, editor clearing after denied removal, and additional-subscription client-profile overwrite. Focused corrections preserve the selected role/editor and prepare an additive replacement of the existing subscription transaction function. The original nine migrations remain unchanged; the new migration is not applied pending explicit execution approval.

This is preparation, not an integration milestone: no PR has merged, main remains unchanged, and no production configuration or promotion has occurred. Earlier UTC headings and explicitly Pacific headings describe the same development period; this checkpoint records both time zones. Final integration facts will be appended only after confirmed, accepted merges.


### Approved development correction — 2026-10-08 UTC / 2026-10-07 Pacific

After clarification of “development only,” the owner explicitly approved execution. The reviewed client-profile function migration was applied only to the existing Talix development project. Supabase assigned 20261008033814; the prepared migration filename was aligned to that recorded version without changing its SQL or the original nine migrations. Live authenticated SQL/RLS verification confirmed profile preservation, independent purchase snapshots, replay safety, role seeding and cross-user isolation inside a transaction that rolled back all fixtures. Function permissions/search path remain unchanged. All 34 local unit/SQL tests passed after filename alignment.

Vercel settings require sign-in; automatic approval review rejected that prompt because the latest approval was interpreted as database execution rather than explicit authenticated account-settings access. No sign-in occurred. Settings inspection, complete deployed acceptance and separate exact-head merge acceptance remain outstanding; no integration milestone or production launch is claimed.


## Deployment-trigger recovery — October 16, 2026 (Pacific / UTC)

The owner supplied Vercel Production and Git screenshots after explaining their GitHub sign-in could not be used in the remote browser. Production tracks main with automatic deployments/domain assignment; the Git repository is BravoKelo/Talix. This resolves settings inspection without sign-in. GitHub recovery confirmed unchanged branch heads and successful exact-head checks for 04d18c93. No dashboard settings, application code, database or merges were changed. INTEGRATION-PLAN records a proposed main-only deployment hold on both implementation branches; that protected configuration change requires explicit execution approval. Full current deployed acceptance and final baseline/merge acceptance remain separate.


### Approved main deployment hold — October 16, 2026

The owner approved the specific configuration after clarifying the broader security boundary. Identical root vercel.json files on core and onboarding set git.deploymentEnabled.main=false, preserving automatic feature previews. Main itself remains unchanged until a separately accepted merge. Existing production deployments, payment simulation, database/security permissions and dashboard settings are unchanged. Exact new heads and CI/preview results belong to Issue #10; final baseline/merge acceptance remains separate.


## Main development baseline integrated — October 16, 2026

The owner explicitly instructed merging the current work and deferring further manual testing until afterward, removing the outstanding live-acceptance gate for this early-development checkpoint. PR #2 merged foundation/core into main as 05e6db3040c4fb3b255ff38cf2f2fe87add03c8a; PR #4 then merged onboarding/Users/reconciliation as fce04b7ddc35f0505868c616dd0d3fb257571df8. The final merge tree exactly matches accepted onboarding head 432e7dd59abca5d3db8b847f061dead8c6d3f0f0, whose push/PR checks passed. All branches/history remain preserved. The approved main-only Git deployment hold is present; post-merge production listing showed no new release. No migrations, security policies, payment handling or existing business data changed. Further user testing and fixes proceed from this baseline; full fresh deployed authenticated acceptance is not claimed.


## Talix visual design batch — October 16, 2026

After testing the integrated core, the owner requested three original Talix design updates: blue/white/gold sign-in/signup; general workspace layout/navigation; storefront appearance editing. Issues #11–13 capture each request. Seven screenshots supplied the appearance workflow when video playback was unavailable. Implementation on one focused feature branch preserves existing behavior and permissions, with working previews for existing branding fields and labeled placeholders for unsupported capabilities. No new database/backend capability or merge is implied. The owner also requested routine cleanup of merged feature branches once their testing previews are replaced.


The owner subsequently extended the same design batch to the public homepage. Original Talix content and illustrations replace the old minimal landing page; current capabilities, future plans and sample billing are distinguished. This stays within Issue #11/PR #14 and changes no authentication, payments, persistence or infrastructure.


## Owner testing corrections #15–21 — October 16, 2026

Owner testing requested a return-to-top control, an alternative to mobile dropdown navigation, business logo identity, a consistent shortcut/context header, compact orders with an interactive popup, searchable settings tiles with planned-feature navigation, and reusable internal Users tabs. The owner authorized implementing this batch and reserved final merge acceptance. The same design branch contains these revisions. A minimal business-logo migration is prepared and tested, with actual development execution held for protected-boundary approval; no live database change or merge is claimed. Other UI changes retain existing workflows and permissions.


## Design and owner-review acceptance — October 16, 2026 Pacific / October 17 UTC

Owner accepted the final preview (“Looks good. lets proceed.”). PR #14 merged as 6e92e456f30c355129162f7ace1a0ae0e0613ed6, preserving reviewed head 62d17846d6d298d1a1844c03e63b2e6aa3966771, completing Issues #11–13 and #15–30. Final workflow 39006918021 passed lint, TypeScript, 48 unit/SQL tests, build and six desktop/mobile browser scenarios. Owner reported image deletion works and accepted filename display across image pickers.

Separately approved development activations are recorded as 20261017032355_business_logos, 20261017050812_readable_order_numbers_and_cancellation and 20261017050814_product_and_image_deletion. Thirteen migrations are applied; none replayed at merge. Live rolled-back SQL verification passed numbering, cancellation/payment separation, scoped product/image permissions, saved-reference protection and historical snapshots. Those checks do not claim automated live file-byte deletion.

No production release was performed; automatic main deployment remains disabled, no-mail development mode and simulated payments remain. Retain the design feature branch while the accepted testing preview depends on it; delete after replacement per owner preference. This supersedes the historical pending acceptance/execution statuses.


## Authorized repository history cleanup — October 16, 2026 Pacific

Owner requested removal of external design-reference naming from current files and historical snapshots, then explicitly authorized a history rewrite and force-push. Audited 52 reachable commits and 316 unique original file blobs across five branches; no tags. Nineteen commits were reconstructed with cleaned historical documentation, preserving their messages and parent topology; the accepted application tree was unchanged. Three older branch histories needed no changes. Mapped affected checkpoint IDs in current documentation and issue text to cleaned commits. Reconstructed commit timestamps reflect cleanup time. GitHub's retained read-only merged PR #14 head remains a known server-managed limitation, not a successful purge. Continue from current main and avoid reintroducing old design ancestry.


## Storefront phase accepted and merged — October 18, 2026

The owner accepted the reviewed application with “Everything looks good lets roll” and authorized the merge. PR #33 merged into main as bf923ca78387ae32d1a0e69cc77275f5090f9ce2, preserving feature history. Reviewed head 83526d374415d47b74b0e69f2344dca957f8a025 passed Core checks run 39157484444 (lint, TypeScript, 59 unit/SQL tests, build, and 24 desktop/mobile browser tests); its feature preview was READY.

Acceptance covers the storefront product layout, popup cart, five header presets, tabbed appearance settings, and Standard/Custom header navigation. Issues #32 and #35 are complete. The sixteen development migrations, through 20261018174618_storefront_header_navigation, were already applied and were not replayed for the merge. Earlier pending acceptance/merge statements below are historical and superseded by this record.

Automatic production deployment from main remains disabled in vercel.json; this acceptance does not release production. Retain the feature branch while its review preview is in use. Live owner-workspace saving was not independently automated; do not infer that coverage from the shopper checks. Figma recreation remains deferred until allowance is available. Deferred issues #36, #38, #40, #41, #42, and #43 remain outside this phase; demo tracking issues are not closed by this acceptance.



## Deferred batch accepted and merged — October 18, 2026 Pacific

Owner approved PR #44 at 1911ea74b0380b22f4e02eb4b87ee014ad963b34 and the linked tracking/industry proposals with “Approved.” PR #44 merged with history preserved as e77446657ee8abb276b0ff61842ceaff053255c9. Core checks 39166225703 passed lint, TypeScript, 59 unit/SQL tests, build and 26 desktop/mobile browser tests; preview was READY. Issues #36/#41/#42/#43 are accepted. No production deployment or live data/configuration change. Main deployment remains disabled; review branch retained.

The concrete design/persistence boundaries in DEFERRED-FOLLOWUP-REVIEW.md for #38/#40 are now approved for implementation and migration preparation. This supersedes proposal-only wording. Original purchases remain immutable; owner-only versioned/idempotent industry confirmation and append-only history, compatible catalog quotes, privacy-safe tracking branding and public return link are the bounded scope. No real billing, entitlement/industry modules or industry data conversion. Exact migration execution and final acceptance of the new implementation remain separate.



## October 18, 2026 — development tracking/industry activation

Owner explicitly authorized the two reviewed PR #45 migrations. Exact SQL at 68ee60d11979f9ae486770bc0b5f7f332bb229d9 applied successfully as 20261018214821 and 20261018214826, bringing development to eighteen migrations. Rolled-back live fixtures verified the principal transaction, authority, preservation and privacy boundaries. Repository filenames/exclusions align with service history. No actual demo industry conversion, merge or production release.
