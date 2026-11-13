# Toolya selective migration — final inventory (2026-11-13)

**Status: staged only; NOT APPROVED FOR MERGE OR DEPLOYMENT.**

## Repository isolation and change scope
- Branch: `migration/english-paths-clean`, repository `duhrrom11/toolya`.
- GitHub compare `main...migration/english-paths-clean`: 62 commits ahead, 0 behind, 113 added files, **zero modified or deleted files**. Added files consist of `staging/`, `scripts/`, and `.github/workflows/migration-audit.yml`.
- Public root `index.html`, `CNAME`, `.nojekyll`, `README.md`, `MIGRATION-PLAN.md` have exactly matching Git blob SHA values on both branches.
- Staged tree: 103 files in `staging/` (42 wishlist files; 61 other staged files), including 32 HTML pages. Duplicate source `amazon-wishlist/` is excluded.
- Spot-check against original `duhrrom11/Helferlein/main`: `tools/wishlist/discover.mjs`, `assets/helferlein-b3-startseite.js`, `assets/helferlein-b3-startseite.css`, and `shared/helferlein-cloud-store.js` are byte-identical. `tools/umzugskisten-inventar/index.html` versus staged `tools/moving/index.html` matches after normalizing expected URL/slug substitutions. These are representative checks, **not** a complete byte-level source-to-staging equivalence proof.

## Migration-specific technical issues — fixed on staging branch
- Restored required `assets/heir-e2ee-handoff.js` dependency for estate handover.
- Replaced stale JS-generated `gift-cockpit.html` target with `cockpit.html`.
- Corrected dynamically constructed estate routes `erben.html` and `schluessel-drucken.html` to `heirs.html` and `print-key.html`.
- Updated four obsolete German tool URLs in staged `sitemap.xml`.
- Static audit currently finds **zero legacy-route matches and zero newly missing references** in its supported patterns. The audit is not exhaustive for computed URLs, CSS runtime behavior, or auth callbacks.

## Defects already present in the original Helferlein source — NOT fixed
1. `tools/wishes/gift-tasks.html` and `tools/wishes/gift-analytics.html` are referenced but absent in the original `tools/wishlist/` and `tools/amazon-wishlist/` trees. Static audit reports five references to these two missing destinations; they are not introduced by the migration. Do not fabricate pages or silently redirect navigation.
2. `tools/wishes/discover.mjs` contains a `counts` variable-shadowing / temporal-dead-zone bug in `load()`, also present byte-for-byte in original `tools/wishlist/discover.mjs`. It prevents the unmodified discovery page from rendering loaded results. **The 5/5 discovery fixture result passes only with a localhost HTTP-response-only workaround**; application code remains unchanged. Requires separate authorization if a functional bug fix is desired.

## Validated tests
- Latest complete green CI run: https://github.com/duhrrom11/toolya/actions/runs/43472844619 (head `7faf59efb93ca5d5a52c28d01f330468d45c39d1`).
- Static dependency and route audit; JS/MJS syntax; all 32 local page smoke tests; 32 mocked-dependency page tests.
- 11 real local anchor navigations, 11 safe non-submitting UI-control checks.
- Six homepage category filters: verified visible cards and counts.
- Wishlist discovery: five visible-result checks with three synthetic records and **test-only shadowing workaround** (newest, alphabetical, popularity, search, topic).
- Moving inventory: six visible-result checks with three synthetic boxes (name, descending/ascending value, tag, search, reset); no storage writes.
- All browser tests use localhost-only assets, network-blocking policy, and disposable mock data; no production Supabase access, authentication or writes.

## Open acceptance gates
- Do not call the migration production-ready: offline mocks are not a faithful substitute for third-party libraries, auth flows, browser storage origins, or real deployment conditions.
- Audit untested computed JS routes, external links and callback URLs; inspect estate recovery, heir keys, omitted `a10-*`/`heir-*` assets, PWA manifest/service worker, sitemap and legacy compatibility redirects.
- Decide separately whether to repair pre-existing missing wishlist destinations and discovery variable-shadowing bug; these are outside the current technical-path-only permission.
- No merge, production Supabase changes, or publication has occurred in this work.

