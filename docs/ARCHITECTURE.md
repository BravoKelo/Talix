# Talix Architecture

## Status

**Architecture status:** Not yet established  
**Project stage:** Foundation / pre-implementation

## Purpose

This document records Talix's implemented architectural boundaries and accepted high-level architecture.

It must not be used to turn product ideas or possible future capabilities into architecture prematurely.

## Current Implemented Architecture

There is currently no implemented Talix application architecture in the repository.

A Supabase project named Talix exists externally, but that fact alone does not establish:

- the application framework;
- database schema;
- authentication model;
- module boundaries;
- API architecture;
- deployment model;
- billing architecture;
- CRM architecture;
- integration architecture.

## Previously Discussed Technology

Earlier Talix planning considered a modern web architecture, including Next.js and Supabase/PostgreSQL.

Those discussions remain useful inputs, but they are not accepted architecture merely because they were previously considered.

Technology decisions should be re-evaluated against the approved first proof-of-concept requirements before implementation.

## Architecture Principles

Until concrete architecture is approved, use these governing principles:

1. **Requirements before structure.** Demonstrated product requirements drive architecture.
2. **Minimum necessary architecture.** Implement the smallest structure that cleanly supports the accepted requirement.
3. **Avoid speculative decomposition.** Do not create services, modules, schemas, APIs, or abstractions solely for anticipated future needs.
4. **Preserve clear ownership.** Once boundaries are established, responsibilities should have clear owners and should not be duplicated across layers.
5. **Keep external providers behind deliberate boundaries.** Provider-specific behavior should not silently become the core domain model.
6. **Preserve durable data deliberately.** Persistence decisions must be based on demonstrated product/history/reporting/integration needs.
7. **Architecture changes require evidence.** Accepted architecture changes follow the process in `AGENTS.md`.

## Decision Process

When the first POC boundary is approved:

1. identify the required end-to-end behavior;
2. identify the minimum data that must persist;
3. identify required trust/authentication boundaries;
4. identify required external services;
5. select the simplest architecture that supports those demonstrated needs;
6. record durable architectural decisions in this document and ADRs where appropriate;
7. implement a small complete vertical slice.

## ADR Policy

Use an ADR when a decision is:

- architecturally significant;
- durable enough that future developers need its rationale;
- costly or confusing to reverse without context;
- a choice among meaningful alternatives.

Do not create ADRs for trivial implementation details.

Accepted ADRs supplement this document. If architecture changes, supersede or update the appropriate durable record rather than silently contradicting it.
