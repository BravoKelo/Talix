# Stable website public routes — architecture and security review

Status: prepared for a separate owner architecture decision. No routes, schema, redirect storage, backfill, sitemap, or deployment are authorized by this review.

## Approved outcome

Every launched Talix template must eventually provide stable, crawlable, server-rendered pages for each published location and eligible public product. `/shop/<business>` remains the canonical business homepage. Ordinary links must connect these pages; structured data must match visible authoritative content. Draft, unpublished, unauthorized, and cross-subscription content remains inaccessible.

## Decisions still required

1. Exact location and product URL syntax and whether identifiers are mutable slugs or stable opaque keys with display slugs.
2. Slug ownership, normalization, collision, rename, redirect, and deletion rules.
3. Additive redirect storage and limits, including tenant-scoped validation and loop prevention.
4. Explicit public projection for product/location pages and server rendering, caching, revalidation, and failure behavior.
5. Canonical and sitemap generation, removal responses, structured-data types, and category-page threshold.
6. Compatibility and backfill for existing subscriptions, products, locations, and bookmarked storefront links.

## Recommended boundary for later approval

Resolve every public object by both subscription and public identifier in one authoritative query. Publish only fields already approved for catalog use, return an intentional missing response for unpublished or cross-tenant objects, and generate metadata from the same returned contract as visible content. Keep checkout and pricing authority in existing server operations. Redirects must be tenant-owned, path-safe, loop-free, and bounded. Cache keys and invalidation must include the authoritative subscription/object state. Preview and workspace routes remain authenticated and non-indexable.

This review must be completed before calling a visual template SEO-ready. Search visibility, ranking, AI citation, traffic, leads, and revenue are never guaranteed.
