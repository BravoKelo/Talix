# Talix Project History

## Purpose

This document records material project outcomes, durable decisions, major investigations, milestone transitions, and important rejected directions.

It is historical context, not the source of truth for current implementation state. Use `docs/CURRENT-STATE.md` for the current handoff.

## 1. Initial Product Concept

Talix was conceived as a web-based platform for business owners to manage products and business information through a back office and use that managed data/settings to generate a customer-facing point-of-sale / commerce experience.

The broader concept included business customization, reporting, customer/marketing capabilities, extensibility through future industry-specific modules, integrations/APIs, and Talix-side operational/customer-management capabilities.

Early planning considered a modern web stack and a proof-of-concept-first development path.

## 2. New Repository and Infrastructure Foundation

On October 6, 2026, the Talix GitHub repository was established at `BravoKelo/Talix`.

The verified repository starting point contained a single `README.md` and one initial commit:

`133cb2450a422ed550a8d646d3a7626d36c68519` — `Initial commit`

A new Supabase project named Talix was also created separately.

No application implementation or database architecture was treated as established merely because infrastructure existed.

## 3. Development-Governance Reset

Before beginning Talix implementation, the product owner chose to apply development lessons learned from a prior software project.

The key change was to preserve rigorous repository-first, evidence-driven development while eliminating unnecessary manual file-transfer and command-relay work.

Talix therefore adopted a controlled direct-GitHub workflow:

- repository/GitHub remains durable project truth;
- meaningful scope is diagnosed and proposed before implementation;
- the product owner approves protected decision boundaries;
- after approval, the AI agent may implement and iteratively correct work directly on the approved branch within that scope;
- the agent must stop when evidence requires a product, material UX, architecture, schema, security, infrastructure, integration, or material scope decision;
- automated CI should perform routine validation as the implementation gains tooling;
- complete diff review and product-owner acceptance remain required before merge.

This governance model is intended to keep product-owner attention focused on decisions and acceptance rather than mechanical development transport.

## 4. Overall Product Discovery and Vision Reconciliation — October 6, 2026

The entire initial Talix FigJam was reviewed, then refined through explicit owner clarifications before first-POC definition. The owner authorized updating the board and repository documentation, without implementation or architecture/schema/technology decisions.

Material outcomes include restaurant-first audience with a foundation for other industries; multiple subscriptions per client and multiple locations per single-business-type subscription; one login and location-specific predefined/custom roles; subscription-wide branding, CRM, and tool selection; shared/local products with local inventory; product-configured production timing; materials-only BOM contribution to COGS; restaurant ordering, tables/QR/tabs, preparation stations, own-driver delivery; and financial reporting without full bookkeeping or payroll processing.

Later clarifications superseded initial interpretations: production timing is product-configured rather than industry-fixed; online orders alone require email and phone, while in-person QR contact details are optional; marketing is separate from transactional communications.

Current product authority is `docs/PRODUCT-VISION.md`. Detailed UI, technical decisions, commercial terms, and first-POC scope remain open. This reconciliation does not authorize application implementation.
