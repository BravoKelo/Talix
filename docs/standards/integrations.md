# Integration readiness engineering standards

Status: proposed for owner review, October 18, 2026 Pacific. Owner requested this extension before merging the pending documentation in scope #60 / PR #61. It is included in the same focused documentation branch so cross-platform/accessibility references resolve without depending on unmerged files from another branch. The original standards PR #47 is merged; approved main remains `a0dc2b2015a715bb2a8798bcd92b6d06d9538e97`. No implementation or merge authorization.

## Purpose and governing principle

**External integrations must extend Talix through controlled, secure, and maintainable contracts without introducing unnecessary dependencies into the core platform or compromising tenant isolation, subscription enforcement, data integrity, or operational reliability.**

Preserve [AGENTS](../../AGENTS.md), [architecture](../ARCHITECTURE.md), [ADRs](../adr/0001-shared-commerce-core.md), [security/reliability](saas-security.md), [platform rules](talix-platform.md), [cross-platform standards](cross-platform.md), [accessibility](accessibility.md) and [testing/workflow](testing-and-workflow.md). These rules complement S01–S14, P01–P09 and X45/X46; they do not replace their authorities or create new APIs, services or persistence.

Keep provider-specific mapping/authentication within justified boundaries. Existing Next.js/Supabase/Vercel choices are accepted dependencies, not a requirement to replace them with generic services. Do not mandate a plugin system, marketplace, event bus, universal adapter, microservices, queues or centralized integration framework. Build the minimum adequate boundary for an actual approved integration. Industry-specific integrations belong at the appropriate industry boundary and must not unnecessarily affect generic storefront/core behavior. Existing-site links and the future Talix primary-website/configurable-template path must remain viable. No website product, industry module or entitlement engine is implemented by prose.

## Focused repository assessment

Static inspection of relevant source, dependencies, tests and architecture at approved main supplies the following context. This is not a fresh comprehensive audit, live-service validation or provider certification. The pending prior audit PR #59 and issues #48–#58 remain separate evidence; its findings are not remediated here.

| Capability                                                                     | Classification                                              | Actual evidence / limit                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase Auth/Storage/database clients                                         | Implemented but not fully verified live                     | `src/lib/supabase/client.ts`, `server.ts`, proxy and auth callback; SQL grants/RLS/checked RPCs govern authority. Publishable keys are public configuration, not privileged credentials. No service-role key is part of the application. |
| Internal business contracts                                                    | Implemented but not fully verified across external clients  | Browser/server operations use existing database/RPC contracts; checkout/quote/refund/industry changes validate authority, prices and retry state. A checked public catalog/checkout RPC is not a general third-party developer API.      |
| Website storefront integration                                                 | Implemented but not fully verified for every target website | Linkable storefront and configurable navigation exist. Embedding, automatic header synchronization and a full Talix website product are not established.                                                                                 |
| Provider-specific commerce/payment/accounting connectors                       | Future possibility                                          | No processor SDK, accounting connector or provider webhook implementation found in the inspected application/dependency inventory; payments remain simulated. No connection lifecycle/credential vault is claimed.                       |
| Webhook handling, provider sync/reconciliation and background integration jobs | Future possibility                                          | No approved provider event ingestion/sync worker/queue in current architecture; absent mechanisms are not current defects.                                                                                                               |
| Integration-restricted entitlements                                            | Future possibility                                          | Data-driven offerings and checked subscription changes exist, but no centralized restricted-feature entitlement engine or integration eligibility mechanism is implemented. P03 applies when an actual restricted feature is introduced. |
| Error/retry/diagnostic foundation                                              | Partially implemented                                       | UI feedback and SQL request/version/locking rules exist. No full provider timeout/backoff/rate-limit/operational telemetry implementation or proof is claimed.                                                                           |
| Integration test foundation                                                    | Partially implemented                                       | Vitest/PGlite and Playwright local SQL gateway cover Talix outcomes; mock Auth/Storage and sequential retries do not certify live provider behavior, signatures or independent concurrent sessions. No provider sandbox suite found.     |
| Production credential/recovery and provider configuration                      | Not verified                                                | No live secret-store inspection, rotation/revocation drill, provider configuration query or production test performed for this documentation scope.                                                                                      |
| Public developer ecosystem                                                     | Future possibility                                          | No general developer authentication, consent, portal, marketplace or public API support commitment established.                                                                                                                          |

