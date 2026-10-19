# Engineering standards

Status: accepted by the owner and merged through PR #47 on October 18, 2026 Pacific. These standards govern new and materially changed work; they do not certify the existing codebase or authorize retrofits.

Read [AGENTS.md](../../AGENTS.md) first, then the relevant standards below. [Architecture](../ARCHITECTURE.md), [accepted ADRs](../adr/0001-shared-commerce-core.md), [product vision](../PRODUCT-VISION.md), and [product design](../PRODUCT-DESIGN.md) retain their existing ownership. A conflict with an accepted decision must be surfaced before implementation; these documents do not silently supersede it.

| Document                                                  | Scope                                                                 |
| --------------------------------------------------------- | --------------------------------------------------------------------- |
| [Architecture and code quality](architecture-and-code.md) | Responsibilities, dependencies, naming, types, errors and refactoring |
| [SaaS security and reliability](saas-security.md)         | Tenancy, authorization, contracts, integrity, retries and operations  |
| [Testing and workflow](testing-and-workflow.md)           | Evidence, review, CI, deployment and decision records                 |
| [Talix platform rules](talix-platform.md)                 | Core/industry separation, future entitlements and website direction   |
| [Assessment and follow-ups](assessment.md)                | Verified baseline, tooling gaps and unresolved decisions              |

## Cross-platform extension under review

[Cross-platform standards](cross-platform.md) add X41–X55 (attachment rules 41–55), with current web requirements and separately gated future PWA/native/offline/distribution guidance. [Future audit checklist](cross-platform-audit.md) defines assessment evidence. This extension is proposed for review; the previously accepted 47 rules retain their IDs and status. [Accessibility standards](accessibility.md) add AC01–AC16 for semantic, keyboard, screen-reader, visual, form/transaction and verification requirements, with documented temporary-gap handling. No PWA/native implementation or retrofit is authorized.

## Integration readiness extension under review

[Integration standards](integrations.md) add I56–I70 for contracts, provider boundaries, credentials, tenant/entitlement authority, lifecycle, events/sync, resilience, quotas, privacy and verification. I70 is future developer-ecosystem guidance. The owner requested this addition before merging the same documentation PR; cross-platform/accessibility references are included together. No connector, framework, new API or integration infrastructure is authorized.

## Operational and lifecycle extension under review

[Operational readiness O01–O08](operational-readiness.md) covers diagnostics/incidents, backup/restore/continuity, release/recovery and performance/capacity. [Business lifecycle B01–B08](business-lifecycle.md) covers data portability/offboarding, provisioning/ownership, subscription/billing boundaries and administration/auditability. [Definition of Done D01–D04](definition-of-done.md) records applicability, exact evidence, deferrals, review and approval. These extend the same pending documentation PR, not a new operational architecture. Advanced tooling/automation stays future guidance; no application or operational change authorized.

## Classification and exceptions

Every rule below has an ID, level, purpose, applicability and enforcement expectation. “Review” means a human/agent review gate, not an automated repository check.

- **L1 Mandatory:** security, isolation, authorization, correctness, critical boundaries and required validation. Applicable violations block approval/merge. Do not waive tenant isolation or unauthorized access. A proposed change to a protected boundary requires prior owner approval and a documented replacement decision; an exception cannot silently remove the invariant. An unavailable check must be reported, with alternative evidence and explicit acceptance of any remaining verification limit before merge.
- **L2 Strongly enforced:** maintainability, typing, naming and interface consistency. Exceptions require explicit technical justification in the PR: rule ID, affected scope, reason, risk, alternative and follow-up when needed. Reviewers assess it; owner approval is required only if it crosses an existing protected boundary.
- **L3 Guidance:** contextual tradeoffs. Record material departures where they affect review; do not require permission for routine design choices inside approved scope.

Exceptions are scoped to the reviewed change, not blanket precedents. Existing violations are findings, not retroactive permission to rewrite unrelated code. Never add a suppression merely to make a check green. No automatic formatter gate, module-boundary linter or entitlement engine is introduced by this documentation.