## Read-only release-gate risk review (2026-11-13)

Scope: repository-tree and selected source inspection only; no browser authentication, real backend access, data writes, code modifications, merge, or deployment. Priority means risk **if** staging is later published, not evidence of an incident in the currently public site.

| Priority | Area | Evidence | Classification / action before release |
|---|---|---|---|
| **P0 / release blocker** | Browser-origin storage and recovery | The staged homepage reads/writes `localStorage` and supports a manual backup/import flow; `assets/heir-e2ee-handoff.js` reads `digital_estate_vault` locally; `shared/helferlein-cloud-store.js` also uses origin-scoped `localStorage`. Moving from `duhrrom11.github.io` to `toolya.app` changes browser origin. | **Migration compatibility risk**: existing local data will not automatically follow the domain. Verify safe, consent-based export/import and encrypted-estate recovery on disposable local data; never assume automatic migration. |
| **P0 / release blocker** | Authentication / cloud origin | Homepage and estate owner use Supabase email/password auth; estate owner CSP permits the configured Supabase API origin. No `redirectTo`, `signInWithOAuth`, `signInWithOtp` or password-reset redirect was found in the selected files, but that does not prove no other callback flow exists. No Supabase project settings were queried. | **Unverified configuration**: inspect allowed Site URL/redirect URLs, CSP, CORS and login/logout behavior using an isolated nonproduction environment before release. Do not modify production settings as part of this audit. |
| **P1 / release blocker** | Legacy URLs / redirects | Original Helferlein includes redirect-only `tools/kfz/`, `tools/kassenbon/`, `tools/kisten/`, `tools/notizen/`, `tools/energie/`, `tools/haustier/`, `tools/parken/`, `tools/pflanzen/`, `tools/verleih/`, `tools/wg-kasse/`; these paths are absent from staged output. Original `tools/notizen/index.html` and `tools/kfz/index.html` redirect with query/hash preservation. No `404.html` or `_redirects` is staged. | **Migration compatibility gap** for inbound bookmarks and links. Design explicit legacy route strategy and verify query/hash preservation; no redirect pages created under the current no-code-change instruction. |
| **P1** | PWA / indexing metadata | Staged `manifest.json` has relative `start_url: ./index.html`, which resolves correctly when hosted at the intended site root. `robots.txt` still names `https://duhrrom11.github.io/Helferlein/sitemap.xml` (byte-identical to original) while staged `sitemap.xml` uses `https://toolya.app/`. No service worker was found in either repository tree; do not claim offline installation support. | **Confirmed migration-specific metadata defect**: update the robots sitemap URL only after separate permission to make technical reference changes. Also verify sitemap against the final deployed path; no fix applied in this read-only review. |
| **P1** | Estate and recovery asset scope | Four estate pages stage `estate-owner.js`, `estate-trustee.js`, `heir-e2ee-handoff.js`, `estate-print-ready.js` and their directly referenced local scripts/styles. The selected estate JS/HTML files contain no literal `a10-`, `heir-owner`, or `heir-redemption` references. Original source contains many additional `assets/a10-*` and `assets/heir-*` files and staging-only invitation/backend work. | **Unverified feature-scope risk**, not proven missing dependency: decide whether these are experimental/feature-gated or required; audit runtime dynamic imports and all invitation/recovery entrypoints. Original `docs/heir-invitations-production-gate.md` explicitly says NO-GO pending separate release gates. |
| **P2** | Static assets and social metadata | Staged homepage `og:image` points to `https://toolya.app/assets/preview.jpg`, but no `preview.jpg` exists in the staged tree **or** original Helferlein tree. | **Pre-existing missing asset**, now referenced under new host; broken social preview if published without asset. Do not invent asset without authorization. |
| **P2** | Dynamic routes and computed links | Previously fixed computed `heirs.html`, `print-key.html`, `cockpit.html` targets. Static scanner checks selected patterns only, does not exhaustively parse template strings or all JS-generated navigation. Local browser checks exercise 11 anchors. | **Residual verification gap**, not a demonstrated current migration defect. Use instrumented navigation and exhaustive source/path inventory before signoff. |
| **P2** | Original wishlist defects | `gift-tasks.html` and `gift-analytics.html` absent from original; `discover.mjs` variable-shadowing confirmed byte-identical to original. | **Pre-existing functional defects**, outside migration-only fixes. Discovery fixture passes only under a test-response workaround. |

