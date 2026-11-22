# i18next parking pilot – validation record

The parking tool entry now imports the centralized adapter and uses it for app-owned dialog and runtime messages **only if** an existing initialized `window.i18next` is present. Otherwise it retains the previous exact-message translator. No new i18next instance, CDN dependency, user-data translation or database change was introduced.

The pilot is a compatibility integration, not a claim that i18next is already bootstrapped on the parking page. Existing tool selector translations and account status continue on the legacy path. Other tools remain unchanged.

Relevant checks to execute on the branch:
```sh
node --test tests/i18n/i18next-legacy-resources.test.mjs tests/i18n/i18next-runtime-adapter.test.mjs
node --test tests/i18n/interface.test.mjs
```
Run the existing browser tests for parking locale switching, modal dialogs and live timer statuses with synthetic data only. Verify the no-i18next fallback and an injected initialized i18next instance, DE→EN→DE, mobile width, and no mutation of stored records.

GitHub Actions for the pilot commit returned no runs at inspection time; do not mark tests passed or merge to main until checked. Remaining English UI strings and full i18next bootstrapping are still pending.
