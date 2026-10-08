# ADR 0003 — Configurable subscription and location permissions

**Status:** Implemented under the authorized Issue #9 feature scope; specific schema/security boundaries await explicit baseline acceptance.
**Date:** 2026-10-08 UTC (2026-10-07 Pacific).
**Decision owners:** Product owner / engineering.

## Context

Issue #9 requires editable configured users, protected Owner, predefined leadership roles and custom permission checkboxes. Existing viewer/fulfillment flags cannot express shared management permissions or independent location roles. The owner explicitly authorized implementing all five review issues.

## Decision

Add subscription-owned business_roles with constrained permission lists and role references on existing memberships/location assignments. Preserve existing Owner identity and legacy membership markers; backfill existing location roles. Seed Manager, Supervisor, Lead, Fulfillment and Viewer for existing/new subscriptions. Owner cannot be assigned, edited or removed through this API.

Nine current permissions cover viewing/fulfilling/refunding orders, viewing/managing products, viewing/managing settings and viewing/managing users. Manage actions require corresponding view permission. Shared tools use the subscription role; location actions use the separately assigned location role. Shared roles do not automatically grant all locations.

RLS and narrow authenticated RPCs enforce authorization. User/role writes require users.manage, reject cross-subscription references and self-escalation, and prevent managers granting permissions or location access beyond their own authority. Permission changes affect database authorization immediately; the UI refreshes effective permissions periodically. No service key, invitation mail, owner transfer, organization framework or industry-specific behavior is introduced.

## Consequences and evidence

Migration 20261008021501_configurable_user_roles preserves existing onboarding function compatibility. Migration 20261008021928_index_membership_business_roles indexes the composite role reference. Both are applied only to Talix development. Eight dedicated SQL tests cover delegation, tenant boundaries, protected identities, direct-write denial and revocation. Actual service checks used disposable no-mail accounts and verified role changes, denial, removal and duplicate signup; all fixtures were removed.

## Decision drivers

Existing coarse roles could not satisfy the requested configurable access matrix, editable users and independent location roles. Owner protection, tenant isolation and bounded delegation must continue to be enforced in the database.

## Considered options

Retaining only Viewer/Fulfillment cannot meet Issue #9. Subscription-owned permission roles were implemented as the minimum extension. The durable record does not establish a separately approved options analysis before implementation; this section records the observed tradeoff rather than inventing historical approval.

## Current predefined role mapping

| Role | Permissions |
|---|---|
| Owner | All current permissions and locations; protected identity |
| Manager | View/fulfill/refund orders; view/manage products, settings and users |
| Supervisor | View/fulfill/refund orders; view products and users |
| Lead | View/fulfill orders; view products |
| Fulfillment | View/fulfill orders; view products |
| Viewer | View orders and products |

Each non-owner subscription and location assignment is independent. Custom roles select from these nine current permissions; manage/fulfill/refund require the corresponding view permission. Predefined roles are fixed. Managers cannot change themselves or Owner, or grant permissions/location access beyond their authority.

## Boundaries and approval provenance

The owner authorized Issue #9 implementation and later closed the issue. Separate prior approval of every schema/security choice is not established by repository evidence. The earlier Accepted wording conflated feature authorization with acceptance of protected implementation details. Issue #10 approves reconciliation and routine stabilization, not retrospective blanket approval. Explicit acceptance of this mapping, protected identities and delegation rules remains a final baseline prerequisite. No invitation delivery, ownership transfer, role hierarchy engine or additional permissions are decided here.

## Validation

Eight SQL tests cover role delegation, tenant boundaries, protected accounts, direct-write denial and revocation. Browser regressions additionally cover repeated custom-role Save and denied/successful removal. Historical real-service checks and latest exact-commit validation are distinguished in CURRENT-STATE.

## Supersession

Supersedes the core-only restriction to Viewer/Fulfillment under the later authorized Issue #9 scope. Does not supersede AGENTS.md or grant merge/deployment approval.
