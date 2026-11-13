# Toolya migration inventory and naming policy

Status: planning only. Do not overwrite the live toolya index.html or modify duhrrom11/Helferlein. Last source tree reviewed: 2026-11-13.

## Principles
- Selectively migrate only verified live product code and required assets, dependencies, legal pages, PWA files, and production-safe workflows.
- Short lowercase ASCII English slugs, hyphen only when essential; prefer descriptive short names over cryptic abbreviations.
- Keep index.html as each tool's entrypoint. Rename subpages to concise English names.
- Fix ALL internal references (HTML href/src, JS imports and dynamic paths, CSS url(), manifest start_url/scope, service workers/cache paths, navigation, sitemap, robots, canonical/og URLs, workflow paths, test assertions).
- Never blindly copy production data, secrets, SQL migrations, staging code, fixture data, obsolete workflows, historical documentation, or duplicate implementations.
- Supabase production must not be modified during static migration; do not insert test data. Verify auth redirects and allowlisted domains separately.
- GitHub Pages at toolya.app remains a coming-soon page until the migration has passed validation and an intentional release is approved.
- Keep existing Helferlein repository and Pages URL intact.

## Candidate route map (subject to dependency and feature audit)
| Old path | Candidate new path |
| --- | --- |
| /index.html | /index.html |
| /tools/autokosten-reifenwechsel/ | /tools/car/ |
| /tools/backform-umrechner/ | /tools/baking/ |
| /tools/digitaler-nachlass/ | /tools/estate/ |
| /tools/energie/ | /tools/energy/ |
| /tools/haushaltsbuch-kassenbon/ | /tools/budget/ |
| /tools/haustier-gesundheitspass/ | /tools/pet-health/ |
| /tools/haustier/ | /tools/pets/ |
| /tools/kassenbon/ | /tools/receipts/ |
| /tools/kfz/ | /tools/vehicle/ |
| /tools/kisten/ | /tools/boxes/ |
| /tools/küche/küchenmathe.html | /tools/kitchen/index.html |
| /tools/notizen/ | /tools/notes/ |
| /tools/parken/ | /tools/parking/ |
| /tools/parkplatz-merker-parkschein-timer/ | /tools/park-timer/ |
| /tools/pflanzen/ | /tools/plants/ |
| /tools/pflanzenpflege-giessplan/ | /tools/watering/ |
| /tools/umzugskisten-inventar/ | /tools/moving/ |
| /tools/verleih/ | /tools/lending/ |
| /tools/verliehene-gegenstaende-verwalten/ | /tools/loans/ |
| /tools/wg-kasse/ | /tools/shared-budget/ |
| /tools/wg-organisator/ | /tools/housemates/ |
| /tools/wishlist/ | /tools/wishes/ |
| /tools/zaehlerstaende-erfassen/ | /tools/meters/ |
| /datenschutz.html | /privacy.html |
| /impressum.html | /legal.html |

## Nested page examples
- /tools/estate/erben.html -> /tools/estate/heirs.html
- /tools/estate/erben-uebergabe.html -> /tools/estate/handover.html
- /tools/estate/schluessel-drucken.html -> /tools/estate/print-key.html
- /tools/notes/vertrauensperson-einladung.html -> /tools/notes/invite.html
- /tools/notes/vertrauensperson-erstellen.html -> /tools/notes/create-trustee.html
- /tools/notes/vertrauenspersonen-verwaltung.html -> /tools/notes/trustees.html
- /tools/notes/vertrauenspersonen.html -> /tools/notes/trusted.html
- /tools/wishes/gift-assistant.html -> /tools/wishes/assistant.html
- /tools/wishes/gift-dashboard.html -> /tools/wishes/dashboard.html
- /tools/wishes/gift-planner.html -> /tools/wishes/planner.html
- /tools/wishes/my-reservations.html -> /tools/wishes/reservations.html
- /tools/wishes/social-dashboard.html -> /tools/wishes/social.html
- /tools/wishes/social-feed.html -> /tools/wishes/feed.html

