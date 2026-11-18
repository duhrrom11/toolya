# Toolya – Roadmap und ausführbarer Masterauftrag für ChatGPT Work

**Stand:** 18. November 2026  
**Verbindliche Wissensbasis:** `toolya-master-audit.md` (konsolidiertes Audit aus [A1], [A2], [A3] und lesendem GitHub-Abgleich).  
**Zielort im Repository:** `docs/audits/toolya-master-audit.md` und `docs/audits/toolya-roadmap.md` (mit vorhandenen Dateien intelligent zusammenführen, nicht Historie blind überschreiben).  
**Repository:** `duhrrom11/toolya` · `main` · GitHub Pages: `https://toolya.app/`  
**Leitprinzip:** Nicht „alle drei Audits blind ausführen“, sondern die **deduplizierten und auf den aktuellen Zustand abgeglichenen** Verbesserungen produktionsreif implementieren. Ziel ist eine technisch saubere, schnellere, barriereärmere, hilfreiche, rechtlich sorgfältige, indexierbare und messbare Toolya-Plattform.

## 0. Direkt in ChatGPT Work einfügbarer Hauptauftrag

> Du bist der federführende autonome Entwickler, technischer SEO-/GEO-Redakteur und Qualitätsprüfer für **Toolya** (`duhrrom11/toolya`, GitHub Pages unter `toolya.app`). Arbeite **eigenständig bis zum umsetzbaren Abschluss** der Roadmap; recherchiere im Repository, vorhandenen PRs/Branches, verbundenen Diensten und Live-System, statt bekannte Informationen erneut abzufragen. Verwende den beigefügten Master-Audit und diese Roadmap als Ausgangsmaterial; verifiziere vor Änderungen den **tatsächlichen aktuellen Stand**. Nutze verbundene GitHub-, Supabase-, Search-Console-/Analytics-, OpenSEO-, Ahrefs- und Browser-Werkzeuge dort, wo sie echten Nutzen bringen. Falls eine Integration fehlt, dokumentiere den Blocker und bearbeite alle unabhängigen Aufgaben weiter.
>
> **Autorisierung:** Routine-Codeänderungen, neue Branches, PRs, Merges und Deployments sowie notwendige kompatible Schema-/Konfigurationsänderungen sind für diesen Auftrag freigegeben. Arbeite in kleinen überprüfbaren Paketen mit Rollback. Bestehende private Produktivdaten und Supabase-RLS dürfen **weder gelöscht noch mit Testdatensätzen verunreinigt** werden. Unbedingt erhalten bleiben persönliche Datenzugriffe, Auth, Verschlüsselungs-/Nachlassprozesse, bestehende Funktionen, die öffentliche Startseite `/`, das separate nicht indexierbare `/dashboard/`, die identische Toolya-Wortmarke in Header und Footer sowie die wählbaren türkisen/lilafarbenen Maskottchen. Die Hauptseite nicht aus gestalterischem Übereifer umgestalten. Inhalte nur mit nachprüfbaren Fakten/Quellen; personenbezogene Wishlist-Einträge nicht ohne Rechtsgrundlage publizieren. Keine automatischen externen Community-Posts, Täuschung, gekauften Links oder fingierten Bewertungen.
>
> **Vorgehensweise:** (1) aktuelle Baseline inventarisieren, Audit-Issues deduplizieren und bereits umgesetzte Änderungen als erledigt markieren; (2) dringende Sicherheits-/Datenschutz-/Indexierungsrisiken behandeln; (3) die öffentliche Backform-Berechnung und weitere sichere kostenlose Kernfunktionen sowie SEO-Technik liefern; (4) die 18 kanonischen Seiten gezielt inhaltlich verbessern und weitere Suchseiten nur datenbasiert ergänzen; (5) Performance, GEO, Messung und Release-Abnahme kontinuierlich prüfen. Führe die Phasen möglichst **ohne Zwischenfreigaben** aus. Wo externe Berechtigung, eine irreversible Massenlöschung, juristische Endbewertung oder grundlegende Produkt-/Hosting-Entscheidung nötig ist: sichere Default-Lösung umsetzen, heikle Aktion aussetzen und genau diesen Punkt als „Entscheidung/Blocker“ protokollieren; mit allen anderen Arbeiten fortfahren.
>
> **Pro Ticket:** dokumentierter Ausgangszustand, konkrete Änderung, ggf. Test/Manual-Check, PR/Commit, Deployment-URL, HTTP-/Canonical-/Robots-/Mobile-Abnahme, ggf. Screenshot und verbleibende Risiken. Wenn ein vorgeschlagenes SEO-Ticket bereits korrekt umgesetzt ist, nicht neu implementieren. Wenn es einem anderen Befund widerspricht, die Entscheidungstabelle des Master-Audits verwenden. **Nie** 12 private `noindex`-Toolseiten pauschal in die Sitemap eintragen, nie `/tools/wishes/public.html` blind `noindex` setzen, nie `robots.txt` verwenden, um `noindex`-Inhalte vor dem Bot zu verstecken, und nie Auth/Security durch reines SEO-Markup ersetzen.
>
> **Liefere am Ende:** (a) aktualisierte Audit-/Roadmap-Dateien mit Status pro ID, (b) konkrete PR-/Commit-/Release-Links, (c) Ergebnis der Tests und Live-Prüfung, (d) messbare Vorher/Nachher-KPIs einschließlich Datenlücken, (e) kurze Liste blockierter, rechtlich zu prüfender oder strategisch optionaler Punkte. Status ausdrücklich unterscheiden: **implementiert**, **auf `main` gemergt**, **live geprüft**, **nur vorbereitet**, **blockiert**. Ändere die rechtlichen Hinweise nicht mit dem Anspruch abschließender Rechtsberatung.

