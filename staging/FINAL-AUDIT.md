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

## Confirmed final CI outcome for origin isolation (2026-11-13)

**Verified green** GitHub Actions run [43475839897](https://github.com/duhrrom11/toolya/actions/runs/43475839897), commit `5aed79fb65828772239eeee6a91e4aec17de85f4`. All workflow steps completed successfully, including static route/dependency audit, JS syntax, 32-page local smoke, offline mocks, navigation, visible UI filters, isolated crypto backup and redirect checks, two-origin Chromium check, and offline pending-store isolation.

**Exact logged outcomes:**
- `test_backup_isolated.cjs`: **10/10 PASS**, including persistent write-failure warning, wrong password, tampering, invalid JSON, excluded keys, rollback on one-shot quota failure and static signup redirect.
- `test_two_origins.py`: **3/3 PASS**: two different localhost origins, source synthetic storage retained, destination initially empty, only two explicitly allowlisted synthetic keys transferred; auth token, wishlist extras and cloud pending fixture remain absent from destination.
- `test_cloud_pending_isolated.cjs`: **5/5 PASS**: matching owner can inspect offline pending data, mismatched owner and signed-out state cannot claim it, no fabricated queue, and no network calls or inspection writes.
- **Total newly relevant assertions: 18/18 PASS.**

**Previous failed runs are not hidden:** `43475311677` and `43475397596` failed during earlier Chromium testing, with a timeout in the original multi-process harness and intermittent smoke failures under overlapping runs. The single-process cross-origin iframe version is verified green in the latest completed run. These failures did not establish an application regression; no application code was changed.

**Remaining boundaries:** The cross-origin test performs an explicit synthetic allowlist transfer, not the actual encrypted file export/import UI across two browser origins. It does not validate IndexedDB, production domain cookies, Supabase auth redirects, live cloud flush, recovery keys or pending-write reconciliation. Persistent storage corruption can still make rollback impossible. Accordingly, **release remains NO-GO** until separate acceptance gates are met.

This update changes documentation only; no application code, production Supabase settings/data, merge or deployment.

## Final release checklist and responsibility matrix (2026-11-13)

**Current decision: NO-GO; no merge, production configuration change or deployment authorized.** Latest *completed* green CI at checklist preparation: [run 43475839897](https://github.com/duhrrom11/toolya/actions/runs/43475839897), 18/18 new isolated assertions. Newer run [43476720388](https://github.com/duhrrom11/toolya/actions/runs/43476720388) was in progress at initial check; verify its final result separately. `main...migration/english-paths-clean`: 80 commits ahead, 0 behind, 117 files added, 0 existing files modified/deleted.

**Roles are proposed assignments, not confirmed named people.** Owner/Release approver = project owner; Migration engineer = implementing engineer; Security/Auth reviewer = person authorized to inspect Supabase settings; Data steward = owner of backup/vault recovery decisions; QA reviewer = independent test signoff. One person may hold multiple roles, but every gate requires a recorded reviewer and evidence link.

### Ordered gates and hard stop criteria

| Order | Gate / responsible role | Required evidence and objective GO condition | Automatic NO-GO |
|---|---|---|---|
| 0 | **Freeze / isolation** — Migration engineer + Release approver | Compare `main...migration/english-paths-clean`; no changes outside permitted staging/test/docs/CI; record exact commit and CI run. Preserve public coming-soon site and original Helferlein. | Any unintended modification of `main`, source Helferlein, production Supabase, DNS or deployed site. |
| 1 | **Data inventory / ownership** — Data steward + Migration engineer | Signed-off table of every `localStorage`/IndexedDB store and backup coverage; explicit handling for `helferlein-wish-extras:*`, `helferlein_cloud_*_pending`, owner IDs, encrypted estate vault and unsynced queues. | Unknown keys, unclassified pending edits, account-mismatch or a claim that global backup covers all data. |
| 2 | **Realistic encrypted cross-origin rehearsal** — QA + Data steward | Two disposable browser origins and synthetic fixture users; run actual UI file export/import (not merely VM crypto or explicit allowlist copy); validate file integrity, wrong password, tampering, quotas, rollback and preserved original data. Repeat in representative browsers. | Any lost, leaked, silently overwritten or nonrecoverable synthetic data without a documented safe fallback. |
| 3 | **Estate vault and cloud conflict rehearsal** — Data steward + Security reviewer | Synthetic vault keys, mocked remote snapshots, mismatched account and revisions, pending writes and disconnected state; prove fail-closed behavior and owner-approved reconciliation; document old/new origin storage and encrypted recovery. | Automatic pending replay, cross-owner access, silent conflict resolution or false claim of complete rollback under persistent corruption. |
| 4 | **Auth redirect security** — Security/Auth reviewer | Read-only production Supabase Site URL, allowed redirect URLs, email confirmation template, callback handling, CSP and cookie/session assumptions; use **separate test Supabase project and disposable accounts** for runtime confirmation after authorization. Confirm new canonical URL, old-domain transition, expired/replayed link and rejection of arbitrary redirect origins. | Redirect to wrong host, unallowlisted callback, open redirect, real credentials in tests or change to production settings without explicit authorization. |
| 5 | **Legacy URLs, metadata and assets** — Migration engineer + QA | Exhaustive old-to-new URL matrix including query/hash behavior; validate 404/redirect strategy, staged `robots.txt` sitemap, `sitemap.xml`, `manifest.json`, social preview and estate optional dependencies. Verify source-existing wishlist defects remain separately documented. | Required bookmarked paths 404, old sitemap URL remains, required asset absent, unresolved feature dependency. |
| 6 | **Full release rehearsal** — QA reviewer | Green CI at **exact candidate commit**; local/offline browser diagnostics and staged link scan; representative encrypted backup and account-recovery rehearsal; evidence URLs, known limitations, test logs, rollback drill and written signoffs. | Any P0/P1 gate unpassed, CI red/in progress, unexplained modified source or missing rollback proof. |
| 7 | **Explicit release decision** — Project owner / Release approver | Written GO for a specific commit and deployment plan, verified encrypted backups, DNS/redirect rollback operator, communication plan and monitoring owner. **Separate authorization required for merge, deploy or production config changes.** | No signed approval, unresolved P0/P1 issue or inability to revert routing and protect old/new origin data. |

### Practical GO/NO-GO checklist (all boxes must be evidenced before GO)

- [ ] Exact release commit, branch diff, CI run and static asset inventory recorded.
- [ ] Every local storage family and owner binding inventoried; pending queues and wishlist extras explicitly classified.
- [ ] Encrypted backup/restore verified through real UI on two disposable origins and supported browsers.
- [ ] Vault restore, cloud conflicts, cross-account protection and persistent-storage failure handling accepted.
- [ ] Supabase redirect allowlist and confirmation email flow inspected read-only; isolated auth test passed.
- [ ] Legacy redirects, canonical URLs, `robots.txt`, sitemap and required assets accepted.
- [ ] Full CI green on exact candidate commit and independent QA signoff recorded.
- [ ] Rollback drill documented, old site preserved, backups verified and release approver signs GO.

### Rollback responsibility and sequencing

- **Before any future cutover (Release approver + Data steward):** Keep old host operational, verify encrypted backup integrity, record DNS/hosting config, deploy SHA, allowed redirect settings and recovery contacts. Avoid exporting auth tokens. Establish who may stop the rollout.
- **Trigger (QA/Security/Data steward):** Stop on unexpected login redirect, data mismatch, missing pending changes, vault restore failure, unexpected 404 or failed critical CI. Freeze writes/entrypoints if safe and explicitly authorized.
- **Restore (Migration engineer / infrastructure operator):** Restore prior hosting/routing/DNS according to approved runbook; do **not** assume browser storage follows DNS. Preserve both origins' data and investigate cloud revisions before resuming sync.
- **Auth (Security/Auth reviewer):** Only through separately approved production change control, restore previous allowlist/Site URL if modified; require re-login where needed.
- **Closure (Project owner + QA):** Verify old-site accessibility, login and data-read path; document affected accounts, pending conflicts and backup evidence; require a new GO before retrying.

### Verification limits

The 18 isolated assertions are valid but not substitutes for production-domain auth checks or actual UI-driven encrypted file transfer. The original wishlist defects, missing preview asset, stale robots sitemap and legacy redirects remain release concerns. The current task adds **documentation only**, not an implementation or authorization of release.

**CI status correction (verified after checklist drafting):** run [43476720388](https://github.com/duhrrom11/toolya/actions/runs/43476720388) on commit `f3eff12083bb02a0cec57172a5b2bf9d1cf1c278` has **completed successfully**, including the two-origin browser and offline pending checks. The checklist documentation commit(s) are newer and require their own CI completion before claiming green at current branch HEAD.

## Read-only local storage inventory and backup coverage (2026-11-13)

**Method and boundary:** Inspected the staged homepage's **exact** backup allowlist and exclusion filter, staged HTML pages, local storage adapters, estate modules and wishlist modules, including user-scoped computed key constructors. This is a **source-derived inventory of first-party explicit browser storage**, not a read of actual user profiles or a guarantee against storage created by third-party SDKs, future dynamic code, or browser extensions. No browser data, production database or Supabase config was accessed. For each family below, “YES” means the homepage backup key predicate permits it **if the key exists and the value is readable**, not that it has been exported successfully for a real user.

### A. Fixed-key first-party localStorage data — backed up by homepage

| Tool / family | Exact keys (all allowlisted) | Data type / exposure | Priority |
|---|---|---|---|
| Homepage | `hub_favorites` | Favorite tools; preferences | P2 |
| Budget | `kassenbon_data`, `budgetbuch_budgets`, `budgetbuch_goals` | Receipts, spending, financial goals; sensitive | **P0** |
| Moving | `mini_homebox_pro` | Box and location inventory | P1 |
| Housemates: context | `wg_active_bin_id`, `wg_last_loaded_bin_id` | Selected household / context; restore may not restore cloud permissions | P1 |
| Housemates: finance | `wg_kassenbon_data`, `wg_budgetbuch_budgets`, `wg_budgetbuch_goals` | Shared household finances | **P0** |
| Housemates: shared records | `wg_flatmates`, `wg_notes`, `wg_events`, `wg_inventory`, `wg_diets`, `wg_cleaning`, `wg_shopping`, `wg_cooking`, `wg_contracts`, `wg_infoboard` | Personal contacts, household notes, dietary data and shared records; restore only with appropriate owner/household context | **P0** |
| Estate | `digital_estate_vault` | Encrypted vault; owner-bound recovery and cloud-snapshot conflicts | **P0** |
| Car | `kfz_tracker_pro_v3` | Vehicles and costs | P1 |
| Pet health | `haustier_pass_pro_v5` | Animal health records and treatment data | P1 |
| Parking | `park_end_time`, `park_history_pro_v3` | Timer and parking history; expiry/time interpretation | P2 |
| Loans | `verleih_tracker_pro_v3` | Borrower contacts and loan inventory | P1 |
| Plants | `dismiss_frost`, `pflanzen_pass_v10` | Frost reminder and plant records | P2 |
| Meters | `energie_tracker_pro_v8` | Meter readings and energy cost data | P1 |
| Baking | `helperly_recipes_pro` | Personal recipes | P2 |
| Global UI | `helferlein_ui_theme_v1` | Theme preference | P2 |
| Layouts | `helferlein_ui_layout_backform_v1`, `helferlein_ui_layout_nachlass_v1`, `helferlein_ui_layout_pflanzen_v1` | Dashboard arrangements | P2 |
| Layout regex | `helferlein_ui_layout_{energie,kassenbon,kisten,wg,notizen,kfz,haustier,verleih,pflanzen,nachlass,backform,parken,haushaltsbuch,umzugskisten}_v1` | Explicitly permitted set of layout variants, **not** an unrestricted wildcard | P2 |

The homepage's fixed allowlist has **34 literal keys**; the layout regex adds selected variants (some overlap with those 33). The homepage explicitly excludes auth-like names (including `sb-`, `supabase`, `auth-token`, `access_token`, `refresh_token`, `session`, `password`, `secret`, `private_key`, PKCE/code verifier and Firebase prefixes), even if a key otherwise matched. Backup is origin-scoped, never an automatic transfer. The encrypted vault triggers mandatory encrypted backup; ordinary backups without a vault can follow a different export path, so **all sensitive backup files should be handled as sensitive even when the vault key is absent**.

### B. First-party localStorage families NOT covered by homepage backup

| Family / exact key pattern | Evidence / meaning | Backup | Risk and required disposition |
|---|---|---|---|
| Wishlist extra fields: `helferlein-wish-extras:<ownerId>` | `tools/wishes/app.mjs`, also read in `lists-dashboard.mjs`; owner-scoped wish images/prices/quantity/status | **NO** | **P0** if user-created records not replicated; owner-specific export/import and conflict check required |
| Wishlist markers: `helferlein-wish-markers:<ownerId>` | `lists-dashboard.mjs`; wish status/markers | **NO** | P1: preserve per-owner markers |
| Wishlist categories: `helferlein-wish-categories:<ownerId>` | `lists-dashboard.mjs`; wish classifications | **NO** | P1: preserve per-owner categories |
| Wishlist favorites: `helferlein-wishlist-favorites:<ownerId>` | `lists-dashboard.mjs`; list favorites | **NO** | P1: per-owner export decision |
| Wishlist recent: `helferlein-wishlist-recent:<ownerId>` | `lists-dashboard.mjs`; recently opened list IDs | **NO** | P2: may be reconstructible |
| Wishlist checkpoint views: `helferlein-checkpoint-views-v1:<userId>` | `gift-start.mjs`; locally saved checkpoint views | **NO** | P1: user-generated view definitions, review before discarding |
| Wishlist social read marker: `helferlein-social-seen:<userId>` | `social-dashboard.mjs`; timestamp for viewed updates | **NO** | P2: reinitialize deliberately |
| Wishlist theme: `helferlein_wishlist_theme` | `tools/wishes/index.html`; separate from global UI theme | **NO** | P2: cosmetic, default may change |
| Cloud owner: `helferlein_cloud_owner_<tool>` | `shared/helferlein-cloud-migration.js` and cloud-store offline owner validation; tool IDs are **legacy IDs** (e.g. `backform-umrechner`, `haushaltsbuch-kassenbon`, `autokosten-reifenwechsel`, `verliehene-gegenstaende-verwalten`, `zaehlerstaende-erfassen`, `umzugskisten-inventar`, `parkplatz-merker-parkschein-timer`, `haustier-gesundheitspass`, `pflanzenpflege-giessplan`) | **NO** | **P0**: never blindly copy owner binding; validate authenticated account and local payload |
| Cloud enabled: `helferlein_cloud_enabled_<tool>_<uid>` | Opt-in flag in cloud migration adapter | **NO** | **P0**: require deliberate re-enablement and owner verification; do not silently turn sync on |
| Cloud account slot: `helferlein_cloud_slot_<tool>_<uid>` | Per-user saved local payload for account switching | **NO** | **P0**: potentially unique local edits; preserve and reconcile manually |
| Cloud account-switch journal: `helferlein_cloud_switch_<tool>` | Crash-recovery journal of prior owner/local bytes | **NO** | **P0**: in-progress switch must be recovered on original origin before transfer; do not discard |
| Cloud cache: `helferlein_cloud_<tool>_<uid>_cache` | Snapshot/cache used by cloud store and migration adapter | **NO** | P1: remote freshness and owner check; not authoritative backup |
| Cloud pending: `helferlein_cloud_<tool>_<uid>_pending` | Unsynced local writes; cloud-store `writePending` and offline flush logic | **NO** | **P0**: loss can discard edits; must not replay automatically or cross-owner |
| Cloud baseline: `helferlein_cloud_<tool>_<uid>_base` | Revision baseline for pending reconciliation | **NO** | **P0**: must be evaluated **together** with pending and remote revision |
| Cloud revision: `helferlein_cloud_<tool>_<uid>_revision` | Last known cloud revision | **NO** | **P0**: stale or missing revision can create conflicts; no blind copy |

`<tool>` denotes the adapter's tool argument, not necessarily the new English URL slug; `<uid>` and `<ownerId>` are account identifiers. No secrets or actual identifiers are included here. The cloud-store's four-key tuple `{cache,pending,base,revision}` and the migration adapter's `{owner,enabled,slot,switch}` must be treated as a **single consistency/identity problem**, not as independent ordinary backup keys.

### C. Browser sessions, IndexedDB, and remote state

- **Supabase Auth**: Supabase JS client maintains browser-origin-scoped authentication state (SDK-managed key naming may vary); homepage backup intentionally filters session/auth-like keys. **Never export tokens, PKCE verifiers, refresh tokens or session cookies.** New-domain re-login is expected; confirm configured Site URL and redirect allowlist separately.
- **IndexedDB / Cache Storage**: No direct first-party `indexedDB` or `caches.open` storage family was established in the inspected staged application code. This is **not proof** that the bundled third-party Supabase SDK, other browser libraries, or future versions never use other storage. A runtime inventory in disposable browsers is a remaining gate.
- **Supabase remote records**: Wishlist, shared WG, and estate cloud snapshots are remote records, not captured by a `localStorage` export. Read-only backend schema/ownership and remote reconciliation need independent review; this inventory does **not** establish remote completeness.
- **In-memory / unpersisted state**: UI drafts and unfinished operations can be lost on navigation even when no local storage key exists; user guidance should require completing edits before cutover.

### D. Prioritized acceptance and no-go implications

1. **P0 / blocking** — Account-scoped wishlist extras and cloud slot/switch/pending/base/revision/owner/opt-in state are excluded from global backup. Require a complete per-owner preservation and reconciliation design, verified with synthetic fixtures; otherwise **NO-GO** for users with local-only edits.
2. **P0 / blocking** — Estate encrypted vault and sensitive finance/household data require verified encrypted export, owner-bound restore, explicit conflict checks and preserved original origin; backup inclusion alone does not prove safe recovery.
3. **P0 / blocking** — Auth session storage is deliberately excluded and must remain excluded. Verify clean new-origin login and Supabase allowed redirects without copying credentials.
4. **P1** — User-generated wishlist markers, categories, favorites and checkpoint views need an explicit migration/retention decision; document expected data loss before any waiver.
5. **P1** — Cloud cache is not a trustworthy recovery source without remote revision validation; missing/stale baseline must block automatic flush.
6. **P2** — Themes, layout settings, recently opened lists, social seen timestamp and parking timers may be re-created, but only by an explicit product decision.

**Current inventory signoff: NOT APPROVED.** This is a documented source-level inventory; no production browser storage was inspected, no user data transferred, and no authorization to deploy is implied. Application code and production configuration remain unchanged.

### Documentation CI verification and nondeterministic browser-test warning (2026-11-13)

- [Run 43477118211](https://github.com/duhrrom11/toolya/actions/runs/43477118211) on documentation commit `9cd8c29a7`: **SUCCESS**.
- [Run 43477162467](https://github.com/duhrrom11/toolya/actions/runs/43477162467) on documentation commit `4d371e5c2`: **FAILURE**. The static audit and JS checks passed, but `Headless Chrome local smoke tests` failed on the homepage/legal/privacy pages and `Isolated two-origin browser storage checks` timed out after 45 seconds. No application or test script changed between those two documentation commits; this suggests CI/Chromium nondeterminism but does **not** establish the root cause. Do not treat the failed run as green.
- New documentation-only inventory runs `43477891416` and `43477943605` were in progress/queued at initial inspection; verify their eventual conclusions before claiming a green current HEAD.
- **Release gate remains NO-GO** until a reproducibly green exact candidate commit and a resolved/accepted browser-test reliability criterion. No code or CI scripts changed in this inventory task.

## Read-only Chromium CI stability assessment and reproducibility plan (2026-11-13)

**Scope:** Inspected GitHub Actions run/job states and failing job logs plus the existing `.github/workflows/migration-audit.yml`, `scripts/smoke_staging.py`, `scripts/smoke_mocked.py`, and `scripts/test_two_origins.py`. **Only this report may be changed in this task.** No test, workflow, application, Supabase, merge or deployment changes.

### Verified run ledger (at assessment)

| Run | Head SHA prefix | Verified result | Evidence |
|---|---|---|---|
| [43478019991](https://github.com/duhrrom11/toolya/actions/runs/43478019991) | `1aacdee3c1` | **IN PROGRESS** at first and follow-up queries; do not count as green | Documentation-only commit, exact current HEAD before this report update |
| [43477943605](https://github.com/duhrrom11/toolya/actions/runs/43477943605) | `1aa1cc98ee` | **SUCCESS** | Data inventory count correction, documentation only |
| [43477891416](https://github.com/duhrrom11/toolya/actions/runs/43477891416) | `3e25dbad88` | **SUCCESS** | Data inventory, documentation only |
| [43477162467](https://github.com/duhrrom11/toolya/actions/runs/43477162467) | `4d371e5c26` | **FAILURE** | `Headless Chrome local smoke tests` and `Isolated two-origin browser storage checks` |
| [43477118211](https://github.com/duhrrom11/toolya/actions/runs/43477118211) | `9cd8c29a78` | **SUCCESS** | Documentation-only commit |
| [43476720388](https://github.com/duhrrom11/toolya/actions/runs/43476720388) | `f3eff12083` | **SUCCESS** | Full migration CI including two-origin check |
| [43475839897](https://github.com/duhrrom11/toolya/actions/runs/43475839897) | `5aed79fb65` | **SUCCESS** | Full migration CI, 18/18 isolated checks |
| [43475811181](https://github.com/duhrrom11/toolya/actions/runs/43475811181) | `4879b46864` | **FAILURE** | Chrome smoke and two-origin steps failed; earlier test harness variant |
| [43475397596](https://github.com/duhrrom11/toolya/actions/runs/43475397596) | `2585e58737` | **FAILURE** | Earlier browser test iteration |
| [43475311677](https://github.com/duhrrom11/toolya/actions/runs/43475311677) | `8c91248385` | **FAILURE** | Earlier browser test iteration |

**Direct failure evidence from run 43477162467:** the Chrome smoke printed `FAIL: index.html`, `FAIL: legal.html`, and `FAIL: privacy.html`; the two-origin subprocess raised `subprocess.TimeoutExpired` with `timeout=45` at `scripts/test_two_origins.py:62`. These are runner/browser outcomes, **not proof** that the staged pages or storage-isolation semantics are broken. The run's complete smoke JSON should be retained before categorizing each page failure; failure labels alone do not establish whether the cause was process timeout, missing instrumentation or rendering.

### Prioritized stability risks and hypotheses

| Priority | Finding / confidence | Consequence | Diagnostic discriminant |
|---|---|---|---|
| **P0 CI reliability** | **Observed:** same test code passed and failed on documentation-only pushes; full run sometimes red | Cannot require one lucky green run as reliable release evidence | Re-run same immutable SHA in serial and repeat; distinguish infrastructure from deterministic assertion |
| **P1 process contention** | **Plausible, not proven:** `smoke_staging.py` and `smoke_mocked.py` use `ThreadPoolExecutor(max_workers=3)`; each case launches its own headless Chrome process; separate branch pushes can start overlapping workflows | Chromium process/CPU/memory exhaustion, slow shutdown or contention | Record process count, RSS, available memory, Chrome exit status and overlap with other runs; compare serial vs parallel |
| **P1 fixed subprocess timeout** | **Observed:** 35-second per-page timeout in both smoke scripts; 45-second timeout in `test_two_origins.py`; 45-second timeout was actually reached | Runner speed influences pass/fail; a timeout is not a failed storage assertion | Capture elapsed time and timeout phase; differentiate startup, navigation, iframe message and browser exit |
| **P1 limited failure artifacts** | **Observed:** two-origin script only parses final `--dump-dom` output and reports limited stderr; no phase timestamps, screenshots, Chrome process metrics or preserved timeout trace | Root cause cannot be established from timeout alone | On failure capture bounded stdout/stderr, phase marker, page/iframe state, Chrome version and memory; scrub fixture content |
| **P2 nondeterministic browser lifecycle** | **Plausible:** `--virtual-time-budget=4000` and cross-origin iframe/postMessage handshake rely on browser event progression; `--dump-dom` waits for completion | Potential missed message or browser waiting despite successful page script | Distinguish no page load, no `before`, no `after`, DOM present but process still running |
| **P2 CI environment drift** | **Observed:** workflow uses `ubuntu-latest`, system Chrome lookup and no pinned Chrome version | Browser/runner image changes can affect timing | Record runner image, Chrome/Chromium version, Python and Node versions on each run |
| **P2 classification** | **Observed:** offline external CDN resources are reported `OFFLINE-LIMITED`; mocked browser script intentionally treats mock warnings as diagnostic | A green workflow does not mean external dependencies or real Supabase integration passed | Keep separate categories: deterministic assertion PASS, offline limitation, mock warning, infrastructure timeout, real app failure |

### Reproducible production-isolated validation plan (proposal only; not implemented)

1. **P0 — Freeze a single candidate SHA (Migration engineer / QA):** stop overlapping documentation pushes for the measurement window; record exact commit, runner image, Chrome/Python/Node versions and GitHub run ID. Use manual `workflow_dispatch` on the **same SHA**. Never compare two different SHAs as identical trials.
2. **P0 — Establish baseline (QA):** run the complete workflow **at least 5 consecutive times**, serially, with no overlap, using localhost-only servers and synthetic storage fixtures. Acceptance for CI-stability gate: **5/5 complete green**, 5/5 two-origin PASS, zero unexplained Chromium timeouts. If any failure occurs, preserve its logs and classify before retrying; do not silently discard failed trials.
3. **P1 — Collect bounded diagnostics (CI maintainer; future test-only authorization):** on every browser run log browser version, process exit code, elapsed time, URL/phase, bounded stderr and resource availability. On timeout collect process tree and last completed handshake phase, and terminate the process group; do not print real browser data, passwords, tokens or actual user IDs. Keep temporary profiles and artifacts synthetic only.
4. **P1 — Isolate contention (CI maintainer; future test-only authorization):** compare a **serial** Chrome page sweep (max_workers=1) to the current max_workers=3, each for 5 runs at the same SHA. If serial is stable and parallel fails, reduce concurrency or isolate jobs; do not simply increase timeouts without root-cause evidence. Consider workflow-level concurrency with cancellation policy that does not hide test failures.
5. **P1 — Separate process exit from test assertion (QA):** treat `TimeoutExpired`, missing `--dump-dom` report, Chrome nonzero exit, missing cross-origin `before/after` phase and explicit storage mismatch as **distinct failures**. Acceptance: an assertion PASS is never inferred from a browser that failed to exit; all timeouts remain visible and blocking until explained.
6. **P1 — Control isolation (Security/QA):** retain `127.0.0.1` servers, ephemeral profiles, `connect-src 'none'`, DNS restriction, fake accounts and no production Supabase; check test harness makes no real network calls or production storage writes. Verify no external credentials enter logs.
7. **P2 — Pin/record toolchain (CI maintainer; future authorization):** prefer explicit browser version or at minimum record browser binary/version and runner image. Re-run reproducibility suite after any runner/browser upgrade.
8. **P0 — Release gate and escalation (Release approver):** require a fully green **exact release SHA** after reliability remediation, stable repeat results and separate data/auth/redirect GO gates. Any unexplained timeout, missing diagnostic evidence, or unresolved P0/P1 remains **NO-GO**. No retries used to relabel a red run as green.

**Change boundary:** The proposed test/workflow improvements above require a **separate explicit request**. This task only documents the evidence and plan. No test scripts or application files were changed. The latest documentation commit will itself trigger CI; its outcome must be checked later.

## Chromium test harness hardening implemented (2026-11-13)

**Scope / branch:** `migration/english-paths-clean`; changes restricted to `scripts/chrome_isolation.py` (new), `scripts/smoke_staging.py`, `scripts/smoke_mocked.py`, `scripts/test_two_origins.py`, `.github/workflows/migration-audit.yml`, and this report. No staged application HTML/JS/CSS, Supabase settings/data, main, merge, DNS or deployment changed.

### Implementation and observable effects

1. **Process cleanup and bounded timeout diagnostics** (`scripts/chrome_isolation.py`): launch headless Chrome in a separate process session; on timeout send SIGTERM to process group, wait up to three seconds, then SIGKILL if necessary, reap stdout/stderr and report test label, configured timeout, measured elapsed time, exit status and a bounded stderr tail. Return a distinct `timed_out` flag so a process timeout cannot masquerade as a storage assertion pass.
2. **Reduced local smoke parallelism** (`scripts/smoke_staging.py`, `scripts/smoke_mocked.py`): `ThreadPoolExecutor(max_workers=3)` -> `max_workers=1`; both use the shared Chromium runner, 45-second per-page timeout and failure details. Expected tradeoff: lower runner pressure but longer total smoke duration.
3. **Two-origin Chromium cleanup** (`scripts/test_two_origins.py`): shared process runner, 60-second timeout, bounded stderr/elapsed diagnostics, retained ephemeral browser profile, two distinct localhost port origins, cross-origin iframe and explicit synthetic allowlist transfer. This does not create a real browser backup file and does not touch user data.
4. **CI overlap and environment metadata** (`.github/workflows/migration-audit.yml`): branch-scoped concurrency group with `cancel-in-progress: false`; browser/runner/Python/Node versions, CPU count and available memory recorded before tests. A queued run is **not** counted as a pass; preserve failed runs rather than silently retrying.

### Verification state and acceptance

- Prior baseline [run 43478350664](https://github.com/duhrrom11/toolya/actions/runs/43478350664) completed **SUCCESS** on the preceding documentation-only commit.
- Hardening commits `bf6ab16`, `beccc053`, `f41e773`, `bb380d2`, and `ef3a558` were pushed to the migration branch. Their CI outcomes must be verified against the exact respective SHAs. At the initial post-change check, several earlier pushes were still running; **do not claim a completed green hardening run yet**.
- **Required acceptance:** exact final commit green; 3/3 two-origin assertions, 5/5 offline pending assertions, 10/10 backup assertions; 32 staged pages covered; no unexplained timeout. For the CI reliability release gate, run at least five consecutive, nonoverlapping trials on the same immutable candidate SHA and require 5/5 complete success.
- **Residual limits:** This mitigates concurrency and process leaks but does not prove why previous Chromium timeouts occurred. Runner and browser version drift, long-running child processes, event-loop/iframe stalls and real data/auth migration risks remain. Future failures should be classified using new diagnostics; do not increase timeouts or waive red runs without evidence.

**Release remains NO-GO.** These are test/CI-only changes and do not authorize any production migration.

### Post-hardening CI verification — confirmed (2026-11-13)

**Verified successful full workflow:** [run 43478825999](https://github.com/duhrrom11/toolya/actions/runs/43478825999), exact commit `b583c837605b542d24d8498551fff90a4511a12a`, status `completed`, conclusion `success`. The four intermediate test-hardening commits `bf6ab16ac9`, `beccc05369`, `f41e773dab`, and `bb380d2021` also each had a completed successful workflow. No test-only fixes were needed after this verification.

**Assertions observed in the successful job log:** isolated backup **10/10 PASS**, cross-origin browser storage **3/3 PASS**, offline cloud pending **5/5 PASS**, combined **18/18**. The smoke, mocked browser, navigation, UI and static audit steps all completed successfully as workflow steps. Note that the offline smoke intentionally reports offline external-dependency limitations and the mocked browser diagnostics may contain expected fake/offline errors; a green workflow is **not** proof of live CDN or Supabase integration.

**Recorded runner/toolchain:** Linux `ubuntu26` image `20261101.186.1`; Python `3.14.4`; Chrome `156.0.8078.79`; 4 CPUs; memory available `15430320 kB` at test setup. The two-origin step ran from approximately `18:04:37` to `18:05:11` UTC (~34 seconds), below its 60-second timeout, but long enough to warrant monitoring rather than claiming timeout elimination.

**Outstanding reliability qualification:** This is **one confirmed green full run at the hardening-and-documentation SHA**, not the prescribed 5/5 serial repetitions at one immutable SHA. Prior Chromium failures remain recorded; the root cause is not proven. A separate workflow run at a prior intermediate SHA may remain queued due to branch-scoped concurrency; it does not invalidate the green result for `b583c8376`. This report update itself creates a newer documentation commit, so its exact-HEAD CI must be verified separately.

**Release decision remains NO-GO:** real encrypted cross-origin UI restore, excluded owner-scoped wishlist/cloud pending data, vault conflict recovery, production Auth redirect review, and legacy URL/metadata acceptance remain open. No application source, production Supabase data/config, merge or deployment changed.

## Immutable-SHA five-run CI reproducibility request — actual verification (2026-11-13)

**Read-only GitHub Actions check:** The previously pending [run 43479261757](https://github.com/duhrrom11/toolya/actions/runs/43479261757), SHA `fb855d371ba0a919f7b61c7185a3f64d2f30ce2e`, is now **completed / success**. Prior successful runs `43478971820` (`ef3a55819478`), `43478825999` (`b583c837605b`), `43478716511` (`bb380d2021e2`), `43478690975` (`f41e773dab45`), `43478670230` (`beccc05369b0`) and `43478639727` (`bf6ab16ac93e`) are also **completed / success**. They are **distinct SHAs**, not repeated trials on the same immutable commit.

**Execution capability limitation:** The connected GitHub actions expose reads and reruns of failed jobs, but not a supported full workflow-dispatch action or a rerun of a successful full workflow. Therefore **0 of the requested 5 controlled same-SHA repetitions were initiated or completed** in this task. No synthetic pass count, dummy commits, CI workflow edits, production access or code changes were made.

**Next reproducibility procedure:** Freeze a candidate commit (prefer a SHA after this documentation update); using an authorized GitHub Actions interface, dispatch the `Migration static audit` workflow five times **sequentially** against the exact same SHA/ref, waiting for each complete result before starting the next. Record run ID, attempt, exact `head_sha`, runner/Chrome version, duration, per-step conclusion, isolated assertions (backup 10, two-origin 3, pending 5), and any timeout diagnostics. **GO for CI reliability only if all 5/5 are green without unexplained timeout.** Do not count runs from different commits, incomplete runs, or a retry that hides an earlier failure. Keep `NO-GO` for release independently of CI reliability until the data/auth/legacy gates pass.

**This update changes only `staging/FINAL-AUDIT.md`.** Its resulting new commit may itself trigger another push CI; that is not one of the five controlled repetitions.

## Five-run execution capability audit — GitHub + browser automation (2026-11-13)

**Newest verified CI:** [run 43479911364](https://github.com/duhrrom11/toolya/actions/runs/43479911364) on SHA `641c973b589dff9337e79d8ff44236dea716b937`: **completed / success**. This is an ordinary documentation push run, **not** a controlled repeated trial.

**GitHub connector capability inspection:** Available actions include read-only workflow/run/job/log retrieval and retry actions for **failed** workflow jobs. No exposed action dispatches the full workflow or re-runs a successfully completed full workflow. A failed-job retry is not an equivalent five-run whole-workflow reproducibility test.

**TinyFish browser automation capability inspection:** `run_web_automation` can navigate and click GitHub Actions, but `list_profiles` reports one default profile (`prof_a093696d154844d8`) with `signed_in_sites: []`. There is **no verified authenticated GitHub browser profile**. Per connector guidance, do not run a sign-in-required automation until the user confirms a signed-in profile or authorizes a browser-profile sign-in setup. No sign-in attempt, browser workflow dispatch, or credential handling occurred.

**Same-SHA reproducibility results:** **0/5 initiated; 0/5 completed.** The five-run acceptance criterion remains **UNVERIFIED**, not passed or failed. To enable: obtain an authenticated GitHub browser profile through the user's explicit setup action, then choose and freeze a candidate SHA and execute one full `workflow_dispatch` at a time (waiting for completion), checking exact head SHA and per-step results for each of five runs. Do not create dummy commits, change production data, or count differing SHA push runs.

**Boundary:** Only this audit document was modified. No application code, test scripts, CI configuration, merge, production Supabase access or publication. The documentation update itself may trigger another normal push CI, which is not a controlled repetition. Overall release **NO-GO**.

## Authenticated TinyFish dispatch recheck (2026-11-13)

User reported saving a GitHub sign-in for default profile `prof_a093696d154844d8`. A fresh `list_profiles` returned `signed_in_sites: []`; a new browser automation on [the workflow page](https://github.com/duhrrom11/toolya/actions/workflows/migration-audit.yml) explicitly checked authentication and attempted **at most one** `Run workflow` only if authenticated. Browser observed **Sign in / Sign up**, **no Run workflow button**, and reported **no run started**. Browser automation ID `4853708f-468d-4c8c-b57d-96e37c1848b0`. The workflow YAML itself includes `workflow_dispatch:` on `migration/english-paths-clean`, but that does not establish the browser's authorization.

**Five-run immutable-SHA gate: 0/5 started, 0/5 completed; blocked by missing authenticated browser session.** No workaround, fake pass, CI code change, production Supabase access, merge or publication. Next action requires saving an authenticated GitHub session in the actual TinyFish default profile and verifying that `signed_in_sites` includes GitHub or that the live browser is demonstrably signed in before dispatch. Documentation-only commit may trigger ordinary push CI and changes the branch HEAD; freeze the new exact SHA before any eventual five-run trial. Overall **NO-GO**.

## Authenticated GitHub Actions browser check — dispatch unavailable (2026-11-13)

TinyFish default profile `prof_a093696d154844d8` now has a saved GitHub login (`signed_in_sites` includes `github.com`); live browser run `ab977647-5cdf-4e18-a2f8-9c3e6d188ef5` confirms an authenticated session. On the [Migration static audit workflow page](https://github.com/duhrrom11/toolya/actions/workflows/migration-audit.yml), the agent could **not** find `Run workflow`; the workflow overflow menu showed only `Create status badge`, `Pin workflow`, `Disable workflow`. **No workflow dispatched; 0/5 completed.** Missing UI control alone does **not** prove insufficient repository write permission.

**Additional structural finding:** `.github/workflows/migration-audit.yml` exists on `migration/english-paths-clean` with `workflow_dispatch:`, but a GitHub connector read of that exact path at `main` returned **404 Not Found**. GitHub requires a workflow file to be present on the repository's default branch for `workflow_dispatch` to trigger. This is a **plausible independent blocker** if `main` is the default branch; default-branch metadata was not verified in this check. No changes to `main` are authorized by this migration task, so do not copy the workflow there merely to enable dispatch.

**Acceptance gate:** 0/5 same-SHA runs initiated, 0/5 passed; **UNVERIFIED**. To proceed, first verify default branch and GitHub Actions dispatch eligibility and permissions through an authorized mechanism, without touching the public site or merging. Keep overall release **NO-GO**. Only this report updated; no app code, tests, CI workflow, Supabase, merge, or publication.

## Five consecutive immutable-commit CI re-executions — PASSED (2026-11-13)

**Verified configuration:** GitHub `get_repo` reports default branch `main` and the connected GitHub app's repository permissions include `admin=true`, `push=true`. The workflow `.github/workflows/migration-audit.yml` has `workflow_dispatch:` on the migration branch but is absent from `main`; thus the browser could not expose a normal `Run workflow` action. TinyFish live browser confirmed GitHub sign-in but no dispatch button. Neither `main` nor the workflow YAML was changed.

**Authorized alternative actually executed:** GitHub's `rerun_workflow_job` action successfully re-ran the already successful **single** `audit` job of [workflow run 43485233500](https://github.com/duhrrom11/toolya/actions/runs/43485233500). This is equivalent to re-executing the entire job's audit steps for this **one-job workflow**, while keeping its original run ID and immutable `head_sha`. This is **five sequential job rerun attempts**, not five separately dispatched workflow run IDs; distinguish this accurately.

**Frozen tested SHA:** `f9355a5485c33dfe0ec9483e5c260216053f3df7`. Original push attempt #1 was already green; reruns #2, #3, #4, #5 and #6 were started **only after the previous attempt completed successfully**. Each of the five reruns was confirmed by GitHub REST as `status=completed`, `conclusion=success`, same run ID `43485233500` and same `head_sha`. **Reproducibility: 5/5 PASS** on that exact SHA.

Latest attempt #6 job `132097647717` has all listed steps `success`. Its decoded logs confirm isolated encrypted backup **TOTAL 10**, two-origin localhost browser **TOTAL 3**, offline cloud-pending **TOTAL 5**: **18/18 isolated assertions** in the last rerun. No evidence of a timeout in the final job outcome. The five complete attempts' green conclusions were verified individually; assertion totals were explicitly inspected in the final attempt, not individually audited for all five logs.

**Scope and limitations:** All tests are isolated CI checks; they do not establish production Supabase compatibility, actual encrypted backup UI transfer between origins, complete auth/legacy redirects, or release readiness. This report-only update creates a **new documentation commit** after the tested SHA; do not misrepresent it as part of the five frozen-SHA trials. No app code, tests, workflow config, `main`, public homepage, Supabase, merge, or deployment changed. **CI reliability gate PASSED on tested SHA; overall migration release remains NO-GO** pending other gates.
