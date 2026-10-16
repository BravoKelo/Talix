# Talix Agent Instructions

## Purpose

This file defines how the product owner, developers, and AI coding agents work in the Talix repository.

The repository and its GitHub history are the durable sources of project knowledge. Conversation may help collaboration, but prior chat must not be required to continue development.

## Source-of-Truth Ownership

Use one durable home for each kind of project truth:

- `AGENTS.md` — how development work is governed and executed.
- `docs/PRODUCT-VISION.md` — why Talix exists, who it serves, and intended product capabilities.
- `docs/CURRENT-STATE.md` — concise verified handoff and exact restart point.
- `docs/ARCHITECTURE.md` and accepted ADRs — implemented architecture and durable architectural decisions.
- `docs/PRODUCT-DESIGN.md` — approved customer-facing experience and design decisions.
- `docs/PROJECT-HISTORY.md` — material historical outcomes and decisions.
- Active GitHub issue — the implementation scope currently authorized.

Implementation must not be described as complete merely because it is planned or discussed.

## Start Here

Before planning, implementing, or resuming meaningful work:

1. inspect the current branch and repository state;
2. read this file;
3. read `docs/CURRENT-STATE.md`;
4. read `docs/PRODUCT-VISION.md`;
5. read `docs/ARCHITECTURE.md`;
6. read `docs/PRODUCT-DESIGN.md` when customer-facing behavior is relevant;
7. read relevant accepted ADRs;
8. read the active GitHub issue and relevant recent history;
9. inspect the relevant implementation, tests, configuration, schema, migrations, and dependencies as applicable.

Repository evidence outranks remembered conversation.

## Core Development Principle

Use evidence-driven development.

Before proposing architecture, persistence, schema, migrations, abstractions, infrastructure, integrations, or product structures, answer:

> **What actual data, observed behavior, or demonstrated requirement requires this change now?**

If the need cannot be demonstrated from project evidence or an explicitly accepted requirement, defer it.

A plausible future need is not a current requirement. Once a need is demonstrated, implement the minimum necessary solution.

## Diagnose Before Design

Before selecting an implementation:

- determine what is actually implemented;
- determine what has been explicitly accepted;
- determine what remains incomplete;
- identify the active requirement;
- identify applicable protected decisions;
- identify contradictions or missing evidence.

Do not choose work merely because it appears convenient from the current code.

## Stop on Ambiguity or Contradiction

If authoritative sources conflict or a requested change would cross an established decision boundary, stop and surface the conflict.

Do not silently resolve it using remembered conversation, generic best practices, architectural preference, external research, or implementation convenience.

## Product-Owner Authority

The product owner retains approval authority over:

- product direction and requirements;
- material customer-experience changes;
- architecture and architectural boundaries;
- database/schema changes;
- infrastructure and security boundaries;
- external integration strategy;
- meaningful implementation scope.

Meaningful implementation begins after the product owner approves a bounded scope.

## Controlled Direct-Repository Workflow

Talix uses a direct GitHub workflow to reduce manual file-transfer and command-relay work.

After the product owner approves a bounded implementation scope, the AI agent may directly create or update repository files on the approved feature branch and may perform corrective iterations necessary to satisfy that scope.

Separate approval is not required for routine corrections that remain inside the approved scope, such as:

- fixing implementation defects;
- correcting tests;
- resolving lint or type errors;
- reconciling documentation required by the approved change;
- making non-material implementation adjustments needed for validation.

The agent must stop and return to the product owner if evidence shows that completion requires crossing a protected boundary, including a new or changed:

- product requirement;
- material UX behavior;
- architecture decision;
- database/schema or migration decision;
- security model;
- infrastructure strategy;
- external integration strategy;
- material scope expansion.

Direct repository access is authorization to execute an approved scope, not blanket authorization to redesign the project.

## Development Lifecycle

Use this lifecycle for meaningful changes:

```text
recover
  ->
diagnose
  ->
propose bounded scope
  ->
product-owner approval
  ->
implement on focused branch
  ->
automated/manual validation
  ->
correct within approved scope
  ->
review complete diff
  ->
product-owner acceptance
  ->
merge
  ->
reconcile durable documentation
```

Do not prematurely merge or bypass review because automated validation passes.

## Branch and Change Discipline

