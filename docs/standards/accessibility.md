# Accessibility engineering standard

Status: Accepted by the owner and merged through [PR #61](https://github.com/BravoKelo/Talix/pull/61) on October 18, 2026 Pacific. Reviewed head `6bb42acf0ce4845d915fedcd4189d6bde299cd19`; merge `a1499537e2269608799c336e225fb7a0ab8a7b92`; Core checks run 39203796995 passed. This supersedes proposal/pending-acceptance wording below. Adoption governs applicable future work; it does not certify existing compliance or authorize implementation, new infrastructure, remediation, migration execution or production release.

Historical proposal context: proposed for owner review, October 18, 2026 Pacific; extension of documentation scope #60 and PR #61. No implementation, audit, dependency, CI or merge authorization. See [governance and exceptions](README.md#classification-and-exceptions), [cross-platform rules X41–X55](cross-platform.md), [Q07](architecture-and-code.md), [testing/workflow](testing-and-workflow.md) and [platform constraints](talix-platform.md).

## Target, scope and authority

**WCAG 2.2 Level AA is the engineering target for applicable Talix web interfaces.** Evaluate applicable Level A and AA success criteria, including complete affected processes, rather than treating this practical checklist as an exhaustive replacement for WCAG. A target does not demonstrate conformance, certify the current application or determine legal compliance.

This applies to new and materially changed business administration, storefront, owner onboarding, customer and subscription workflows, and Talix-hosted websites when approved/implemented. Future supported native clients need platform-appropriate accessibility criteria in their separately approved scope; WCAG web techniques are not a substitute for native accessibility review. Existing unrelated defects require bounded remediation approval. No full website builder, industry workflow, real payment UI, native app or PWA is introduced by these standards.

Preserve approved designs and business boundaries. Configurable themes/templates must maintain accessible output; do not treat a business's branding choice as permission to make essential content inaccessible. Keep core rules, tenant isolation, entitlement checks and transaction authority on the server/database regardless of input method or client. Accessibility changes cannot weaken those controls.

Current repository evidence is partial: native modal use, focus restoration, semantic controls, labels/image alternatives, responsive CSS and some reduced-motion handling exist. Playwright uses desktop and narrow-viewport Chromium; no dedicated axe dependency or accessibility CI gate is configured. No comprehensive keyboard/screen-reader/contrast/device audit was performed for this documentation update. See the [focused assessment](cross-platform.md#repository-assessment-and-evidence-boundary). Absence of an automated tool is not evidence that a screen is inaccessible, and tool success alone cannot prove conformance.

## Classified requirements

AC01–AC16 are new, non-conflicting identifiers implementing X44 in detail. Each entry states purpose, applicability, enforcement, verification, timing and limitations. L1 rules apply to affected current work; L2 supports consistency and regression prevention. Future-only native/packaging/optional integrations remain guidance under X51–X55 until separately approved, not immediate work.

### AC01 — Accessibility target and acceptance (L1)

**Purpose/applicability:** Make accessibility testable for applicable new/changed web interfaces and complete affected journeys. **Requirement:** Map relevant WCAG 2.2 A/AA criteria to feature acceptance, including dependencies and shared controls, and distinguish target, tested evidence and remaining gaps. **Verification:** Review criteria mapping, actual checks and limits before acceptance. **Timing:** Scope/design and acceptance of affected work. **Limitations:** No retrospective certification, automatic legal claim or authority to remediate unrelated pages; unresolved material gaps follow AC15.

### AC02 — Semantic structure (L1)

**Purpose/applicability:** Give web content predictable meaning for browsers and assistive technologies. **Requirement:** Use a meaningful heading hierarchy, landmarks and named navigation regions; native buttons for actions and links for navigation; explicit form labels; semantic lists; proper table headers/captions/associations; appropriately named dialogs. Avoid clickable non-controls or replacing simple semantics with custom widgets. **Verification:** Inspect rendered structure/accessibility tree and names/roles; check heading/landmark/table navigation with assistive technology for affected structures. **Timing:** UI construction/review. **Limitations:** Use custom patterns only when justified and their keyboard/name/state behavior is verified; ARIA cannot repair an incorrect interaction model by itself.

### AC03 — Keyboard and focus (L1)

**Purpose/applicability:** Complete essential workflows without a mouse. **Requirement:** Logical tab order, visible unobscured focus, keyboard-operable actions, no traps, no positive-tabindex ordering workaround, and a way to bypass repeated navigation where applicable. Dialogs receive sensible initial focus, contain modal interaction, offer keyboard dismissal consistent with safe transaction state, and restore focus predictably. Do not let sticky/collapsing headers obscure the focused control. **Verification:** Keyboard-only end-to-end completion, forward/backward tabbing, dialog open/close/Escape, focus return, menu/tab controls and sticky-header scrolling. **Timing:** Current affected UI acceptance. **Limitations:** Use the proper keyboard pattern for the actual widget; a native dialog alone does not prove correct focus in every consumer.

### AC04 — Screen-reader names, states and announcements (L1)

**Purpose/applicability:** Make controls and changing content understandable without visual context. **Requirement:** Accurate accessible names, roles, current/expanded/selected/invalid states, associated field instructions/errors, named dialogs and navigation landmarks. Expose important status/error/loading updates through suitable semantics or live regions without announcing every render. Prefer native semantics; avoid redundant ARIA, hidden interactive controls and conflicting labels. **Verification:** Inspect names/states and test relevant screen-reader/browser combinations, including dialog announcements and async updates. **Timing:** Affected UI acceptance. **Limitations:** Accessibility-tree inspection supplements rather than replaces screen-reader use; document the tested combination.

### AC05 — Visual presentation, reflow and motion (L1)

**Purpose/applicability:** Keep information usable at differing vision, zoom and motion needs, including branding/appearance settings. **Requirement:** Meet applicable WCAG text and non-text contrast criteria; do not convey important state with color alone. Preserve legible typography, text resizing/spacing, zoom and responsive reflow without lost content/actions. Provide meaningful alternatives for images and applicable media. Respect reduced-motion preferences for nonessential motion and applicable pause/stop/flash criteria. **Verification:** Measure actual foreground/background combinations and interactive states, test text/spacing/zoom/reflow and reduced-motion settings on affected views. **Timing:** Design and affected visual changes. **Limitations:** Normative contrast/resize exceptions govern; no invented contrast shortcut. Do not claim all animation must be removed or that this section substitutes for applicable media criteria.

### AC06 — Touch and mobile interaction (L1)

**Purpose/applicability:** Make supported tablet/phone and mixed-input experiences operable. **Requirement:** Adequate target size/spacing, usable mobile navigation/forms, no precision-only controls, and alternatives to dragging or complex gestures. Support portrait/landscape unless an essential constraint is documented. Preserve keyboard alternatives on touch-capable devices and accessible mobile screen-reader interaction. **Verification:** Appropriate physical touch/soft-keyboard and mobile screen-reader checks, orientation changes and target/spacing inspection; label emulator evidence separately. **Timing:** Affected supported mobile/tablet UI. **Limitations:** Retain existing approved 48px controls where applicable; WCAG target-size exceptions and larger Talix design targets are distinct. Do not infer real touch support from viewport dimensions.

### AC07 — Forms, authentication and validation (L1)

**Purpose/applicability:** Complete forms, sign-in and multi-step onboarding independently. **Requirement:** Persistent input labels, understandable required-field indicators, appropriate autocomplete/input-purpose semantics, relevant instructions and actionable field-associated errors. Provide an accessible error summary for multi-error/complex forms with a way to reach the fields; announce success and preserve valid input after errors. Make step/progress changes clear and manage focus predictably. Support password managers/paste and accessible authentication methods; avoid unnecessary cognitive-function tests without the applicable accessible alternative. **Verification:** Keyboard and screen-reader completion for empty, invalid, server-denied, corrected and successful submissions; check summary links/associations, autocomplete and step recovery. **Timing:** Affected form acceptance. **Limitations:** No Auth architecture or provider behavior change authorized; do not introduce a security bypass or mark an unknown save as successful.

### AC08 — Dynamic interfaces (L1)

**Purpose/applicability:** Keep changing UI predictable. **Requirement:** Use correct patterns for modal dialogs, dropdowns, popovers, expandable sections, tabs, toasts, loading/async content, interactive tables, search and pagination. Communicate selected/expanded/busy/result states; keep context and focus unless an intentional, announced transition warrants a move. Error/success information must remain discoverable, not disappear solely in a brief toast. **Verification:** Test keyboard, screen-reader state changes and focus through open/close, loading/empty/error, search results and page changes. **Timing:** New/changed dynamic controls. **Limitations:** Navigation styled like tabs need not adopt an ARIA tablist unless it actually implements that widget's behavior; reuse appropriate existing primitives.

### AC09 — Commerce and protected transactions (L1)

**Purpose/applicability:** Preserve independent access to implemented/approved product browsing/configuration, cart, checkout, confirmation, order management and subscription management; real payment forms only if approved later. **Requirement:** Product/option/quantity controls, prices, totals, validation, confirmations and outcomes must be accessible and understandable. Apply relevant review/correction/error-prevention requirements before financial/data commitments. Busy/disabled states and uncertain outcomes must remain understandable with a safe retry/recovery path. **Verification:** Complete affected critical flows by keyboard and screen reader, including validation, declined simulated payment, unavailable options, server denial and interrupted/unknown outcomes where relevant. **Timing:** Critical-workflow acceptance and regressions. **Limitations:** Accessibility changes do not authorize new payment features, change simulation, bypass authoritative checks or defeat idempotency.

### AC10 — Dashboards and data visualization (L1)

**Purpose/applicability:** Expose meaningful information in implemented/approved charts, graphs, dashboards and complex data displays. **Requirement:** Descriptive labels, meaningful status text, non-color distinctions and an equivalent accessible summary/data table or other appropriate alternative for important information. Interactive exploration needs keyboard-operable controls and understandable results. Tables need header relationships and responsive access without losing values. **Verification:** Compare visual findings with the accessible alternative and complete relevant keyboard/screen-reader tasks. **Timing:** When introducing/changing such displays. **Limitations:** Does not require implementing charts or duplicating decorative content; no charting dependency selected.

### AC11 — Shared components (L2)

**Purpose/applicability:** Make accessible defaults reusable in actual shared components. **Requirement:** Prefer existing appropriate dialog, form, navigation, image and control primitives. Keep keyboard/focus/name/state behavior in the shared owner where practical and document consumer responsibilities, rather than repeating fixes per screen. **Verification:** Component behavior tests plus at least representative consumer checks for changed behavior; confirm overrides preserve accessibility. **Timing:** Shared-component or consumer work. **Limitations:** No blanket component rewrite; L1 user outcomes still apply even when reuse is inappropriate.

### AC12 — Automated accessibility strategy (L2)

**Purpose/applicability:** Catch repeatable structural regressions efficiently. **Requirement:** Use existing browser assertions for names/roles, labels, errors, focus, modal behavior and responsive structure. Evaluate axe-core or an equivalent scanner only after reviewing compatibility, maintenance, result handling and an approved dependency/CI scope. Candidate future gates include critical-page scans, shared-control checks and focused accessibility assertions for transactions. **Verification:** Review what each check covers, actual results, false positives and unresolved findings; never suppress errors merely to pass. **Timing:** Add suitable checks within approved feature/test scope; broader tooling only after separate approval. **Limitations:** No scanner installed, CI changed or automated WCAG gate claimed here. Scan success is not conformance.

### AC13 — Manual verification (L1)

**Purpose/applicability:** Validate behavior automation cannot establish for supported workflows. **Requirement:** Automated testing alone is insufficient. Use the risk matrix below for keyboard-only operation, screen readers, focus, zoom/reflow, mobile touch/forms and critical transactions. Record environment, scope and observed results. **Verification:** Actual manual execution or explicit unavailable-check disposition under existing governance. **Timing:** Affected feature acceptance, scaled to risk. **Limitations:** No device farm or universal assistive-technology matrix mandated; emulation and prior results cannot be silently relabeled as current physical/manual evidence.

### AC14 — Regression prevention (L2)

**Purpose/applicability:** Preserve accessible behavior over time. **Requirement:** Include accessibility in relevant acceptance criteria and protect shared components and critical journeys with appropriate outcome tests/manual checks. Recheck affected consumers after changes to markup, styling, themes, async logic or focus. **Verification:** Review relevant regression cases, actual pass/fail results and remaining manual coverage. **Timing:** Every affected feature/change. **Limitations:** Avoid implementation-mirroring tests or redundant infrastructure; required verification remains L1 through T01/X54/AC13.

### AC15 — Exceptions and remediation (L1)

**Purpose/applicability:** Keep gaps visible and temporary. **Requirement:** Follow the process below for any material accessibility exception, missing required check or discovered defect affecting acceptance; preserve existing L1 authority. **Verification:** Review the explicit disposition, mitigation, responsible owner, priority and dated follow-up/reassessment. **Timing:** Before acceptance of affected work and on the scheduled review. **Limitations:** An exception record is not an automatic waiver, retrospective certification or remediation authorization; it cannot silently become permanent.

### AC16 — Claims and legal review (L2)

**Purpose/applicability:** Keep accessibility statements accurate for actual services/customers. **Requirement:** Distinguish engineering targets, scoped technical conformance evidence and legal compliance determinations. State tested scope, date, limitations and outstanding issues. Applicable obligations can depend on jurisdiction, service and customer commitments; obtain separate qualified review when a legal determination is needed. **Verification:** Review claims against actual evidence and the applicable separately reviewed obligations. **Timing:** External claims, contracts or release/compliance review. **Limitations:** This document gives no jurisdiction-specific legal conclusion or blanket compliance promise; native/store rules require review when pursued.

## Practical verification matrix

Select actual browser/OS/screen-reader/device combinations with the supported-environment decision in X42. No fixed family/version guarantee is invented here. Record whether a check is automated, manual, emulated or physical; report unavailable environments and acceptance limits. The matrix defines a risk-based method, not evidence that these checks have already run.

| Changed area / risk                            | Automated evidence where suitable                                                                                     | Required manual evidence proportionate to affected behavior                                                                                                |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Simple content, theme or layout                | Rendered names/structure, image alternatives, responsive overflow and appropriate deterministic checks                | Contrast including states/configuration, readable zoom/reflow/spacing, keyboard/focus; screen-reader reading order for structural changes.                 |
| Shared dialog/menu/tab/form component          | Role/name/state, focus open/close/return, keyboard alternatives, form error associations and representative consumers | Keyboard-only interaction, screen-reader announcements/states, focus visible/not obscured; mobile/soft keyboard if affected.                               |
| Onboarding/authentication/settings             | Validation/summary links, save/error/step state, negative permission and appropriate session regressions              | Complete keyboard/screen-reader flow including multi-error correction, success, expiry/denial and input preservation; touch/zoom for supported mobile use. |
| Storefront/cart/order/subscription transaction | Critical success/failure paths, option/quantity/totals labels, confirmation, unknown-response/retry invariants        | End-to-end keyboard and screen-reader tasks; mobile touch/cart/dialog/form behavior; understandable simulated outcomes and recovery.                       |
| Data displays/search/pagination                | Header/state/label and result-count/empty/error checks                                                                | Equivalent summary/table, keyboard exploration and screen-reader context after updates; responsive data access.                                            |
| Approved future platform capability            | Capability-denied/unavailable/revoked and lifecycle tests                                                             | Platform-appropriate assistive technology, device behavior and accessible fallback, only when that scope is approved.                                      |

A PR should record applicable AC/X IDs, criteria/complete-flow scope, actual environments, commands or manual steps and results, unresolved defects and explicit acceptance limits. Source inspection and DOM assertions cannot replace the manual behavior they do not test. Shared primitive conformance alone does not certify a full page or workflow.

## Exception and remediation record

For a requested exception or unavailable required check, record: affected functionality and users; standard ID and relevant WCAG criterion; current versus future applicability; user impact; reason; mitigation or accessible alternative; responsible owner; severity/priority; target remediation or reassessment date; reviewer/owner disposition; and evidence needed for closure. Set a review date and prevent renewal by silence. If a defect is discovered, document it for the separately authorized review/remediation process; this documentation task does not create remediation issues.

Under the existing index, applicable L1 violations block approval/merge. A recorded mitigation or pending test does not itself waive that rule. Any proposed replacement of a protected requirement requires the established explicit owner decision and documented governing change, and cannot weaken tenant isolation/authority. L2 departures require the existing technical justification. Surface unresolved material accessibility barriers before acceptance; do not independently expand scope into unapproved redesign or implementation.

## References and future audit use

- [WCAG 2.2 W3C Recommendation](https://www.w3.org/TR/WCAG22/) — normative A/AA criteria and conformance requirements, including relevant exceptions.
- [WAI accessibility evaluation guidance](https://www.w3.org/WAI/test-evaluate/) — evaluation combines tools and human review.
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) — widget patterns inform justified custom controls; native HTML is preferred when suitable.
- [Future cross-platform/accessibility audit checklist](cross-platform-audit.md) — assess actual compliance and limitations separately from optional future readiness; no repeat audit authorized here.

No architecture or framework decision changes. Future platform-specific accessibility, store requirements, tooling, browser/assistive-technology support coverage and formal compliance/legal assessments remain separately scoped decisions. No current WCAG conformance or legal compliance claim is made.
