# Stable website public routes — architecture and security review

Status: homepage search foundation implemented locally after owner acceptance feedback; not accepted for merge or deployed. Stable product/location routes and the remaining decisions below are still separately gated.

## Approved outcome

Every launched Talix template must eventually provide stable, crawlable, server-rendered pages for each published location and eligible public product. `/shop/<business>` remains the canonical business homepage. Ordinary links must connect these pages; structured data must match visible authoritative content. Draft, unpublished, unauthorized, and cross-subscription content remains inaccessible.

## Implemented homepage boundary

The business shop page remains the only canonical website URL. When a Talix template has been explicitly launched, the server reads the existing public-catalog contract and produces business-specific title, description and social metadata, index/follow robots instructions, LocalBusiness and visible Product structured data, and a sitemap response containing only that canonical homepage. Unlaunched, deferred, existing-site and unavailable states are noindex and emit no structured business graph or sitemap. Preview remains inside the authenticated workspace and is not crawlable.

This adds no schema, migration, public table grant, service credential, product/location route, redirect storage, backfill, custom domain, infrastructure or deployment. Structured data uses only fields already visible in the public catalog and matches visible homepage content.

## Decisions still required

1. Exact location and product URL syntax and whether identifiers are mutable slugs or stable opaque keys with display slugs.
2. Slug ownership, normalization, collision, rename, redirect, and deletion rules.
3. Additive redirect storage and limits, including tenant-scoped validation and loop prevention.
4. Explicit public projection for product/location pages and server rendering, caching, revalidation, and failure behavior.
5. Product/location canonical and sitemap inclusion, removal responses, additional structured-data types, and category-page threshold.
6. Compatibility and backfill for existing subscriptions, products, locations, and bookmarked storefront links.

## Recommended boundary for later approval

Resolve every public object by both subscription and public identifier in one authoritative query. Publish only fields already approved for catalog use, return an intentional missing response for unpublished or cross-tenant objects, and generate metadata from the same returned contract as visible content. Keep checkout and pricing authority in existing server operations. Redirects must be tenant-owned, path-safe, loop-free, and bounded. Cache keys and invalidation must include the authoritative subscription/object state. Preview and workspace routes remain authenticated and non-indexable.

The homepage foundation does not make the future product/location routing work complete. Search visibility, ranking, AI citation, traffic, leads, and revenue are never guaranteed.
