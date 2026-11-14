# Current authorization – 14.11.2026
The owner confirmed toolya.app in duhrrom11/toolya as the release target, including adoption of the other tools. This supersedes the historical planning-only/coming-soon restrictions below. User data and old Helferlein hosting remain protected. Current routes and selected runtime assets are recorded in docs/runtime-port-inventory.json.

# Toolya migration inventory and naming policy

Status: planning only. Do not overwrite the live toolya index.html or modify duhrrom11/Helferlein. Last source tree reviewed: 2026-11-13.

## Principles
- Selectively migrate only verified live product code and required assets, dependencies, legal pages, PWA files, and production-safe workflows.
- Short lowercase ASCII English slugs, hyphen only when essential; prefer descriptive short names over cryptic abbreviations.
- Keep index.html as each tool's entrypoint. Rename subpages to concise English names.
- Fix ALL internal references (HTML href/src, JS imports and dynamic paths, CSS url(), manifest start_url/scope, service workers/cache paths, navigation, sitemap, robots, canonical/og URLs, workflow paths, test assertions).
- Never blindly copy production data, secrets, SQL migrations, staging code, fixture data, obsolete workflows, historical documentation, or duplicate implementations.
- Supabase production must not be modified during static migration; do not insert test data. Verify auth redirects and allowlisted domains separately.
- GitHub Pages at toolya.app remains a coming-soon page until the migration has passed validation and an intentional release is approved.
- Keep existing Helferlein repository and Pages URL intact.

## Candidate route map (subject to dependency and feature audit)
| Old path | Candidate new path |
| --- | --- |
| /index.html | /index.html |
| /tools/autokosten-reifenwechsel/ | /tools/car/ |
| /tools/backform-umrechner/ | /tools/baking/ |
| /tools/digitaler-nachlass/ | /tools/estate/ |
| /tools/energie/ | /tools/energy/ |
| /tools/haushaltsbuch-kassenbon/ | /tools/budget/ |
| /tools/haustier-gesundheitspass/ | /tools/pet-health/ |
| /tools/haustier/ | /tools/pets/ |
| /tools/kassenbon/ | /tools/receipts/ |
| /tools/kfz/ | /tools/vehicle/ |
| /tools/kisten/ | /tools/boxes/ |
| /tools/küche/küchenmathe.html | /tools/kitchen/index.html |
| /tools/notizen/ | /tools/notes/ |
| /tools/parken/ | /tools/parking/ |
| /tools/parkplatz-merker-parkschein-timer/ | /tools/park-timer/ |
| /tools/pflanzen/ | /tools/plants/ |
| /tools/pflanzenpflege-giessplan/ | /tools/watering/ |
| /tools/umzugskisten-inventar/ | /tools/moving/ |
| /tools/verleih/ | /tools/lending/ |
| /tools/verliehene-gegenstaende-verwalten/ | /tools/loans/ |
| /tools/wg-kasse/ | /tools/shared-budget/ |
| /tools/wg-organisator/ | /tools/housemates/ |
| /tools/wishlist/ | /tools/wishes/ |
| /tools/zaehlerstaende-erfassen/ | /tools/meters/ |
| /datenschutz.html | /privacy.html |
| /impressum.html | /legal.html |

## Nested page examples
- /tools/estate/erben.html -> /tools/estate/heirs.html
- /tools/estate/erben-uebergabe.html -> /tools/estate/handover.html
- /tools/estate/schluessel-drucken.html -> /tools/estate/print-key.html
- /tools/notes/vertrauensperson-einladung.html -> /tools/notes/invite.html
- /tools/notes/vertrauensperson-erstellen.html -> /tools/notes/create-trustee.html
- /tools/notes/vertrauenspersonen-verwaltung.html -> /tools/notes/trustees.html
- /tools/notes/vertrauenspersonen.html -> /tools/notes/trusted.html
- /tools/wishes/gift-assistant.html -> /tools/wishes/assistant.html
- /tools/wishes/gift-dashboard.html -> /tools/wishes/dashboard.html
- /tools/wishes/gift-planner.html -> /tools/wishes/planner.html
- /tools/wishes/my-reservations.html -> /tools/wishes/reservations.html
- /tools/wishes/social-dashboard.html -> /tools/wishes/social.html
- /tools/wishes/social-feed.html -> /tools/wishes/feed.html

## Audit findings from source tree
- 629 files, about 5.46 MB, source tree not truncated.
- tests/: 161 files; .github/: 46 files; docs/: 63 files; supabase/: 68 files.
- tools/: 117 files; amazon-wishlist/: 74 files; assets/: 75 files.
- tools/wishlist and amazon-wishlist have overlapping HTML page names; determine canonical implementation and dependency graph before selecting one.
- Kalendertest.html and dashboard-test-fixture.html are candidate exclusions (verify they are not runtime dependencies).
- Numerous a10-* staging/migration assets, legacy estate files, and historical release checklists need reachability and runtime-reference analysis; names alone are not sufficient evidence for deletion.
- Keep only actually referenced CSS/JS/vendor files, and preserve license files for retained vendors.
- Keep production legal/privacy pages, and confirm they reflect the new brand and domain.

## Before deployment
1. Inventory entrypoints and all referenced assets across HTML/JS/CSS, including dynamic routes and import maps.
2. Identify canonical versions of overlapping tools and classify each source file as retain / merge / archive / exclude with justification.
3. Copy selected source into an isolated branch in duhrrom11/toolya (not directly onto live main).
4. Rewrite references and scan for broken links, old /Helferlein/ base paths, stale domain URLs, and renamed asset imports.
5. Check auth redirects, PWA service worker and cache, storage origins, legal text, accessibility, and security.
6. Validate in staging; release only after acceptance and verification. No automatic data migration across browser origins.
