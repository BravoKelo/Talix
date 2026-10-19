# Cross-platform engineering standards

Status: proposed for owner review, October 18, 2026 Pacific. Documentation only; takes effect on acceptance. Baseline: main `a0dc2b2015a715bb2a8798bcd92b6d06d9538e97`, after standards PR #47. These requirements govern new and materially changed work; they neither certify nor authorize retrofitting existing interfaces.

## Purpose and application models

**Talix must remain a device-independent SaaS platform whose core business capabilities can be accessed through supported client experiences without duplicating authoritative business logic or weakening security boundaries.**

The current priority is responsive web access on desktop/laptop, tablet and smartphone environments. An installable Progressive Web App and dedicated iOS/Android clients are future options requiring separately approved scopes. No mobile framework, separate API service, service worker, offline mode, application packaging or infrastructure is selected or authorized here.

Follow [AGENTS](../../AGENTS.md), [classification and exceptions](README.md#classification-and-exceptions), [architecture](../ARCHITECTURE.md), [ADRs](../adr/0001-shared-commerce-core.md), [security rules](saas-security.md) and [platform rules](talix-platform.md). The core must remain independent of industry implementations and client presentation technologies. Current PostgreSQL RLS/grants and checked RPCs remain authoritative. Client-independent logic does not mean extracting or rewriting the current SQL rules. Preserve client/subscription/location isolation, purchase snapshots, simulated-payment restrictions and server-side entitlements when an actual restricted feature is introduced. No entitlement engine currently exists.

Existing-website storefront links and the future Talix primary-website path remain supported directions. Prefer approved configuration/templates over per-business code forks; preserve the included-template/custom-work-fee direction in P06/P07. Full websites, domains, fees and specialized industry workflows still need their own proposals.

## Repository assessment and evidence boundary

This is a focused documentation assessment, not a repeat comprehensive audit or compliance certification. Source/configuration inspection at the baseline establishes the following:

| Capability                         | State                                          | Evidence / limitation                                                                                                                                                                                                                                |
| ---------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Current web architecture           | Implemented                                    | Next.js App Router, React, strict TypeScript; routes/components/helpers; Supabase Auth/Storage and PostgreSQL checked operations. No native project in the tracked tree.                                                                             |
| Responsive presentation            | Partially implemented/verified                 | `src/app/globals.css` contains adaptive grids, navigation and dialog rules; existing designs require compact touch-friendly controls. Orientation, zoom, soft keyboard, all routes and physical devices have not been comprehensively verified.      |
| Accessible primitives              | Partially implemented/verified                 | `order-dialog.tsx` uses native modal behavior, labels and focus restoration; form controls and image alternatives exist, with reduced-motion CSS. This does not demonstrate WCAG conformance.                                                        |
| Client contracts and authority     | Implemented, not fully verified across clients | Shared Supabase clients/types and checked SQL operations exist; future native authentication/lifecycle compatibility has not been established.                                                                                                       |
| Platform-specific integration      | Implemented only where currently needed        | Browser file/image selection, DOM measurement, cookies and modal behavior exist in UI/helpers. No camera/geolocation/push/biometric integration or general capability framework found.                                                               |
| Storage/session behavior           | Implemented, not fully cross-device verified   | Supabase SSR/browser clients handle sessions; carts/customer form state remain in component memory. Prototype localStorage is proposal-only, not production offline storage. No claim of secure native storage or cross-device cart synchronization. |
| Cross-device automation            | Partially implemented                          | `playwright.config.ts` defines desktop Chromium and a 390×844 Chromium viewport. Mobile viewport is not touch emulation or a physical-device test. CI installs Chromium only; no WebKit/Firefox or screen-reader gate.                               |
| Browser/version support commitment | Not verified / decision pending                | No approved production family/version/OS matrix found. Test coverage must not be presented as a general browser guarantee. See policy below.                                                                                                         |
| PWA/installability/offline         | Future option; not implemented                 | No tracked web app manifest, service-worker registration or offline synchronization implementation found. Responsive UI and HTTPS alone do not establish PWA readiness.                                                                              |
| Native apps/store distribution     | Future option; not implemented                 | No iOS/Android project, packaging, mobile framework or distribution workflow found. Backend reuse is direction, not a verified native client.                                                                                                        |

The October engineering audit is separately proposed in [PR #59](https://github.com/BravoKelo/Talix/pull/59); this branch does not depend on its unmerged files or change its historical 47-standard matrix. Existing audit issues remain separate. No new remediation finding or application audit is performed here.

## Browser support policy and unresolved coverage

Current evidence supports only the configured Chromium automation environments, not a production browser/version commitment. For every new user-facing feature, record the intended desktop/tablet/phone sizes, portrait/landscape behavior, browser/OS targets and input methods in its approved scope and PR evidence. Reuse established approved device requirements; do not shrink them silently. Responsive width alone is insufficient to validate touch or a mobile browser.

Before asserting production compatibility, propose a maintained support matrix for owner approval covering desktop Chrome, Edge, Firefox and Safari and mobile Safari on iOS/iPadOS and Chrome on Android, with explicit version/OS windows, review date and retirement process. These are **evaluation candidates, not adopted support promises**. Do not invent latest-N-version commitments or claim coverage for untested families. This pending decision does not waive responsive, accessibility or security requirements for currently reviewed experiences.

Prefer standards-based semantic HTML/CSS and feature detection. Progressively enhance optional capabilities; provide an accessible alternative or clear unsupported-capability message when required. Never silently degrade authorization, transactional correctness or privacy. Document any essential browser requirement and its fallback in the feature proposal. Reassess actual engine/device behavior before broadening support; no new testing vendor or dependency is required by this document.

## Classified rules 41–55

IDs X41–X55 map directly to the supplied rule numbers and do not replace A/Q/S/T/W/P identifiers. Each rule below supplies purpose, applicability, level, verification, timing and limitations. Applicable L1 violations block acceptance under the index's existing policy; L2 exceptions need explicit technical justification; L3 future guidance is not present implementation authority.

### X41 — Rule 41: Responsive design first

- **Level:** L1.
- **Purpose:** Keep supported workflows usable across device sizes.
- **Applicability:** All new or materially changed user-facing web interfaces, including settings, storefront, forms, tables and dialogs.
- **Requirement:** Use fluid/adaptive layouts, readable type/spacing, responsive navigation and data displays. Avoid unnecessary page-wide horizontal scrolling; genuinely two-dimensional data may use a labeled, operable scroll region. Support orientation changes without losing work or hiding essential actions. Preserve approved touch-friendly controls and adequate target spacing; do not make controls smaller merely to fit a breakpoint.
- **Verification:** Inspect representative approved widths, portrait/landscape, long content, text/zoom, soft-keyboard interaction and reachable pinned controls. Verify no clipped actions or unintended document overflow; record actual input/device tests.
- **Timing:** Current feature development and acceptance.
- **Exceptions / limitations:** An essential orientation constraint or two-dimensional layout needs documented rationale consistent with X44. Existing approved 48px controls remain the design baseline where applicable; this is not a universal WCAG pixel claim.

### X42 — Rule 42: Cross-browser compatibility

- **Level:** L1.
- **Purpose:** Make compatibility commitments explicit and verifiable.
- **Applicability:** Supported web journeys and any newly used browser capability.
- **Requirement:** Apply the policy above, declare actual browser/OS/version targets, use progressive enhancement and safe fallbacks. Do not infer universal browser support from Chromium tests.
- **Verification:** Run the relevant supported-engine scenarios and manual checks not covered by automation; record exact browser/OS versions and unavailable checks.
- **Timing:** During feature planning and acceptance; approve the production support matrix before making release compatibility claims.
- **Exceptions / limitations:** No fixed browser/version matrix is invented here; unresolved commitments must be surfaced in scope/release review.

### X43 — Rule 43: Multiple input methods

- **Level:** L1.
- **Purpose:** Ensure essential actions are available without a particular pointer or gesture.
- **Applicability:** Mouse, touch, keyboard and assistive-technology use of applicable workflows.
- **Requirement:** Provide semantic controls, logical focus order and keyboard alternatives. Do not rely solely on hover, drag, swipes, multipoint gestures or pointer precision; keep actions discoverable on touch.
- **Verification:** Exercise keyboard-only completion, visible focus, touch activation and appropriate assistive technology. Test menu/dialog dismissal, returning focus and alternatives to dragging.
- **Timing:** Current UI work.
- **Exceptions / limitations:** A viewport resize alone does not demonstrate touch or assistive-technology support.

### X44 — Rule 44: Accessibility target

Detailed requirements: [accessibility engineering standard AC01–AC16](accessibility.md), including manual verification, shared controls and exception handling.

- **Level:** L1.
- **Purpose:** Make WCAG 2.2 Level AA the target for applicable web interfaces.
- **Applicability:** New and materially changed web pages and complete affected workflows, including configurable presentation.
- **Requirement:** Use semantic structure, labels/names/roles, meaningful image alternatives, keyboard navigation, visible unobscured focus, accessible forms/errors/status messages, sufficient text/non-text contrast, reflow/zoom and appropriate reduced-motion behavior. Branding choices must preserve accessible results.
- **Verification:** Review applicable WCAG A/AA criteria; combine suitable automated checks with keyboard, screen-reader, contrast, zoom/reflow and manual interaction checks. Record tested scope, exceptions and remaining gaps.
- **Timing:** Target applies to current applicable work; remediation of existing unrelated interfaces requires separate scope.
- **Exceptions / limitations:** Target is not verified conformance or legal certification. The normative WCAG criteria and their exceptions govern; existing larger touch targets are not to be reduced to a technical minimum.

### X45 — Rule 45: Device-independent business logic

- **Level:** L1.
- **Purpose:** Keep critical rules consistent across clients.
- **Applicability:** Tenant ownership, authorization, introduced entitlements, protected validation and transactions.
- **Requirement:** Keep authority on the server/database and reuse the existing checked operations. UI validation is guidance; desktop, mobile web and any future app must not fork authoritative pricing, permissions or transaction rules.
- **Verification:** Inspect trust boundaries and run appropriate negative authorization/tenant/transaction cases through affected contracts; compare outcomes across actual supported clients.
- **Timing:** Current changes and every future client.
- **Exceptions / limitations:** Preserves the SQL/RLS architecture; no new business service or entitlement engine authorized.

### X46 — Rule 46: Stable client contracts

- **Level:** L2.
- **Purpose:** Permit additional clients without duplicating core rules.
- **Applicability:** Existing and introduced secure backend contracts with actual consumers.
- **Requirement:** Specify request/response shapes, identity, permission checks, validation, errors, retries and compatibility. Version when a demonstrated breaking change requires it; keep business operations independent of browser presentation.
- **Verification:** Contract/consumer tests and S09 review, including stale client behavior and denial cases for affected boundaries.
- **Timing:** When changing a contract or approving a new consumer.
- **Exceptions / limitations:** Existing RPCs may suffice; no REST/GraphQL layer or blanket versioning framework required. L1 security/integrity rules remain mandatory.

### X47 — Rule 47: Adaptive performance

- **Level:** L2.
- **Purpose:** Make supported workflows usable on less capable devices and constrained networks.
- **Applicability:** Assets, rendering, list queries and network-dependent web interactions.
- **Requirement:** Use appropriate asset sizes/image delivery, bounded data access/pagination, avoid unnecessary requests/rendering and provide loading/error/retry states. Preserve user input and distinguish unknown transaction outcomes from confirmed failure.
- **Verification:** Measure representative supported mobile/desktop journeys and constrained-network conditions using a recorded method; assess request/payload/render cost and recovery.
- **Timing:** Normal affected feature review; performance targets require an approved methodology.
- **Exceptions / limitations:** No arbitrary SLA, mandated image service or performance infrastructure; static image dimensions alone do not prove optimized delivery. S08/Q04 still govern correctness.

### X48 — Rule 48: Platform capability isolation

- **Level:** L2.
- **Purpose:** Prevent device features from controlling shared business rules.
- **Applicability:** Actual camera, location, notifications, files, storage, biometrics, native share or similar integrations.
- **Requirement:** Keep permission requests, capability detection, provider-specific handling and unavailable/denied states at narrow justified boundaries; use established helpers where appropriate.
- **Verification:** Review consumers and test capability absent, permission denied/revoked, cancellation and fallback; preserve ordinary workflows.
- **Timing:** Only when a capability is approved and used.
- **Exceptions / limitations:** No speculative adapter registry, permission request, native bridge or capability framework.

### X49 — Rule 49: Secure client storage

- **Level:** L1.
- **Purpose:** Protect credentials and tenant data across clients and device loss.
- **Applicability:** Current browser sessions/data and any separately approved future client persistence.
- **Requirement:** Use the approved authentication mechanism; do not copy tokens, private tracking links or customer/tenant data into ad hoc localStorage, caches, logs or artifacts. Classify persisted data, access, tenant/account separation, retention and cleanup on logout/account switch. Review personalized cache boundaries, device loss and session revocation.
- **Verification:** Inspect actual persisted values/caches and auth SDK behavior; test tenant/account switch, logout and back-navigation on affected clients. Never report an SDK storage choice safe without review.
- **Timing:** Current affected storage changes; future storage proposals before implementation.
- **Exceptions / limitations:** Does not change Supabase session transport now or demand removal of unrelated existing storage. Native secure storage and cache controls need their own approved design.

### X50 — Rule 50: Cross-device session management

- **Level:** L1.
- **Purpose:** Keep identity and sensitive operations consistent through client lifecycle changes.
- **Applicability:** Session expiry, refresh, revocation, logout, multi-tab/device use and sensitive actions.
- **Requirement:** Preserve authoritative identity checks, prevent token leakage and stale access, and define client state after expiry/revocation. Consider shared devices, sleep/resume, account switch and risk-appropriate reauthentication. Do not assume logging out one device revokes all others.
- **Verification:** Test actual service/session behavior where relevant: expired access/refresh tokens, revoked permission, refresh-cookie persistence, multiple tabs/devices and safe return/recovery. Distinguish mock results from deployed evidence.
- **Timing:** Current affected auth work and future-client approval.
- **Exceptions / limitations:** No new session duration, global logout or reauthentication policy selected; changes require protected-boundary approval. Existing audit session findings are not resolved by prose.

### X51 — Rule 51: PWA readiness

- **Level:** L2.
- **Purpose:** Preserve practical installable-web options without premature implementation.
- **Applicability:** Boundary review for affected web changes; detailed requirements only for an approved PWA scope.
- **Requirement:** Avoid unnecessary browser-tab assumptions at shared business boundaries. A future proposal must evaluate manifest/icons, installability, secure context, standalone behavior, browser differences, optional service-worker lifecycle, updates and public/private cache boundaries.
- **Verification:** Review actual requirements and compatibility; if PWA is approved, verify install/update/standalone and failure behavior on named target browsers.
- **Timing:** Readiness review now; functionality only after separate approval.
- **Exceptions / limitations:** No service worker or offline requirement solely for readiness. Responsive design and HTTPS alone are not an installability guarantee.

### X52 — Rule 52: Offline behavior and synchronization

- **Level:** L3.
- **Purpose:** Make any optional offline feature safe and explicit.
- **Applicability:** Only future approved offline operations.
- **Requirement:** Define allowed offline reads/writes, secure local persistence and tenant partitioning, synchronization/conflict rules, idempotent retry/backoff, unknown outcomes and reconciliation. Revalidate current permissions, subscriptions and authoritative prices on reconnect; cached authority cannot permit protected writes.
- **Verification:** Test loss/recovery, duplicates, conflicts, expiry/revocation, tenant switch and cache cleanup in the separately approved scope.
- **Timing:** Future option; no current feature must become offline-capable.
- **Exceptions / limitations:** No queue, offline checkout or sync engine authorized. When introduced, applicable S01/S02/S06/S08/S11 remain L1.

### X53 — Rule 53: Native mobile readiness

- **Level:** L2.
- **Purpose:** Reuse authoritative backend capabilities for potential iOS/Android clients.
- **Applicability:** New-client boundary decisions and contracts touched by current approved work.
- **Requirement:** Keep presentation platform-specific and business authority shared. A future scope must cover secure authentication, foreground/background/resume/deep-link behavior, device integrations, compatibility with older clients and upgrade/recovery paths.
- **Verification:** Review backend consumers and lifecycle/security compatibility with the actual proposed client; test affected invariants rather than assume web parity.
- **Timing:** Preserve reasonable boundaries now; native implementation only after approval.
- **Exceptions / limitations:** No React Native, Flutter, Capacitor, native framework or shared-UI mandate. No guarantee that current Auth/configuration already supports native clients.

### X54 — Rule 54: Cross-platform verification

- **Level:** L1.
- **Purpose:** Match evidence to supported client risks.
- **Applicability:** Every new/materially changed user journey.
- **Requirement:** Use risk-based responsive/browser, touch/keyboard, accessibility, session/authorization, regression and relevant network/device failure checks. Record which tests are automated, manual, emulated or physical and what remains unverified.
- **Verification:** Use the verification plan below and T01–T04. An unavailable required check needs alternative evidence and explicit acceptance of the remaining limit under existing governance.
- **Timing:** Current feature acceptance and future-client scopes.
- **Exceptions / limitations:** No required device farm, new vendor or automated full accessibility certification; no assumption that viewport emulation equals a phone.

### X55 — Rule 55: Distribution and platform compliance

- **Level:** L3.
- **Purpose:** Make any future app-store release a reviewed product/operational decision.
- **Applicability:** Only approved Apple App Store or Google Play distribution.
- **Requirement:** Review then-current official store rules: privacy disclosures, requested permissions, security, account/deletion/subscription policies, review requirements, signing, release/update/rollback management and applicable billing rules. Record date and applicability; never assume policies stay fixed.
- **Verification:** Use current primary platform documentation and a release checklist for the actual app/business model; review store submissions and operational controls.
- **Timing:** Future distribution planning and each material release/policy change.
- **Exceptions / limitations:** No store account, submission, packaging, policy certification or billing change authorized. Native/store policies are not an immediate web implementation requirement.

## Verification plan and security review

Use existing [testing/workflow rules](testing-and-workflow.md), not a parallel release process. Automation should cover deterministic affected workflows, responsive overflow/navigation assertions, form errors, dialog keyboard/focus, negative permissions and relevant retry contracts. Add browser-engine/device-emulation checks only where the supported scope justifies them and any tooling changes are approved. Pure viewport tests must be labeled as such.

Manual review supplies evidence automation cannot establish: physical touch and soft keyboard where required, orientation/zoom/reflow, screen-reader announcements, focus visibility/return, contrast in configurable branding and supported browser/device behavior. A suitable browser accessibility tool can supplement this; no new dependency or audit service is selected. Risk determines representative device coverage; record exact environment and remaining gaps before acceptance.

Cross-client security review must cover tenant/account switching, public versus personalized caching, token/link leakage, logout/revocation, stale permissions and uncertain transaction outcomes. Future client contracts must not bypass SQL authority through device identity, user metadata or cached roles. Background/offline work, if approved later, inherits the same security and idempotency requirements. Native apps may use secure platform credential facilities only through a separately reviewed auth design.

Apply the [dedicated accessibility standard](accessibility.md) for detailed acceptance and the risk-based manual/automated matrix. For future audits, use the [cross-platform audit checklist](cross-platform-audit.md). Report current defects separately from unimplemented optional capabilities; do not classify absence of PWA/native/offline functionality as a current violation.

## Source references and open decisions

- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) is the accessibility target; applicable A/AA criteria and normative exceptions govern. This is a target, not a claim that Talix has passed a conformance audit.
- [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) helps assess input usability; Talix's already approved larger controls remain design constraints where applicable.
- Repository evidence: `playwright.config.ts`, `.github/workflows/ci.yml`, `src/app/globals.css`, `src/components/order-dialog.tsx`, `src/components/product-image.tsx`, `src/lib/supabase/` and [architecture](../ARCHITECTURE.md). Assessment is static; no application tests, migrations, live service calls or device tests were executed for this documentation change.

No architectural conflict was found. Remaining decisions: approve these standards; define the browser/OS/version and representative physical-device support matrix before production compatibility claims; approve feature-specific verification environments and measured performance targets when needed. PWA/native/offline/distribution, their frameworks and infrastructure, and any changes to authentication/session/entitlement boundaries remain separate future decisions. Approval of these standards does not authorize them.