## Audit findings from source tree
- 629 files, about 5.46 MB, source tree not truncated.
- tests/: 161 files; .github/: 46 files; docs/: 63 files; supabase/: 68 files.
- tools/: 117 files; amazon-wishlist/: 74 files; assets/: 75 files.
- tools/wishlist and amazon-wishlist have overlapping HTML page names; determine canonical implementation and dependency graph before selecting one.
- Kalendertest.html and dashboard-test-fixture.html are candidate exclusions (verify they are not runtime dependencies).
- Numerous a10-* staging/migration assets, legacy estate files, and historical release checklists need reachability and runtime-reference analysis; names alone are not sufficient evidence for deletion.
- Keep only actually referenced CSS/JS/vendor files, and preserve license files for retained vendors.
- Keep production legal/privacy pages, and confirm they reflect the new brand and domain.

## Before deployment
1. Inventory entrypoints and all referenced assets across HTML/JS/CSS, including dynamic routes and import maps.
2. Identify canonical versions of overlapping tools and classify each source file as retain / merge / archive / exclude with justification.
3. Copy selected source into an isolated branch in duhrrom11/toolya (not directly onto live main).
4. Rewrite references and scan for broken links, old /Helferlein/ base paths, stale domain URLs, and renamed asset imports.
5. Check auth redirects, PWA service worker and cache, storage origins, legal text, accessibility, and security.
6. Validate in staging; release only after acceptance and verification. No automatic data migration across browser origins.

## Verified isolated CI and unresolved release blockers (2026-11-13)

- GitHub Actions run 43493967857 (commit 3d5f87d939ec3dcb5e2e34dea0c046391f09bc27): success. Isolated localhost two-origin storage checks 3/3; real encrypted export/import 5/5; offline owner/auth/pending conflict checks 9/9. This is not a production release approval.
- Static staging audit: 104 files scanned, 102 references checked, five unresolved links, zero legacy route occurrences. Three links target `staging/tools/wishes/gift-tasks.html` (assistant, cockpit, dashboard); two target `staging/tools/wishes/gift-analytics.html` (assistant, dashboard). Both HTML targets are absent from the branch tree, although `gift-tasks.mjs` and `gift-analytics.mjs` exist.
- Do not silently redirect these links to unrelated pages or create placeholder HTML: task management and yearly analytics require verified functional pages, correct DOM bindings, authentication and isolated browser tests. Treat these as release-blocking until implemented and validated or explicitly removed with product acceptance.
- Offline browser diagnostics report external CDN dependencies (Supabase, Tailwind, Lucide). These are offline limitations, not proof of production defects. Verify dependency behavior and CSP under approved staging conditions without production Supabase access.
- Remaining P0/P1 release gates: complete route/feature inventory, verify auth redirects and domain allowlists, review service worker/cache and origin-specific storage behavior, verify legal/privacy branding, accessibility and security, and obtain explicit acceptance. Do not infer completion from a green CI job.
- Release decision: **NO-GO**. Do not modify `main`, access production Supabase, merge or deploy during this audit.

## CI verification update (2026-11-13): runs #103 and #104

- **CI #103**: run [43496042695](https://github.com/duhrrom11/toolya/actions/runs/43496042695), commit `a7fee08c3409b76e111b382e46838f0c6ff0f5b3`, **completed / success**; no failed workflow steps.
- **CI #104**: run [43496297833](https://github.com/duhrrom11/toolya/actions/runs/43496297833), commit `d3eedce346e7eda467d383361e83bed8de9c343d`, **completed / success**; no failed workflow steps. The isolated backup harness now awaits completion of the synthetic FileReader callback instead of relying on alert polling. Production backup code was not changed.
- Latest verified static audit before this documentation update: **106 scanned files, 104 checked references, 0 missing links, 0 old route occurrences**. Previously missing `gift-tasks.html` and `gift-analytics.html` were implemented. Offline DOM contract checks passed for **35 task IDs and 30 analytics IDs**. Five real localhost anchor navigations to these pages passed. These are contract, navigation and isolated CI checks, not end-to-end verification with live authentication or real user data.
- The earlier findings section above is a **historical snapshot** of run #95: its five missing links and absent HTML files have since been resolved. Do not treat those findings as currently outstanding.
- **Remaining P0/P1 release gates (OPEN):** full feature-level browser behavior of gift tasks/analytics (including form actions, empty/error states, authorization and permissions); complete route/feature inventory and canonical source review; staging verification of authentication redirect URLs and provider domain allowlists; service worker/cache and cross-origin storage migration behavior; privacy/legal brand/domain correctness; accessibility and security review; explicit release acceptance. External CDN dependencies reported in offline tests require staging verification and do not themselves prove production failure.
- **Release decision: NO-GO.** All work stays on `migration/english-paths-clean`; do not modify `main`, connect to production Supabase, merge or deploy.

