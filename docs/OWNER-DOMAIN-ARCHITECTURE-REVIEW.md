# Owner-supplied domain — architecture, security, and operations review

Status: approved product direction, implementation not authorized. No provider integration, DNS change, domain activation, infrastructure, billing, or support commitment is included in issue #73.

## Approved boundary

An owner using a Talix template may eventually connect one verified domain identity per subscription without an immediate additional recurring Talix website charge. An apex and `www` redirect pair count as one identity. The owner registers and renews the domain. Talix does not purchase, renew, transfer, or request registrar credentials. Masking, framed spoofing, and unverified activation are prohibited.

## Required pre-implementation decisions

- Hosting/provider capacity, costs, quotas, API boundary, failure isolation, and environment separation.
- Owner-only request and verification operations, proof expiry, re-verification, replacement, and removal.
- Exact provider-issued DNS instructions that preserve unrelated records, especially email/MX records.
- Automatic HTTPS issuance/renewal, certificate failure visibility, one authoritative host, and safe fallback.
- Apex/`www` normalization plus path-for-path redirects and canonical generation.
- Existing-site migration checklist, redirect-map storage/limits, rollback, cutover, and exit handling.
- Domain-conflict resolution, abandoned subscriptions, renewal failure, abuse response, audit history, and support ownership.
- Privacy-safe diagnostics that never collect registrar credentials or unnecessary DNS data.

Activation must fail closed until ownership and routing are verified. A DNS lookup alone is not proof of account authority. Provider-specific behavior belongs behind a contained integration boundary; tenant ownership and subscription eligibility remain enforced by Talix. Domain deactivation must not remove the stable Talix `/shop/<business>` fallback.