**Wichtig:** Der obenstehende Prompt verweist auf die beiden angehängten Markdown-Dateien. Work soll beide vollständig lesen. Das komplette Aufgabenprogramm mit Abhängigkeiten und Tests folgt darunter.

## 1. Zustandsmodell und Priorisierungsregeln

**Prio P0:** potenzieller Zugriff auf private Informationen, nichtgewollte Indexierung personenbezogener/operativer Seiten, defekte RLS/Auth-/Schlüsselwege.  
**Prio P1:** Messbasis, öffentliche Rechenfunktion, Crawl-/URL-Korrektheit, kritische defekte Links.  
**Prio P2:** technische/semantische Qualität, Performance, redaktionelle Substanz, nutzbare Ressourcen.  
**Prio P3:** Skalierung, optionales Local-first, neue Content-Cluster, externe Erwähnungen/Brand.  
**Prio P4:** große URL-/Hosting- oder Spracherweiterung nur nach belastbaren Daten und Migrationsplan.

Status pro Ticket: `TO_DO`, `VERIFIED_ALREADY_DONE`, `IN_PROGRESS`, `IMPLEMENTED_NOT_DEPLOYED`, `DEPLOYED_VERIFIED`, `BLOCKED`, `NOT_APPLICABLE` (jeweils Beleg/Datum/Commit). Bestehende Work-Branches und PRs vor Neuanlage suchen. Keine überholten Befunde erneut als Fehler melden.

### Abnahme-Gates, die für alle Phasen gelten

- Vor Codeänderung: aktuelle `main`-SHA, vorhandene Branches/PRs, Deploy-Pipeline, aktuelle Sitemap und `robots.txt`, relevante HTML-Routen erfassen; zwei oder mehr gleichzeitige Work-Änderungen erkennen.
- Bestehende Header/Footer/Logo-/Maskottchen-Assets und Einstellungen als UI-Baseline fotografisch/automatisiert sichern; keine Designregression. Die öffentliche Homepage bleibt eine Such-Einstiegsseite; `/dashboard/` separat.
- Änderungen erst in isoliertem Branch, bestehende Tests/Build plus gezielte E2E-Smoke-Tests ausführen, prüfbaren PR erzeugen; bei kleinen risikoarmen Paketen bis `main` und Live-Deploy fortsetzen.
- Nur sichere lokale/statische Beispielrechnungen/Dummy-Daten; **niemals** Testnutzer, Testlisten oder Testzahlungen in Produktiv-Supabase anlegen. Bei DB-Änderungen zuerst RLS-/Berechtigungsfolgen prüfen und Rückrollpfad dokumentieren.
- Live-Abnahme testet pro betroffener URL mindestens HTTP-Status, Canonical, Robots, interne Links, Kernfunktion, Mobilbedienung und Console-Fehler. Für statische GitHub-Pages-Redirects keine behauptete 301-Funktion ohne gemessenen HTTP-Status.
- Sicherheits-/Rechtsfragen nicht stillschweigend durch „SEO-Optimierung“ entscheiden. Präferenz: kein neues Personenprofil-Indexing, keine sensiblen Daten veröffentlichen; keine irreversible Massenlöschung ohne konkrete Prüfung.

## 2. Geordnete Umsetzung – Phasen

### Phase 0 – Repository/Design-Baseline und Audit-Deduplizierung (Tag 1)