## Functional wishes test extension (2026-11-13)

- **CI #105**: run [43496797438](https://github.com/duhrrom11/toolya/actions/runs/43496797438), commit `2bf72bffa0dc7ee33ae32b8953e9c573608b695a`, **completed / success**, no failed workflow steps.
- Added `scripts/test_wishes_browser.py` and a CI step for seven localhost-only browser scenarios: guest access, empty data and load failure on both `gift-tasks.html` and `gift-analytics.html`, plus a synthetic task form submission. The test intercepts external scripts and injects a local mock client; it must not access production Supabase or real user data.
- **Verification pending** for this new functional test suite: CI #108 (43497099541) was cancelled before completion; subsequent CI runs must be checked. The documentation commit triggered [CI #109](https://github.com/duhrrom11/toolya/actions/runs/43497141041). Do not mark functional scenarios as passed until its results and logs are reviewed.
- **P0/P1 still OPEN**: verify all new functional browser scenarios; test task update/delete, analytics year closing/export and permission boundaries with isolated fixtures; validate staging auth redirects/domain allowlists, complete route/feature inventory, service worker and origin-storage behavior, legal/privacy text, accessibility and security; require explicit release acceptance.
- **Release remains NO-GO.** No changes to `main`, production Supabase, merges or deployments.

## CI #110 and functional-test assertion correction (2026-11-13)

