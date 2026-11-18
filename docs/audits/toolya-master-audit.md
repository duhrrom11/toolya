# Toolya – konsolidiertes Master-Audit SEO, GEO, Technik, Content, Datenschutz und Sichtbarkeit

**Stand:** 18. November 2026  
**Projekt:** https://toolya.app · Repository: `duhrrom11/toolya` · Standardbranch `main` · Hosting: GitHub Pages  
**Status:** Konsolidierung von drei Audits; **keine** Umsetzung oder Veröffentlichung mit diesem Dokument.  
**Quellenkennzeichnung:** `[A1]` = vollständig im aktuellen Chat gelieferter „SEO- & GEO-Audit toolya.app“; `[A2]` = im aktuellen Chat gelieferter Abschnitt **4. Priorisierter Umsetzungsplan** des zweiten Audits (die Abschnitte 1–3 liegen hier nicht vor); `[A3]` = Markdown-Datei `Toolya-SEO-GEO-Audit-2026-11-18.md` aus „SEO Toolya Gesamt“ (Git-Referenz `43f8664`). `[G]` = zusätzlicher lesender GitHub-Abgleich des aktuellen `main` am 18.11.2026. `[E]` = ergänzende fachliche Einordnung aus offiziellen Google-Richtlinien.  
**Beweiskategorien:** **Bestätigt** = im A3-Bericht technisch geprüft oder per lesendem GitHub-Abgleich bestätigt; **Hinweis** = aus A1/A2 ohne technische Gegenprüfung; **Offen** = echte Produktentscheidung, juristische Prüfung, GSC-/Bing-/Analytics-Messung oder noch nicht nachgewiesener Fehler. Ein Audit-Befund ist nicht automatisch ein noch offenes Ticket.

## 1. Ergebnis in Kürze

Toolya besitzt eine solide indexierbare Basis, aber SEO und GEO werden vor allem durch fehlende direkt nutzbare öffentliche Funktionen, wenig eigenständige Vergleichs-/Recheninhalte, schwache externe Autorität und unklare öffentliche/geschützte URL-Grenzen gebremst. Die dringendsten technischen Risikofelder sind 16 alte Wunschlisten-Unterseiten mit HTTP 200 ohne `noindex`, drei operative Nachlass-Hilfsseiten ohne `noindex` sowie parameterbasierte öffentliche Wunschprofile, deren Canonical auf die Verzeichnissuche verweist. **Datenschutz und Zugriffsschutz sind wichtiger als Reichweitensteigerung.**

Die Grundstrategie ist: **Je Suchthema eine starke öffentliche, indexierbare, hilfreiche Landingpage** (Ratgeber + sofort lösbare Beispielaufgabe + kostenloser Kern, sofern sicher), während **interne Nutzer-/Kontofunktionen grundsätzlich `noindex`** bleiben. Das zentrale Toolya-Dashboard bleibt separat unter `/dashboard/`; die Startseite `/` bleibt öffentlich und indexierbar. Daten, Synchronisation und sensible Vorgänge bleiben im vorhandenen sicheren Authentifizierungs- und Berechtigungssystem. Keine breit angelegten URL-Umbenennungen ohne belastbare Redirect-Lösung.

### Prioritäten

| Stufe | Wirkung | Maßnahmenkomplex |
|---|---|---|
| **P0 Schutz** | Hoch | Zugriff/Indexierung bei Nachlass-Hilfsseiten und Wishlist-Altwegen; persönliche Profildaten, Opt-in, Löschung, Import/Anzeige; Auth/RLS/Verschlüsselung; Affiliate-/Rechtsprüfung |
| **P1 Wirkung & Messbarkeit** | Sehr hoch | Search Console/Bing/Analytics-Baseline; Backform-Rechner ohne Login auf **öffentlicher** URL; konsistente kanonische URLs und funktionierende Nutzerwege |
| **P2 Infrastruktur & Inhalte** | Hoch | Technische SEO-Hygiene, JSON-LD sachgerecht, Performance, passende Querverlinkungen, alle 18 bestehenden Seiten verbessern, Mustertabellen/PDFs |
| **P3 Wachstum** | Mittel bis hoch | Suchintent-Cluster, getestete programmatische Unterseiten, nutzbare freie Basis weiterer Tools, externe fachliche Erwähnungen, GEO-Messung |
| **P4 Optionen** | Unsicher | Weitere Sprachversionen, umfassende URL-Migration, große öffentliche Datenstudien und neue Profillandingpages nur bei Belegen/Rechtsfreigabe |

## 2. Datenbasis: Was sicher ist und was nur geprüft werden muss

### 2.1 Technische Inventur aus [A3]

