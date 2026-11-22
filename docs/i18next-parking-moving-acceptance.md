# i18next pilot acceptance — parking and moving

Date: 2026-11-22
Branch: `feature/i18n-de-en-foundation-20261121`
Validated commit: `3b71ca8cfba0fe7cb953b800ac0e4da101a42821`

## Verified checks

- i18next migration pilot: GitHub Actions run 44999742962, both `parking-browser` (job 137138434268) and `node-regressions` (job 137138434517) passed.
- i18n static checks: run 44999742864 passed.
- Isolated Toolya browser tests for earlier commit `b1c5654`: run 44999471958 passed.
- Full isolated browser tests for validated commit: run 44999742893 still running at time of documentation; **not yet accepted**.

## Browser coverage

`tests/i18n/parking-i18next-playwright.cjs` serves a small local HTML fixture with real shared i18n modules. It runs four Chromium scenarios: parking/moving × i18next supplied/absent. External requests are blocked, so no live website or Supabase access occurs. Assertions cover DE→EN→DE button state, parking timer text, shared diagnostic prefix, moving-specific dialog, moving save-location label, sign-in loading text, and step-by-step guide text. The missing-i18next case verifies the legacy fallback. The supplied-i18next case currently uses a test double for the i18next API, **not the real CDN bundle**.

## Scope and outstanding work

This is an isolated i18n-pilot acceptance, not an end-to-end acceptance of the actual full moving or parking pages, authentication, account flows, or exports. The pilot routes selected dialog and runtime messages through i18next; DOM translations still use the legacy interface. The full browser workflow for the validated commit must finish before broader release acceptance. No changes to `main`, production website, or Supabase data are authorized by this report.

## Extended validation pending (2026-11-22)

Commit `12e73556b079aa964328aae9504003a642c5198b` replaces the i18next API test double with the pinned real `i18next@23.16.8` UMD browser bundle, served locally by Playwright interception of the CDN URL. The outage scenario aborts that request and verifies fallback. Both tools additionally receive an offline full-page HTML smoke check with remote services blocked; these smoke checks do **not** verify authentication, storage, or complete end-to-end functionality. CI results for this new commit have not yet been confirmed. The earlier pilot acceptance remains valid only for the earlier tested scope. The full browser workflow for commit `3b71ca8` (run 44999742893) was still in progress when last checked.

## Confirmed CI update (2026-11-22)