### Read-only findings and boundaries
- Staged `robots.txt` is the **one newly confirmed obsolete migration-specific metadata reference** in this review; it has **not** been changed.
- `manifest.json` is byte-identical to source; `start_url` is relative, and the staged root includes `index.html`. Its branding text is unchanged by design.
- `staging/sitemap.xml` lists 12 canonical URLs on `toolya.app` and omits some staged pages, including the wishlist landing page; completeness should be decided at publication time. The old robots sitemap URL conflicts with this file.
- No service-worker file or GitHub Pages `404.html` was found in the inspected trees. The absence of a service worker is **not** itself a migration regression.
- No runtime or browser test with real auth, estate keys, actual production database, third-party APIs or pre-existing user data was performed.
- GitHub Actions last verified green run before this documentation update: `43472844619`. This report update will trigger another CI run; do not assert it passed until checked.
- **Release decision remains NO-GO.** No functional source change, merge or publication authorized.

## Release plan: local-data transfer, auth and rollback (2026-11-13; read-only assessment)

**Decision: NO-GO.** This is a plan, not an executed migration or approval. Repository and source inspected read-only. A six-key *synthetic* allowlist simulation was run locally without accessing browser storage or Supabase: `hub_favorites`, `wg_inventory`, and `digital_estate_vault` were classified as allowed; `helferlein-wish-extras:mock-user`, `helferlein_cloud_owner_budget`, and `sb-local-auth-token` as excluded. This is a narrow logic illustration, **not** a browser export/import round-trip or security proof.

### Evidence from staged source
- `staging/index.html` uses a fixed `HELFERLEIN_BACKUP_KEYS` allowlist plus a limited layout-key regex. The export warns about some excluded application keys; it deliberately excludes Supabase sessions, tokens, passwords and private keys. The allowed keys include `digital_estate_vault`; encrypted export is mandatory when that key is present.
- Encrypted backup format: `encrypted-backup-v1`, PBKDF2-SHA256 (600,000 iterations), AES-256-GCM. Import checks a 20 MiB file-size ceiling, version `2.0`, entry count and types, and confirmation before overwriting existing local keys. On a `localStorage.setItem` exception it attempts to restore previous values. **This is not a durable transactional rollback guarantee** if the browser/storage itself is broken.
- `staging/tools/wishes/app.mjs` stores `helferlein-wish-extras:<owner-id>`, which is not on the global backup allowlist. `staging/shared/helferlein-cloud-store.js` uses `helferlein_cloud_<tool>_<user-id>_...` cache/pending keys, also not on the global allowlist. These should **not** be blindly copied: they are user-scoped and may represent unsynchronized writes.
- `staging/assets/estate-owner.js` reads/writes `digital_estate_vault` and checks `vault_cloud_snapshots`. Local encrypted vault and cloud snapshot must be independently reconciled; never replace a newer local vault without verified encrypted backup and owner confirmation.
- Homepage and wishlist use Supabase `signUp`/`signInWithPassword`; estate-owner signup explicitly supplies `emailRedirectTo: location.origin + location.pathname`. On `https://toolya.app/tools/estate/index.html`, the expected redirect is `https://toolya.app/tools/estate/index.html`. Homepage/wishlist signup does not supply an explicit redirect in the inspected calls and may rely on Supabase's configured Site URL. Supabase project settings have **not** been read or changed.
- Sessions are browser-origin-scoped; copying Supabase auth storage is forbidden. New-domain users must sign in again. No real credentials or accounts were used.

### Prioritized release gates and objective acceptance criteria

