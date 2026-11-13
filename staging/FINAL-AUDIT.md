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

## Read-only release-gate risk review (2026-11-13)

Scope: repository-tree and selected source inspection only; no browser authentication, real backend access, data writes, code modifications, merge, or deployment. Priority means risk **if** staging is later published, not evidence of an incident in the currently public site.

| Priority | Area | Evidence | Classification / action before release |
|---|---|---|---|
| **P0 / release blocker** | Browser-origin storage and recovery | The staged homepage reads/writes `localStorage` and supports a manual backup/import flow; `assets/heir-e2ee-handoff.js` reads `digital_estate_vault` locally; `shared/helferlein-cloud-store.js` also uses origin-scoped `localStorage`. Moving from `duhrrom11.github.io` to `toolya.app` changes browser origin. | **Migration compatibility risk**: existing local data will not automatically follow the domain. Verify safe, consent-based export/import and encrypted-estate recovery on disposable local data; never assume automatic migration. |
| **P0 / release blocker** | Authentication / cloud origin | Homepage and estate owner use Supabase email/password auth; estate owner CSP permits the configured Supabase API origin. No `redirectTo`, `signInWithOAuth`, `signInWithOtp` or password-reset redirect was found in the selected files, but that does not prove no other callback flow exists. No Supabase project settings were queried. | **Unverified configuration**: inspect allowed Site URL/redirect URLs, CSP, CORS and login/logout behavior using an isolated nonproduction environment before release. Do not modify production settings as part of this audit. |
| **P1 / release blocker** | Legacy URLs / redirects | Original Helferlein includes redirect-only `tools/kfz/`, `tools/kassenbon/`, `tools/kisten/`, `tools/notizen/`, `tools/energie/`, `tools/haustier/`, `tools/parken/`, `tools/pflanzen/`, `tools/verleih/`, `tools/wg-kasse/`; these paths are absent from staged output. Original `tools/notizen/index.html` and `tools/kfz/index.html` redirect with query/hash preservation. No `404.html` or `_redirects` is staged. | **Migration compatibility gap** for inbound bookmarks and links. Design explicit legacy route strategy and verify query/hash preservation; no redirect pages created under the current no-code-change instruction. |
| **P1** | PWA / indexing metadata | Staged `manifest.json` has relative `start_url: ./index.html`, which resolves correctly when hosted at the intended site root. `robots.txt` still names `https://duhrrom11.github.io/Helferlein/sitemap.xml` (byte-identical to original) while staged `sitemap.xml` uses `https://toolya.app/`. No service worker was found in either repository tree; do not claim offline installation support. | **Confirmed migration-specific metadata defect**: update the robots sitemap URL only after separate permission to make technical reference changes. Also verify sitemap against the final deployed path; no fix applied in this read-only review. |
| **P1** | Estate and recovery asset scope | Four estate pages stage `estate-owner.js`, `estate-trustee.js`, `heir-e2ee-handoff.js`, `estate-print-ready.js` and their directly referenced local scripts/styles. The selected estate JS/HTML files contain no literal `a10-`, `heir-owner`, or `heir-redemption` references. Original source contains many additional `assets/a10-*` and `assets/heir-*` files and staging-only invitation/backend work. | **Unverified feature-scope risk**, not proven missing dependency: decide whether these are experimental/feature-gated or required; audit runtime dynamic imports and all invitation/recovery entrypoints. Original `docs/heir-invitations-production-gate.md` explicitly says NO-GO pending separate release gates. |
| **P2** | Static assets and social metadata | Staged homepage `og:image` points to `https://toolya.app/assets/preview.jpg`, but no `preview.jpg` exists in the staged tree **or** original Helferlein tree. | **Pre-existing missing asset**, now referenced under new host; broken social preview if published without asset. Do not invent asset without authorization. |
| **P2** | Dynamic routes and computed links | Previously fixed computed `heirs.html`, `print-key.html`, `cockpit.html` targets. Static scanner checks selected patterns only, does not exhaustively parse template strings or all JS-generated navigation. Local browser checks exercise 11 anchors. | **Residual verification gap**, not a demonstrated current migration defect. Use instrumented navigation and exhaustive source/path inventory before signoff. |
| **P2** | Original wishlist defects | `gift-tasks.html` and `gift-analytics.html` absent from original; `discover.mjs` variable-shadowing confirmed byte-identical to original. | **Pre-existing functional defects**, outside migration-only fixes. Discovery fixture passes only under a test-response workaround. |

### Read-only findings and boundaries
- Staged `robots.txt` is the **one newly confirmed obsolete migration-specific metadata reference** in this review; it has **not** been changed.
- `manifest.json` is byte-identical to source; `start_url` is relative, and the staged root includes `index.html`. Its branding text is unchanged by design.
- `staging/sitemap.xml` lists 12 canonical URLs on `toolya.app` and omits some staged pages, including the wishlist landing page; completeness should be decided at publication time. The old robots sitemap URL conflicts with this file.
- No service-worker file or GitHub Pages `404.html` was found in the inspected trees. The absence of a service worker is **not** itself a migration regression.
- No runtime or browser test with real auth, estate keys, actual production database, third-party APIs or pre-existing user data was performed.
- GitHub Actions last verified green run before this documentation update: `43472844619`. This report update will trigger another CI run; do not assert it passed until checked.
- **Release decision remains NO-GO.** No functional source change, merge or publication authorized.