- The complete isolated browser workflow for commit `3b71ca8` **passed**: run [44999742893](https://github.com/duhrrom11/toolya/actions/runs/44999742893), job `137138433969`.
- The i18next node regression job `137139247807` for run [45000005671](https://github.com/duhrrom11/toolya/actions/runs/45000005671) **passed**. Its browser job `137139247963` was still running at verification time; no browser acceptance is claimed for that run.
- The i18next run [45000016709](https://github.com/duhrrom11/toolya/actions/runs/45000016709) was queued when checked.
- Latest smoke-test adjustment: commit `fb65397b53d1d3184cf8af70810f6409b5d9f599` uses DOM `textContent` rather than rendered `innerText` so the expected authentication visibility gate does not invalidate the offline HTML smoke test. Its runs `45000079415` (static checks), `45000079358` (i18next pilot), and `45000079373` (isolated browser tests) had not completed when checked.

**Acceptance decision:** earlier isolated pilot and comprehensive browser checks are green. Real i18next UMD / CDN-fallback and full-page smoke changes are **pending their own successful browser CI results**. No release approval or production changes.

## Final real-library pilot acceptance (2026-11-22)

**Accepted pilot commit:** `68870a26dfb80f7ec9cfbae25a3f531b15d3ba3d`.
**Successful CI:** [i18next migration pilot run 45003183191](https://github.com/duhrrom11/toolya/actions/runs/45003183191); `parking-browser` job `137148956140` and `node-regressions` job `137148956345` both passed. [i18n static checks run 45003183237](https://github.com/duhrrom11/toolya/actions/runs/45003183237) passed.

The Playwright browser job logged four successful scenarios with pinned **real i18next@23.16.8 UMD**, served from a local interception of the CDN URL, or an intentionally blocked CDN request:

- `PASS parking DE/EN/DE and prefix translation (loaded)`
- `PASS parking DE/EN/DE and prefix translation (cdn-blocked)`
- `PASS moving DE/EN/DE and prefix translation (loaded)`
- `PASS moving DE/EN/DE and prefix translation (cdn-blocked)`

The real-library scenarios assert initialization and registered English `tool_parking`/`tool_moving` resource namespaces. The CDN-blocked scenarios assert that the legacy translation fallback still works. The successful browser job also executes offline full-page HTML smoke checks for both tools. Those smoke checks validate the HTTP response and source HTML structure, **not** authenticated, interactive end-to-end page behavior; all external traffic is blocked.

**Decision:** the isolated i18next parking/moving migration pilot is accepted for the scope above. This does **not** authorize a production release or imply all Toolya views are fully bilingual. The previous pending notes above describe historical intermediate runs and are superseded by this final pilot acceptance. `main`, live website, and production Supabase data remain untouched.

## Follow-on migration status (2026-11-22)

The validated parking/moving pilot remains accepted at commit `68870a26` (run `45003183191`, success). Two further tools have been **integrated but not accepted**:

- Housemates (`tools/housemates/index.html`): real pinned i18next UMD loading, opt-in singleton adapter, existing namespaced translations, and legacy CDN-failure fallback. Integration commit `2f54e4294a2faa862d6c1556969fa122b9ac35af`. Static checks [run 45003404381](https://github.com/duhrrom11/toolya/actions/runs/45003404381) passed; i18next browser [run 45003404335](https://github.com/duhrrom11/toolya/actions/runs/45003404335) and isolated browser run `45003404320` were still queued when inspected. **Six browser scenarios not yet confirmed.**
- Plant care (`tools/plants/index.html`): same opt-in adapter and fallback, integration commit `f898345b73231976ca9219cd928d2a5821a6e377`. i18next browser [run 45003515686](https://github.com/duhrrom11/toolya/actions/runs/45003515686), static checks `45003515564`, and isolated browser run `45003515742` were queued when inspected. **Eight browser scenarios not yet confirmed.**

No browser failures or application defects have been established for either follow-on tool. Do not create diagnostic-only commits or mark these migrations accepted until CI has completed. The additional coverage uses the existing isolated fixture; authenticated full-page end-to-end behavior remains out of scope. No changes to `main`, production website, or Supabase production data.

## Housemates acceptance update (2026-11-22)

**Accepted isolated housemates i18next pilot:** commit `2f54e4294a2faa862d6c1556969fa122b9ac35af`, [run 45003404335](https://github.com/duhrrom11/toolya/actions/runs/45003404335). The `parking-browser` job `137149635127` and `node-regressions` job `137149635433` both passed; static i18n run `45003404381` passed. Browser log explicitly confirms six successful cases: parking, moving, housemates × real pinned i18next loaded or CDN blocked, each with DE→EN→DE and prefix translation. Offline HTML smoke checks were included in the successful browser job. This acceptance covers the isolated pilot, **not** authenticated end-to-end workflows.

**Plant care remains pending:** commit `f898345b73231976ca9219cd928d2a5821a6e377`, [run 45003515686](https://github.com/duhrrom11/toolya/actions/runs/45003515686), had both browser and node jobs queued when checked; do not claim acceptance until they pass.

## Subsequent migration verification (2026-11-22)

- **Plant care browser scenarios verified:** [run 45003515686](https://github.com/duhrrom11/toolya/actions/runs/45003515686), browser job `137149961866` **passed**. Its log contains eight `PASS` cases: parking, moving, housemates, plants × loaded real i18next or CDN blocked, DE→EN→DE and prefix translation. The node-regressions job `137149962099` and static-check run `45003515564` were still queued at inspection; therefore **full plant care CI acceptance is pending**.
- **Baking:** commit `067b4d73c58034c92b200cc1e202981e8c076f58`; [i18next run 45003693451](https://github.com/duhrrom11/toolya/actions/runs/45003693451), static checks `45003693384` and isolated browser checks `45003693391` were queued. No successful baking browser claim yet.
- **Budget:** opt-in i18next singleton and legacy CDN-failure fallback now integrated on the feature branch, plus the existing isolated browser fixture expanded to twelve cases. Implementation commit `f7cacb993a4ecf4d7a14f8c5d11203d63673be3e`. **No CI acceptance yet**.

Only isolated browser scenarios are covered; authenticated production workflows are not. All changes remain on `feature/i18n-de-en-foundation-20261121`; no `main`, live-site or production database changes.
