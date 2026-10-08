# ADR 0003 — Configurable subscription and location permissions

Status: Accepted for the owner-authorized review batch, October 8, 2026.

## Demonstrated requirement

Issue #9 requires editable configured users, protected Owner, predefined leadership roles and custom permission checkboxes. Existing viewer/fulfillment flags cannot express shared management permissions or independent location roles. The owner explicitly authorized implementing all five review issues.

## Decision

Add subscription-owned business_roles with constrained permission lists and role references on existing memberships/location assignments. Preserve existing Owner identity and legacy membership markers; backfill existing location roles. Seed Manager, Supervisor, Lead, Fulfillment and Viewer for existing/new subscriptions. Owner cannot be assigned, edited or removed through this API.

Nine current permissions cover viewing/fulfilling/refunding orders, viewing/managing products, viewing/managing settings and viewing/managing users. Manage actions require corresponding view permission. Shared tools use the subscription role; location actions use the separately assigned location role. Shared roles do not automatically grant all locations.

RLS and narrow authenticated RPCs enforce authorization. User/role writes require users.manage, reject cross-subscription references and self-escalation, and prevent managers granting permissions or location access beyond their own authority. Permission changes affect database authorization immediately; the UI refreshes effective permissions periodically. No service key, invitation mail, owner transfer, organization framework or industry-specific behavior is introduced.

## Consequences and evidence

Migration 20261008021501_configurable_user_roles preserves existing onboarding function compatibility. Migration 20261008021928_index_membership_business_roles indexes the composite role reference. Both are applied only to Talix development. Eight dedicated SQL tests cover delegation, tenant boundaries, protected identities, direct-write denial and revocation. Actual service checks used disposable no-mail accounts and verified role changes, denial, removal and duplicate signup; all fixtures were removed.