- 52 HTML-Dateien im betrachteten Repository, 69 eindeutige Live-URL-Abfragen (einschließlich Varianten, robots, Sitemap und 404-Test): **68 × HTTP 200, 1 × erwartetes HTTP 404**.
- Die **18 Sitemap-URLs** lieferten je HTTP 200, genau eine H1 und einen selbstreferenziellen Canonical; **13 Ratgeber** sind über statische Links von `/` erreichbar.
- HTTP und `www` wurden stichprobenweise korrekt auf `https://toolya.app` weitergeleitet. Die Forderung aus [A2] nach neuen pauschalen 301-Weiterleitungen ist daher **Prüf-/Regressionsthema**, nicht als ungeprüfter Defekt zu behandeln.
- `robots.txt` ist vorhanden, enthält `User-agent: *`, `Allow: /` und die Sitemap; Search-/KI-Crawler werden auf dieser Ebene nicht gesperrt. `sitemap.xml` ist vorhanden und enthält die 18 kanonischen öffentlichen URLs. Ein allgemeines Neuaufsetzen beider Dateien ist unnötig.
- Die **13 Anleitungsseiten** besitzen laut [A3] parsebares `WebPage`-JSON-LD; das Wunschlisten-Verzeichnis `CollectionPage`. Es ist falsch, pauschal „JSON-LD fehlt“ zu behaupten.
- Die 12 privaten Tool-App-Seiten hatten im A3-Inventar bereits überwiegend `noindex,follow`; `/dashboard/index.html` besitzt `noindex,follow`; Admin-Seiten besitzen `noindex,nofollow`. Das **öffentliche Verzeichnis `/tools/wishes/public.html`** ist die bewusste Ausnahme und soll nicht versehentlich `noindex` erhalten.
- 16 ältere Dateien unter `/tools/wishes/` und die drei Dateien `/tools/estate/{handover,heirs,print-key}.html` waren öffentlich erreichbar, ohne sichtbares `noindex` im geprüften Roh-HTML/Response.
- Öffentliche Wishlist-Detailansichten werden über `?profile=…` aus JS aufgebaut; im initialen HTML fehlt nutzbarer Profilinhalt und das Canonical zeigt auf die Suchseite. **Produkt- und Datenschutzentscheidung erforderlich**, keine automatische Indexierung privater Namensprofile.
- `/index.html` und 13 Ratgeber-`index.html`-Varianten liefern HTTP 200 mit Canonical auf die bevorzugte Kurz-URL. Nicht per se ein Duplicates-Fehler, wohl aber Anlass für saubere interne Links und ggf. echte Redirects.
- Eine 404-Statusantwort existiert, im geprüften Git-Stand jedoch keine eigene `404.html`.
- OpenSEO-Crawl (18.11., 32 Seiten) wies u.a. 10 Bildwarnungen und 10 vermeintliche Waisen aus; auf **aktuelle** URLs/Crawldaten abgleichen, da die Startseite inzwischen 13 Ratgeber verlinkt. Leere `alt`-Attribute sind für dekorative Bilder korrekt.
- GSC-Indexabdeckung, organische Klicks, Impressionen, durchschnittliche Position, Backlinks und CrUX-Felddaten waren im Audit nicht abrufbar. Das ist **Messlücke**, kein Nachweis für schlechte Rankings oder Nichtindexierung.

### 2.2 Lesender Repository-Abgleich [G] am 18.11.2026

- `main` lag bei Commit `4e2bcc99cb0921f4dd77383b070789a4972e804a`, zwei Commits vor dem A3-Referenzstand `43f8664`. Die Vergleichsdateien betrafen im Wesentlichen Design, Startseite, Plattform-CSS/JS und UI-Tests, **nicht** die Backform-Ratgeber-/App-Dateien.
- `backform-rechner/index.html` enthält nach dem lesenden Dateiabgleich eine erklärende Landingpage und **kein direktes Formular**; die App unter `/tools/baking/index.html` enthält `noindex` und eine vorgeschaltete Konto-Prüflogik. Die in einem anderen Arbeitskontext erwähnte Login-freie Umsetzung ist daher **nicht als auf `main` veröffentlicht bestätigt**. Work muss offene Branches/PRs prüfen, bevor es eigene Änderungen beginnt.
- `robots.txt` und `sitemap.xml` in `main` stimmen mit dem A3-Grundbefund überein: `Allow: /` und 18 öffentliche Kanonicals, nicht alle privaten Tool-Seiten.

### 2.3 Nicht belegt / zu messen

- Google-/Bing-Indexstatus pro URL, von Google gewählter Canonical, interne Suchbegriffe, Backlink-/Brand-Abdeckung, Ranking-/Klickraten, AI-Citation-Rate und tatsächlich von Crawlern abgerufene Seiten.
- LCP, INP und CLS **als reale Felddaten**; Labordaten und eine vorläufige mobile LCP-Beobachtung sind getrennt zu führen. Prüfen, ob externe Tailwind-Laufzeiteinbindung, JavaScript, Supabase, Hero-Assets oder DOM-Menge die Startseite bremsen.
- Hosting-/CDN-Kontrolle für HSTS/Security-Headers, Status-Weiterleitungen und `/tools/...`-Migrationsregeln. GitHub Pages allein bietet nicht beliebige serverseitige 301-Regeln.
- Vollständige Datenschutz-/Rechtssituation der Wunschlisten-Importe und Profile, Einwilligung, Löschung, Herkunft und Zweck, Rechtsangaben, Affiliate-Hinweise und Betreiberexpertise.

## 3. Dubletten, Widersprüche und verbindliche Entscheidungen

