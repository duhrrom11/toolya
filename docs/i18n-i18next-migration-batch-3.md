# Toolya i18next migration – batch 3

Added `shared/toolya/i18n/i18next-runtime-adapter.mjs` as an **opt-in** adapter around the existing translation dictionaries. It registers the migrated resource bundles on a supplied i18next instance (does not create a second instance), provides exact-message lookup and safe fixed-prefix translation, and leaves unrecognized user-authored text unchanged.

The adapter is not yet wired into live tool views. Existing translations and data flows remain untouched. The next migration should convert one isolated view to the adapter, run its existing Chromium and Node regressions, then continue view by view. Prefixes are intentionally separate from exact i18next resource keys; the suffix is never interpolated or translated.

Added `tests/i18n/i18next-runtime-adapter.test.mjs` covering English/German exact translation, dynamic prefixes, unchanged user suffixes and invalid language/tool inputs.

Validation: `node --test tests/i18n/i18next-legacy-resources.test.mjs tests/i18n/i18next-runtime-adapter.test.mjs`. As of this commit, the connector returned no completed GitHub Actions runs for the test commit. Tests have therefore **not** been verified as passing. No production deployment, no user-data or Supabase changes, no legacy branch deletion.
