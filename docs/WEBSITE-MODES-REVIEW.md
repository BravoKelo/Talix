# Website modes and homepage goals — #83 / #84

## Approval and baseline

The owner approved both bounded proposals recorded in issues [#83](https://github.com/BravoKelo/Talix/issues/83#issuecomment-6331505797) and [#84](https://github.com/BravoKelo/Talix/issues/84#issuecomment-6331506614), then directed implementation after PR #90 merged as `5c0b9618760007b338ccbf64f7e7ba6d66b82353`. The retained onboarding feature branch is fast-forwarded to that baseline and reused for its existing development-preview configuration. Future merge and database execution are separate decisions.

## Owner-approved development activation

`supabase/migrations/20261022032702_storefront_only_publication.sql` adds only `publish_storefront_only(uuid,text,timestamptz)`. No table/column, policy, role, public catalog projection, or existing save/launch function is changed. It uses the established security-definer transaction boundary because direct writes to these owner-only subscription fields are intentionally unavailable. It has an empty search path, qualified relations, internal `private.is_owner` authorization and authenticated-only execution; PUBLIC and anonymous execution are revoked.

The operation locks the subscription, requires a saved deferred path and a reviewed prior template/timestamp, rejects a different current live publication, and clears only the live template and its publication timestamp. It fills setup completion only if absent. The saved draft, existing address, default location, branding, catalog and business data remain. Repeating the committed transition safely acknowledges storefront-only state. A stale confirmation cannot hide a newer live publication, including a new publication of the same template with a different timestamp.

The returned object contains the existing private website state fields and `storefront_only: true`. The UI requires that explicit acknowledgement, deferred path, null live template and null launch timestamp before reporting success. A transport failure retains a safe retry; reload reads current subscription state. Missing-function responses on older databases state that activation is pending rather than falsely reporting publication. Response validation alone is not live-service verification; actual development verification is recorded below. No production readiness is claimed.

The owner separately approved migration execution. The exact SQL from reviewed head `2602b4ec5d3c1c131984eaeb8e44944396ab2828` was applied unchanged to Talix development `lzepujggusieapablzhn` as service version **`20261022035957_storefront_only_publication`**. Twenty-two migrations are recorded. The repository filename retains its preparation timestamp; its historical preparation-only header is superseded by this activation record. Do not replay or rewrite applied migrations. Production execution is not authorized.

Actual service verification passed: empty search path, security-definer boundary, authenticated execution allowed with internal owner check, and PUBLIC/anonymous execution denied. A rolled-back transaction using disposable owner/settings-editor/outsider identities verified required deferred review, pending-save preservation, owner publication, employee/outsider/anonymous denial, retry, stale timestamp and newer-publication rejection, retained subscription fields and public catalog/location/product preservation. No Auth API sessions were created. All fixture users/subscriptions were rolled back; zero matching records remain. Existing subscription digest is unchanged (`f755bb36ddcfe678e842c1f6abbcc983`); retained counts are nine subscriptions, 94 products and 23 locations. These are live database/RPC checks, not browser acceptance.

Advisor comparison: security categories unchanged; authenticated security-definer findings increased 18 → 19 for this intentional owner-gated operation ([advisor guidance](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)). Anonymous findings remain five, private admin deny-all RLS one, and the existing disabled leaked-password protection notice one. Performance categories remain unchanged: one unindexed foreign key; unused-index notices decreased four → three after verification queries used an existing index. No index was added/removed and no provider/security configuration was changed.

## User-visible scope

Product behavior is owned by PRODUCT-DESIGN.md. #83 adds a two-step deferred transition only for an already-live site. Saving the choice preserves the live site; the Go Live final action changes it. A never-launched subscription retains the one-step Save for later journey. The public action follows the active template, so it becomes Open storefront only after returned current state confirms the transition.

#84 keeps the existing canonical URL and Home/Shop anchors. The shared storefront remains mounted while a separate homepage is shown, preserving cart, query and selected location across Home/Shop navigation. Existing location changes still clear the cart. Direct Shop/product links and browser Back/Forward reveal the matching view and restore the anchor/focus. Order First embeds commerce at Home; the other templates expose it through Shop. Every homepage has a Shop action even with empty custom navigation. Header destination `storefront` uses the same Shop entry as `shop`.

Browse & Shop features the first three available products for the selected location in the existing catalog order, without popularity/ranking claims. The same helper selects homepage Product metadata. Visit & Order and Story & Shop emit no homepage Product graph; Order First includes the full eligible catalog. Metadata remains for the canonical homepage, not a separate route. Existing metadata/indexability follows the active template and becomes the existing storefront-only noindex behavior after #83 publication.

Go Live and Website Appearance previews use the same template composition and eligible products with Home/Shop controls; ordering stays disabled. Unsaved branding remains private preview data. No new route, persistence, commerce implementation, testimonial, claim of product popularity, domain, dependency, security provider or infrastructure is introduced.

## Validation and review

Local isolated SQL tests cover deferred save preservation, required pending path/review, owner authority, employee/outsider/anonymous denial, direct-write denial, retry, stale template/timestamp rejection, public projection and catalog/location preservation. Template/metadata tests cover homepage selection, the three-product limit, and removal of invented quote/popularity content. Browser regressions cover publication denial/lost-response retry and Home/Shop navigation, direct links, history and cart/location retention. Actual commands/results, exact PR head, CI and preview URL belong in the PR and issues; writing a scenario is not a passing execution result.

The owner elected to perform browser review personally. Agent manual browser testing is not claimed. Required exact-head automated CI is reported separately, including the existing CI development-server startup failure if it recurs. Physical-device and real assistive-technology evidence retain the approved support-policy deferral.

Owner review:

1. Select each template and inspect Home in Go Live and Website Appearance preview. Only Order First shows the whole catalog; Browse shows at most three eligible featured items; Visit leads with real location information; Story uses the saved description.
2. Switch preview Home/Shop; check desktop, tablet and phone presentation and keyboard controls.
3. On a published development fixture, use Shop, add to cart, return Home, then Back/Forward. Confirm cart/location retention. Open `#shop-products` directly, and check Shop remains reachable without a configured navigation link.
4. For an already-live development fixture, select Decide Later and Save to continue. Verify the existing site remains live until Go Live publication.
5. Publish storefront-only mode in development. Confirm the exact success message, Open storefront destination and plain shared storefront at the same address. Saved template/catalog/branding remain. Never-launched Decide Later still saves in one step. Older databases without activation retain the explicit awaiting-activation response.

Only the separately approved development migration has been executed. No merge or production operation is authorized or performed. Current exact PR head, CI and preview evidence remain in PR #91 and issues #83/#84.