| Mehrfacher Vorschlag / Konflikt | Zusammengeschlossene Entscheidung |
|---|---|
| `[A1/A2] robots.txt und Sitemap neu` vs. `[A3] vorhanden` | Bestehende Dateien **validieren und pflegen**; keine pauschale Neuerstellung. 18 kanonische öffentliche URLs als Ausgangspunkt. `lastmod` nur bei nachweislich relevanter Änderung. |
| `[A2] alle 12 Tool-URLs in Sitemap` vs. `[A3] private App-URLs mit noindex` | **Nicht** alle 12 hinzufügen. Nur indexierbare, selbstkanonische öffentliche Landingpages in Sitemap; private App-, Konto-, Auth-, Admin- und operative Seiten raus. Tool-Titel/Descriptions auf App-Seiten dennoch benutzerfreundlich halten, aber dort keine Ranking-Priorität. |
| `[A2] public.html/Auth-Views noindex` vs. `[A3] Wunschlisten-Verzeichnis ist öffentlich` | Unterscheiden: Auth-/Profilbearbeitungsansichten `noindex`; **das öffentliche Wunschlisten-Verzeichnis** bleibt nur nach Rechts-/Produktprüfung indexierbar. Öffentliche **Einzelprofile** nicht automatisch indexieren. |
| `[A1] strukturierte Daten fehlen` vs. `[A3] WebPage/CollectionPage vorhanden` | Bestehendes Markup erweitern/vereinheitlichen, nicht blind ersetzen. `WebApplication` nur bei zutreffender Funktion und verifizierten Angaben; `FAQPage` nur bei sichtbaren echten FAQ; `BreadcrumbList` nur bei sichtbaren Breadcrumbs. Kein Anspruch auf FAQ-/HowTo-Rich-Results. |
| `[A2] englische Pfade/HTML-Endungen grundsätzlich umbenennen` vs. `[A3] URL-Kanonicals konsistent` | Keine Big-Bang-Migration. Zunächst öffentliche deutsche Einstiegsseiten nutzen. Umbenennungen nur nach Inventur von Links, Bookmarks, QR-Codes, App-Routing, Querys und **echten** 301/308-Redirect-Möglichkeiten. Meta-Refresh/JS-Redirect sind kein vollwertiger Ersatz. |
| `[A1] Login für alle Tools abschaffen` vs. Datenschutz & bestehende Produktentscheidung | **Öffentliche, sichere Kernfunktion pro geeignetem Tool**, beginnend Backform; Speichern/Synchronisierung und private Daten in bestehenden geschützten Abläufen. Nicht pauschal Auth/RLS/Verschlüsselung entfernen. Nachlass und persönliche Profile bleiben besonders geschützt. |
| `[A1] 1.000–1.800 Wörter je Ratgeber` vs. `[A2] 400–600 Wörter je App` | Inhalte **intent- und nutzwertorientiert**; kein bloßes Wortmengenziel. Detaillierte Tabellen/Muster an sinnvoller öffentlicher Landingpage; auf `noindex`-App nur knappe hilfreiche Bedienhinweise statt konkurrierender SEO-Texte. |
| `[A1] Anleitungsseite und Tool konkurrieren` vs. `[A3] App meist noindex` | Pro Thema primär **eine** indexierbare Hauptseite; die App ist Funktionsziel. Kanonisierung/noindex nur nach Prüfung, niemals blind ein indexierbares Tool zu einer nicht identischen Anleitung canonicalisieren. |
| `[A1] Brand nicht auffindbar` vs. `[A3] keine GSC-Daten` | Indexierung/Brand-Sichtbarkeit **unbekannt**, nicht „nicht indexiert“. GSC/Bing, URL-Prüfung, Brand-Queries und Backlinks messen. |
| `[A1/A2] llms.txt` | **Optionaler Nebenpunkt**, wenn ohne Aufwand korrekt wartbar. Kein SEO-/GEO-Prioritätshebel und kein garantierter Crawling-/Zitierstandard. |
| `[A1] alle Bots freischalten` vs. `[A3] robots bereits offen` | Crawler-Zugriffe prüfen und Such-/Trainingscrawler nach bewusstem Datenschutz-/Nutzungszweck unterscheiden; nicht annehmen, dass `Allow` zu KI-Zitaten führt. |
| `[A1] SearchAction` | Nur ergänzen, wenn tatsächlich eine öffentlich nutzbare interne Seitensuche existiert; nicht die Personen-Wishlist-Suche als allgemeine Website-Suche auszeichnen. |
| `[A1] alt für Icons/Sterne` | Informative Bilder bekommen aussagekräftige Alt-Texte; rein dekorative Maskottchen-Grafiken und SVGs ggf. `alt=""`/`aria-hidden`, interaktive Favoriten-Buttons hingegen verständliche zugängliche Namen. |

## 4. URL- und Indexierungsarchitektur

### 4.1 Öffentlich indexierbare Kernseiten laut aktueller Sitemap (18)

| Nr. | Kanonische URL | Zweck | Veränderung |
|---:|---|---|---|
| 1 | `/` | Marke + Tool-Übersicht | Suchbegriff in H1, präzise Tool-Nutzen, Logo-/Startlinks auf `/`, Geschwindigkeit |
| 2 | `/amazon-wunschliste-veroeffentlichen/` | Eigene Liste teilen | Amazon-Freigabe vs. Toolya-Profil, Sichtbarkeit, Löschung, Beispieldaten |
| 3 | `/autokosten/` | Autokosten/Tankbuch | Kosten pro Monat/km, Fixkosten, Verbrauch, Rechenmuster |
| 4 | `/backform-rechner/` | Backform umrechnen | **Direkter loginfreier Rechner**, Faktorenmatrix, geometrische Grenzen |
| 5 | `/digitaler-nachlass/` | Digitalen Nachlass organisieren | nachvollziehbare Abläufe/Checkliste/Quellen, keine sensiblen Inhalte im HTML |
| 6 | `/haushaltsbuch/` | Ausgaben/Budget/Belege | Beispielmonat, 50/30/20, Fixkosten, OCR-Kontrolle, Vorlagen |
| 7 | `/parkplatz-merker/` | Auto wiederfinden | Parkebene/Platz, Standortfreigabe, Parkzeit/-kosten nur bei realen Funktionen |
| 8 | `/pflanzenpflege/` | Gießplan | Erinnerungsintervall vs. tatsächlicher Wasserbedarf, Muster zweier Pflanzen |
| 9 | `/tiergesundheit/` | Tier-Gesundheitstagebuch | Musterimpfung/Tierarzt, Termine/Erinnerungen, keine Tiermedizinberatung |
| 10 | `/toolya-dashboard/` | öffentliches Dashboard-Intro | Beispieldaten, Grenzen lokaler Speicherung, Link zum getrennten privaten `/dashboard/` |
| 11 | `/umzugskisten/` | QR-Umzugskisten | druckbares Etikett, QR-Workflow, nützliche Vorlage |
| 12 | `/verliehene-dinge/` | Verleihliste | Beispiel vom Ausleihen bis Rückgabe, Leihdauer vs. Rückgabedatum |
| 13 | `/wg-organisator/` | WG-Kosten/Putzplan | anteilige Aufteilung, rotierender Plan, Rollen/Rückzahlung erklären |
| 14 | `/zaehlerstaende/` | Zähler dokumentieren | Strom/Gas/Wasser, Zählerwechsel, Wohnungsübergabe, Gasfaktor nur aus Rechnung |
| 15 | `/tools/wishes/public.html` | öffentliche Wunschlisten-Suche | **Rechts-/Sichtbarkeitsprüfung**, initiale Erklärung, Suchgrenzen, Opt-in, Profilstrategie |
| 16 | `/mascots.html` | Marken-/Maskottchenvorstellung | klare H1, Text-/Bild-Alt-Texte, bestehende Markenassets erhalten |
| 17 | `/legal.html` | Impressum/Betreiber | Kontaktdaten prüfen, auf Betreiber-/Autorenangaben abstimmen |
| 18 | `/privacy.html` | Datenschutz | tatsächliche Auth-, Browser-, Sync-, Analyse- und Wishlist-Verarbeitung abgleichen |

**Wichtige Bestandsregeln:** Keine automatische Weiterleitung von `/` nach `/dashboard/`. Verwendete Wortmarke/Logo in Header und Footer identisch halten. Vorhandene auswählbare türkis-weiße und lilafarbene Maskottchen bleiben nutzerabhängig; Footer und Hauptseiten-Design außerhalb notwendiger Verbesserungen nicht versehentlich verändern.

