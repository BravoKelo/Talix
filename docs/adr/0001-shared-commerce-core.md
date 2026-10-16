# ADR 0001: Shared commerce core and simulated payments

Status: Accepted foundation and bounded scope; implementation pending product-owner acceptance.
Date: October 7, 2026.

## Evidence

The owner identified online ordering/fulfillment as Talix's primary purpose, required the business-neutral core before industry-specific behavior, approved the bounded first implementation, requested simulated payments, and explicitly selected Next.js, Supabase and Vercel. Issue #1 records the scope.

## Decision

Use a single Next.js application backed by Supabase Auth/PostgreSQL/Storage, deployed to Vercel. Core data and fulfillment vocabulary remain generic. Do not add speculative industry/module/provider frameworks. PostgreSQL enforces ownership/location roles, catalog pricing, snapshots and transaction rules. Narrow RPCs support guest checkout and private status without general anonymous table access.

Use deterministic approved/declined simulation and recorded full/partial refund simulation. Collect no card fields and connect no processor. The simulator is development behavior, not payment processing.

## Consequences

A small working core can serve different catalogs without restaurant entities. Industry modules and provider integration require later demonstrated requirements and owner approval. Live acceptance needs the existing Talix Supabase project's identity, schema review, migration application and public preview configuration. Embedded tests are useful evidence but do not establish live service correctness.

## Supersession and integration

Later authorized Issues #3 and #9 add self-service provisioning and configurable permissions; original owner-only refund and manual-provisioning assumptions are historical. Core migrations remain preserved. The core PR is not an operational rollback target for development after onboarding migrations disable its provisioning shortcut. The approved reconciliation plan integrates the inherited foundation and core, then the dependent onboarding branch, using merge commits after separate acceptance. No module framework, real processor or production launch is implied.