| ID | Ausführung | Fertig, wenn |
|---|---|---|
| R00 | Master-Audit/Work-Roadmap in `docs/audits/` integrieren, auf vorhandene Audit-Historie und offene PRs prüfen; aktuelles `main`, Branches, GitHub Pages, DNS/Custom Domain, Workflow und relevante Verzeichnisse lesen. | Zwei versionierte Dateien, Referenz-SHA und Statusboard im Repo; keine bestehenden Entscheidungen verloren |
| R01 | Automatisierte URL-Inventur **aller** HTML-Seiten, 18 derzeitiger Sitemap-Ziele, `?profile`, `index.html`-Varianten, `http/www/https`, Login-/Admin- und Estate-Hilfsseiten. Für jede: Status, Canonical, `noindex`, H1, Title, Description, Schema, Verlinkung, HTML/JS. | Reproduzierbarer maschinenlesbarer Report mit Differenzen zu Audit 3 (52 HTML, 69 Live-Abfragen), validierter Ausgangsliste |
| R02 | Browser-Baseline für Smartphone/Desktop: Startseite, alle 12 Tools, Header/Footer, gewähltes Maskottchen, Auth-Ansichten; bestehende Playwright-/UI-Tests sichten. | Screenshots/Testliste und regressionsrelevante Elemente dokumentiert; keine echten Produktionsdaten benutzt |
| R03 | GSC/Bing/Analytics/OpenSEO/Ahrefs Status und Berechtigungen prüfen; vorhandene GSC-Property sowie ggf. Supabase-Stats-Integration verwenden. | Baseline-Export oder benannter Berechtigungsblocker; keine erfundenen SEO-Messzahlen |

**Gate 0:** Die offenen Befunde und tatsächlichen aktuellen Branches sind bekannt; als bereits erledigt erkannte Aufgaben werden übersprungen. Beispiel: `robots.txt` und 18-URL-Sitemap sind bereits vorhanden; `main` zeigte im lesenden Abgleich noch **keinen** loginfreien Rechner direkt auf `/backform-rechner/`.

### Phase 1 – Sicherheits-, Datenschutz- und Indexierungsgrenzen (Woche 1, vor Growth)

| ID | Ausführung | Fertig, wenn |
|---|---|---|
| R10 | 3 Estate-Hilfsseiten `handover.html`, `heirs.html`, `print-key.html` mit geeigneten `noindex`-Metadaten und Schutz vor Datenexposition versehen. Zusätzlich Auth, Tokens/Keys, URL-Parameter, Freigabeprozess, RLS, Caching, Logging und direkte Aufrufe kontrollieren. | Quell-HTML/Response korrekt; unbefugter Zugriff auf echte Inhalte verhindert; gültige Nachlassübergabe funktioniert unverändert |
| R11 | 16 alte `/tools/wishes/`-Routen einzeln klassifizieren (aktiv, ersetzt, abgeschafft); Zugriffsrechte, eingehende Links, Bookmarks, Funktionalität erfassen. Gleichwertige Nachfolger per echten 301/308 **wenn Hosting unterstützt**; andernfalls sauberer bewusst gewählter `noindex`/404/410/erhaltener Funktionsweg. | Jede der 16 Routen hat begründeten Endstatus und Live-Check; keine wichtige bestehende Aktion ohne Ersatz kaputt |
| R12 | Öffentliche Wunschprofile und `?profile`-Suchansichten analysieren: Opt-in/Sichtbarkeit, Identität, Import, Datenherkunft, Rechtsgrundlage, DSGVO-Löschweg, Canonical, JS-Anteile, tote Profile. **Bis fachlich freigegeben** keine eigenständigen indexierbaren Personenprofile generieren. | Dokumentierte Profilentscheidung (default: keine zusätzlichen indexierten Personenprofile); keine unbeabsichtigten Personeninformationen im indexierbaren HTML; Löschpfad und RLS getestet |
| R13 | `public.html` als **öffentliches Verzeichnis** von Auth-/Profilbearbeitungsseiten trennen. Gegebenenfalls vorübergehend Discovery einschränken, wenn akute personenbezogene Exposition entdeckt wird, ohne ungeprüft alle Verzeichnisdaten zu löschen. | Indexierungsstrategie je Typ nachvollziehbar; initialer Verzeichnistext erklärt Umfang/Grenzen; Zugriff und Datenschutz geprüft |
| R14 | Amazon-Affiliate-Kennzeichnung, `rel="sponsored"` (ggf. `nofollow`), Impressum/Datenschutz-Abgleich nach tatsächlichen Funktionen. Sensible oder fachlich bindende Änderungen für qualifizierte Rechtsprüfung markieren. | Anzeigenkennzeichnung sichtbar beim Link, technische Attribute korrekt; juristische offene Fragen mit Quelle benannt |
| R15 | Login-/Dashboard-/Admin-Seiten inventarisieren: öffentlich lesbare App-Assets sind nicht gleich Zugriff auf Daten. Keine Geheimnisse in Frontend/Metadaten, keine neuen `noindex`-Seiten in Sitemap. | Whitelist öffentlicher indexierbarer URLs und Blacklist privater App-/Admin-Routen getestet |

**Gate 1:** Kein bekannter P0-Datenzugriffsfehler bleibt ohne Schutz oder dokumentierte unmittelbare Eskalation. `noindex` nicht als Ersatz für Auth verwenden. Bei Risiko irreversibler Datenlöschung nicht allein „aufräumen“.