### 4.2 Nicht in die Sitemap aufgenommene App-/Arbeitsansichten

- `/dashboard/index.html` → `noindex,follow` (privates Dashboard, keine Root-Weiterleitung).
- `/admin-stats-dashboard/index.html`, `/admin-stats-dashboard/wishlist-finder.html` → `noindex,nofollow`; **`noindex` ersetzt keinen Zugriffsschutz**.
- `/tools/baking/index.html`, `/tools/budget/index.html`, `/tools/car/index.html`, `/tools/estate/index.html`, `/tools/housemates/index.html`, `/tools/loans/index.html`, `/tools/meters/index.html`, `/tools/moving/index.html`, `/tools/parking/index.html`, `/tools/pet-health/index.html`, `/tools/plants/index.html` → im A3-Stand überwiegend `noindex`, teilweise unterschiedliche `follow`-Werte. Alle weiteren Tool-Dateien vollständig inventarisieren, auch neue seit A3. **Nur nichtöffentliche/operative Views** mit `noindex`.
- `/tools/estate/handover.html`, `/tools/estate/heirs.html`, `/tools/estate/print-key.html` → fehlendes `noindex` im A3-Stand, aber wesentlich wichtiger: Berechtigungen, kryptographische Schlüssel, Freigaben, Log-Ausgaben und Freigabeabläufe sicherheitstechnisch prüfen.
- `/tools/wishes/index.html` → Meta-Refresh zum öffentlichen Verzeichnis; vor etwaiger Ablösung echte Redirect-Unterstützung prüfen.

### 4.3 Alt-Wishlist-Seiten [A3] – Einzelentscheidungen nötig

`/tools/wishes/assistant.html`, `bookmarks.html`, `cockpit.html`, `collection.html`, `dashboard.html`, `discover.html`, `feed.html`, `gift-analytics.html`, `gift-tasks.html`, `notifications.html`, `occasions.html`, `planner.html`, `profile.html`, `report.html`, `reservations.html`, `social.html`.

Für **jede** Route in einer Tabelle festhalten: aktiv/ersetzt/abgeschafft, öffentliche Inhalte vs. Kontoinhalte, bestehende Deep-Links/Bookmarks, Ziel-URL, Auth-/RLS-Status, HTTP-Status, Canonical/Robots. Entscheidung: echte 301/308 bei gleichwertigem dauerhaftem Nachfolger und technisch möglichem Hosting, 404/410 bei entfallener Seite, `noindex` bei notwendiger öffentlicher Arbeitsansicht, und klare Zugangsbeschränkung bei privaten Daten. Keine gebrochenen QR-/Teillinks; keine private Information im initialen HTML oder Caches.

### 4.4 URL-Varianten und Migration

`/index.html` und alle 13 Ratgeber-`index.html`-Varianten haben bereits saubere Canonicals; intern auf Kurzpfade verlinken. `?v=...`-Versionsparameter von **Seitenlinks** auf Asset-Versionierung/Build-Hashes umstellen; berechtigte Nutzer-/Profil-/Tracking-Querys nicht unüberlegt löschen. `http` und `www` als Regression prüfen. Umbenennungen etwa `/tools/baking/index.html` oder `/tools/wishes/public.html` auf deutschsprachige schöne Pfade nur als gesonderte, nachgewiesen sichere Migration und **nicht** allein zur Kosmetik; Browser- und API-Deep-Links müssen erhalten bleiben.

## 5. Technische SEO- und UX-Aufgaben (dedupliziert)

1. **Crawl & Index:** Canonical, HTTP-Status, Robots-Meta, Sitemap, interne Links, H1, Title/Description, JavaScript-unabhängige Kurzantwort und Linkpfad pro Seite automatisiert prüfen. Alle vorhandenen Search-Console-/Bing-Verifikationen sowie Sitemap-Submission/URL-Inspection verwenden, soweit Berechtigungen bestehen.
2. **Meta & Social:** individuelle Titles, Meta-Descriptions, OG-/Twitter-Card-Daten und `og:locale=de_DE` auf öffentlichen Seiten; bei privaten Tools sinnvolle App-Titel, aber `noindex` beibehalten. Title mit Suchintent, H1 natürlich und unterscheidbar; Seitennamen konsistent halten.
3. **Startseite:** H1 etwa „Kostenlose Online-Tools für Haushalt, Finanzen und Organisation“, bestehenden Claim als Subline; Kategorie-Navigation und echte unmittelbare Nutzenversprechen. Keine Seite mit unerfüllten Funktionen bewerben.
4. **Semantik, Bilder, Icons:** informative `alt`-Texte (Grammatikfehler „Unsere türkisfarbene und lilafarbene Begleiter …“ korrigieren), dekorative SVGs zugänglich verstecken, Favoritensteuerung beschriften; WebP beibehalten, `width/height`, sinnvolles `loading="lazy"`, kein Lazy-Loading für kritisches Hero, `fetchpriority` nur nach Messung. Prüfen, welche 10 OpenSEO-Bildwarnungen heute noch bestehen.
5. **Performance:** Tailwind-CDN-Laufzeitskript in statischen CSS-Build überführen, sofern Messung/Regression Vorteile bestätigt; HTML-Payload (~76 KB laut A3), JS-Menge, Font-/Hero-Ladepfade, Supabase-Initialisierung. Mobile Lighthouse-Labor vor/nach und CrUX-Feldwerte separat; Ziele am 75. Perzentil: LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1. Keine ungemessenen „Verbesserungen“ behaupten.
6. **Accessibility & UX:** semantische Überschriften, Label, Tastatur- und Screenreader-Bedienung, Fokusmarkierungen, Skip-Link, Kontrast, mobile Touch-Ziele, klare Zustands-/Fehlermeldungen. Auth-Views und öffentliche Minirechner nicht vermischen.
7. **Security/Hosting:** HTTPS, HSTS, CSP, Referrer-Policy, Permissions-Policy, Frame-/MIME-Schutz, Cache-Header nur dort, wo GitHub Pages/CDN technisch steuerbar; keine Header versprechen, die dort nicht gesetzt werden können. Keine Secrets in Repo, Logs, Browser-HTML oder generierten Beispielen.
8. **Interne Navigation:** von jedem Ratgeber sinnvolle Aufgaben-Nachbarn: Umzugskisten ↔ Zählerstände, Autokosten ↔ Haushaltsbuch, WG ↔ Zählerstände, Wunschliste veröffentlichen ↔ Verzeichnis; Startseite als Hub. Sichtbare Breadcrumbs nur bei echtem Mehrwert.
9. **404 und Weiterleitungen:** benutzerfreundliche `404.html`, Original-404-Status erhalten; für echte Redirects keine HTML-/JS-Umgehung als „301“ deklarieren. Testmatrix `http`, `www`, `/`, `index.html`, Tool-Deep-Links und `?profile`.
10. **Crawler & GEO:** statisch lesbare Beschreibung, funktionierende Links, nachvollziehbare Beispiele. Bestehende robots-Zulassung dokumentieren; OAI-SearchBot, GPTBot, ClaudeBot, PerplexityBot, Google-Extended zweckgetrennt betrachten; `llms.txt` nur klein, korrekt, wartbar und optional.

