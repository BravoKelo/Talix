# Talix Product Design

## Status

**Design status:** Confirmed product-level workflows; no approved detailed UI or visual design.

## Purpose

This document is the durable source of truth for approved Talix customer-facing experience decisions.

It separates approved design from implemented-but-unapproved experiments, planned ideas, and unresolved questions.

## Design Authority Categories

Customer-facing elements should be classified as one of:

- **Approved / Established** — explicitly accepted product design that implementation must preserve unless changed through product-owner approval.
- **Implemented but Not Specifically Approved** — code exists, but implementation does not establish design authority.
- **Planned** — intended future behavior that has not yet been designed/approved.
- **Undecided** — no accepted design exists.

## Current Approved Design

No detailed customer-facing design has yet been approved in the current Talix repository.

The product vision establishes that Talix is intended to include:

- a business-owner back-office experience; and
- a business-specific customer-facing commerce/POS experience driven by managed data/settings.

Those are product requirements, not approval of a particular layout, navigation system, visual style, responsive hierarchy, or interaction model.

## Confirmed Product-Level Experience

The October 6, 2026 discovery established user journeys and operating behaviors, owned by `docs/PRODUCT-VISION.md`. Preserve those requirements when proposing the POC and later design.

The [Talix FigJam](https://www.figma.com/board/WtSucgcWZBc29V8SXToWKS/Talix?node-id=0-1) is a product-discovery map and visual companion. Its boxes, colors, connections, and supplemental detail cards do not approve screen layouts, navigation widgets, service decomposition, or database relationships.

Product-level choices are confirmed; detailed interface design remains undecided. Nothing is implemented. POC inclusion remains undecided even for confirmed overall capabilities.

## Design Principles for the First POC

When design work begins:

1. start from the approved POC workflow;
2. design the minimum complete experience required to demonstrate that workflow;
3. distinguish business-owner tasks from customer tasks;
4. make loading, empty, error, and incomplete states explicit where relevant;
5. validate responsive behavior appropriate to the intended users;
6. avoid adding dashboard surfaces or controls merely because a future SaaS platform might need them;
7. obtain product-owner approval before treating material customer-facing decisions as established.

## Protection Rule

An approved design must not be materially redesigned, removed, or replaced for implementation convenience.

Newer code does not automatically supersede an approved design.

Diagnostic, administrative, or engineering interfaces do not become customer-experience authority merely because they exist.

## Next Design Boundary

No detailed product design should be established until the first POC product boundary is approved.
