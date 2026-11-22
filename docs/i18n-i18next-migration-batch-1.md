# Existing translations → i18next: migration batch 1

The resource bridge `shared/toolya/i18n/i18next-legacy-resources.mjs` imports **existing** reviewed source-exact DE/EN catalogues (dashboard, wishes, estate and admin), preserving German source keys and namespace separation. No translation is regenerated and no second i18next instance is initialized.

Call `registerLegacyCatalogues(existingI18nextInstance)` only from a future centralized runtime integration, after i18next is initialized. Until then, existing view translators stay active. Never run both old DOM translation and i18next DOM translation on the same elements.

Validation: `node --test tests/i18n/i18next-legacy-resources.test.mjs`. Follow-up batches must migrate the larger tool interface selector catalogue, runtime prefixes and remaining untranslated screens, and add end-to-end browser checks before replacing the old translation implementation.

This batch changes no published pages, authentication, database data, or SEO indexability. The legacy branch is retained until a fully verified production migration.
