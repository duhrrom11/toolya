# English 1.0 – evidence and main reconciliation (2026-11-24)

## Verified individual tests

CI run [45490125362](https://github.com/duhrrom11/toolya/actions/runs/45490125362/job/138785890353), head a6c118ea5d474725748caef0f6869f8d14c05548, checked synthetic merge c8a2bca. The job as a whole failed (365 passed, 8 failed), but the following exact cases passed:

| TAP case | Verified scope |
| --- | --- |
| 241 | Seven PDF export paths render EN and DE without mutating synthetic records |
| 256 | Dynamic budget cards and receipt badges provide paired display-only DE/EN copy |
| 261 | Budget QR sticker labels round-trip without changing private QR payload |
| 272 | Household and parking PDFs localize report values without modifying stored records |

These are individual regression-test results, not complete app acceptance. No production test records were used in these isolated tests.

## Main reconciliation

Main 5cccf344a680dfe081aca1868b835a69acaf00b8 intentionally retires mascots.html and en/mascots.html (2cfd765 and 21b35da). Merge 50c2fba preserves all release changes and the current shared mascot settings. Commit 12cdad1 updates navigation, PWA, SEO and audit expectations to 16 public bilingual pairs and 13 English guide cards; 12 canonical apps remain. Both retired pages must remain absent. New CI is required.

## Not accepted yet

34 opt-in application views and 38 heuristic message-file candidates require further runtime review. These counts are not confirmed translation defects. Complete authenticated and dynamic journeys, accessibility, export checks and SEO release readiness remain open. English public noindex must stay in place until acceptance. Do not merge into main or deploy on this evidence alone.

## Verified evidence after main reconciliation

Head a7cf47e1a3fa21622a47b370e107231e6f430d68:

- [Translation quality](https://github.com/duhrrom11/toolya/actions/runs/45491783881/job/138791735669): 373 tests passed, zero failed; 32 local bilingual layout checks, zero visual review warnings; public wishlist editorial DE/EN at 320 and 390 px; 48 application shell and 36 authenticated shell checks passed. These are shell checks, not exhaustive state-by-state acceptance.
- [Platform tests](https://github.com/duhrrom11/toolya/actions/runs/45491783922/job/138791778761): 124 unit/static tests passed, including PWA, sitemap, social previews and original mascot assets; isolated real SDK sign-in, 12 tool routes and 10 reloads, refresh and sign-out passed; two-device isolated synchronization passed. The overall job failed on navigation to retired /mascots.html. Commit df57980 replaces that obsolete navigation with an English mascot-settings assertion; new CI required.
- [Estate/security](https://github.com/duhrrom11/toolya/actions/runs/45491783922/job/138791777300): isolated mail, PostgreSQL security and recovery, household access and encrypted backup cases passed; Chromium owner/trustee security, print, local QR, mobile widths 320/375/768/1280/1440 passed. This is security/functional evidence, not comprehensive translation evidence.
- [Strict audit](https://github.com/duhrrom11/toolya/actions/runs/45491783848): 70 HTML, 129 JS/MJS, 16 English public pages, zero missing routes, zero public German heuristic candidates, five language entrypoints assign document language. All 16 English public pages remain noindex; 34 app views and 38 message-file candidates still require review. Strict gate remains failed.

No production test records were created. No release approval is granted.

## Hardened shell checks
Head ada9f09: quality run 45492725039, job 138794998373 passed 373 static tests, 32 layout checks, 72 anonymous and 54 authenticated shell cases at 320/375/768px. Draft CI head a50a7fc: nine workflows succeeded, full isolated browser workflow skipped intentionally, strict gate failed. New occasion/bookmark copy changes require fresh focused regression evidence; no full acceptance claimed.

## Verified fast CI at b49803a
[Quality run 45496003133 / job 138806549452](https://github.com/duhrrom11/toolya/actions/runs/45496003133/job/138806549452): 384 tests passed, zero failed; both ten-tool validation and meter-calendar regression tests passed (349–350). 12 canonical tools, 16 marketing pages and 16 namespaces: zero critical or review findings in catalogue check. Nine workflows succeeded; full browser suite skipped on draft; strict audit failed (34 incomplete views, 38 candidate files, 16 noindex pages). This is not exhaustive runtime acceptance. New Connect, backup and bulk-action fixes require fresh CI evidence.

## Verified fast CI at 2d30643
[Translation quality job 138817573566](https://github.com/duhrrom11/toolya/actions/runs/45499184103/job/138817573566): 388 tests passed, 0 failed. Four additional Connect, backup and bulk-copy tests passed. [Strict audit](https://github.com/duhrrom11/toolya/actions/runs/45499184110): 36 candidate files (previously 38), 34 incomplete app views, 16 noindex pages, zero missing routes or public German candidates. Candidate counts are heuristic, not runtime acceptance. New catalogue triage records evidence per occurrence without changing the strict condition. Shared, composite and unmatched source occurrences remain review tasks; catalogue matches do not certify runtime usage or user-data protection.

## Verified fast CI at 09652fc
[Quality job 138818497803](https://github.com/duhrrom11/toolya/actions/runs/45499443923/job/138818497803): 389 tests passed, 0 failed. Ten workflows succeeded, full isolated browser workflow skipped, strict failed. [Strict audit job 138818497947](https://github.com/duhrrom11/toolya/actions/runs/45499444429/job/138818497947): 218 source occurrences across 36 files; 184 catalogue matches (runtime unverified), 25 shared-context, 6 composite, 3 unmatched. The three unmatched literals were identified from the JSON artifact: app.mjs save wish, lists-dashboard.mjs save without a list, gift-start.mjs distinct checkpoints. Budget duplicate confirmation and the two wishes network-error prefixes already have catalogue rules. New changes address these unmatched literals and explicit dashboard statuses and framed confirmations; full runtime acceptance remains open.

## Verified fast CI at 6b19939
[Quality job 138820554342](https://github.com/duhrrom11/toolya/actions/runs/45500035844/job/138820554342): 392 tests passed, 0 failed. [Strict audit job 138820554397](https://github.com/duhrrom11/toolya/actions/runs/45500036108/job/138820554397): 187 catalogue matches, 25 shared-context candidates, 6 composite candidates, zero unmatched family literals. Ten workflows succeeded, one skipped, strict failed. Shared presentation changes require fresh evidence; no runtime release acceptance claimed.

## Verified fast CI at 0f3ac5c
[Quality job 138829883106](https://github.com/duhrrom11/toolya/actions/runs/45502718383/job/138829883106): 394 passed, 0 failed. [Strict audit job 138829882557](https://github.com/duhrrom11/toolya/actions/runs/45502718438/job/138829882557): 187 catalogue matches, 19 shared candidates, 6 composite, zero unmatched; 33 candidate files, 34 incomplete views and 16 noindex pages. Current main c15ec1c must be reconciled before release. No full runtime acceptance; existing gate unchanged. New gift view rename, duplication and import frames require fresh tests.

## Main reconciliation and fast CI at 53e0170
Merged c15ec1c as second parent of 53e0170; retained home updates, redesigned wishes hero placement and parking GPS/affiliate updates alongside release translations. [Quality job 138852828012](https://github.com/duhrrom11/toolya/actions/runs/45509380053/job/138852828012): 393 passed, 2 failed because the parking PDF helper followed the extraction marker. The fix restores its position and adds six isolated GPS/PDF regression cases; GPS-required saving now refuses missing geolocation APIs, while ordinary saving falls back without coordinates. Strict audit remains blocked (34 views, 33 candidate files, 16 noindex pages; 187 catalogue matches, 19 shared, 6 composite). No full browser acceptance or production writes.

## Fast CI at 8249e27
[Quality job 138853392091](https://github.com/duhrrom11/toolya/actions/runs/45509542820/job/138853392091): 397 passed, 4 failed. Both prior PDF failures resolved. GPS tests exposed a mistaken replacement of the inner rather than outer fallback and premature microtask assertions. Corrected the two distinct branches and wait for event-loop completion in fixtures. Six direct isolated branch checks passed in the development tool; full Node CI still required. Strict gate remains blocked.

## Verified fast CI at bb5111b and review of all 25 non-catalogue candidates
[Quality job 138854075255](https://github.com/duhrrom11/toolya/actions/runs/45509744223/job/138854075255): 401 passed, 0 failed; ten regular workflows succeeded, full browser skipped, strict failed. [Strict artifact](https://github.com/duhrrom11/toolya/actions/runs/45509744396/artifacts/14973868583) was downloaded and read. Review: 16 German home occurrences (14 distinct strings) have explicit English route counterparts; B3 plant layout warning and shared backup confirmation have exact runtime catalogue rules; cookie settings already localized but estate/admin event subscriptions missing, now added. Six composite occurrences: budget duplicate confirmation (escaped line breaks), two wishes cloud-error prefixes preserving diagnostic suffix, template overwrite frame preserving name, two list count patterns. All have existing translators, now covered together by targeted regression tests. Additional unassigned-selection result now translated. These are source/catalogue findings, not authenticated browser acceptance. Strict gate unchanged, 34 views and 16 noindex pages remain pending.

## Verified fast CI at 6c1f324
[Quality job 138978199156](https://github.com/duhrrom11/toolya/actions/runs/45546781589/job/138978199156): 405 passed, zero failed. [Watering job 138978196069](https://github.com/duhrrom11/toolya/actions/runs/45546780996/job/138978196069) and [dashboard Connect job 138978195668](https://github.com/duhrrom11/toolya/actions/runs/45546780983/job/138978195668) failed the same adapter fixture because 2026-11-24 was no longer future. Adapter fixture now derives local calendar dates relative to execution; explicit-date pure unit tests and production validation unchanged. Strict job 138978197093 remains blocked: 34 partial views, 16 noindex pages, 33 source candidate files (187 catalogue, 19 shared, 6 composite). Full acceptance must be executed on a green current revision; no production writes or release approval.

## First Ready-for-Review acceptance at d084f27
Six of ten newly triggered workflows succeeded; strict gate failed and the isolated full-tool browser workflow was still in progress when checked. [i18next job](https://github.com/duhrrom11/toolya/actions/runs/45547870621/job/138981710012) passed all 20 tool locale/CDN-mode checks before failing at removed homepage category controls. [Platform job](https://github.com/duhrrom11/toolya/actions/runs/45547870648/job/138981710711) passed 124 unit tests, real SDK navigation to 12 tools and 10 reloads, plus isolated two-device CAS/offline/account-switch checks, then failed at removed finance filter. Both current homepages deliberately omit search and category buttons; updated browser assertions verify all 12 visible unique tool cards, category membership, count, localized routes, favourites and accessibility rather than clicking removed controls. Search/filter interaction coverage is retired because the feature was removed on main, not because failures are ignored. Full browser acceptance remains pending; strict gate and noindex unchanged. No production test data.

## Full CI at 35be2a6
[Quality](https://github.com/duhrrom11/toolya/actions/runs/45548369964/job/138983332659): 405/405 unit, 32 bilingual layout checks, zero warnings, public wishlist editorial at 320/390, 72/72 application-shell and 54/54 authenticated-shell checks. i18next workflow passed. [Platform](https://github.com/duhrrom11/toolya/actions/runs/45548370219/job/138983333718): 124/124 unit, real SDK 12 tools and 10 reloads, isolated two-device CAS/offline/account-switch, 12-route 320px mascot browser including 16 emotions and keyboard/touch, and isolated admin finder passed. Design foundation then failed on removed /mascots.html. Replaced retired gallery route with /en/, retaining seven routes and three widths, consent reopen, shared brand, legal navigation contrast, estate keyboard/contrast checks, and adding bilingual integrated settings keyboard opening, character persistence, hide/restore, Escape and focus return. Full isolated browser job 138983453880 was still in progress at last inspection; no claim of completion. Strict gate unchanged (34 incomplete views, 16 noindex pages, 33 candidate files). No production writes.

## Full CI and responsive regression at 77def38

- [Isolated browser job 139008170285](https://github.com/duhrrom11/toolya/actions/runs/45556029827/job/139008170285): 191 passed, zero failed. Previous head f0d7fd4 had 181 passed and ten failed with horizontal overflow in both locales. Shared B3 border-box sizing resolves the ten failing tests at 320/375/768px in both languages (60 locale/width checks, tolerance 2px). [Browser evidence](https://github.com/duhrrom11/toolya/actions/runs/45556029827/artifacts/14995049881). No assertion weakened.
- [Translation quality job 139008169519](https://github.com/duhrrom11/toolya/actions/runs/45556029611/job/139008169519): 72/72 anonymous and 57/57 authenticated shell views passed. Authenticated admin stats fixture checks chart labels, accessible descriptions, locale-specific numeric/date formatting, empty states and no refetch on locale change. [Evidence](https://github.com/duhrrom11/toolya/actions/runs/45556029611/artifacts/14994878962).
- Twelve of thirteen workflows succeeded. [Strict audit job 139008170001](https://github.com/duhrrom11/toolya/actions/runs/45556029921/job/139008170001) failed: 34 opt-in views, 33 source candidate files (187 catalogue matches, 19 shared-context, 6 composite), 16 English noindex pages, zero missing routes and public German heuristic candidates.

Scope: verified responsive shell regression and isolated functional tests, not exhaustive visual, accessibility, export or translation acceptance. No production test data, release approval, merge or deployment. All strict conditions and noindex retained. Evidence refers specifically to 77def38, not future commits.


## Full CI and composite runtime evidence at 6c967b8

All 16 workflows completed: 15 successful, strict release gate failed. [Isolated Chromium job 139221703928](https://github.com/duhrrom11/toolya/actions/runs/45618912412/job/139221703928): 197 passed, zero failed (4.9 minutes). [Browser artifact](https://github.com/duhrrom11/toolya/actions/runs/45618912412/artifacts/15023958243).

| Composite occurrence | Verified isolated runtime evidence |
| --- | --- |
| Budget duplicate confirmation | Actual saveReceipt handler; DE/EN exact multiline confirmation, cancellation, unchanged snapshot and no additional mock write. |
| Wishes assigned count | Actual mountListsDashboard with seven assigned wishes; DE/EN counters. |
| Wishes unassigned count | Three unassigned wishes; actual selection action, translated count and status, unchanged fixture and zero writes. |
| Gift layout template overwrite | Actual gift-start module; DE/EN/DE confirmation, private slot label preserved, cancellation, unchanged preferences and zero writes. |
| Wishes cloud insert network failure | Actual extracted app.mjs handler with injected dependencies; rejected mock insert, uncertainty wording and literal diagnostic suffix preserved in DE/EN/DE. |
| Wishes cloud update network failure | Actual extracted app.mjs handler with injected dependencies; rejected mock update, owner/wish/version filters preserved, no success report, unchanged fixture. |

Same run passed homepage login/registration validation, shared cloud replacement cancellation before backup/write, and budget PDF retry after cloud readiness. [Translation quality job 139221530779](https://github.com/duhrrom11/toolya/actions/runs/45618912114/job/139221530779): 406/406 tests, 72/72 anonymous and 57/57 authenticated shell checks. [Strict job 139221530749](https://github.com/duhrrom11/toolya/actions/runs/45618912216/job/139221530749): 187 catalogue matches runtime-unverified, 19 shared-context occurrences, 6 composite occurrences, 33 source files, 34 partial views, 16 English noindex pages. Static counts are retained; isolated runtime evidence does not establish exhaustive authenticated, accessibility, export, SEO or live release acceptance. No production test data, merge, deployment or release approval.


## Shared runtime evidence at ca258d8

[Isolated browser run 45621301045](https://github.com/duhrrom11/toolya/actions/runs/45621301045/artifacts/15025866037): 199 passed, 0 failed. Fifteen regular workflows succeeded; strict gate failed. The previous d978d65 browser run found an actual untranslated B3 storage warning on the vehicle tool (197 passed, one failed; [job](https://github.com/duhrrom11/toolya/actions/runs/45620254380/job/139226170153)). Central exact-message translation fixed the failure without changing the assertion. Confirmed: DE/EN local storage failure, editor remains open, cancel restores panel state and no cloud write. Homepage backup password length and wrong file extension are verified on both localized routes. Earlier 6c967b8 evidence covers homepage login/registration validation and shared cloud replacement cancellation. These are scoped runtime paths, not a claim that all 19 shared occurrences or 187 catalogue candidates are accepted.

### Catalogue runtime review protocol

Retain the strict audit's static counts. For each candidate, record source path/line, exact owned message, family, actual triggering UI or handler, DE/EN assertion, private-data invariance where relevant, and immutable CI job/artifact. Catalogue matching alone is not runtime evidence. Group duplicate literals only when the shared execution path is demonstrated; otherwise verify each source occurrence independently. Start with validation/error branches in the ten main tools, then wishes, estate, dashboard and admin. The first shared B3 error and home validation evidence above must not be counted as 187 catalogue candidates without mapping to the audit occurrences. No release waiver.


## First catalogue runtime batch (pending CI)
Source revision f0a3e40: car/index.html:626 saveCar missing name; meters/index.html:638 saveTarifs invalid gas calibration; meters/index.html:662 saveReading invalid date. New isolated Chromium tests trigger the real handlers in DE/EN/DE and assert exact dialogs, unchanged private inputs, unchanged cloud snapshot and zero writes. These three source occurrences are pending CI, not accepted. Previous merged checkout 82e6580 (main 5587c1a) passed 202/202 browser tests including both consent states and backup failures ([artifact](https://github.com/duhrrom11/toolya/actions/runs/45623159798/artifacts/15026178063)); three static parking regressions remain because main removed the old GPS status component. No strict release waiver.


## Runtime evidence at 9e67d84 and static review at c262840
Merged checkout 19331f7: [browser job 139247662228](https://github.com/duhrrom11/toolya/actions/runs/45626357180/job/139247662228) passed 205/207. Both GPS denial/missing API regression tests passed (required GPS blocks write; ordinary save falls back with null coordinates in both locales). saveCar missing-name catalogue occurrence passed. saveReading/saveTarifs failed before validation because the test referenced the car cloud controller instead of metersCloudController; corrected in c262840, pending browser evidence. Static checkout 268d15b: 405/406 passed, including countdown and accessible GPS feedback checks; remaining successful GPS mock case asserted button state before cross-context async completion. Wait for one event-loop turn without weakening the assertion. Next catalogue batch: car saveTireSet missing vehicle (f0a3e40 line 720), saveEvent missing vehicle/date/title (754), updateEvent missing description/date (853). Real handlers, exact DE/EN/DE messages, unchanged form/snapshot and zero writes. Pending CI; no release waiver.

## Full CI evidence at 4b3af6c (before main reconciliation)
All 15 regular workflows passed; strict alone failed. [Quality job](https://github.com/duhrrom11/toolya/actions/runs/45629349519/job/139258048825): 406/406 tests, 72/72 anonymous and 57/57 authenticated shell checks, public wishlist editorial at 320/390. [Isolated browser job](https://github.com/duhrrom11/toolya/actions/runs/45629350461/job/139258267834): 210/210. [Platform job](https://github.com/duhrrom11/toolya/actions/runs/45629349391/job/139258048695): 125/125, SDK auth navigation 12 tools/10 reloads, CAS/offline/account switch, 16 emotions, 7 routes × 3 widths bilingual integrated settings, consent, handover export and wrong password. [Estate security job](https://github.com/duhrrom11/toolya/actions/runs/45629349391/job/139258049394): 25 isolated mail cases; PostgreSQL 17.12 RLS/EXECUTE, cross-owner isolation, revoke, encryption/recovery; WG permissions; encrypted backup; real Chromium owner/trustee QR and A4 print at 320/375/768/1280/1440. These support shell language/layout, auth/cloud isolation, keyboard, and specific export/security criteria, not exhaustive per-view nested-state acceptance or screen-reader verification. [Strict job](https://github.com/duhrrom11/toolya/actions/runs/45629349514/job/139258061725): 34 partial views, 16 noindex, 33 candidate files, 212 occurrences (187 catalogue, 19 shared, 6 composite). No waiver. Main 48cb0af has five additional commits, two files; merged nonoverlapping line hunks from common ancestor c15ec1c, preserving release changes and nearby search. New merged revision requires fresh CI. No production writes or deployment.