| Gate | Priority | Required isolated verification | Pass criteria |
|---|---|---|---|
| G0 Inventory / classification | **P0** | Read-only enumerate each app's `localStorage` and IndexedDB key families in source, classify owner binding, secret exposure, sync pending state, data sensitivity and backup coverage. No actual user data. | Signed-off matrix with all app data stores; unknown/unsynced keys flagged; explicit decision for wishlist extras and cloud pending queues. |
| G1 Backup and restoration | **P0** | On two disposable local origins, seed synthetic non-sensitive and synthetic encrypted-vault fixtures. Test encrypted export, size cap, wrong password, corrupt/tampered file, invalid key, duplicate overwrite, quota failure and rollback. Verify no auth/session key in exported JSON. | All negative tests fail closed; successful round-trip matches expected allowlisted values byte-for-byte; no unintended overwrite; original origin remains intact. |
| G2 Vault/recovery and sync | **P0** | With disposable keys and mocked cloud snapshots only, simulate same/different owner, conflicting local/remote revisions, pending writes, missing vault password and restore on a new origin. Never trigger real emergency, invitations or database writes. | No cross-owner leakage; no silent pending-write loss; cryptographic restore and owner-confirmation gates pass; recovery path documented. |
| G3 Auth/redirect configuration | **P0** | Read-only review of Supabase Auth Site URL, allowed redirect URLs, email confirmation templates, PKCE/callback handling and production CSP; use an isolated Supabase project and dummy users for runtime tests only after separate approval. Check old-domain and new-domain confirmation links, expired/replayed links, logout and independent sessions. | New-domain signup/confirmation returns to correct page; no unexpected redirect to old host; open redirects rejected; password/session secrets never exported; no changes to production config. |
| G4 Cutover/legacy routes | **P1** | Inventory old URLs and query/hash-preserving redirects, choose canonical host/path, check `robots.txt`, sitemap and deployment base path in preview. | No required old bookmark resolves to 404; metadata points to canonical new domain; legacy links are documented and reversible. |
| G5 Release rehearsal | **P1** | Full CI and representative cross-browser dry-run using synthetic data, offline/failed-network scenarios, source-to-staging dependency diff and a written operator checklist. | All blocking checks green, no outstanding P0/P1 defect, explicit owner approval before any merge or publication. |

### Rollback / containment plan (not executed)
1. **Before cutover:** Preserve the old site and DNS configuration, keep `toolya/main` unchanged, and retain a verified encrypted export on the old origin. Record commit hashes and an immutable list of required static files. Do not delete original browser data or revoke the old host.
2. **If preview fails:** Stop at NO-GO; do not merge or switch DNS. Correct only in an authorized follow-up and rerun the complete isolated gate suite.
3. **If a future published cutover fails:** Restore the previous deployment and routing/DNS from recorded configuration, disable new-domain entrypoints where appropriate, and communicate that data stored on the new origin remains **separate**. DNS rollback alone does not move or delete browser storage.
4. **Data rollback:** Do not overwrite an older/newer vault or cloud snapshot automatically. Use owner-approved, verified encrypted backups and a conflict-resolution procedure. Preserve both old and new origin data until explicit reconciliation; never export session tokens.
5. **Auth rollback:** Revert allowed redirect URLs and Site URL only through a separately approved, audited Supabase change; keep both hosts allowlisted during a planned transition if security review permits. Existing sessions may require re-login.
6. **Exit criteria:** Validate old public site, canonical links, login and read-only data access after rollback; document unresolved writes/conflicts and obtain explicit signoff before reattempting release.

### Explicit boundaries
No real Supabase Auth configuration was inspected; runtime auth behavior, mail templates and allowlists remain unverified. No local browser export/import with synthetic fixtures was executed in this review, only the stated narrow classification simulation. No application source, production database/configuration, main branch, merge, deployment or DNS was changed.

## Isolated executable backup/security regression suite (2026-11-13)

