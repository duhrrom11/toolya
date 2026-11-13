# Toolya Website Release Gate — 2026-11-13

## Existing application source
- Original source (read only): `duhrrom11/Helferlein`.
- Existing Toolya migration snapshot: `staging/` in `duhrrom11/toolya`, branch `migration/english-paths-clean`.
- Verified real pages: `staging/index.html`, `staging/tools/wishes/index.html`, `staging/tools/baking/index.html`, `staging/assets/helferlein-b3-startseite.js`, `staging/manifest.json`.
- The root `index.html` remains a holding page. This release branch must NOT be merged or deployed as-is.

## Confirmed blockers
1. **Production backend contamination:** `staging/index.html` and `staging/tools/baking/index.html` reference the **Helferlein production Supabase URL** `https://avapuibsidubuzxjtyld.supabase.co`. Do not ship until all pages and shared JS are audited and redirected exclusively to `https://yheogmeaosuigyaxkwth.supabase.co` or a separately approved Toolya production project. Never copy production data.
2. **No verified email Auth launch:** Toolya staging Auth Site URL is `http://localhost:3000`; Redirect URLs are empty. Configure for `https://toolya.app` only when the public app and email confirmation flow are ready. Anonymous sign-ins were disabled again after CI.
3. **Publication not prepared:** GitHub Pages currently points at the root holding page. The complete `staging/` application tree, including assets, shared code and legal pages, must be promoted as one consistent artifact, not individual HTML pages.
4. **No verified public URL/HTTPS and E2E browser smoke:** validate before any merge or deployment.

## Required release sequence
- Use `staging/` as the migrated source tree. Do not re-copy older files from Helferlein over the migrated English-path versions.
- Build the complete static site in a temporary CI artifact, with a fail-closed scan for `avapuibsidubuzxjtyld`, old Helferlein canonical URLs, and missing assets.
- Test real email login, redirect, public domain and the wishlist/baking workflows against Toolya only.
- Only then review a PR for merge to `main` and perform a separate authorized deployment.

## Boundaries
No writes to Helferlein. No production-data copy. No merge to `main`. No deployment from this preparation branch.