### Phase 2 – Sucheinstieg, Core SEO und loginfreier Backform-Rechner (Woche 1–3)

| ID | Ausführung | Fertig, wenn |
|---|---|---|
| R20 | `/backform-rechner/` erhält sofort sichtbaren, **ohne Konto** nutzbaren Browser-Rechner: Rundform→Rundform, verifizierte Formel, mobil/tastaturbedienbar, sinnvolle Eingabe- und Fehlerzustände; bestehende geschützte App nicht beeinträchtigen. Prüfen, ob schon ein fertiger PR/Branch existiert; bevorzugt dessen Qualität nutzen. | Auf der **öffentlichen Landingpage** zeigt Ø 20→28 cm Faktor 1,96; Ø 26→28 cm ≈1,16; Nutzung ohne Anmeldung und ohne reale DB-Aufrufe möglich |
| R21 | Vollständige Radius-/Durchmesser-Faktormatrix für 18, 20, 22, 24, 26, 28, 30 cm; Kastenformen/Backblech nur mit dokumentierten Flächen-/Volumenannahmen, Muffinform/Backzeit-Grenzen. Öffentliche HTML-Tabelle und Rechenmethodik ergänzen. | Nachrechenbare, geprüfte Werte; keine exakten Backzeiten behauptet; Inhalte im initialen HTML lesbar |
| R22 | Startseiten-H1 mit „Kostenlose Online-Tools für …“, emotionalen Claim bewahren; pro Werkzeug prägnanter konkreter Nutzen. `/index.html`-Links zu `/`, Versionsparameter `?v=` von Seitenlinks entfernen und Cache-Busting auf Assets verlagern, wo kompatibel. | Genau eine sichtbare H1, erwarteter Header/Footer/Marke unverändert, interner Linkcrawl ohne unnötige Varianten |
| R23 | HTTP/www/https als **bereits überwiegend korrekt** verifizieren; alle 18 Kanonicals, 13 Verzeichnis-`index.html`-Varianten prüfen. Nur nachgewiesene Redirect-Fehler korrigieren; GitHub-Pages-Grenzen respektieren. | Redirect-Matrix mit tatsächlich gemessenen Codes und Zielen; keine Redirect-Schleifen |
| R24 | Sitemap von 18 öffentlichen Zielen ausgehend pflegen, wenn neue hochwertige öffentliche URLs entstehen; `lastmod` nur bei echten Aktualisierungen. `robots.txt` weiter zugänglich, damit `noindex` gelesen werden kann. Sitemap in GSC/Bing **bei vorhandenen Berechtigungen** einreichen/aktualisieren. | Nur indexierbare Kanonicals in Sitemap, kein privates `/tools/baking/` etc.; GSC/Bing-Submission protokolliert oder als Blocker |
| R25 | Auf allen 18 öffentlichen Seiten Titles/H1/Descriptions, OG, `twitter:card`, `og:locale`, interne Linkvorschauen prüfen und harmonisieren; private Apps bekommen korrekte Nutzer-Titel, behalten aber `noindex`. | Einzigartige wahrheitsgemäße Texte, keine Massen-Duplikate, Social Preview/Favicon validiert |
| R26 | Schema-Baseline erhalten und erweitern: `WebSite`, Betreiber-Entität, `@id`, passende `WebPage`/`CollectionPage`/`WebApplication`-/`Article`-Daten; FAQ/Breadcrumb nur für sichtbaren Inhalt; keine fingierten Rankings/Bewertungen. | Alle relevanten JSON-LD-Blöcke parse- und semantisch valide; kein unzutreffendes `FAQPage`-Massen-Markup |
| R27 | 404-Seite mit nutzbaren Start-/Ratgeber-Links, Status muss HTTP 404 bleiben; defekte interne Links und Redirect-Ziele beheben. | 404-URL bleibt 404; mindestens relevante Navigation funktioniert |
| R28 | Informative Bilder/SVG-Buttons, Alt-Texte, Größen/Lazy-Load/Priority und Landmark-/Skip-/Fokus-Semantik verbessern. | A11y-/Bildwarnungen differenziert abgearbeitet; dekorative Bilder dürfen `alt=""` behalten |

**Gate 2:** Öffentlicher Backform-Rechner ist live nutzbar; Search-/Index-Architektur bleibt intakt; keine Auth-/Design-/Datenregressionen.

### Phase 3 – Performance, Funktionalität und UX (Woche 2–5)

