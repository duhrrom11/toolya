# Toolya development instructions

Repository: duhrrom11/toolya. Live target: https://toolya.app (never tooly.app).
The owner authorized independent implementation, commits, PRs, merges, deployments and necessary Supabase changes for the mascot-universe release and adoption of the existing tools. Read docs/TOOLYA-MASCOT-UNIVERSE-WORK-ROADMAP.md before continuing.

Preserve all eight assets/toolya/originals PNGs byte-for-byte; verify SHA256SUMS. Preserve both approved character identities. Supabase target: yheogmeaosuigyaxkwth. Never point runtime clients at the former Helferlein project. Do not copy real user data or secrets into fixtures, overwrite user data, or silently transfer browser storage across origins. Existing Helferlein remains available. Keep tests minimal and production-isolated. Never claim release or full acceptance without checking it.

The existing Wishlist and Amazon importer must remain intact. Estate alarms are fail-closed without confirmed mail-provider configuration. Never bypass that gate or use fabricated delivery acknowledgements.


## Toolya Universe / Gamification / Monetarisierung (newer instruction, 22.11.2026)

**MANDATORY FIRST READ:** `docs/TOOLYA-UNIVERSE-GAMIFICATION-MONETIZATION-ROADMAP.md`. This supersedes older blanket deployment and production-change authorizations for this *new feature family*.

**Current user instruction: concept and roadmap ONLY; do not implement further features until explicitly requested.** Work on `feature/gamification-mascot-levels-v1` (or non-production descendant) when instructed. **NEVER merge/push this feature to `main`, deploy to toolya.app, or change production Supabase data/schema without a fresh, explicit user go-live authorization.** The first accidental merge (PR #311) was reverted from `main`. Do not repeat it.

The already-live mascot/platform release documented above is historical; do not confuse its release approval with the new Universe project. Keep the original mascots and wordmark, all free tools, core functionality, privacy and accessibility intact. No pay-to-win, purchased XP, forced visits, ad-click incentives or invasive revenue prompts. Prioritize real tool value + optional cozy fantasy hideout/adventures + clearly disclosed, contextual Amazon affiliate suggestions and nonintrusive voluntary Ko-fi. New-chat handoff and status updates must distinguish actual implemented work from proposals and distinguish development branch from production.


## Newer Universe decisions (22.11.2026; supersedes former no-XP and guest assumptions)

**Read** `docs/TOOLYA-UNIVERSE-ACCOUNT-PROFILES-REWARDS-LEADERBOARDS.md` alongside the Universe master roadmap and P0 matrix. The user now requests mandatory registered access to **every tool** (future target), mandatory first + last name at registration, optional country and optional avatar-image URL, editable personal profiles, account-backed XP/badges and possible rank lists. **Rewards for sensitive tools including estate and pet health are now explicitly requested**; keep the implementation privacy-preserving, non-coercive, and entirely detached from sensitive document/health contents and critical security events. The older matrix statement 'no XP for sensitive tools' is obsolete. Leaderboard visibility and full-name exposure must not be automatic; use privacy-by-default and plan an explicit opt-in. The existing public wishlists/search and existing accounts need a carefully evaluated migration. **CONCEPT ONLY for now. No feature implementation, main merge, live deployment, or production DB mutations without an explicit new authorization.**

**Wishlist identity requirement (newer clarification, 22.11.2026):** When submitting a public Amazon wishlist, **first AND last name for a person**, OR the **organization/association name** for an organization, remain mandatory. These are public wishlist-submission fields, separate from the private user's mandatory first/last name at Toolya account registration. Never automatically expose private account names on a public wishlist or leaderboard. Current wishlist page also requires country for the public listing; optional country applies to Toolya account profiles only. No live changes.