- New `scripts/test_backup_isolated.cjs` is wired into `.github/workflows/migration-audit.yml`. It extracts and executes the **actual** homepage backup export/import functions in a Node `vm` context, with synthetic in-memory `localStorage`, mocked file reader, confirmations and download, and Node WebCrypto (PBKDF2-SHA256 / AES-GCM). It does not access a real browser profile, network, production database, accounts or credentials.
- Cases: allowed/excluded keys and auth-token exclusion; encrypted export/import round-trip; wrong password; tampered ciphertext; malformed JSON; unsupported-key exclusion; quota-error rollback; declined overwrite; static estate signup `emailRedirectTo` expectation.
- Important scope: the rollback simulation throws on **one** selected write, then allows restoration. It does not prove rollback under persistent storage corruption, concurrent writes, browser quota behavior, or full multi-origin browser migration. Redirect checks inspect source only, not Supabase Auth project allowlists or email delivery.
- Initial CI run `43474397137` failed because the harness returned before asynchronous PBKDF2 decryption completed. The harness was changed to wait for the asynchronous import outcome (commit `f1e3fb2`). This was a **test synchronization defect**, not a confirmed application defect. Final CI verdict must be checked on the latest run; do not count cases as passing before that.
- No application source or production configuration changed; no merge or deployment.

- Follow-up CI run `43474489747`: seven checks passed, then the intentionally **cancelled** import failed a test-only expectation that every import must display an alert. Cancellation correctly returns silently. Harness corrected in commit `4ba689d`; this was not an application defect. Final all-green run remains to be confirmed.

## Extended origin, persistent-storage and pending-queue release checks (2026-11-13)

Added isolated tests (only scripts and CI workflow changed):
- `scripts/test_two_origins.py`: disposable Chromium profile and **two distinct localhost port origins** in one browser process (cross-origin iframe and origin-checked postMessage), CSP `connect-src 'none'`. Seeds only synthetic `localStorage` fixtures on origin A; asserts B is initially empty, then **explicitly** restores only two allowlisted synthetic keys on B, leaving auth token, wishlist extras and `helferlein_cloud_budget_mock-user_pending` on A. This is a browser-origin isolation and manual allowlist-copy test, **not** a real encrypted file export/import across browser origins; that cryptographic function is exercised separately in `test_backup_isolated.cjs`.
- `scripts/test_backup_isolated.cjs` extended with persistent simulated `setItem` failure during import and rollback. Acceptance: application warns rollback may be incomplete, does **not** claim full recovery. The test intentionally preserves a prior value in the fixture; it does not prove data recovery if the underlying browser storage is irreparably corrupted.
- `scripts/test_cloud_pending_isolated.cjs`: executes the **actual** `shared/helferlein-cloud-store.js` in a Node VM with `navigator.onLine=false`, synthetic unexpired session, account-scoped pending keys, and a Supabase stub whose `from()` and online `getUser()` throw. Tests matching owner, mismatched owner, signed-out state, no queue, and no mutation/network calls. It does not test real flush, conflict resolution, cloud persistence or migration of unsynced queues.
- Both new scripts are wired into `.github/workflows/migration-audit.yml`. Verify CI outcome separately before claiming green.

**Residual release risks (priorities unchanged):**
- **P0:** Cross-origin encrypted *browser* export/import with real file picker, two real domain contexts, and disposable vault keys still requires dedicated rehearsal. Do not automatically copy auth tokens or pending cloud queues. A browser origin cannot directly read another origin's storage.
- **P0:** Persistent storage failure cannot be reliably rolled back by another write to the same failed storage medium; preserve old origin and independently verified encrypted export. Explicit failure notice is necessary, not sufficient.
- **P0:** Pending cloud writes are intentionally excluded from global backup; no automatic migration or guaranteed replay. A user-scoped, revision-aware manual reconciliation strategy must be designed and tested with offline mocks before publication.
- **P0:** Supabase allowed redirects, confirmation emails, sessions and live auth remain unverified; no production project access.
- **P1:** Legacy routes and old `robots.txt` sitemap remain unresolved.

No application code, main branch, production Supabase, merge, DNS or deployment modified.

- CI run `43475311677` encountered Chromium timeout in the first multi-process two-origin harness and a separate headless page-smoke failure under concurrent runs. The two-origin harness was rewritten as a single-process cross-origin iframe test in commit `4879b46`; CI outcome pending. Do not interpret the timeout as a proven application regression.