| ID | Ausführung | Fertig, wenn |
|---|---|---|
| R30 | Lighthouse-Tests mobil/desktop für `/`, Backform und repräsentative schwere Tools; CrUX/GSC-Felddaten separat. HTML-Last, Third-Party-JS, Tailwind-CDN-Compile, Hero-Bilder, Supabase-Start evaluieren. | Vorher-Werte für LCP, INP/Interaktionslabor und CLS mit Messumgebung dokumentiert |
| R31 | Gemessene Engpässe beheben: wenn sinnvoll statisches Tailwind-CSS statt CDN-Laufzeitskript, kritische CSS-/JS-Reihenfolge, sinnvolles Defer/Preload, WebP-Dimensionen/Fetchpriority, unnötige Blocker entfernen. | Stabile Mobilansicht, keine Auth-/Theme-Regression, nachvollziehbare Vorher-/Nachher-Labordaten; Felddaten nicht mit Labor verwechseln |
| R32 | Tastatur, ARIA, Kontrast, Formularfeedback, Screenreader, Mobil-Breakpoints und Touch-Ziele der betroffenen Seiten prüfen. | Backform ohne Maus vollständig nutzbar; wichtige öffentliche Seiten bestehen Accessibility-Smoke-Checks |
| R33 | **Local-first prüfen**, nicht unbesehen alle Apps öffnen: Parkplatz-Merker, Zähler, Verliehene Dinge, Pflanzen zuerst nach Datenschutz/UX/Technik beurteilen. Nur sichere, klar abgegrenzte, lokale Basisfunktion ohne Anmeldung anbieten; Konto optional für Synchronisierung. Digitaler Nachlass und andere sensible Cloud-Funktionen geschützt lassen. | Pro Tool dokumentierte Entscheidung und, falls realisiert, funktionierende lokale Basis ohne Supabase-Testdaten; Lösch-/Sync-Grenzen verständlich |
| R34 | Strukturierte Fehler-/Ladezustände in Apps und statische Einleitung im initialen HTML, sofern sinnvoll, statt nur „Konto wird geprüft“/„Lade …“. Indexierungsstatus bleibt wie vorgesehen. | Mensch und Bot lesen relevanten öffentlichen Einstieg; private App-Daten werden nicht offengelegt |

**Gate 3:** Performanceveränderungen sind technisch belegt und UX stabil; freie Basisfunktionen gefährden keine Datenzugriffe.

### Phase 4 – Redaktionelle Substanz auf **allen 18** Kanonicals (Woche 3–8)

**Vorgehen:** Die Tabelle „18 öffentliche Kernseiten“ und die Cluster-Liste im Master-Audit **seitenweise** abarbeiten. Keine willkürlich aufgeblähten 1.800-Wort-Texte. Pro Seite eine echte Direktantwort, verifiziertes Beispiel, passende FAQ, interne Links, sinnvolle visuelle Hilfe oder Download, sofern fachlich passend. Inhaltsproduktion und Design zuerst auf bestehende Komponenten/Markenassets abstimmen; Rechtstexte fachlich getrennt prüfen.

| ID | Seiten / Aufgabenpaket | Verifizierbare Ergebnisse |
|---|---|---|
| R40 | `/autokosten/`, `/haushaltsbuch/`, `/wg-organisator/` | Rechenbeispiel Monat + €/km, Beispielbudget/Kassenbon/OCR-Check, WG-Einkauf mit Teilgruppe + rotierender Putzplan; Formeln und Annahmen korrekt |
| R41 | `/zaehlerstaende/`, `/umzugskisten/` | lesbares Übergabe-/Zählerwechselbeispiel, druckbares neutrales Übergabeprotokoll, QR-Etikett mit **Dummy-Daten**, Scan-/Druck-Workflow; Nachbarthemen verlinkt |
| R42 | `/parkplatz-merker/`, `/pflanzenpflege/`, `/tiergesundheit/` | konkrete Standorthinweise/Berechtigungen, Pflege-Erinnerung vs. Bedarf, Tierarzt-/Impfeintrag als rein dokumentierendes Muster; lokale/medizinische Behauptungen belegt |
| R43 | `/verliehene-dinge/`, `/toolya-dashboard/` | Workflow bis Rückgabe, Rückgabetermin vs. Dauer, Dashboard mit Beispieldaten und Unterscheidung Browser-/Cloud-Speicherung |
| R44 | `/amazon-wunschliste-veroeffentlichen/`, `/tools/wishes/public.html` | getrennte Suchintentionen, eigene Liste freigeben vs. Fremdliste suchen, Ablauf/Einwilligung/Verifizierung/Entfernen, kein automatisches Personen-Landingpage-System |
| R45 | `/digitaler-nachlass/`, `/legal.html`, `/privacy.html` | sichere Checklisten, Grenzen und belegte Aussagen; Rechts-/Finanz-/DSGVO-Aussagen für Fachprüfung markieren; echte Betreiber-/Funktionsangaben |
| R46 | `/`, `/mascots.html`, `/backform-rechner/` | Marke und Tool-Kategorien, korrekte Produktidentität, vollständig erklärt nutzbarer Rechner und Faktorenmatrix; gewähltes Maskottchen nicht überschrieben |
| R47 | alle relevanten öffentlichen Ratgeber | Autoren-/Methodik-/Aktualisierungsdaten **wahrheitsgemäß**, gute Begriffsdefinitionen, passende FAQ, Quellen, echte Screenshots mit neutralen Musterdaten, interne Aufgabenlinks |
| R48 | PDFs/CSV/Excel nur dort, wo Nutzen klar (Haushaltsbuch, Zähler/Umzug, WG, Nachlass-Checkliste) | verlinkte und tatsächlich öffnende Downloads, korrekte Formel-/Beispielangaben, **keine** privaten Datensätze in Assets |