- [CI #110 / 43497195405](https://github.com/duhrrom11/toolya/actions/runs/43497195405), commit `a2bcf412953c829105913f67567b35db52735ae8`: **completed / success**. Static audit 106 files / 104 references / 0 missing / 0 legacy routes; offline DOM contracts 35 task IDs and 30 analytics IDs; all 16 localhost anchor navigation checks passed (including five restored wishes links).
- The seven reported browser cases were guest/empty/load-error for both pages plus task form. **Important false positive**: the form case logged `PASS` while its status was `Aufgabe konnte nicht gespeichert werden.` because a substring check matched `gespeichert` inside `nicht gespeichert`. This was **not** evidence of successful task creation.
- Corrected the seventh case to **form-error** with an explicit synthetic insert failure and an exact expected failure message. The successful form submission path remains **P1 OPEN** pending a separate positive-path fixture and verification. The corrected assertion must pass in follow-up CI before being considered verified.
- Other **P0/P1 OPEN**: positive create/edit/delete task behavior and permission boundaries, analytics year changes/closing/export, staging auth redirects and allowlists, complete route/feature inventory, PWA cache/origin storage, legal/privacy branding, accessibility/security and explicit release acceptance.
- **NO-GO**; no `main` changes, production Supabase, merge or deployment.

## Isolated wishes form verification follow-up (2026-11-13)

- [CI 43498097504](https://github.com/duhrrom11/toolya/actions/runs/43498097504) at `a59faf77`: **completed / success**. Job logs confirm `PASS gift-tasks form-error` with the exact expected `Aufgabe konnte nicht gespeichert werden.` message. This verifies the corrected negative-path assertion, not successful insertion.
- [CI 43498118711](https://github.com/duhrrom11/toolya/actions/runs/43498118711) at `9746a4fd`: status must be checked separately; do not infer success from earlier runs.
- Added a distinct **form-success** browser scenario at `10360b3e` with isolated mock insert payload capture, exact user ID/title/status checks, rendered task heading, success message and form reset assertions. This increases the suite to eight scenarios. [CI 43498500705](https://github.com/duhrrom11/toolya/actions/runs/43498500705) must confirm this positive path before marking it verified.
- **P1 OPEN until CI success:** successful task insertion and DOM update. Additional P0/P1 remain: update/delete and permission checks; analytics year assignment/closing/export; full route/feature inventory; staging auth redirects/domain allowlists; cache and origin-storage review; legal/privacy branding; accessibility/security; explicit acceptance.
- **NO-GO**; no production Supabase access, no `main` modification, merge or deployment.

## Positive task form regression verified (2026-11-13)

- [CI 43498614699](https://github.com/duhrrom11/toolya/actions/runs/43498614699), commit `9782dd2a`: **completed / failure**, isolated wishes functional browser step. Job logs: seven other scenarios passed; `gift-tasks form-success` failed with `Aufgabe konnte nicht gespeichert werden.` despite the correct mocked insert payload. No task heading was rendered.
- Root cause in `staging/tools/wishes/gift-tasks.mjs`: task rendering assigned `h=document.createElement('h3')` without declaring `h` in an ES module, causing a `ReferenceError` after successful mock insertion. Fixed by declaring `h` alongside `item` at commit `ae2e0a36a3425789198cb62f5ad04eef9859b0b2`.
- [CI 43499201518](https://github.com/duhrrom11/toolya/actions/runs/43499201518), commit `ae2e0a36`: **completed / success**, no failed steps. Logs explicitly confirm `PASS gift-tasks form-success`: one mock insert into `wishlist_gift_tasks` with `user_id=offline-user`, title `Offline-Aufgabe`, status `open`; `renderedTask=["Offline-Aufgabe"]`, exact `Aufgabe gespeichert.` status and reset form. Negative `form-error` also passed. Static audit 106 files, 104 references, zero missing/legacy routes.
- **Verified only under isolated mocked browser conditions**; no claim of real Supabase writes or production permissions. **P1 still OPEN** for update/delete, unauthorized access and row-level security checks, analytics year assignment/closing/export and comprehensive data edge cases. Other P0/P1 remain: full route/feature inventory, staging auth redirect/domain allowlists, service worker/cache and origin storage, legal/privacy branding, accessibility/security and explicit release acceptance.
- **Release NO-GO**. Do not touch `main`, production Supabase, merge or deploy.

## Task mutation browser contracts (2026-11-13)

- Added `scripts/test_wishes_mutations.py` and an always-run CI step, on `migration/english-paths-clean`. Eight isolated localhost Chrome cases exercise task **edit success/failure**, **done status success/failure**, **delete success/failure**, **synthetic permission denial**, and **unauthenticated guest**. The fixtures seed a single offline task, intercept Supabase in-page and verify rendered task headings, exact status messages, operation types, and task/user scoped `eq` filters. No production connection is permitted.
- The previous successful [CI 43499201518](https://github.com/duhrrom11/toolya/actions/runs/43499201518) verified task form insert success and failure. [CI 43499537043](https://github.com/duhrrom11/toolya/actions/runs/43499537043) is the documentation-only follow-up and must be checked to completion.
- The new mutation suite is **not yet verified** until [CI 43499712905](https://github.com/duhrrom11/toolya/actions/runs/43499712905) or a later full run passes. Intermediate runs were superseded/cancelled by branch commits; a cancelled run is not a passing test.
- **P1 OPEN** until the new mutation suite passes; even then real database row-level security, cross-user denial, concurrency, and authorization redirects require approved isolated staging verification. Additional **P0/P1 OPEN**: analytics year assignment/closing/export, route and feature inventory, auth redirect allowlists, service worker/cache and origin storage, privacy/legal branding, accessibility/security and explicit release sign-off.
- **Release NO-GO**. No changes to `main`, no production Supabase queries, merge or deployment.

## Task mutation suite verified in CI (2026-11-13)

- [GitHub Actions 43499805003](https://github.com/duhrrom11/toolya/actions/runs/43499805003), commit `d17c73f61b003eac98de5e705b674cfed04a3a12`: **completed / success**, no failed workflow steps.
- Job logs show **PASS for all eight** `scripts/test_wishes_mutations.py` scenarios: `edit`, `edit-error`, `status`, `status-error`, `delete`, `delete-error`, `permission`, `guest`. Successful edit updates the rendered title to `Changed`; successful status change renders `Wieder öffnen`; successful deletion removes the task. On simulated failure the original task remains visible, with the expected error message. Guest access performs no write.
- Mutation calls target `wishlist_gift_tasks` and include `eq('id','task-1')` and `eq('user_id','offline-user')`; simulated permission denial preserves the original task. These assertions verify client-side behavior under isolated local mocks, **not real Supabase RLS enforcement**.
- Static audit: 106 files, 104 references, 0 missing, 0 legacy route occurrences. No confirmed new test failures, so no application fix was needed.
- **P1 OPEN:** real authorization/RLS verification in approved nonproduction environment, cross-user access, task concurrency and edge cases; analytics year assignment, closing, export and permissions. **P0/P1 OPEN:** route/feature inventory, staging auth redirects/domain allowlists, service worker/cache/origin storage, legal/privacy branding, accessibility/security, explicit release sign-off.
- **Release NO-GO**; no `main` changes, no production Supabase access, merge or deployment.

## Analytics isolated browser suite (2026-11-13)

- Added `scripts/test_wishes_analytics.py` and CI workflow step, covering eight localhost-only scenarios: gift year assignment success/failure, closing success/failure, closing without mandatory confirmation, local JSON export, synthetic RPC permission denial, and unauthenticated guest. All database calls use injected mocks; browser CSP blocks outbound connections. Tests assert RPC names and arguments, UI messages, and local export structure.
- [CI 43500511699](https://github.com/duhrrom11/toolya/actions/runs/43500511699) is the follow-up for this new suite; **not yet verified**. Earlier intermediate CI 43500498918 was cancelled by a subsequent branch commit and is not evidence of success.
- **P1 OPEN until logs confirm** all eight analytics scenarios. Mocked authorization denial is not evidence of actual RLS enforcement. Further P0/P1: real nonproduction RLS and cross-user controls, historical closing immutability and complete snapshots, export file integrity, year edge cases, full route/feature inventory, staging auth redirects and allowlists, cache/origin-storage, legal/privacy, accessibility/security and explicit acceptance.
- **Release NO-GO**. No `main` modifications, production Supabase access, merge or deployment.

## Analytics browser verification complete (2026-11-13)

- [CI 43500594377](https://github.com/duhrrom11/toolya/actions/runs/43500594377), commit `31795be1`: **completed / failure** solely in isolated analytics browser checks. Seven of eight scenarios passed; `year` failed because the test incorrectly expected a successfully reassigned gift to disappear from the editor. Logs showed successful `wishlist_set_gift_year` RPC with `p_plan_id=gift-1,p_year=2025`, status `Geschenkjahr gespeichert.`, and the gift correctly visible under 2025.
- Fixed the **test assertion only** at commit `ea59c4b004f66947a534945a02adbb44c25a9f1a` to verify the reassigned year in the editor. No application changes.
- [CI 43501259732](https://github.com/duhrrom11/toolya/actions/runs/43501259732), commit `ea59c4b0`: **completed / success**, no failed steps. Job logs confirm **PASS all eight** `scripts/test_wishes_analytics.py` cases: `year`, `year-error`, `close`, `close-error`, `close-confirm`, `export`, `permission`, `guest`. Local JSON export includes `schema_version=1`, expected year/gift counts and filename. Static audit: 106 files, 104 references, zero missing/legacy routes.
- **P1 remaining:** actual RLS and cross-user permissions in approved nonproduction environment, durable closing immutability, complete historical snapshots, real export file round-trip and year edge cases. Other P0/P1 gates (inventory, auth redirect allowlists, origin storage/cache, privacy/legal, accessibility/security, release acceptance) remain open. Local mocks do not prove production database behavior.
- **Release NO-GO**. No `main` changes, production Supabase access, merge or deployment.

## P0/P1 isolated prioritization and legal-branding evidence (2026-11-13)

- [CI 43501616716](https://github.com/duhrrom11/toolya/actions/runs/43501616716), commit `6fb30b80`: **completed / success**, no failed workflow steps. This verifies the previous analytics documentation-only commit and existing automated checks; it is not a release approval.
- **Confirmed P1 brand/legal consistency blocker (static source inspection):** `staging/privacy.html` has an HTML `<title>` containing `Helferlein` and its first privacy section names the offer `Helferlein`; `staging/legal.html` also has an HTML `<title>` containing `Helferlein`. Both already use `https://toolya.app/privacy.html` / `https://toolya.app/legal.html` canonical URLs. Review brand wording and the full accuracy of privacy/legal statements before any release. Do not automatically rewrite provider identity, privacy disclosures or legal obligations.
- **Next safe isolated priorities:** (1) read-only static checks for brand/domain consistency and external origins in staging HTML/JS; (2) deterministic offline accessibility checks for labels, focus and form feedback; (3) static route/feature inventory with source-to-staging coverage. These can be developed without production data or auth credentials.
- **Cannot close via local mocks alone:** Supabase RLS and cross-user access, approved staging auth redirect/domain allowlists, irreversible historical closing persistence, actual third-party CDN/CSP behavior and legal acceptance. Keep these P0/P1 OPEN until independently verified.
- **Release NO-GO**. No `main` modification, production Supabase access, merge or deployment.

## Release-focused gap triage (2026-11-13)

- Latest three verified full runs: [43501259732](https://github.com/duhrrom11/toolya/actions/runs/43501259732), [43501616716](https://github.com/duhrrom11/toolya/actions/runs/43501616716), and [43501905130](https://github.com/duhrrom11/toolya/actions/runs/43501905130): **completed / success**. Existing isolated browser coverage is sufficient for the tested UI contracts; do not add broad redundant suites.
- **Confirmed release-brand mismatch corrected on migration branch:** `staging/index.html`, `staging/privacy.html`, `staging/legal.html` displayed the old `Helferlein` product name in metadata/visible branding despite `toolya.app` canonicals. Replaced the exact display brand with `Toolya` and updated the home Twitter title. Technical asset filenames, provider identity, substantive legal text and data flows were not rewritten. This is a targeted source fix; follow-up CI must still be confirmed.
- **Minimal release gates:** **P0** obtain explicit release acceptance and validate login/redirect allowlists and user-data isolation in an approved nonproduction environment (local mocks do not prove RLS); **P1** check legal/privacy accuracy and brand/domain review, and verify PWA/service-worker and origin storage behavior before cutover. Full route/source inventory should be assessed for any genuinely missing release-critical features rather than expanded into blanket testing.
- **NO-GO** until these release-critical gates are resolved and follow-up CI succeeds. No `main`, production Supabase, merge or deployment.

## Final targeted release-gate review (2026-11-13)

- [CI 43502400174](https://github.com/duhrrom11/toolya/actions/runs/43502400174), commit `e70b0177`: **completed / failure** in isolated analytics export check; seven other analytics cases passed. Log shows JSON download filename and success status but `exports=[]` in the test report. The test captures `Blob.text()` asynchronously and snapshots results after only 450ms, so this run does **not** establish an application export defect. Increased only the test report delay to 1200ms in commit `a5d8d3e0`; [follow-up CI 43503182102](https://github.com/duhrrom11/toolya/actions/runs/43503182102) must pass before treating this as resolved.
- **Auth gate (OPEN, external verification):** staged homepage uses Supabase email/password `signUp` and `signInWithPassword`; no OAuth/reset redirect code was found in that page. This does not establish project-level Auth Site URL/redirect allowlists, other tools' flows, or real RLS/cross-user isolation. Verify only in an authorized nonproduction environment.
- **PWA/origin gate (PARTIAL, external acceptance):** `staging/manifest.json` now names `Toolya`, starts at `./index.html`; no `serviceWorker` registration was found in the homepage. Earlier isolated two-origin encrypted backup checks passed, but browser localStorage is origin-scoped: users must be given a safe migration/backup procedure and explicitly accept that existing origin data do not automatically transfer. Do not rename the legacy `Helferlein` backup format identifier without compatibility proof.
- **Legal gate (PARTIAL, external approval):** `staging/privacy.html` and `staging/legal.html` display the Toolya brand and canonical URLs on `toolya.app`. Provider identity and substantive disclosures were left intact. Obtain legal/privacy content approval before release.
- **Release approval gate (OPEN):** explicit acceptance required after final CI, nonproduction Auth/RLS checks, domain/origin migration decision and legal sign-off. **NO-GO**; no `main`, production Supabase, merge or deployment. No new broad test suites.
