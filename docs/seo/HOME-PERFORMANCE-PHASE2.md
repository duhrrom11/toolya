# Public homepage performance phase 2 — verified candidate

Source baseline: e53ee4d25a117d7a81e7df990fe051543806396c.
Verified GitHub Actions run: 45824122809; artifact 15118649173, ZIP SHA-256 e6e97046e3d6898cc02667d8acb540e12ec50f6048a45c5adef520783a52c60c.

- 15 image derivatives: 884734 → 549572 bytes (335162 bytes saved).
- 6 minified static assets: 92908 → 84617 bytes (8291 bytes saved).
- Total raw asset size reduction: 343453 bytes across all variants, not per navigation.
- Direct stylesheet links: 8 → 2. Dynamic platform styles and synchronous auth scripts unchanged.
- All eight mascot original PNG checksums passed.
- Browser comparison: DE/EN at 390 and 1440 px, 8 screenshot comparisons. Hero PSNR 38.61–39.56 dB; sampled tool card images pixel-identical. Layout, links, language and settings behavior passed.
- Existing isolated home-auth regression passed. Public cache only stored the allowlisted static asset in the synthetic privacy check.
- Phase 1 live verified on /, /en/ and /robots.txt in the same run.

## Maintenance and cache policy

The 21 generated files and manifest are committed as release artifacts. The readable source CSS, JS and original WebP files remain unchanged. The source homepage and offline-only service worker before promotion are preserved in the baseline commit. To reproduce this release, use the CI recipe: archive the baseline homepage/SW into an isolated copy of the current checkout, remove generated assets from that copy, run the three builders with the pinned Pillow/esbuild versions and compare bytes. Do not run these builders on the working production checkout. Future homepage or stylesheet changes must regenerate and review the affected immutable assets, preserving source and generated HTML consistency; update the baseline recipe for a new release rather than editing only a hash-named asset. Never mutate a file with an existing SHA-256 filename.

GitHub Pages HTTP headers remain host-controlled. Service worker retains its offline navigation behavior; only exact allowlisted public hashed URLs, no query strings and no auth headers qualify for the added static cache. Network fetch omits credentials, rejects redirects; bytes and MIME are checked before storing. Old versioned cache namespaces are removed on activation. No HTML, API responses, accounts, personal attachments or Supabase requests added to the cache.

No Lighthouse improvement is claimed without comparable measurement. The current release does not defer the Supabase SDK or change authenticated application code.
