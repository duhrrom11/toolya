# Toolya DE/EN – produktionssicherer technischer Umsetzungsplan

Stand: 2026-11-21. Dies ist die **Vorbereitungsphase auf einem separaten Branch**. Keine Live-Bereitstellung, keine Migration und keine Änderung bestehender Produktivdaten.

## Geprüfter Bestand
- Repository `duhrrom11/toolya`, GitHub Pages und statische HTML-/JS-Seiten; CommonJS-Paket mit `node --test`-Tests und Playwright-Vertragstests.
- Öffentliche SEO-Ratgeber unter bestehenden deutschen URLs, separate `/tools/<name>/index.html`-Anwendungen. Tool-Anwendungen haben teils `noindex,follow`, Auth-Gates und Cloud-Only-Verhalten.
- `shared/toolya/platform.mjs` und `buddy.mjs`: bestehende Maskottchen `turquoise`/`purple`; Speicherkey `helferlein-toolya-preferences-v1`. Die Maskottchenwahl darf durch Sprache **nicht** geändert werden.
- Deutschsprachige Startseite mit Canonical `/`, OG `de_DE` und Schema.org `inLanguage=de`. Sitemap enthält bislang nur deutsche URLs.
- Supabase-Verbindung über gepinntes lokales Vendor-Script `supabase-2.57.0.js`. In dem sichtbaren Supabase-Projekt `toolya-staging` keine allgemeine `locale`-Spalte vorhanden; `wishlist_discovery_queries.lang` ist fachlich getrennt. Projekt `Helferlein` separat, hier nicht ändern.
- **Nicht abschließend geprüft:** ob die sichtbare Staging-Datenbank dieselbe ist wie der Live-Backend-Endpunkt. Vor produktiver DB-/Auth-Konfiguration gesondert verifizieren.

## Architektur / Reihenfolge
1. **Öffentliche Seiten separat lokalisieren.** Bestehende `/` und alle deutschen Legacy-URLs weiter mit HTTP 200 ausliefern; keine pauschalen Redirects. Neue `/en/`-Startseite und priorisierte englische SEO-Ratgeber unter `/en/moving-boxes/`, `/en/roommate-organizer/`, `/en/plant-care/`, `/en/cake-pan-calculator/`; später `/de/` als zusätzliche oder kanonische deutsche Seite, aber Root-Canonical-Strategie vorher festlegen. Niemals kanonische doppelten DE-URLs indexieren.
2. **UI-i18n je Anwendung schrittweise.** Datengestützte `de.json`/`en.json`-Nachrichtenkataloge pro Tool. Dynamische Texte und HTML `lang`, Form-Fehler, Barrierefreiheit, PWA, Export-/PDF-Texte, Einheiten und E-Mail-Templates übersetzen. Kein `innerHTML` mit Übersetzungsstrings und keine pauschale DOM-Text-Ersetzung. Bestehende Tool-Routen und Cloud-Only-Keys unverändert lassen.
3. **Sprachpräferenz unabhängig speichern.** Für Gäste neuer separater Key `toolya-locale-v1`; bei eingeloggten Nutzern bevorzugt Auth-User-Metadatum `locale` (nur Darstellung, niemals Autorisierung). Priorität: expliziter `/en/`- oder `/de/`-Pfad > manuelle Spracheinstellung > gespeicherte Präferenz > Browser > Deutsch. Zwischen Geräten nach Auth-Metadatum synchronisieren. Die Buddy-/Theme-Präferenzen unangetastet lassen.
4. **Auth ohne neue Nutzerkonten.** Einheitliche Supabase-Auth und Session; `redirectTo` nur mit exakt freigeschalteten DE/EN-Redirect-URLs; Anmeldungsrückkehr zur passenden Sprache und Ziel-Tool-Seite per geprüften internen Return-Pfad. Keine unkontrollierten Redirects, keine Änderungen an RLS oder Service-Keys. Supabase Auth user_metadata nicht für Berechtigungsentscheidungen verwenden.
5. **Internationalisierung fachlicher Daten.** Geld mit `Intl.NumberFormat(locale,{style:'currency',currency})`; Geldwert und ISO-Währung getrennt speichern. UK-Inch-Unterstützung im Backformtool erst nach Format-/Einheitenprüfung; Datumsformate per `Intl.DateTimeFormat`. Keine automatische Währungsumrechnung und keine stillen Datenmigrationen.
6. **Originalmarke.** Logo-/Wortmarken-Asset identisch in Header/Footer, vorhandene beiden Maskottchen und individuelle Einstellung beibehalten. Keine Sprache-zu-Figur-Zuordnung.
7. **SEO erst mit vollständig übersetztem Content.** Eindeutiger Canonical auf jeder Sprachseite, vollständige bidirektionale `hreflang`-Paare `de`/`en` (+ ggf. `x-default` auf Sprachauswahl), lokalisierte OG-/Twitter-Texte, `og:locale` und `og:locale:alternate`, `inLanguage` in JSON-LD und Sitemap. Interne/private Tool-Views weiterhin `noindex`; sie dürfen keine sprachlichen öffentlichen Landingpages kanonisieren.
8. **Social-Funnel.** Jeder Post geht auf konkrete öffentlich erreichbare Sprach-/Tool-Landingpage; CTA nach einem Nutzennachweis zur Anmeldung. UTM `utm_source`, `utm_medium=organic_social`, `utm_campaign`, optional `utm_content`. Attribution datensparsam und consent-konform; Konversionsdefinition `signup_completed` und `first_tool_action` ohne personenbezogene URLs.
9. **Rollout / Test.** Staging-Preview mit realistischen aber synthetischen UI-Daten und ohne Writes in Produktivdatenbanken. Checks: 404/200, alte Links, Login/Logout, Passwortreset, Auth Redirect Allowlist, Buddy/Theme, RLS-unverändert, Fokusnavigation, 320px Mobile, Übersetzungslücken, PDF-Exports, canonical/hreflang/sitemap, Tracking nach Sprache. Erst nach Review/Freigabe optional Feature-Flag/Deploy.

## Technischer Prototyp dieses Branches
- `shared/toolya/i18n/locale.mjs`: reine Funktionen ohne Side Effects für Sprachwahl, sichere öffentliche Sprach-URLs und UTM-Links.
- `tests/i18n/locale.test.mjs`: Node-Builtin-Tests.
- Noch **keine** Sprachumschalter-Injektion in die Live-Oberfläche und **keine** öffentlichen `/en/`-Seiten, weil Inhalte, Auth-Flows und SEO erst zusammen vollständig geprüft werden müssen.

## Akzeptanzkriterien für ersten ausführbaren DE/EN-Meilenstein
- Alte deutschen URLs und Tool-Daten unverändert erreichbar.
- EN-Landingpages ohne gemischtsprachige Navigation; vollständige Texte für die ersten vier Tools.
- Manuelle Sprachwahl bleibt beim Navigieren und nach Login erhalten, ohne die Maskottchenwahl zu überschreiben.
- `/en/`-Kampagnenlinks führen zu Englisch und speichern die Kampagnenquelle ohne Tracking-Leak.
- Kein Datenbank-Schema-Update nötig für Spracheinstellung; Änderung an Auth-Metadaten erst nach gesonderter Auth-Integration und Staging-Prüfung.
- Indexierbare öffentliche Seiten haben richtige locale-, canonical-, hreflang- und Sitemap-Daten.
