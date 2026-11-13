# Toolya migration staging — NOT PUBLISHED

This directory contains an in-progress, selectively copied version of the existing Helferlein website. Its files have been placed only on branch `migration/english-paths-clean`; the root `index.html` on `main` remains the public coming-soon page.

## Completed in this staging branch
- Copied the original homepage, legal pages and 14 tool entrypoints / estate subpages using English directory names.
- Copied canonical wishlist pages from `tools/wishlist/` into `tools/wishes/`, including 27 runtime `.mjs` modules. The duplicate `amazon-wishlist/` tree has not been copied.
- Copied selected shared JS/CSS, cloud integration modules, estate assets, vendor scripts and their license files.
- Kept existing user-facing German labels, UI layout, and functionality code except path substitutions and canonical metadata references.
- Excluded source tests, SQL migration drafts, historical release checklists, CI workflow files, and obvious HTML test fixtures from staging.

## Incomplete / must verify before any release
- This is **not** a validated runnable production build. Do not merge or publish.
- Need inspect dynamic JS imports, cloud auth redirects, estate recovery/heir asset dependencies, storage origins and all CSS URLs.
- Some `a10-*` and `heir-*` assets were not copied; determine which are runtime dependencies before declaring them obsolete.
- The initial path-rewrite pass is not a complete reference graph rewrite. Run a recursive link/dependency scanner and repair all unresolved links, including JS-generated URLs.
- `manifest.json`, `sitemap.xml`, `robots.txt` were copied; verify sitemap contents reflect renamed URLs.
- Source `tools/notizen/` and other redirect-only legacy routes were not copied. Audit whether external links require compatibility redirects.
- No production Supabase changes or browser-origin data migration were performed.

## Verified limited static link sample
Five representative HTML files were scanned for static href/src targets after copying. All their local static targets were present after adding the manifest and vendor scripts; two JS template placeholders were intentionally excluded from the static check. This does **not** prove complete site correctness.

## User constraints
Only rename directories and HTML files, and repair the references necessary to preserve their operation. Do not change visible text, design, behavior, or tool functionality. Keep original Helferlein untouched and do not publish Toolya until verified.

## Dependency audit follow-up (2026-11-13)
- Scanned all 32 staged HTML pages for literal href/src targets. Missing: estate/handover.html -> assets/heir-e2ee-handoff.js (restored in commit 5648521). Two wishlist targets gift-tasks.html and gift-analytics.html were already missing from the original Helferlein source and must not be fabricated or silently redirected.
- Scanned 64 staged JavaScript, MJS and CSS files for static relative import/require and CSS url()/@import targets: no missing relative dependencies detected by these patterns.
- Checked 75 staged HTML/JS/CSS files for selected old tool paths and obsolete renamed HTML targets; no matches in those scanned files. Remaining files and dynamic computed URLs still require review.
- Static scanning is not browser validation; do not publish or merge until functional smoke tests and a full URL/route audit pass.

## Follow-up audit (2026-11-13)
- Completed additional static checks of the remaining 22 HTML/JS/CSS files for obsolete renamed routes and dynamic URL usage. Found a dynamically constructed cockpit navigation target in tools/wishes/gift-start.mjs still pointing to ./gift-cockpit.html; changed only this path to ./cockpit.html (commit 8797fd1).
- Verified source tree does not contain gift-tasks.html or gift-analytics.html, despite references from wishlist HTML and JS. These are pre-existing missing destinations; do not fabricate pages or change visible navigation without a source implementation.
- Added read-only scripts/audit_staging.py for repeatable local static link checks after branch checkout. It has not been executed against a full branch checkout in this session; do not describe it as a passing test.
- Browser functional testing of staging was not performed: staging is not published, and no runnable local copy of the exact current branch was assembled. Therefore no functional sign-off and no deployment.

## All-page offline browser smoke audit (2026-11-13)
- Added scripts/smoke_staging.py covering all 32 staged HTML pages via a localhost-only HTTP server and headless Chrome. Checks rendered DOM, captures browser script errors/resource load failures, and verifies static same-origin navigation targets without clicking, logging in or submitting forms.
- The test deliberately blocks external DNS/network access to avoid connecting to production Supabase or third-party services. Therefore 28 pages are classified OFFLINE-LIMITED because they depend on external CDN scripts (Tailwind, Supabase, etc.). These are NOT confirmed full functional passes.
- Four estate HTML pages passed without external dependency errors. Final audit had zero additional local failures, but this does not validate remote dependencies or interactive application behavior.
- GitHub Actions run 43460430391: static audit passed (103 staged files, 102 scanned references, 0 legacy route matches, 5 references to the two already missing original wishlist pages); Node JS syntax checks passed; 32-page offline browser test completed with 4 PASS, 28 OFFLINE-LIMITED, 0 local failures.
- Earlier tests flagged self-document URLs as resource errors; this was determined to be a browser event artifact and filtered without modifying site source.
- No visible page contents, design, production database, deployment or main branch changed. Remaining acceptance gate: browser verification with required external libraries available and safe production-isolated test configuration, plus interaction/navigation checks.

## Offline mocked dependency diagnostics (2026-11-13)
- Added scripts/smoke_mocked.py and GitHub Actions job step. Test-only localhost responses remove external script tags and inject inert stubs for Supabase, Tailwind, Lucide, Chart.js and other CDN APIs. CSP blocks all network connections; no production database calls or real user actions.
- First complete run 43468874746: 32/32 pages rendered; 31 MOCK-PASS, 1 MOCK-WARNING on budget/index.html from incomplete Chart.js mock dataset shape. Fixed test mock to include dataset slots (commit d195e2f), with follow-up run pending at documentation time.
- Mock browser results are diagnostics, not production functionality proof. Static anchor navigation is checked by the separate offline smoke script, but no state-changing button/form interactions were performed. Full external-library fidelity, authentication and workflows remain unverified.
- No production HTML, design, text, Supabase, default branch or deployed site was changed.
