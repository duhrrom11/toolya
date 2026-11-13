# Toolya selective migration — final inventory (2026-11-13)

**Status: staged only; NOT APPROVED FOR MERGE OR DEPLOYMENT.**

## Repository isolation and change scope
- Branch: `migration/english-paths-clean`, repository `duhrrom11/toolya`.
- GitHub compare `main...migration/english-paths-clean`: 62 commits ahead, 0 behind, 113 added files, **zero modified or deleted files**. Added files consist of `staging/`, `scripts/`, and `.github/workflows/migration-audit.yml`.
- Public root `index.html`, `CNAME`, `.nojekyll`, `README.md`, `MIGRATION-PLAN.md` have exactly matching Git blob SHA values on both branches.
- Staged tree: 103 files in `staging/` (42 wishlist files; 61 other staged files), including 32 HTML pages. Duplicate source `amazon-wishlist/` is excluded.
- Spot-check against original `duhrrom11/Helferlein/main`: `tools/wishlist/discover.mjs`, `assets/helferlein-b3-startseite.js`, `assets/helferlein-b3-startseite.css`, and `shared/helferlein-cloud-store.js` are byte-identical. `tools/umzugskisten-inventar/index.html` versus staged `tools/moving/index.html` matches after normalizing expected URL/slug substitutions. These are representative checks, **not** a complete byte-level source-to-staging equivalence proof.

## Migration-specific technical issues — fixed on staging branch
- Restored required `assets/heir-e2ee-handoff.js` dependency for estate handover.
- Replaced stale JS-generated `gift-cockpit.html` target with `cockpit.html`.
- Corrected dynamically constructed estate routes `erben.html` and `schluessel-drucken.html` to `heirs.html` and `print-key.html`.
- Updated four obsolete German tool URLs in staged `sitemap.xml`.
- Static audit currently finds **zero legacy-route matches and zero newly missing references** in its supported patterns. The audit is not exhaustive for computed URLs, CSS runtime behavior, or auth callbacks.

## Defects already present in the original Helferlein source — NOT fixed
1. `tools/wishes/gift-tasks.html` and `tools/wishes/gift-analytics.html` are referenced but absent in the original `tools/wishlist/` and `tools/amazon-wishlist/` trees. Static audit reports five references to these two missing destinations; they are not introduced by the migration. Do not fabricate pages or silently redirect navigation.
2. `tools/wishes/discover.mjs` contains a `counts` variable-shadowing / temporal-dead-zone bug in `load()`, also present byte-for-byte in original `tools/wishlist/discover.mjs`. It prevents the unmodified discovery page from rendering loaded results. **The 5/5 discovery fixture result passes only with a localhost HTTP-response-only workaround**; application code remains unchanged. Requires separate authorization if a functional bug fix is desired.

## Validated tests
- Latest complete green CI run: https://github.com/duhrrom11/toolya/actions/runs/43472844619 (head `7faf59efb93ca5d5a52c28d01f330468d45c39d1`).
- Static dependency and route audit; JS/MJS syntax; all 32 local page smoke tests; 32 mocked-dependency page tests.
- 11 real local anchor navigations, 11 safe non-submitting UI-control checks.
- Six homepage category filters: verified visible cards and counts.
- Wishlist discovery: five visible-result checks with three synthetic records and **test-only shadowing workaround** (newest, alphabetical, popularity, search, topic).
- Moving inventory: six visible-result checks with three synthetic boxes (name, descending/ascending value, tag, search, reset); no storage writes.
- All browser tests use localhost-only assets, network-blocking policy, and disposable mock data; no production Supabase access, authentication or writes.

## Open acceptance gates
- Do not call the migration production-ready: offline mocks are not a faithful substitute for third-party libraries, auth flows, browser storage origins, or real deployment conditions.
- Audit untested computed JS routes, external links and callback URLs; inspect estate recovery, heir keys, omitted `a10-*`/`heir-*` assets, PWA manifest/service worker, sitemap and legacy compatibility redirects.
- Decide separately whether to repair pre-existing missing wishlist destinations and discovery variable-shadowing bug; these are outside the current technical-path-only permission.
- No merge, production Supabase changes, or publication has occurred in this work.