- Keep `main` stable.
- Use focused branches for meaningful work.
- Keep each branch within its approved scope.
- Avoid unrelated refactors.
- Inspect the complete resulting diff before acceptance.
- Do not force-push or delete protected history without explicit approval.
- Prefer pull requests for meaningful changes.

## Validation

Validation must match the change and the implemented technology.

As Talix gains tooling, CI should become the authoritative automated validation path for checks such as:

- dependency installation;
- lint;
- type checking;
- unit/integration tests;
- build;
- schema validation;
- other project-specific checks justified by the implementation.

Never claim a validation step passed without reviewing its actual result.

A failed check is evidence to diagnose, not justification for an unrelated architectural change.

## CI and Automation Security

Use least privilege for GitHub Actions and other automation.

- Prefer read-only permissions unless a workflow demonstrably requires write access.
- Do not expose secrets to untrusted code.
- Do not use elevated pull-request workflow patterns merely for convenience.
- Keep production/deployment credentials scoped to the minimum required environment and workflow.
- Treat changes to CI permissions or secret access as security-boundary changes requiring product-owner approval.

## Customer-Facing Design Protection

Before materially changing customer-facing behavior or presentation:

1. read `docs/PRODUCT-DESIGN.md`;
2. determine what is approved, provisional, planned, or undecided;
3. preserve approved workflows and decisions;
4. obtain product-owner approval for material changes.

Newer code does not automatically supersede an approved design.

## Documentation Reconciliation

Durable decisions must not remain only in conversation.

When a change materially affects project truth, reconcile the appropriate source:

- workflow/governance -> `AGENTS.md`;
- product purpose/capabilities -> `docs/PRODUCT-VISION.md`;
- current handoff -> `docs/CURRENT-STATE.md`;
- architecture -> `docs/ARCHITECTURE.md` and/or ADR;
- customer experience -> `docs/PRODUCT-DESIGN.md`;
- material historical outcome -> `docs/PROJECT-HISTORY.md`;
- active implementation scope -> GitHub issue.

Avoid duplicating the same authority across multiple documents.

## Architecture Change Discipline

Before changing an accepted architectural decision:

1. read the governing architecture documentation/ADR;
2. inspect the current implementation;
3. identify the demonstrated requirement requiring change;
4. present the proposed change and consequences;
5. obtain product-owner approval;
6. update or supersede the durable decision when accepted.

Do not infer architecture solely from directory names, legacy code, roadmap wording, or convenience.

## External Research

External research may answer a repository-defined unresolved question, validate a technology choice, or investigate a demonstrated problem.

Do not use research to reopen settled decisions without new evidence.

Record durable conclusions when they materially affect product or engineering direction.

## Handoff and Recovery

A conversation handoff restores decision state; it does not replace repository/GitHub truth.

A useful recovery identifies:

- repository and branch;
- last verified commit;
- working-tree/remote verification limits;
- established constraints;
- approved decisions;
- explicitly unapproved or rejected proposals when material;
- exact unresolved boundary;
- minimal sources needed to continue.

After a long pause, recover repository evidence before continuing implementation.

## Development Style

Prefer work that is:

```text
small
working
testable
documented
deployable
```

over work that is:

```text
large
speculative
partially integrated
```

Optimize product-owner involvement for decisions and acceptance, not mechanical file transfer or routine debugging.

## Integration and approval records

Record the owner-approved bounded scope in a GitHub issue, with relevant PRs and decision records. Preserve prior approvals and supersessions without inventing historical approval details. Routine corrective commits within that scope may proceed directly; a protected change still requires specific approval.

Implementation authorization, defect acceptance, database/infrastructure execution approval, and merge acceptance are distinct. A closed defect issue or successful CI does not authorize a merge or operational change. Record acceptance against the exact reviewed commit and material boundaries. Significant implemented decisions with incomplete approval provenance must be surfaced for owner acceptance, not retrospectively stamped approved.

Review stacked PR ancestry before selecting an integration sequence. Preserve original foundation history when already inherited by implementation branches. Prefer merge commits for the approved baseline integration; do not squash, rebase, delete branches or force-push history without separate approval. Recheck retargeted diffs, dependencies and mergeability.

Verify deployed code/database compatibility and automatic deployment behavior before merging. Do not activate an intermediate older application against incompatible newer migrations. Never replay or rewrite applied migrations to make an old branch work. CI using isolated fixtures and actual deployed end-to-end verification are separate evidence and must be reported separately.