Documentation gaps concern explicit connection lifecycle, provider failures/quotas, credential ownership, synchronization and integration-specific verification. The new rules define these only when applicable; they do not invent current capabilities. Existing core and simulation decisions remain authoritative. No architectural conflict was identified.

## Rules 56–70 and classification

I56–I70 map to the supplied rule numbers without colliding with existing A/Q/S/T/W/P/X/AC IDs. Each rule defines purpose, applicability, enforcement, verification, timing and limits. Rule-specific classification is used: I56 remains L1 for applicable isolation requirements as explicitly requested, while proportional maintainability choices do not mandate abstraction. There are **12 L1, 2 L2 and 1 L3 rules**. Applicable security/transaction invariants remain mandatory even when a surrounding future capability is optional.

### I56 — Rule 56: Provider independence

- **Level:** L1.
- **Purpose:** Contain provider assumptions without unnecessary layers.
- **Applicability:** New or materially changed integrations and provider-specific consumers.
- **Requirement:** Keep provider authentication/data mapping at controlled boundaries, prevent unrelated features depending on a connector and avoid scattering provider fields/rules throughout core domains. Prefer existing appropriate interfaces.
- **Verification:** Inspect dependencies, mapping ownership and actual consumers; verify unrelated core workflows remain independent.
- **Timing:** When an actual integration is approved or changed.
- **Exceptions / limitations:** No single-provider adapter boilerplate or replacement of approved Supabase services; hypothetical provider portability alone does not justify a rewrite.

### I57 — Rule 57: Stable integration contracts

- **Level:** L1.
- **Purpose:** Make data exchange explicit and validated.
- **Applicability:** Actual inbound/outbound integration contracts.
- **Requirement:** Document request/response formats, runtime validation, error conventions, authentication/authorization, owner/consumers, assumptions, compatibility and provider API version. Validate external data before protected work; do not treat provider responses as trusted domain authority.
- **Verification:** Contract and malformed-response/denial tests, reviewed consumers and upgrade compatibility evidence.
- **Timing:** Before accepting an implemented/changed contract.
- **Exceptions / limitations:** No new API layer, blanket version framework or new integration authorized; reuse existing contracts when suitable.

### I58 — Rule 58: Secure connection and credential management

- **Level:** L1.
- **Purpose:** Prevent unauthorized credential use or leakage.
- **Applicability:** Private provider credentials/tokens and connection administration.
- **Requirement:** Use approved server-side secure storage and transport, least-privilege scopes, tenant-specific ownership, authorized administration and explicit expiry/refresh/rotation/revocation recovery. Never expose private provider secrets in browser code, logs, artifacts or unauthorized responses. Keep diagnostic context redacted. For OAuth-like connections define safe authorization/callback/account binding and state protections as applicable.
- **Verification:** Review secret flows/scopes/access, redacted diagnostics, expired/revoked tokens and isolation/rotation recovery tests using safe fixtures.
- **Timing:** Before connecting a real provider or changing credential handling.
- **Exceptions / limitations:** Public publishable configuration and approved end-user session transport are distinct from confidential integration credentials; existing Auth architecture is unchanged. No token store, vault or rotation job is provisioned here.

### I59 — Rule 59: Integration lifecycle management

- **Level:** L2.
- **Purpose:** Keep connection states understandable and recoverable.
- **Applicability:** Actual provider connections, scaled to complexity.
- **Requirement:** Define connect/authorize/configure/activate, health/status, renewal, suspend, disconnect, reconnect, authorization-failure recovery and related data cleanup. State who may act and what pending work does in each state. Configuration/status/error UI must meet X/AC requirements.
- **Verification:** State-transition and recovery review/tests including permission loss, failed renewal, disconnect/reconnect and accessible user guidance.
- **Timing:** With an approved connection workflow.
- **Exceptions / limitations:** No global connection registry or universal lifecycle engine. A simple integration may use a small documented state model.

### I60 — Rule 60: Tenant-isolated integrations

- **Level:** L1.
- **Purpose:** Prevent cross-tenant credential access and synchronization.
- **Applicability:** Credentials, settings, external account associations, requests, synchronized records and diagnostics.
- **Requirement:** Establish explicit tenant ownership and server-side authority for actual resources, scoped queries/storage and safe staff operations. Derive tenant context from verified bindings rather than untrusted event fields. External IDs alone do not establish ownership. Scope error/log/admin access appropriately.
- **Verification:** Negative tests for outsiders, wrong tenant/account/location, revoked memberships, forged binding and unauthorized staff access; inspect authoritative storage/grants.
- **Timing:** Every introduced or changed integration boundary.
- **Exceptions / limitations:** Do not weaken existing RLS or rely on hidden UI/client tenant IDs. Shared provider accounts require an explicitly reviewed ownership model.

