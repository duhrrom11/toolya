# Wunschlisten-Finder

Admin entry: `/admin-stats-dashboard/wishlist-finder.html`. Uses the same fixed owner ID, email and server-managed `toolya_stats_admin` authorization as the existing statistics dashboard. No contact records are exposed through public tables, views or RPCs.

Deploy `20261117173000_wishlist_discovery.sql`, then the `wishlist-discovery` Edge Function with gateway JWT verification disabled: its handler validates the bearer token using Auth getUser and checks the fixed admin identity before any action. The application targets Toolya `yheogmeaosuigyaxkwth` exclusively.

Automatic search requires a Brave Search API key. The owner may enter it in the admin area: it is sent only to the authenticated Edge Function, encrypted using Supabase Vault, and never returned. An existing `BRAVE_SEARCH_API_KEY` Edge secret takes precedence. Provider charges and quotas apply. File import and explicit source crawling work independently of this key.

Search covers DE/AT/CH, Liechtenstein, German content worldwide and Luxembourg terms in German, French and Luxembourgish. This is a finite expandable search plan, not a promise to exhaust the web. A search run continues only while the browser remains open; query offsets and pending source URLs persist in the database. Stop waits for the active bounded request. Failed sources may be retried explicitly through the source URL form. Automatic crawls do not revisit claimed sources. Only direct standard Amazon list links are currently extracted; shortlinks and JavaScript-only pages can require manual supplementation. Robots exclusions, timeouts and fetch limits apply.

Each list identity is the normalized uppercase Amazon list ID, independent of URL alias, tracking and hostname. Insert-on-conflict and unique database constraints prevent repeated candidates and imports; publication is serialized transactionally and compares profiles and older Amazon publications. Known lists are marked duplicates during staging. Source claims are independent of the domain, allowing multiple pages/lists per site.

An owner reviews names and images, edits extracted fields if needed, and selects candidates to publish. Public source discovery is not an Amazon availability check: the UI explicitly asks the owner to verify that the link still opens publicly. No Amazon account is accessed. Imported public entries are separately identified as publicly found and contain no account identity. They are included in the shared search and detail view. Contact emails remain in private staging. Images fall back to the visitor's chosen approved mascot, including on load failure. All published list links use `tag=duhrrom-21`. Imports can be withdrawn from the admin area.

CSV uses UTF-8 BOM, semicolon delimiters and formula protection. JSON is an array. Required input fields: `name`, `wishlist_url`, `source_url`. Optional fields: `type`, `logo_url`, `email`, `country`. Imports publish nothing until explicit selection. Large files are staged in chunks of 200. Public and existing owner data are not overwritten.

Validation: Node URL/CSV/security contracts; isolated PostgreSQL migration and rights/idempotency assertions in Amazon CI; isolated Chromium mobile/selection/publication flow in platform CI. Browser API requests use fixtures exclusively, not production writes.
