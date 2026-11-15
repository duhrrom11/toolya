# Toolya Connect – Phase B (development only)

Branch: `feature/toolya-connect-phase-b`. No production database changes or deployment.

## Implemented
- Explicit handoff of positive car expenses to the household budget, in the same browser.
- Both tools must have verified same-user cloud ownership and enabled cloud backup.
- The target uses its existing `saveData` function and cloud bridge; no direct writes to `public.user_data`.
- Source revision check, persistent source reference (`toolyaConnectSource`), and duplicate recognition.
- Import status `local` means **only locally persisted**; it does not imply cloud confirmation.

## Known limitations – do not deploy
1. Transfer queue is browser-local and not transactionally synchronized across devices/tabs.
2. No server-side transfer journal, RLS-protected rules, or atomic idempotency enforcement.
3. Import does not verify a confirmed cloud revision. Errors after local save may require reconciliation.
4. No automatic update/delete propagation. Attachments are intentionally excluded.
5. No end-to-end runtime, concurrency, offline, or browser integration tests have been run.
6. Payment method defaults to Bargeld and must be reviewed by the user.
7. The tool UI uses native prompt/confirm as a temporary development interaction.

## Required before release
- Create migration using the Supabase CLI `supabase migration new ...` (not applied to production), then define RLS-protected connect rules/transfers with unique (user,source,action) identity.
- Introduce server-authoritative transfer states and target-side idempotent reconciliation that respects the existing cloud revision/pending queue.
- Validate cross-tab/account switching, stale source, interrupted local save, duplicate import, and remote sync conflicts in an isolated test environment.
- Review the generated migration and run security advisors before any release.
