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