**Gate 4:** Jede der 18 URLs hat einen redaktionellen Reviewstatus; Beispiele sind reproduzierbar; keine Rechts-/Gesundheits-/Finanzbehauptungen ohne passende Quellen und Grenzen.

### Phase 5 – Suchintent-Cluster und GEO-Ausbau (Woche 6–12)

| ID | Ausführung | Fertig, wenn |
|---|---|---|
| R50 | GSC/OpenSEO/Ahrefs-/Wettbewerbsdaten nutzen, Keyword-/Intent-Cluster für 12 Themen ordnen (Master-Audit §7), pro Thema zunächst **3–5** gut begründete Inhalte, später nur bei Nachfrage bis ca. 5–10. | Clusterplan mit URL, Hauptintention, Suchsignal, Unique Value, Querverlinkung; keine konzeptlosen Massen-URLs |
| R51 | Backform-Longtails: statische Faktorenmatrix zuerst, dann echte Seiten zu „26 auf 24“, „20 auf 28“, Kastenform↔Springform und runde Form↔Backblech nur mit eigener Substanz und Rechnungen. | Rechner und alle Artikel widersprechen sich nicht; selbstkanonische, indexierbare URLs nur bei belegtem eigenständigem Nutzen |
| R52 | Formatvergleiche/Entscheidungshilfen: Haushaltsbuch-App vs. Excel, passende Backform, Zählerübergabe, WG-Aufteilung; kurze zitierfähige Antwort + Tabelle + Quelle. | menschlich nützlicher, im initialen HTML lesbarer Inhalt, keine bloßen KI-/Keyword-Platzhalter |
| R53 | Brand/Entität: konsistente „Toolya – Alltags-Tools“-Bezeichnung, Autoren-/Betreiberseite, `sameAs` nur auf echte Profile, klar dokumentierte Produktgrenzen. | strukturierte und visuelle Marke konsistent, keine künstlichen Wikipedia-/Wikidata-Einträge |
| R54 | Optional `/llms.txt` mit knapper aktueller Linkliste zu kanonischen Ratgebern und Produktbeschreibung, wenn Wartung geregelt; Crawler-Policy nach Zweck dokumentieren. | valide Datei ohne Geheimnisse/veraltete URLs oder begründetes `NOT_APPLICABLE`; keine fälschliche GEO-Erfolgsgarantie |
| R55 | GEO-Baseline und Recheck mit festen deutschsprachigen Prompts über verfügbare Engine-/Bing-AI-Daten, Beobachtungszeitpunkt/URL/Antwort-/Zitationsstatus trennen. | Dokumentierte Promptliste, 0-Zitate nicht aus fehlender KI-Antwort ableiten; keine erfundenen KI-Erwähnungen |

**Gate 5:** Neue SEO-Seiten sind hochwertig, nicht kannibalisierend, mit Source/Methodik und Nutzerwert; keine personenbezogene oder medizinische Massenproduktion.

### Phase 6 – Off-Page und Messung (Woche 8–16, fortlaufend)

| ID | Ausführung | Fertig, wenn |
|---|---|---|
| R60 | GSC/Bing + rechtmäßige Nutzungsanalytik: Klicks, Impressionen, CTR, Position, Indexstatus/Canonical, Start-/Nutzungsereignisse; Segment URL/Land/Gerät. | Reproduzierbare Datenexporte oder explizite Zugangslücken und Messplan |
| R61 | OpenSEO/Ahrefs-Backlink-/Brand-Baseline und Wettbewerbs-/Suchsichtbarkeit ohne Behauptung ungeprüfter Daten. | Bericht mit Datum, Quelle, Limits; Chancen nach inhaltlichem Nutzen sortiert |
| R62 | Seriöse digitale PR vorbereiten: Tool-Verzeichnisse, Product Hunt, Backblogs, Umzugs-/Verbraucherseiten, thematisch passende Reddit-Communities (u.a. r/Kochen, r/Backen, r/Finanzen) regelkonform. | Liste passender Plattformen mit Regeln, ehrlich gekennzeichnete Entwürfe, konkrete verlinkbare Ressource; **nicht** automatisch posten oder Accounts missbräuchlich verwenden |
| R63 | 28-Tage-Vorher/Nachher-Messung nach Rollouts; Ranking- und GEO-Daten mit Methode, Saison und fehlenden Daten kennzeichnen. | Evidenzbasierter Abschlussreport, keine Rankinggarantie |