### I61 — Rule 61: Reliable webhook processing

- **Level:** L1.
- **Purpose:** Accept authentic events and avoid duplicate or reordered effects.
- **Applicability:** Only integrations actually using webhooks.
- **Requirement:** Verify signature or equivalent authenticity before effects; use the provider-required raw payload/canonicalization, timestamp/replay protection where supported, schema/version validation and trusted account binding. Define duplicate idempotency, out-of-order handling, safe acknowledgments, bounded retries, failed-event recovery and monitoring. Do not acknowledge durable receipt unless the chosen flow can safely recover it.
- **Verification:** Invalid/missing signature, altered body, replay, duplicate/concurrent delivery, stale/out-of-order event, wrong account and handler failure tests; verify no unauthorized or partial effect.
- **Timing:** Before webhook activation.
- **Exceptions / limitations:** No webhook endpoint, signing scheme or queue required for an integration that does not use events. Lack of provider replay support needs an explicit threat/control decision, not a silent bypass.

### I62 — Rule 62: Synchronization and reconciliation

- **Level:** L1.
- **Purpose:** Preserve authoritative data across exchanges.
- **Applicability:** Only integrations importing/exporting/synchronizing data.
- **Requirement:** Define source of truth, field mapping/external IDs, update direction/frequency, conflict rules, deduplication, checkpoints/cursors where needed, atomic boundaries and partial-failure recovery. Provide reconciliation and appropriate history; specify deletion/retention semantics and tombstone handling when relevant.
- **Verification:** Duplicate/import replay, conflicting/stale changes, partial batch failure, restart/resume, mapping changes, deletion and reconciliation tests; preserve Talix order/purchase snapshots.
- **Timing:** Before activating an exchange or changing its mapping.
- **Exceptions / limitations:** No assumed bidirectional sync or new data model. External updates cannot bypass authoritative tenant, price, transition or entitlement checks.

### I63 — Rule 63: Resilience and failure isolation

- **Level:** L1.
- **Purpose:** Keep provider outages from cascading into unrelated functionality.
- **Applicability:** Applicable synchronous/asynchronous provider failure paths.
- **Requirement:** Set justified timeouts and bounded retry budgets; distinguish definitive failure from unknown outcome. Use backoff/jitter where appropriate, respect rate limits and retry only safe/idempotent operations. Define safe fallback and recovery; isolate failures. Consider circuit breakers only when a measured need warrants them.
- **Verification:** Timeout/unavailable/slow/malformed/partial-success tests; verify bounded attempts, safe identity on uncertain writes and unaffected unrelated workflows.
- **Timing:** When introducing provider calls and their failure/recovery behavior.
- **Exceptions / limitations:** No complex resilience infrastructure or arbitrary global timeout selected. Fail closed for protected operations; do not substitute false success.

### I64 — Rule 64: Integration observability

- **Level:** L2.
- **Purpose:** Make connection and transaction failures actionable without leaking data.
- **Applicability:** Material integration operations and authorized operator views.
- **Requirement:** Record safe operation/correlation IDs, outcomes/failure classes, retry and sync/connection status, and useful metrics proportional to need. Surface recovery guidance and scope administrative visibility; redact credentials, private links and unnecessary customer payloads.
- **Verification:** Review sample redacted diagnostics and permission checks; test error classification, retry visibility and reconciliation status.
- **Timing:** With implemented operations and recovery procedures.
- **Exceptions / limitations:** No new monitoring vendor or centralized observability infrastructure. Underlying secret/tenant rules remain L1.

### I65 — Rule 65: API versioning and compatibility

- **Level:** L1.
- **Purpose:** Manage provider evolution without silently breaking consumers.
- **Applicability:** Integrations affected by provider API/version/schema changes.
- **Requirement:** Record provider version/support assumptions, deprecation notices, endpoint/schema dependencies, compatibility tests and controlled upgrade/backout or forward-fix plans. Assess breaking changes and any required mapping/data migration before implementation.
- **Verification:** Contract fixtures for supported versions, malformed/new fields and changed semantics; review upgrade effects and approved migration/recovery plan.
- **Timing:** Provider selection, material upgrades and deprecation reviews.
- **Exceptions / limitations:** No automatic provider upgrade or database migration. Support commitments require actual scoped review, not invented indefinite backwards compatibility.

