# Public SEO and performance follow-up — 2026-11-26

Scope: public DE/EN homepage and sitemap. No changes to authenticated application routes, Supabase, auth handlers, personal data, service worker policy or mascot originals.

## Release candidate
- The homepage uses the existing marketing catalogue and locale helper only. The full i18next application runtime remains unchanged on tool routes and other pages.
- Responsive hero preload uses the identical srcset/sizes as the img. Lazy illustrations decode asynchronously. No visual asset replacement.
- Sitemap includes 16 reciprocal DE/EN pairs plus x-default pointing to the existing German default, while preserving all 33 URLs.
- The operator Person entity uses the existing imprint as its public identifier and profile URL. No unsupported professional claims.
- Search crawlers remain allowed; GPTBot training and Google-Extended training/non-Search grounding are opted out. robots.txt is voluntary crawler guidance, never privacy enforcement.

## Verification and remaining work
- Run the existing isolated i18n and browser checks, including the new public-home-seo tests. Compare before/after mobile Lighthouse under identical conditions; do not infer LCP improvement solely from fewer dependencies.
- Current hosting is GitHub Pages. Custom HTTP cache headers need verified CDN/hosting support; no blanket service worker cache. If introducing a static asset cache later, use only content-hashed, explicitly allowlisted public assets and avoid authenticated HTML, requests, attachments, API responses and user data.
- Generate smaller WebP derivatives from existing assets in an isolated checkout; verify appearance and dimensions before referencing them. Do not overwrite the eight original PNGs. Use a deterministic CSS/JS minifier in a reviewed build; verify all application and accessibility tests before replacing bundles. Do not combine files simply to satisfy a count-based audit.
- Recheck all English sitemap URLs in Search Console after deployment; current source uses index,follow, but stored Google status can lag. Google Search Console URL Inspection API is read-only; request recrawl through Search Console UI where appropriate, not the unrelated Indexing API.
- Check actual HTTP/www redirect chain and all resource responses in a browser, including mixed content. Source review is not a live HTTP-header verification.

## WebMCP feasibility
Public cake-pan area/quantity conversion is a suitable first candidate (existing pure functions in shared/toolya/i18n/pan-calculator.mjs). Chrome WebMCP is early preview; do not deploy an untested registration or external MCP endpoint. Use feature detection for document.modelContext.registerTool, a strict numeric schema, existing input limits, finite outputs, no network/storage/auth, no DOM-derived personal data, and isolated browser testing. No registration on private dashboard, budget, estate, health, wishlist administration or other account routes. Do not use the deprecated navigator.modelContext API. This is an investigation, not an integration or a claim of browser support.

References:
- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://developers.openai.com/api/docs/bots
- https://developers.google.com/crawling/docs/google-extended
- https://developer.chrome.com/docs/modern-web-guidance/guides/webmcp/webmcp