## 6. Structured Data – Ausgangspunkt und Ziel

**Vorhanden:** 13 × `WebPage`, 1 × `CollectionPage` (nach A3); keine fehlende Struktur erfinden.  
**Ziel:** `WebSite` mit konsistentem Seitennamen, `Organization` bzw. korrekter Betreiberentität, stabilen `@id`, `sameAs` nur auf nachweislich zugehörige Profile. Öffentliche Ratgeber mit geeignetem `WebPage`/ggf. `Article`, tatsächlichem `dateModified` und korrekten Autorenangaben. `WebApplication` nur wo wirklich eine Web-Anwendung präsentiert wird, mit belegten Eigenschaften (z. B. `inLanguage`, `operatingSystem`, Preis nur wenn zutreffend). `BreadcrumbList` nur wenn sichtbare Breadcrumbs existieren. `FAQPage` nur für tatsächlich sichtbare Fragen/Antworten und nur bei passenden Seiten, **ohne Rich-Results-Versprechen**. `HowTo` kann sachlich auszeichnbar sein, generiert aber keine Google-HowTo-Rich-Results. `SearchAction` ausschließlich für eine echte interne **Seitensuche**, nicht bloß Personensuche. Schema validieren, Inhalt und Markup müssen übereinstimmen.

Offizielle Referenzen: [Google FAQ/HowTo 2023](https://developers.google.com/search/blog/2023/08/howto-faq-changes), [Google Sitemap/lastmod](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [Google noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing), [Google Canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

## 7. Content-System: Suchintention statt Wörtervorgaben

**Pro indexierbarer thematischer Landingpage**: direkt beantwortete Frage in 1–2 Sätzen, sofortige nutzbare Funktion/Beispiel, nachvollziehbare Formel/Tabelle/Checkliste, echte Produktgrenzen, 3–8 echte Nutzerfragen, Quellen/Methodik, ggf. Download, passender interner Link, echte Autor-/Aktualisierungsinformation. Aufwendigere Themen können 1.000–1.800 Wörter erfordern; einfache Aufgaben brauchen keine künstliche Textlänge. **Nicht** parallel identische 400–600-Wort-Blöcke in `noindex`-Apps als vermeintlichen SEO-Gewinn verstecken.

### Themen-Pillars und Cluster-Ideen (Hypothesen, vor Skalierung anhand GSC/Keyword-/Wettbewerbsdaten priorisieren)

| Tool / Hauptseite | Absichten, Formate und Erweiterungen |
|---|---|
| Backform | „Springform 26 auf 24“, 20→28 Faktor 1,96, 26→28 Faktor ≈1,16; 18/20/22/24/26/28/30-cm-Matrix; 25-/30-cm-Kastenformen; Kastenform↔Springform; Muffinform/Backblech, Teighöhe/Volumen; Backzeit ist **nicht** allein geometrisch bestimmbar |
| Parkplatz | Parkplatz wiederfinden, Ebenen-/Stellplatznotiz, Speichern ohne Standortfreigabe; Parkscheibe-Regeln, Parkzeit überschritten/Bußgeld **nur** mit aktueller, regional passender Rechtsquelle und sauberer Trennung zum Tool |
| Autokosten | Kosten/Monat und €/km, Fix-/variable Kosten, Tankbuch-Muster, Kilometerleistung, Verschleißannahmen und Vergleichsrechner |
| Haushaltsbuch | Haushaltsbuch-Vorlage (CSV/Excel/PDF), Einnahmen/Ausgaben, Fixkosten, 50-30-20, Kassenbon/Rückerstattung, Excel-vs.-App-Vergleich und Erklärungen zur OCR-Nachprüfung |
| Zählerstände | Strom/Gas/Wasser ablesen, Foto/Dokumentation, Auszugsübergabe-Vorlage, Verbrauchsvergleich, Zählerwechsel und Gas-m³-Umrechnung nur mit tatsächlichen Rechnungsfaktoren |
| Digitaler Nachlass | sichere Checkliste und Vorlage **ohne** Passwörter im öffentlichen Dokument, Ablauf für Erben/Vollmacht, rechtliche Grenzen, Quellen/Expertise und Hinweis auf Beratung |
| Umzugskisten | Anzahl Kisten schätzen nur mit Annahmen, QR-Code-Etikett als PDF, Raumliste, druckbare Umzugscheckliste, Scan-/Wiederfinden-Prozess |
| Pflanzenpflege | Gießplan-Muster, Pflegeintervall ≠ biologischer Bedarf, beispielhafte Monstera-Pflege nur mit verlässlicher Quelle und Feuchtigkeits-/Saisonhinweis |
| Tiergesundheit | dokumentierbare Muster für Impfpass-/Tierarztbesuch, keine pauschalen Impffristen ohne seriöse tierärztliche Quellen, Kalender/Erinnerung erklären |
| WG | Putzplan-Vorlage, WG-Kostenanteile, selektive Beteiligung am Einkauf, Kostenausgleich, Rotationsplan, Verantwortlichkeiten |
| Verliehene Dinge | Inventarliste, Leihdauer/Rückgabetermin, Werkzeug-/Buchbeispiel, Rückgabe-Workflow |
| Wunschliste | Eigene Amazon-Wunschliste freigeben vs. Toolya-Verzeichnis; Sichtbarkeit, Identitätsverifikation, Lösch-/Widerspruchsweg; keine automatisch generierten Personen-SEO-Seiten |
| Dashboard | Organisation/Favoriten, lokale Speicherung vs. Konto-Sync, Verweise auf konkrete Tool-Aufgaben |

### Programmatic SEO – nur nach Qualitätsgate

Für Backform zuerst **eine belastbare dynamische Rechnerfunktion und eine statische Faktormatrix**. Danach einzelne ausführliche Kombinationen nur bei nachgewiesener Nachfrage, einzigartiger Rechnung und fachlicher Differenzierung. Die Umrechnung von runden Formen nutzt bei gleicher Teighöhe Fläche ∝ Durchmesser²; rechteckige Backbleche/Kastenformen erfordern Länge × Breite bzw. Volumenannahmen. **Keine** Doorway-Seiten mit bloß ausgetauschten Zahlen und kein Anschein einer exakten Backzeitberechnung. Jede neue URL selbstkanonisch, gut verlinkt, eigenständig hilfreich, in Sitemap nur bei Indexierungsabsicht.

### Vertrauen, Autor und Brand

Über-uns-/Autorenseite mit realen, belegbaren Angaben, verständlicher Methodik („So rechnen unsere Tools“), Kontakt, Datum und Änderungsverlauf, korrekt formulierten Grenzen der Finanzen-/Rechts-/Gesundheitsthemen. Bei YMYL-nahen Inhalten qualifizierte aktuelle Quellen (Verbraucherzentrale, amtliche Hinweise, fachliche Leitlinien), rechtliche Texte fachlich prüfen lassen. Marke konsistent **„Toolya – Alltags-Tools“**, einheitliche Wortmarke, bestehende Maskottchenwahl respektieren. `sameAs` nur bei echten eigenen Profilen; keine Wikipedia-/Wikidata-Seite ohne deren Relevanzkriterien künstlich anlegen.

## 8. Datenschutz, Wunschlisten und Affiliate – Schutz vor Wachstum

- Importierte Wunschlistendaten / Personennamen / nicht verifizierte Identitäten wurden in [A1] als erhebliches DSGVO-/Reputationsrisiko bewertet. Das ist ein **Prüfhinweis**, kein abgeschlossenes Rechtsgutachten. Datenherkunft, Rechtsgrundlage, Transparenz, Sichtbarkeit, Anspruchs-/Löschweg, Datensparsamkeit und Zweckbindung zusammen mit realem Live-Verhalten erheben. Bis Klärung **keine** neuen personenbezogenen SEO-Landingpages und kein massenhafter Import/Index-Aufbau.
- Identitäts- und Publikationsstatus von Wunschprofilen explizit: öffentlich sichtbar/Opt-in? verifiziert? privat? gelöschte Profile korrekt 404/410 bzw. geeigneter Status; keine öffentlich lesbaren nicht freigegebenen Daten. Datenbank-RLS und Server-APIs unabhängig von `noindex` schützen.
- Keine nicht autorisierten Änderungen an Produktivdaten, keine Testpersonen/-listen oder fiktiven Datensätze in Produktions-Supabase; für Screenshots nur lokale neutrale Muster. Konten, Schlüssel, Freigaben, Zahlungen und Sync geschützt lassen.
- Amazon-Partnerlinks: unmittelbare, verständliche Werbe-/Affiliate-Kennzeichnung bei entsprechenden Links und `rel="sponsored"` (je nach Link auch `nofollow`), kein dünner Affiliate-Content ohne eigenständigen Nutzen. Impressum und Datenschutzerklärung mit tatsächlichem Systemzustand und juristischer Prüfung abgleichen.

## 9. GEO: Maschinenlesbarkeit, Belege und Messbarkeit

**Stärken aus [A1]:** direkte Definitionssätze, ehrliche Einschränkungen, Beispiele mit realistischen Zahlen, FAQs. **Schwächen:** wichtige Lösung nur in JS/Login, wenig überprüfbare Tabellen/Quellen/Originalbelege, schwache Drittverweise/Brand-Abgrenzung, fehlende datierte Methodik, wenig direkte Vergleiche.  
**Maßnahmen:** öffentliche Antwortabsätze, überprüfbare Formeln, einfach lesbare HTML-Tabellen, echte Muster/Visuals, Methodik/Quellen, Vergleichsartikel bei realem Bedarf, semantische Gliederung und menschlich nutzbare Site-Architektur. KI-Crawler-Policy dokumentieren. Keine unrealistische Garantie von Zitationen durch Schema oder `llms.txt`.

**GEO-Monitoring:** Für definierte deutschsprachige Prompts, Markt und Engine festhalten: Datum, Suchantwort ja/nein, Toolya genannt ja/nein, URL verlinkt ja/nein, korrekt wiedergegeben ja/nein. „Keine KI-Antwort“ separat von „KI-Antwort ohne Toolya“. Vergleich nur bei gleicher Methodik und mit dokumentierten Limits. OAI-SearchBot und GPTBot erfüllen unterschiedliche Zwecke.

**Externe Erwähnungen, wenn Assets echten Nutzen besitzen:** Product Hunt, thematisch passende deutsche Communitys (z. B. r/Kochen, r/Backen, r/Finanzen) nur transparent, regelkonform und mit relevantem Beitrag statt Werbespam; kuratierte Tools-/Alternativenverzeichnisse, passende Backblogs und Umzugs-/Verbraucherseiten, Gastbeiträge, lokale/Tech-Medien, ggf. Produktdemos/Shortvideos. Kein gekaufter Linkaufbau und keine unbelegte KI-„Trainingssignal“-Wirkung. Erst Backlink-Baseline, dann seriöse Outreach-Priorisierung.

## 10. Ergänzende Wettbewerbsbeobachtungen aus [A3]

- Backform: Online-Wettbewerber UniTools, Rasterkontor, Smartasty liefern direkte Rechner/Tabellen. Ein **sofort rechnender** Faktor ist für diese Suchintention wichtiger als lange Einführung.
- Parkplatz: Google Maps kann Parkorte speichern. Toolya muss Unterschiede klar und wahrheitsgemäß zeigen, z. B. konkrete Stellplatz-/Ebenenotizen und Bedienung im Browser, soweit vorhanden.
- Wunschlisten: etablierte Amazon-Ratgeber dominieren Informationsanfragen; Toolya benötigt transparentes, rechtmäßiges Unterscheidungsmerkmal. Umzug: QR-Etiketten mit Download und Scan-Demo statt vager Produktbeschreibung.
- Zähler/WG: EnergieCheck und Flatastic sind vergleichbare Produkte. Toolya sollte konkrete, schnell lösbare Mikro-Aufgaben erklären.

**Wettbewerbs- und Suchintent-Listen sind Hypothesen**, keine gemessenen Suchvolumina oder Positionen. SEO-Tools (OpenSEO, Ahrefs) dürfen zum Priorisieren verwendet werden, vorhandene Limits/offene Daten müssen berichtet werden.

## 11. KPI-System & Definition of Done

| KPI | Quelle | Definition |
|---|---|---|
| Kanonische Indexierbarkeit | Live-Crawl + GSC/Bing | 200, einzigartiger Canonical, keine versehentliche `noindex`, intern erreichbar, Sitemap nur passende Ziele |
| Reduzierte Risikorouten | HTTP-/HTML-/Auth-Tests | Alle 16 Alt-Wishlist- und 3 Estate-Hilfsrouten einzeln klassifiziert und sicher behandelt |
| Öffentliche Tool-Nutzbarkeit | Browser-/E2E-Test | Backform-Basisrechnung ohne Konto; weitere öffentliche Funktionen nur nach Sicherheitsprüfung |
| Web-Vitals | Lighthouse (Labor) + CrUX/GSC (Feld) | LCP/INP/CLS pro Gerät vor/nach, Feldziele 2,5 s/200 ms/0,1 am p75 |
| Organische Reichweite | GSC/Bing | Klicks, Impressionen, CTR, Position nach URL, Land, Gerät; nicht bei fehlender API-Zugänglichkeit schätzen |
| GEO-Sichtbarkeit | Feste Prompt-Stichprobe + Bing AI Performance soweit verfügbar | Markennennung, echte Quellenlinks, Korrektheit, Prompt-/Modell-/Zeitbezug |
| Nutzung | nur vorhandene rechtmäßige Analytics | Tool-Starts, erfolgreiche Umrechnungen, freiwillige Sync-Anmeldungen; ohne personenbezogene Überinstrumentierung |
| Qualität | manuelle Redaktion & E2E | Rechnerbeispiele korrekt; Tastatur/Mobil; Quellen und Updatezeitpunkte; keine privaten Daten in Beispielen |

**Vergleichsfenster:** Für identische URLs/Queries 28 Tage vor vs. 28 Tage nach Rollout, mit Saison-/Geräte-/Länderhinweisen; nicht Rankings in kurzer Zeit versprechen. Jede Phase braucht: PR mit Diff, reproduzierbare Tests, Deploy-URL, Live-HTTP-/Canonical-/Robots-Check, Changelog und aktualisierte Maßnahmenliste.

## 12. Verweise zum Ausgangsmaterial

1. **[A1]** Vollständiger SEO-&-GEO-Audit im aktuellen Chat (Strategie, Technik, Content, GEO, 1–12-Monats-Maßnahmen).
2. **[A2]** Abschnitt „4. Priorisierter Umsetzungsplan“ im aktuellen Chat (Woche 1, 2–3, Monat 1–2); es lagen keine weiteren Abschnitte dieses Audits vor.
3. **[A3]** `Toolya-SEO-GEO-Audit-2026-11-18.md` aus vorherigem Chat „SEO Toolya Gesamt“, 150 Zeilen, mit URL-Einzelinventar, 12 technischen Tickets T01–T12, 18 redaktionellen Seiten und 30–90-Tage-Messplan. Git-Referenz `43f8664`. Zur vollständigen historischen Einzelauflistung der 69 Live-Abfragen dient diese Quelldatei; die kritischen Varianten und alle 18 kanonischen Ziele sind oben explizit aufgenommen.
4. **[G]** Lesender Repo-Abgleich vom 18.11.2026: `main` bei `4e2bcc9`; `compare 43f8664...main`; Dateien `robots.txt`, `sitemap.xml`, `backform-rechner/index.html`, `tools/baking/index.html`.
5. **[E]** Google Search Central: [Sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing), [Canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [FAQ/HowTo-Einschränkung](https://developers.google.com/search/blog/2023/08/howto-faq-changes).

**Nächster Schritt:** `toolya-roadmap.md` ist der eigenständig ausführbare Auftrag für ChatGPT Work, mit Aufgaben-IDs, Abhängigkeiten, Sicherheitsgates und Abnahmekriterien. Dieses Dokument dient als Quellen-/Entscheidungssammlung; ein neuer Ist-Stand schlägt ältere Befunde und muss dokumentiert werden.

## Anhang A – vollständiges URL-Statusinventar aus [A3]

**Zeitbezug:** Rohbefund des Git-Stands `43f8664`, nicht automatisch Live-Zustand nach späteren Deployments. Ein einzelnes `–` bedeutet in diesem historischen Check „kein entsprechender Wert sichtbar“, nicht „kein Schutz für sämtliche Dienste“. Die App-/Hilfsseiten sind **keine** automatische Sitemap-Empfehlung.

| Live-URL | HTTP | Canonical (relativ) | Robots-Meta | Befund |
|---|---:|---|---|---|
| `/` | 200 | `/` | `index,follow` | Kanonische öffentliche Startseite |
| `/admin-stats-dashboard/index.html` | 200 | – | `noindex,nofollow` | Admin-Arbeitsansicht |
| `/admin-stats-dashboard/wishlist-finder.html` | 200 | – | `noindex,nofollow` | Admin-Arbeitsansicht |
| `/amazon-wunschliste-veroeffentlichen/` | 200 | gleich | – | Kanonisch |
| `/amazon-wunschliste-veroeffentlichen/index.html` | 200 | `/amazon-wunschliste-veroeffentlichen/` | – | URL-Variante |
| `/autokosten/` | 200 | gleich | – | Kanonisch |
| `/autokosten/index.html` | 200 | `/autokosten/` | – | URL-Variante |
| `/backform-rechner/` | 200 | gleich | – | Kanonisch |
| `/backform-rechner/index.html` | 200 | `/backform-rechner/` | – | URL-Variante |
| `/dashboard/index.html` | 200 | – | `noindex,follow` | Privates Dashboard |
| `/digitaler-nachlass/` | 200 | gleich | – | Kanonisch |
| `/digitaler-nachlass/index.html` | 200 | `/digitaler-nachlass/` | – | URL-Variante |
| `/haushaltsbuch/` | 200 | gleich | – | Kanonisch |
| `/haushaltsbuch/index.html` | 200 | `/haushaltsbuch/` | – | URL-Variante |
| `/index.html` | 200 | `/` | `index,follow` | Root-Variante |
| `/legal.html` | 200 | gleich | – | Kanonisch |
| `/mascots.html` | 200 | gleich | – | Kanonisch |
| `/parkplatz-merker/` | 200 | gleich | – | Kanonisch |
| `/parkplatz-merker/index.html` | 200 | `/parkplatz-merker/` | – | URL-Variante |
| `/pflanzenpflege/` | 200 | gleich | – | Kanonisch |
| `/pflanzenpflege/index.html` | 200 | `/pflanzenpflege/` | – | URL-Variante |
| `/privacy.html` | 200 | gleich | – | Kanonisch |
| `/tiergesundheit/` | 200 | gleich | – | Kanonisch |
| `/tiergesundheit/index.html` | 200 | `/tiergesundheit/` | – | URL-Variante |
| `/tools/baking/index.html` | 200 | gleich | `noindex,follow` | Interne App |
| `/tools/budget/index.html` | 200 | gleich | `noindex,follow` | Interne App |
| `/tools/car/index.html` | 200 | gleich | `noindex,follow` | Interne App |
| `/tools/estate/handover.html` | 200 | – | – | P0-/P1-Prüffall |
| `/tools/estate/heirs.html` | 200 | – | – | P0-/P1-Prüffall |
| `/tools/estate/index.html` | 200 | – | `noindex,nofollow,noarchive` | Interne App |
| `/tools/estate/print-key.html` | 200 | – | – | P0-/P1-Prüffall |
| `/tools/housemates/index.html` | 200 | gleich | `noindex,follow` | Interne App |
| `/tools/loans/index.html` | 200 | gleich | `noindex,follow` | Interne App |
| `/tools/meters/index.html` | 200 | gleich | `noindex,follow` | Interne App |
| `/tools/moving/index.html` | 200 | gleich | `noindex,follow` | Interne App |
| `/tools/parking/index.html` | 200 | gleich | `noindex,follow` | Interne App |
| `/tools/pet-health/index.html` | 200 | gleich | `noindex,follow` | Interne App |
| `/tools/plants/index.html` | 200 | gleich | `noindex,follow` | Interne App |
| `/tools/wishes/assistant.html` | 200 | – | – | Alt-Wishlist-Prüffall |
| `/tools/wishes/bookmarks.html` | 200 | – | – | Alt-Wishlist-Prüffall |
| `/tools/wishes/cockpit.html` | 200 | – | – | Alt-Wishlist-Prüffall |
| `/tools/wishes/collection.html` | 200 | – | – | Alt-Wishlist-Prüffall |
| `/tools/wishes/dashboard.html` | 200 | – | – | Alt-Wishlist-Prüffall |
| `/tools/wishes/discover.html` | 200 | – | – | Alt-Wishlist-Prüffall |
| `/tools/wishes/feed.html` | 200 | – | – | Alt-Wishlist-Prüffall |
| `/tools/wishes/gift-analytics.html` | 200 | – | – | Alt-Wishlist-Prüffall |
| `/tools/wishes/gift-tasks.html` | 200 | – | – | Alt-Wishlist-Prüffall |
| `/tools/wishes/index.html` | 200 | `/tools/wishes/public.html` | – | Meta-Refresh zum Verzeichnis |
| `/tools/wishes/notifications.html` | 200 | – | – | Alt-Wishlist-Prüffall |
| `/tools/wishes/occasions.html` | 200 | – | – | Alt-Wishlist-Prüffall |
| `/tools/wishes/planner.html` | 200 | – | – | Alt-Wishlist-Prüffall |
| `/tools/wishes/profile.html` | 200 | – | – | Alt-Wishlist-Prüffall |
| `/tools/wishes/public.html` | 200 | gleich | – | Kanonisches öffentliches Wunschlisten-Verzeichnis |
| `/tools/wishes/report.html` | 200 | – | – | Alt-Wishlist-Prüffall |
| `/tools/wishes/reservations.html` | 200 | – | – | Alt-Wishlist-Prüffall |
| `/tools/wishes/social.html` | 200 | – | – | Alt-Wishlist-Prüffall |
| `/toolya-dashboard/` | 200 | gleich | – | Kanonisch |
| `/toolya-dashboard/index.html` | 200 | `/toolya-dashboard/` | – | URL-Variante |
| `/umzugskisten/` | 200 | gleich | – | Kanonisch |
| `/umzugskisten/index.html` | 200 | `/umzugskisten/` | – | URL-Variante |
| `/verliehene-dinge/` | 200 | gleich | – | Kanonisch |
| `/verliehene-dinge/index.html` | 200 | `/verliehene-dinge/` | – | URL-Variante |
| `/wg-organisator/` | 200 | gleich | – | Kanonisch |
| `/wg-organisator/index.html` | 200 | `/wg-organisator/` | – | URL-Variante |
| `/zaehlerstaende/` | 200 | gleich | – | Kanonisch |
| `/zaehlerstaende/index.html` | 200 | `/zaehlerstaende/` | – | URL-Variante |

Die in [A3] außerdem getestete unbekannte URL ergab den erwarteten **404**-Status. Die 69 Live-Abfragen aus [A3] umfassten auch Robots-, Sitemap- und HTTP-/www-Stichproben; die Tabelle gibt die dort einzeln gelisteten HTML-Routen wieder.