### Phase 7 – spätere Produktentscheidungen (nur bei belastbarem Business Case)

| ID | Entscheidung | Eintrittsvoraussetzung |
|---|---|---|
| R70 | Größere URL-Restrukturierung auf deutsche Slugs und weg von `.html`/`/tools/.../index.html` | Site-/Redirect-Technik beherrscht echte HTTP-301/308, vollständiger alter/neuer Mapping-Plan, bekannte Nutzerlinks/QR/Bookmarks funktionieren |
| R71 | Indexierbare Wunschlisten-Einzelprofile oder Organisations-/Vereinsverzeichnis | Freiwilligkeit/Verifizierung/DSGVO-/Rechtsprüfung, echte eigene HTML-Seiten, zuverlässige Löschung und Takedown, hinreichender nicht-personenbezogener Mehrwert |
| R72 | Lokale Basisversion weiterer Tools | Nutzen, RLS/Auth-Grenzen, Sync-Konflikte, Löschung, Zugriff und Produktentscheidung belegt |
| R73 | Mehrsprachigkeit EN/FR, hreflang, regionale DE/AT/CH-Varianten | echte Nachfrage/Suchdaten, gleichwertige Inhaltsqualität, konsistente Navigation und Übersetzungs-/Pflegekonzept |
| R74 | Eigene Datenstudien, öffentliche Statistiken, Visualisierungen | belastbare Aggregation/Einwilligung und Anonymisierungsprüfung; niemals persönliche Produktivdaten ohne Rechtsgrundlage veröffentlichen |

## 3. Abhängigkeiten und Reihenfolge

```text
R00–R03  Baseline und Branch-/Datenlage
   |
   +--> R10–R15  P0 Datenschutz/Auth/Indexgrenzen
   |           |
   |           +--> R44, R53, R71 (Wishlist-Content/Brand/Profilentscheidungen)
   |
   +--> R20–R28  Backform und technische öffentliche SEO-Basis
   |           |
   |           +--> R40–R48  Inhalte und Vorlagen für 18 Seiten
   |                         |
   |                         +--> R50–R55  Themen-Cluster und GEO
   |
   +--> R30–R34  Performance/UX, mit Phasen 2/4 parallel, aber erst nach Baseline
   |
   +--> R60–R63  Messung/seriöse Outreach-Vorbereitung, fortlaufend

R70–R74: erst nach Beleg und separatem Risiko-/Migrationsentscheid.
```

**Parallelisierung:** Research/Content kann vorbereitet werden, während Schutzmaßnahmen gebaut werden; **nicht** indexierbare Wishlist-Profile oder ungeprüfte Rechtsinhalte publizieren. Performancearbeit darf parallel zu Redaktionsarbeit erfolgen, solange Branchkonflikte und Markenassets koordiniert bleiben. Design → SEO → Inhalte/FAQ/Recht als gestalterische Arbeitsordnung respektieren; P0-Schutz hat Vorrang vor jeder dieser Phasen.

## 4. Konkrete Testfälle und Automatisierungen

### HTTP / SEO

1. `/`, alle 13 Ratgeber, `/tools/wishes/public.html`, `/mascots.html`, `/legal.html`, `/privacy.html`: HTTP 200, genau eine H1, eigener kanonischer Pfad, **kein unbeabsichtigtes** `noindex`, sinnvolles Title/Description, HTML-Link von einem Hub.
2. Alle App-/Admin-/Account-Seiten: erwartete `noindex`-Policy, in der Sitemap **nicht** gelistet; bei Privatinformationen auch echter Zugriffs-/RLS-Test.
3. `robots.txt`: weiterhin abrufbar und benennt Sitemap, blockiert die zu `noindex` vorgesehenen Seiten nicht versehentlich; 18-URL-Sitemap vor Erweiterungen nicht blind überschreiben.
4. `http://toolya.app`, `http://www.toolya.app`, `https://www.toolya.app`, `https://toolya.app`, `/index.html`: finale kanonische HTTPS-URL, tatsächlich erfasste Redirect-Codes. Bei Nicht-301 keine erfundene Erfolgsangabe.
5. `/tools/estate/handover.html`, `/tools/estate/heirs.html`, `/tools/estate/print-key.html` und 16 Alt-Wishlist-URLs: einzeln dokumentierte Index- und Sicherheitsbehandlung.
6. Ungültige URL antwortet 404 auch mit neuer 404-Seite. Keine 200-Soft-404. Parameter-/Profil-URLs dürfen keine unberechtigt öffentlichen Profiltexte liefern.
7. Schema wird mit Parser/Validator geprüft; `FAQPage` nur bei sichtbarem FAQ, `WebApplication` nur bei wahrheitsgemäßem Angebot.

### Rechner / Bedienung