### I66 — Rule 66: Rate limits and usage controls

- **Level:** L1.
- **Purpose:** Respect quotas and protect Talix and neighboring tenants.
- **Applicability:** Applicable outbound calls, inbound workloads and shared provider quotas.
- **Requirement:** Define bounded concurrency/throttling and retry-after/backoff behavior, usage visibility and fair tenant allocation where needed. Prevent unbounded polling, request storms and abusive work; enforce authoritative usage limits when introduced.
- **Verification:** Quota/429/retry-after tests, bounded concurrency/retry counts and noisy-tenant cases where applicable; verify recovery without starvation.
- **Timing:** Before activating quota-sensitive or user-triggered workloads.
- **Exceptions / limitations:** No rate-limit service or queue selected; use the simplest justified control. Do not invent provider quota values or claim current controls exist.

### I67 — Rule 67: Subscription-aware integrations

- **Level:** L1.
- **Purpose:** Keep integration eligibility consistent with authorized capabilities.
- **Applicability:** An integration introduced with industry/tier/subscription restrictions.
- **Requirement:** Use the central authoritative source of eligibility at every actual operation, including connection/activation, direct API calls, jobs and event/sync processing as applicable. Define behavior after downgrade, expiry, suspension, revocation or industry change, preserving required history/reconciliation. Derive UI guidance from the same rules; do not duplicate plan-name checks per provider.
- **Verification:** Unentitled/wrong-industry/cross-tenant/direct-call tests and changed/revoked subscription cases for every authoritative entry point.
- **Timing:** With the first actual restricted integration and its approved capability/lifecycle model.
- **Exceptions / limitations:** No entitlement engine exists today; this rule does not create it or retroactively make foundation Supabase access tier-restricted. Design/approval needed for retention or critical pending-event handling after eligibility loss.

### I68 — Rule 68: Integration testing and validation

- **Level:** L1.
- **Purpose:** Verify outcomes and boundaries at appropriate fidelity.
- **Applicability:** Implemented or materially changed integrations, proportionate to risk.
- **Requirement:** Use suitable unit/contract tests, mocked failures and provider sandbox checks where available. Cover auth/tenant/entitlement denial, timeout/retry, duplicate webhook, synchronization failures and relevant regressions. Protect test secrets/fixtures; separate mocks from actual provider evidence.
- **Verification:** Record exact versions/environment/commands/results/limits. Use the matrix below; independent concurrency evidence when that is the changed risk.
- **Timing:** Before accepting the integration and meaningful upgrades.
- **Exceptions / limitations:** No real payment or production-side effect in routine tests. Sandbox calls, test accounts/data, infrastructure and any migration execution require their approved scope. No tests or installations run by this documentation task.

### I69 — Rule 69: Privacy, retention and deletion

- **Level:** L1.
- **Purpose:** Limit external data exposure and govern its lifecycle.
- **Applicability:** Data transmitted to, stored by or received from a provider.
- **Requirement:** Specify purpose/minimum fields, tenant ownership, secure transmission/storage/access, retention periods, deletion/export/disconnect behavior and appropriate access auditability. Account for contractual/privacy requirements and provider limitations; redact sensitive data. Disconnect does not prove remote deletion or revoke all retained access automatically.
- **Verification:** Data-flow/retention review, authorized-access tests and approved deletion/disconnection evidence in an isolated scope; compare actual claims with provider guarantees.
- **Timing:** Before real data exchange and material purpose/retention changes.
- **Exceptions / limitations:** No legal compliance claim or retention period invented; exact obligations require separate qualified review when needed. Preserve required immutable purchase/order history under reviewed retention decisions.

### I70 — Rule 70: Public API/developer ecosystem readiness

- **Level:** L3.
- **Purpose:** Preserve future extensibility without building a platform prematurely.
- **Applicability:** Only a future approved third-party developer/API initiative.
- **Requirement:** Evaluate explicit public contracts/docs, developer authentication, scoped access, tenant consent, version/support policy, usage limits, approval/revocation, monitoring and abuse prevention for actual consumers. Reuse protected business operations.
- **Verification:** Review the concrete proposal and negative access/consent/compatibility cases if implementation is later approved.
- **Timing:** Future possibility, no current implementation requirement.
- **Exceptions / limitations:** No public API product, portal, marketplace, developer accounts, extension framework or generalized adapter system authorized. Public storefront RPCs are not an ecosystem support promise.

