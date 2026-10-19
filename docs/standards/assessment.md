# Repository assessment and follow-ups

Assessed October 18, 2026 Pacific against main `c71e690e50d635c3bbd7d556e0d802f720928084`. Documentation-only scope; no application/security/schema/infrastructure corrections are included. This is a structural and governance assessment, not a full code/security audit.

## Verified foundation

- One applicable root AGENTS.md; no existing standards directory. Existing docs/ARCHITECTURE.md and docs/adr remain in place; no replacement architecture tree is needed.
- Next.js 16 App Router, React 19, TypeScript strict mode, Node 24. Routes in src/app, components in src/components, helpers/types and Supabase clients in src/lib; src/proxy.ts handles sessions. PostgreSQL RLS/grants/checked RPCs enforce authority; Supabase Auth/Storage and Vercel are the accepted services.
- Eighteen SQL migrations are represented in source. Existing SQL tests use PGlite with Auth/Storage fixtures; Playwright desktop/mobile cases use a local SQL-backed adapter. Vitest, ESLint, TypeScript and Next build run in Core checks. CI uses contents: read. No documentation link job, formatter gate, module-boundary checker or production branch-rule enforcement was verified.
- Prettier is a development dependency, without an npm formatting script/CI step. Protected-branch workflow is a governance rule; actual GitHub branch protections were not inspected.
- Shared commerce, generic product options, five header presets, navigation/branding configuration and checked Owner industry changes exist. Industry-specific workflows, centralized entitlements, queue infrastructure, real billing and a full website builder do not exist. Do not equate catalog choices with feature enforcement.

## Conflicts and disposition

| Finding                                                                                                                                                       | Documentation treatment / future decision                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Product vision's opening scope and merge wording predates merged storefront/follow-up work; website direction still describes staff/outsource first.          | Add dated status/direction clarification; retain older records with explicit supersession. CURRENT-STATE owns current implementation. |
| Architecture's early migration count and original signup description can read as current; later amendments describe more recent behavior.                     | Point migration count to CURRENT-STATE and clarify original purchase vs checked industry changes. Do not rewrite ADR decisions.       |
| Existing AGENTS validation language describes CI as future; CI is now implemented.                                                                            | Link exact existing commands and classify manual versus automated enforcement in standards.                                           |
| Prior handoff says retain the tracking review branch; owner subsequently deleted merged branches and confirmed only main and website-owner-onboarding remain. | Record the cleanup confirmation as superseding retention instructions. Do not touch branches in this documentation task.              |
| Large mixed components and global styles: workspace.tsx 1,240 lines, onboarding.tsx 715, globals.css 4,505 at assessed head.                                  | Recommend a separately scoped responsibility/dependency review. Size alone is not a defect or authorization to split code.            |
| Central entitlements/module contracts are a product requirement, not implemented infrastructure.                                                              | Require enforcement when a restricted feature is introduced; plan the smallest mechanism with its first approved consumer.            |
| Live owner UI coverage and physical touch tests are not established by isolated browser tests.                                                                | Retain the explicit evidence gap; plan owner-journey verification in its new scope.                                                   |

## Recommendations, not implementation orders

1. After standards acceptance, perform a separately authorized risk-based code review: tenant/permission checks, checked transaction contracts, compatibility paths, then component responsibilities. Report evidence and priorities before refactoring.
2. Consider formatting/link checks, dependency-boundary checks and verified branch protection only when their concrete value and operational changes are approved. Do not represent manual requirements as automated protection.
3. Define template content/customization limits, decision placement, hosting addresses/custom domains and custom-work fee terms in the website owner proposal. Do not alter catalog offerings or existing purchases during documentation work.
4. Introduce observability/performance targets and reliable asynchronous processing only with a demonstrated operational feature; no new provider or production readiness claim.

## Verification boundary

Documentation validation checks changed Markdown links, unique standard IDs/classification, preservation of existing governance and documentation-only changed paths. Application tests are not necessary to establish prose correctness and are not claimed as rerun. PR CI is reported separately when available. This branch must stop at review; no merge is authorized.
