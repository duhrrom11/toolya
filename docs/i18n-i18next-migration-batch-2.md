# Toolya i18next migration – batch 2 (22 November 2026)

Existing translations were reused without regeneration. `interface.mjs` now exposes read-only existing tool dictionaries; `i18next-legacy-resources.mjs` converts exact dialogue and runtime status messages into separate `tool_<name>` namespaces, with account status in `account`. Selector-based translations are preserved as separate `tool_<name>_selectors` migration metadata, **not** treated as source-text keys.

Important: Existing runtime prefix translations and text assembled from user values cannot be naively migrated as exact keys. They require explicit interpolation and data-integrity review. The old translator remains active; this is resource migration, not a live runtime cutover. When initializing i18next for source-exact strings, configure `keySeparator:false` and `nsSeparator:false` or use an explicit key strategy, otherwise punctuation in existing German keys may be parsed as key paths.

Regression tests extended in `tests/i18n/i18next-legacy-resources.test.mjs`. CI must confirm them at the final commit; no production merge or deployment until full coverage and runtime/browser checks. No productive user data were accessed.