- Springform Durchmesser alt 20 cm, neu 28 cm → **1,96** (Flächenfaktor); alt 26 cm, neu 28 cm → **784/676 = 1,159763…**, gerundet **1,16**. Faktor 1 bei identischem Durchmesser. Ungültige, negative, leere, 0- und nicht endliche Eingaben abgefangen.
- Kastenform nur mit Eingabe/Annahme tatsächlicher Länge/Breite; Backblech und Muffins mit sichtbaren Einschränkungen; keine exakte Backzeitprognose ohne geeignete Daten.
- Rechner ohne Konto, kein Supabase-Request erforderlich; auf Mobil nutzbar, per Tastatur steuerbar, Screenreader beschreibt Label/Ergebnis.
- Header-/Footer-Brand, zwei Maskottchen-Optionen sowie aktuelle Wahl nach Login/Reload unverändert.
- Keine realen personenbezogenen Inhalte in neuen Templates, Social-Previews oder Screenshots.

### Performance und Releases

- Lighthouse mobil/desktop in vergleichbarer Umgebung, kein Missbrauch von p75-Felddaten. Bei datenfähigem CrUX LCP ≤2,5s, INP ≤200ms, CLS ≤0,1 **als Ziel**, nicht als vorausgesetztes Ergebnis.
- Nach Merge auf `main` tatsächliches Deployment und öffentliche Seite prüfen, 404-/Canonical-/Robots-/Schema-Regressionstests. Fehlende Zugriffe/Berechtigungen offen als „blockiert“ markieren.
- Jeder abgeschlossene Release erhält Changelog, Commit/PR-Link, Live-Teststatus, Liste von Risiken und mögliche Rückrollanweisung.

## 5. Definition of Done pro Release-Welle

**Welle A – Sicherheit & Basis:** R00–R15 abgeschlossen oder mit klar geschütztem Rest-Risiko markiert; kein unberechtigter Zugriff; Verzeichnisstrategie dokumentiert; GSC/Bing-Baseline vorhanden oder sauber blockiert.  
**Welle B – Kernnutzen:** R20–R28 live geprüft; Backform-Rechner ohne Konto sichtbar; 18-URL-SEO-Basis unverletzt, Link-/A11y-/Brand-Smoketests erfolgreich.  
**Welle C – Inhalte & Technik:** R30–R48 mit siteweiten Prüfpunkten und 18 redaktionellen Seitenstatus; Downloads funktionieren, Performance in vergleichbarer Messung geprüft.  
**Welle D – Skalierung:** R50–R63 nur auf Basis bestätigter Nachfrage, hochwertigen Ressourcen und dokumentierter Reputation-/GEO-/Analytics-Messung.  
**Welle E – Optional:** R70–R74 begründet freigegeben, ansonsten bewusst nicht umgesetzt.

## 6. Fortschrittsprotokoll, das Work fortlaufend pflegen soll

| Feld | Pflichtinhalt |
|---|---|
| Ticket-ID / Phase | z. B. `R20 / Welle B` |
| Ist-Zustand | Quelle: Live, `main`-SHA, Branch oder Audit; Datum |
| Entscheidung | umgesetzt / bereits korrekt / keine Umsetzung / blockiert – mit Begründung |
| Code | GitHub-PR, Commit, betroffene Dateien, keine Secrets |
| Prüfung | Testkommandos, automatisierte und manuelle Checks, Screenshots/Logs nur ohne PII |
| Deploy | `main` gemergt? GitHub Pages tatsächlich live? URL-/Statusnachweis |
| KPI | relevante Vorher-/Nachher-Zahlen, Messmethodik, Datenlücken |
| Risiko / Rollback | offene Sicherheits-, Daten-, Rechts- und Hosting-Grenzen |

### Muster für die knappe Abschlussmeldung von Work

> **Erledigt und live geprüft:** [IDs + relevante Ergebnisse + PR/Deploy-Links].  
> **Implementiert, aber noch nicht veröffentlicht:** [IDs/Gründe].  
> **Bereits vorher korrekt:** [IDs + Nachweis].  
> **Blockiert / Entscheidung nötig:** [nur notwendige Rechts-/Produkt-/Zugriffsfragen].  
> **Messung:** [GSC/Performance/GEO-Werte und Datenlücken].  
> **Nächste selbstständig fortsetzbare Welle:** [IDs].

---

**Rangfolge wichtiger als Kalender:** Die Wochenfenster sind eine grobe Sequenz für Planung, **keine Zusage** und keine Blockierung, wenn Aufgaben unabhängig schon erledigt werden können. ChatGPT Work soll nach jedem Paket den wirklichen Live-Zustand neu bewerten und ohne unnötige Rückfrage weiterarbeiten. Die einzige generelle Grenze sind Sicherheitsfreigaben, fremde Plattformautorisierungen und irreversible/rechtlich kritische Aktionen.