## Connection and data design record

For each approved integration, use a proportionate design/contract record rather than introducing a new framework. Identify its owner and consumers; tenant/external-account binding; scopes and secret storage/renewal/revocation; eligibility source; lifecycle/status and accessible UI; inbound/outbound schemas/versions and trust boundaries; authoritative fields and synchronization direction; transaction/idempotency boundaries; timeout/quota/retry budget; unknown-outcome reconciliation; redacted diagnostics; retention/disconnection; compatibility/recovery; and actual verification plan. Record which conditional rules are Not Applicable and why.

Connection lifecycle is not merely a UI toggle. Disconnection must define token revocation, stopping/cancelling pending work, late webhook rejection or safe reconciliation, data retention/deletion, and safe reconnect without duplicate imports or renewed unauthorized access. Subscription changes must respect the same checked authority as direct user operations. No existing session, subscription or simulated payment behavior changes in this documentation task.

## Integration categories: possibilities, not commitments

| Possible category         | Potential needs to evaluate only when approved                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Financial/payment         | Processor, accounting, invoicing, tax and reporting contracts; real payment activation remains separately restricted.     |
| Commerce/inventory        | Catalog/inventory exchange, marketplaces, shipping and fulfillment; explicit ownership/stock/transaction semantics first. |
| Industry-specific systems | Point of sale, reservations, delivery or scheduling at the justified industry boundary.                                   |
| Customer/marketing        | CRM, email, messaging, analytics and engagement with minimization, consent and retention review.                          |
| Automation/developer      | Webhooks, external APIs and future third-party consumers with scoped consent, limits and revocation.                      |

No providers, paid services, dependencies, industry eligibility or product commitments are selected by these categories.

## Proportionate validation and future audit coverage

| Boundary                         | Evidence expected when applicable                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider mapping/contract        | Unit and contract fixtures for valid/malformed/changed data, supported API versions and authoritative-field protection.                               |
| Credentials and tenant authority | Expired/revoked token, rotation, unauthorized administrator, wrong tenant/external account, forged binding and safe-redaction tests.                  |
| Subscription eligibility         | Direct API/job/event denial for missing, changed/revoked industry/tier eligibility; review policy for pending reconciliation.                         |
| Webhook/synchronization          | Authenticity/replay/duplicate/out-of-order events, partial batch failure, retry/resume, reconciliation, data conflict and deletion semantics.         |
| Provider failure/quotas          | Timeouts, unknown outcome, bounded retries, retry-after, concurrency/fairness and unrelated-workflow isolation.                                       |
| User/operator experience         | Accessible connection/status/errors/recovery, cross-device behavior, safe logs/metrics and documented runbook.                                        |
| Sandbox/service fidelity         | Actual sandbox verification when available and approved; label what remains mocked. No real payment or shared-production writes as routine test data. |

Use [T01–T04](testing-and-workflow.md) and [future audit checklist](cross-platform-audit.md#integration-readiness-assessment-extension). Later authorized audits should cover provider independence, contract quality, credential security, tenant ownership, entitlement authority, events/sync, resilience/quotas, telemetry, compatibility, testing, privacy/retention and potential public API boundaries. Classify verified defects, architectural risks, testing gaps and documentation discrepancies separately from optional future-readiness recommendations. No current webhook/sync/developer platform must be invented solely to satisfy an audit checklist.

## Approval and unresolved decisions

No conflict with approved architecture was identified. These standards await owner acceptance; they do not authorize integration implementation, remediation issues, a repeat audit, external accounts, credentials, dependency installation, migration execution/history changes, infrastructure, provider transactions or production deployment. Existing simulated payment and deployment restrictions remain.

Concrete integrations still require an approved need/provider/contract and a reviewed tenant ownership, credential, entitlement, lifecycle, data/retention, resilience/verification and operational scope. The first restricted feature must justify its smallest authoritative capability mechanism; no centralized engine is claimed today. Any protected architecture, security, schema, infrastructure or billing boundary change needs the existing separate approval. Legal/compliance and provider support assertions require actual evidence at that time.
