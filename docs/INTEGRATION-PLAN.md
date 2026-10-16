# Controlled baseline integration — October 16, 2026

## Status
The owner approved the exact main-only deployment configuration on October 16 after clarifying that payment/security decisions remain separate. The configuration is committed on both implementation branches. It reaches main on the accepted merge; no main merge, production release or payment handling is authorized.

## Verified trigger and reason
The owner's October 16 Production screenshot shows main is the production branch, every main commit creates a production deployment, domain auto-assignment is enabled, and the Project production-variable tab is empty. The Git screenshot shows BravoKelo/Talix connected; visible status/comment controls do not pause deployment. The Shared variables tab was not inspected. Browser sign-in is unnecessary for this evidence.

The intended historical sequence merges foundation/core through PR #2 and then onboarding through PR #4. Intermediate core is incompatible with the newer development database. A merge must therefore not automatically activate that intermediate code. The pre-hold onboarding tree (04d18c93) had no vercel.json; the approved file is now present on both implementation branches.

## Approved minimum configuration
The approved root vercel.json is added on feature/core-commerce and feature/customer-onboarding before either main merge:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "git": {
    "deploymentEnabled": {
      "main": false
    }
  }
}
```

Vercel documents branch-specific deployment disabling and defaults unspecified branches to enabled: https://vercel.com/docs/project-configuration/git-configuration#git.deploymentenabled .

This blocks automatic Git deployments from main, while preserving feature-branch previews. Both merge results must include the file. It does not delete or disable an already running deployment, disconnect GitHub, block manual CLI releases, configure production database credentials, change deployment protection, or implement release automation. Production remains on its previously deployed code. Re-enabling main automatic deployment requires a separate release/configuration decision after production readiness.

Approved preparation is restricted to this exact configuration and necessary durable-record updates on the existing feature branches. Do not change the production tracked branch or dashboard settings. Do not overwrite migrations or rebase/squash/delete history. Do not merge core into onboarding merely to copy the identical configuration; applying the identical file preserves the existing stack for the eventual main integrations.

## Verification and integration sequence
1. Owner approval obtained. Verify the identical file on both branches, review incremental diffs, inspect their CI and matching protected previews, and record exact new heads.
2. Complete controlled actual deployed acceptance for the current application. Isolated SQL/browser suites and historical live-service checks remain separate evidence. No full deployed signup/ordering/refund/Users journey is newly claimed here.
3. Present the complete remaining diffs, exact validated heads, current limitations, and ADR 0003 role/delegation mapping for explicit final baseline and merge acceptance. The present proceed instruction authorizes preparation, not that final acceptance.
4. After acceptance, retarget PR #2 to main and recheck its expanded foundation/core diff and mergeability. Its merge result must contain main:false. Merge by merge commit and verify no main deployment was created; if unexpected deployment appears, stop before further integration.
5. Retarget PR #4 to main. Recheck the remaining diff, ancestry, hold, checks, and mergeability against the accepted head before its merge commit. Preserve all original branches and commits.
6. Verify main matches the accepted final tree, checks pass, and no production deployment or migration replay occurred. Reconcile CURRENT-STATE/HISTORY and Issues #1/#3/#10 accurately.
7. Continue existing protected feature-preview testing until a separately approved deployment/release arrangement is established.

## Remaining product/security acceptance
ADR 0003 records the implemented mapping: Owner all/protected; Manager all nine current permissions; Supervisor view/fulfill/refund orders plus view products/users; Lead and Fulfillment view/fulfill orders plus view products; Viewer view orders/products. Subscription and location roles are independent. Predefined roles are fixed; custom roles select permissions. Managers cannot alter themselves/Owner or grant permissions or location access beyond their authority. No new role design is proposed.

## Current checkpoints
- main: 133cb2450a422ed550a8d646d3a7626d36c68519
- foundation/project-governance: 4d547496998c50a30ee20afec5ef423b7145381d
- core before proposed hold: e6fc00a56bf3aca5e0955f74a1c18a5131d9ed43
- onboarding before this documentation update/proposed hold: 04d18c93dd9fdaf8f528667c52cb462174a4f6f7
- Both PRs remain draft and unmerged. Exact heads must be recovered again before approval or execution.
