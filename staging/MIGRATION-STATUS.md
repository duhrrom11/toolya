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
