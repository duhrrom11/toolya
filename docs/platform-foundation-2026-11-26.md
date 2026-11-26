# Toolya shared platform foundation (2026-11-26)

## Scope and invariants

All 12 tools advertised on the homepage, both homepage languages, dashboard, retained Wishes subpages, and administration entry points were included in the source inventory. The generated repository inventory records 66 matching runtime files and 32 SDK-consuming HTML entry points. It is a snapshot of the initial migration, not a claim that every individual workflow has passed live acceptance.

- Keep the existing production Supabase project, publishable key and SDK-default session storage key.
- Use the locally bundled, pinned 2.119.2 SDK, already used by the working public wishlist and dashboard. Keep the older asset for rollback; no active HTML references are intended.
- Use one authenticated client per page through shared/toolya/supabase-client.js; existing private gates and per-tool ownership checks remain. The public wishlist directory intentionally uses a separate anonymous read-only client.
- Keep tool-specific data models, CloudOnly revision checks, dashboard guest behavior, and estate encryption/security controls. No database migrations or production fixture writes.
- Centralize application locale reading and persistence in shared/toolya/i18n/locale.mjs; keep tool-specific catalogs and existing public-guide language routes.
- Reuse the existing shared settings accordion, platform header/footer, mascot and preferences. Preserve per-tool settings DOM and business handlers rather than replacing them wholesale in this release.

## Remaining architectural work

A fully identical account/settings component is not achieved by a shared client alone: historical home, classic tools, dashboard, estate and Wishes panels still have separate form handlers and layouts. Consolidate those using tested adapters, preserving password recovery, private route gating, public discovery, admin authorization and vault controls. Translate account/status strings through one shared catalog, then remove legacy fallbacks once browser coverage is confirmed. Do not delete retained routes or user data.

## Verification

Run all repository workflows, including real SDK isolated browser authentication, mobile settings, translation checks, CloudOnly revision/ownership, estate encryption, Connect, and public directory privacy checks. Verify the deployed version separately; passing CI does not prove live authentication. No production test accounts or records are needed.
