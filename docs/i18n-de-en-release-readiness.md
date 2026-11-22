# DE/EN release readiness – Toolya

Status: release candidate preparation, not authorization to publish.

## Verified
- Development branch: `feature/i18n-de-en-foundation-20261121`; draft PR #291.
- Commit `7a49b6cc8eae908c03321c0c09dea6f2ae546c47`: 15/15 GitHub Actions workflows successful, including i18n static checks, i18next migration pilot and isolated browser CI.
- English marketing homepage and 13 English guides are present.
- Ten existing tools offer an opt-in DE/EN interface. Account statuses, selected dynamic messages and native dialogs have scoped translations.
- The German production experience, authentication, stored records and mascot selection are outside this release's translation changes.

## Release scope and limitations
- Release a **clearly labeled English beta**, not a claim of fully translated workflows.
- Keep the English-interface notice visible wherever advanced functionality may still appear in German.
- Keep `/en/` at `noindex,follow` until a separate decision to publicly index the English landing page; do not silently change SEO publication state.
- Dynamic user-generated records, emails and receipt contents must not be automatically translated.
- Untranslated secondary labels alone are not release blockers when the task remains understandable and usable.

## Actual release blockers
- Any failed required CI or unresolved security issue.
- Authentication, navigation, saving or loading user data failing in either language.
- A language switch changing persisted user data, units, account state, mascot choice or URLs outside intended locale navigation.
- English marketing copy claiming full feature parity despite known incomplete translations.
- Missing explicit publication approval for merge or deployment.

## Publication handoff
1. Confirm the branch tip and required CI are green.
2. Confirm the visible beta notice and `noindex` policy remain intentional.
3. Obtain a separate decision for PR merge, deployment and English search indexing.
4. After authorized publication, verify the actual deployed pages and key account/tool entry points; defer nonblocking copy polish to follow-up work.

No production database changes or deployment are part of this checklist.
