# Toolya – SEO- und Inhaltsinventar

Stand: 16.11.2026. Quellcode-Bestandsaufnahme; keine Produktänderungen, keine Datenbankabfragen und kein Nachweis aktueller Rankings oder vollständiger Live-Crawlbarkeit. Priorität: erst P1 Design abschließen, danach P2 SEO, danach P3 Inhalte/Recht.

## Prüfgrundlage und Grenzen

- Repository `duhrrom11/toolya`, Ausgangscommit `28f73ac3181f823cb5fc867ba8673c8461ea3fa9`. Alle 38 produktrelevanten HTML-Dateien (ohne Tests), `robots.txt`, `sitemap.xml`, Auth-Gate, gemeinsame Plattform-/Consent-Module, aktuelle Nachlass-/Cloud-Runtime und vorhandene Hilfebereiche wurden statisch erfasst.
- Bestätigt bedeutet hier Quellcode bestätigt. Browserdarstellung, Suchmaschinen-Rendering, Auth-Schutz, Nutzerabläufe und Indexierungsstatus benötigen separate Live-Nachweise. Fehlende Metadaten sind bei bewusst privaten oder reinen Druckseiten nicht automatisch ein Fehler.
- Keine juristische Vollständigkeitsprüfung. Betreiberangaben werden weder erfunden noch geändert. Keine Nutzerdaten verwendet.

## Messbare Ausgangslage

| Kriterium | Anzahl | Einordnung |
|---|---:|---|
| HTML-Dateien | 38 | 6 Plattformseiten, 10 reguläre Toolseiten, 4 Nachlassseiten, 18 Wishlist-Seiten |
| Fehlende Meta-Description | 12 | Öffentlichkeitsstatus vor Ergänzung klären |
| Fehlendes Canonical | 23 | Private Seiten brauchen vorrangig klare Indexierungsregeln |
| Seiten mit explizitem noindex | 2 | Persönliches Dashboard und Admin-Statistik |
| Seiten mit JSON-LD | 1 | Startseite; Beschreibung darin veraltet |
| Seiten mit OG-Metadaten | 1 | Startseite; Aussage ohne Anmeldung veraltet |
| Seiten ohne statisches H1 | 2 | Wishlist-Weiterleitung und Schlüsseldruck |
| Seiten mit leerem statischem H1 | 2 | Sammlung und Profil, dynamischer Inhalt; Rendering prüfen |
| Sitemap-URLs | 15 | Root, 12 Toolverzeichnisse, Datenschutz, Impressum |

## Vollständige Seitenklassifikation

Die alte Wishlist-Navigation ist weiterhin in einzelnen Unterseiten und `workspace.mjs` vorhanden. Diese Seiten sind keine bloßen Weiterleitungsstubs. Ihre Produktbedeutung und Datenzugriffe müssen vor Entfernung geklärt werden. Die reine Größe der Dateien ist kein Funktionsnachweis.

| Datei | Quellcodeklasse | Description | Canonical | Robots | H1 |
|---|---|---|---|---|---|
| `admin-stats-dashboard/index.html` | Persönliche/Admin-App, noindex | fehlt | fehlt | noindex,nofollow | 1 |
| `dashboard/index.html` | Persönliche/Admin-App, noindex | ja | fehlt | noindex,nofollow | 1 |
| `index.html` | Öffentliche Plattformseite | ja | ja | index,follow | 1 |
| `legal.html` | Öffentliche Plattformseite | ja | ja | keine Angabe | 1 |
| `mascots.html` | Öffentliche Plattformseite | fehlt | fehlt | keine Angabe | 1 |
| `privacy.html` | Öffentliche Plattformseite | ja | ja | keine Angabe | 1 |
| `tools/baking/index.html` | Kontopflichtiges Tool mit auth-page-gate | ja | ja | keine Angabe | 1 |
| `tools/budget/index.html` | Kontopflichtiges Tool mit auth-page-gate | ja | ja | keine Angabe | 1 |
| `tools/car/index.html` | Kontopflichtiges Tool mit auth-page-gate | ja | ja | keine Angabe | 1 |
| `tools/estate/handover.html` | Nachlass-App/Zugangsablauf | fehlt | fehlt | keine Angabe | 1 |
| `tools/estate/heirs.html` | Nachlass-App/Zugangsablauf | fehlt | fehlt | keine Angabe | 1 |
| `tools/estate/index.html` | Nachlass-App/Zugangsablauf | fehlt | fehlt | keine Angabe | 1 |
| `tools/estate/print-key.html` | Sicherheitskritische Druckseite | fehlt | fehlt | keine Angabe | fehlt |
| `tools/housemates/index.html` | Kontopflichtiges Tool mit auth-page-gate | ja | ja | keine Angabe | 1 |
| `tools/loans/index.html` | Kontopflichtiges Tool mit auth-page-gate | ja | ja | keine Angabe | 1 |
| `tools/meters/index.html` | Kontopflichtiges Tool mit auth-page-gate | ja | ja | keine Angabe | 1 |
| `tools/moving/index.html` | Kontopflichtiges Tool mit auth-page-gate | ja | ja | keine Angabe | 1 |
| `tools/parking/index.html` | Kontopflichtiges Tool mit auth-page-gate | ja | ja | keine Angabe | 1 |
| `tools/pet-health/index.html` | Kontopflichtiges Tool mit auth-page-gate | ja | ja | keine Angabe | 1 |
| `tools/plants/index.html` | Kontopflichtiges Tool mit auth-page-gate | ja | ja | keine Angabe | 1 |
| `tools/wishes/assistant.html` | Legacy-Wishlist: persönliche/Planungs-/Social-UI | ja | fehlt | keine Angabe | 1 |
| `tools/wishes/bookmarks.html` | Legacy-Wishlist: persönliche/Planungs-/Social-UI | ja | fehlt | keine Angabe | 1 |
| `tools/wishes/cockpit.html` | Legacy-Wishlist: persönliche/Planungs-/Social-UI | fehlt | fehlt | keine Angabe | 1 |
| `tools/wishes/collection.html` | Wishlist: öffentliche Entdeckung/Profil/Sammlung | ja | fehlt | keine Angabe | leer/dynamisch |
| `tools/wishes/dashboard.html` | Legacy-Wishlist: persönliche/Planungs-/Social-UI | ja | fehlt | keine Angabe | 1 |
| `tools/wishes/discover.html` | Wishlist: öffentliche Entdeckung/Profil/Sammlung | ja | fehlt | keine Angabe | 1 |
| `tools/wishes/feed.html` | Legacy-Wishlist: persönliche/Planungs-/Social-UI | ja | fehlt | keine Angabe | 1 |
| `tools/wishes/gift-analytics.html` | Legacy-Wishlist: persönliche/Planungs-/Social-UI | fehlt | fehlt | keine Angabe | 1 |
| `tools/wishes/gift-tasks.html` | Legacy-Wishlist: persönliche/Planungs-/Social-UI | fehlt | fehlt | keine Angabe | 1 |
| `tools/wishes/index.html` | Auth-gesteuerte JS-Weiterleitung zu public.html | fehlt | ja | keine Angabe | fehlt |
| `tools/wishes/notifications.html` | Legacy-Wishlist: persönliche/Planungs-/Social-UI | ja | fehlt | keine Angabe | 1 |
| `tools/wishes/occasions.html` | Legacy-Wishlist: persönliche/Planungs-/Social-UI | ja | fehlt | keine Angabe | 1 |
| `tools/wishes/planner.html` | Legacy-Wishlist: persönliche/Planungs-/Social-UI | ja | fehlt | keine Angabe | 1 |
| `tools/wishes/profile.html` | Wishlist: öffentliche Entdeckung/Profil/Sammlung | ja | fehlt | keine Angabe | leer/dynamisch |
| `tools/wishes/public.html` | Wishlist: öffentliche Entdeckung/Profil/Sammlung | fehlt | ja | keine Angabe | 1 |
| `tools/wishes/report.html` | Legacy-Wishlist: persönliche/Planungs-/Social-UI | fehlt | fehlt | keine Angabe | 1 |
| `tools/wishes/reservations.html` | Legacy-Wishlist: persönliche/Planungs-/Social-UI | ja | fehlt | keine Angabe | 1 |
| `tools/wishes/social.html` | Legacy-Wishlist: persönliche/Planungs-/Social-UI | ja | fehlt | keine Angabe | 1 |

## Themen- und Seitenstrategie für alle zwölf Tools

Die Begriffe sind redaktionell aus den tatsächlichen Funktionen abgeleitet, keine recherchierten Suchvolumina oder Rankingversprechen. Eine öffentlich lesbare, schlanke Einführung kann pro bestehender Toolroute die Suchintention erklären; der private Arbeitsbereich bleibt geschützt. Keine künstlichen neuen Landingpages anlegen, bevor geklärt ist, ob bestehende Routen dies leisten können.

| Tool | Schwerpunkt / Suchintention | Vorhandene Basis | Nächster Inhaltstest |
|---|---|---|---|
| Wishlist | Öffentliche Amazon-Wunschlisten finden / eigene Liste veröffentlichen | public.html; index.html nur Weiterleitung | Öffentliches Lesen vs Kontopflicht, Scraper-Fallback und Veröffentlichungsbedingungen abgleichen |
| Haushaltsbuch | Haushaltsbuch online, Einnahmen und Ausgaben erfassen | Titel, Description; guideSection vorhanden | Scanner/OCR, Cloudspeicherung und Budgetablauf sachlich erklären |
| Umzugskisten | Umzugskisten inventarisieren, QR-Etiketten | Titel, Description, ausklappbare Kurzanleitung | Cloudpflicht und Etikettendruck mobil abgleichen |
| Pflanzenpflege | Gießplan und Pflanzenpflege organisieren | Titel, Description, Hilfe-Modal | Pflegeintervalle und Erinnerungstypen gegen Implementierung |
| WG-Organisator | WG-Ausgaben teilen und Haushalt organisieren | Titel, Description, Hilfe-Modal | Rollen, Teilen, Putzplan und Synchronisierung prüfen |
| Digitaler Nachlass | Digitalen Nachlass ordnen und Vertrauenspersonen Zugang geben | App mit Titel Mein Tresor, keine Description/Canonical | Zwei Schlüssel, 24 Stunden, Entwarnung und Verschlüsselung präzise erklären |
| Autokosten | Autokosten, Wartung und Reifenwechsel verwalten | Titel, Description, Kurzanleitung | Kostenkategorien, Erinnerungen, Haushaltsbuch-Verbindung |
| Tiergesundheit | Tiergesundheit, Impfungen und Medikamente dokumentieren | Titel, Description, Kurzanleitung | Digitaler Impfpass nicht als amtliches Dokument darstellen; Medikamente/Amazon-Link |
| Parkplatz-Merker | Parkplatz wiederfinden, Parkzeit merken | Titel, Description, Hilfe-Modal | Standortfreigabe, Timer-Grenzen und Speichern erklären |
| Verliehene Dinge | Leihgaben und Rückgaben organisieren | Titel, Description, Hilfe-Modal | Rückgabe, Kontakte, Erinnerungen und Cloudpflicht |
| Zählerstände | Strom-, Gas- und Wasserverbrauch verfolgen | Titel, Description, sichtbare Anleitung/FAQ | Einheiten, Abrechnung und Berechnungsgrenzen |
| Backform-Rechner | Backform und Zutatenmengen umrechnen | Titel, Description, 3-Schritte-Einstieg, Kurzanleitung | Backzeit als Näherung, Volumen/Formen und Rezeptspeicherung |

## Maßnahmenkatalog (zu integrieren, noch nicht umgesetzt)

| ID | Kategorie / Priorität | Istzustand und Nachweis | Soll / Empfehlung | Aufwand / Abhängigkeit | Risiko / Status |
|---|---|---|---|---|---|
| SEO-01 | Technical SEO / P2 | `sitemap.xml` nutzt Root und Toolverzeichnisse; Canonicals von Root und 10 Tools nutzen index.html. Wishlist-Sitemap führt zur auth-gesteuerten Weiterleitungsroute statt public.html. | Ein kanonisches URL-Schema beschließen, Sitemap/Canonical/Navigation daran angleichen; Redirectverhalten prüfen. | 2–4 h; P1, Zugriffskonzept | Mittel / Offen, Quellcode bestätigt |
| SEO-02 | Indexierung / P2 | 13 private Legacy-Wishlist-Seiten sowie Nachlass-Handover/-Heirs/-Druck besitzen keine explizite noindex-Angabe. Robots erlaubt alles. Dashboard/Admin sind korrekt noindex. | Öffentlichkeitsmatrix beschließen; persönliche Ansichten und Schlüsselabläufe noindex setzen, ohne robots für Zugriffsschutz zu halten. Keine private Daten über Metadaten. | 2–4 h; Produktentscheidung, Runtime-Zugriffe | Mittel / Offen, Quellcode bestätigt |
| SEO-03 | Rendering / P2 | 10 Tool-Einstiegsseiten plus Wishlist-Stub verbergen Body und redirecten bei unbestätigtem Konto zur Startseite (`auth-page-gate.js`). | Für Crawler und Besucher nützliche öffentliche Einführung auf vorhandenen Routen prüfen; geschützte Daten erst nach bestätigter Anmeldung. Nicht den Zugriffsschutz für SEO lockern. | 1–2 Tage; Auth-Architektur, P1 | Hoch / Offen, Suchmaschinenwirkung noch nicht live belegt |
| SEO-04 | Metadaten / P2 | Description bei 12 Seiten und Canonical bei 23 Seiten fehlen; OG nur auf Root. Nachlass und aktuelle public.html ohne Description. | Nach Indexierungsmatrix gezielt eindeutige Titel/Description/Canonical/OG für öffentliche relevante Seiten ergänzen. Private Seiten nicht künstlich indexieren. | 3–5 h; SEO-02/03 | Niedrig / Offen, Quellcode bestätigt |
| SEO-05 | Strukturierte Daten / P2 | Root JSON-LD und OG behaupten ohne Anmeldung und optionale Dienste (`index.html:16,45`); nur Root hat JSON-LD. | Auth-/Speicheraussagen mit Umsetzung abgleichen. Schema nur für tatsächlich sichtbare Inhalte und korrekte App-Fakten einsetzen. | 1–3 h; Kontokonzept | Niedrig / Offen, Quellcode bestätigt |
| SEO-06 | Qualität / P2 | Keine eigene 404.html im Repository. JS-Abhängigkeiten teils CDN zur Laufzeit; Lade- und Renderingwirkung noch ungemessen. | Fehlerseite/Linkcrawl, Mobile-Rendering und echte Performance messen; danach konkrete Ressourcen optimieren. | 4–8 h; Browser/Netzwerk | Mittel / Offen; Fehlen bestätigt, Wirkung nicht gemessen |
| CONTENT-01 | FAQ / P3 | Root FAQ sagt viele Funktionen ohne Anmeldung (`index.html:156`), weitere Beschreibung nennt ohne Anmeldung (`174`); Anmeldungspflicht im Gate nachgewiesen. Root FAQ-Speichertext unpräzise zur CloudOnly-Runtime. | Konto-, Speicher- und Backup-Antworten entlang tatsächlicher Abläufe neu schreiben. Hauptseite nicht gestalterisch neu bauen. | 1–3 h; nach P2 | Niedrig / Offen, Widerspruch bestätigt |
| CONTENT-02 | Datenschutz / P3 | `privacy.html:55–72` beschreibt Local Storage als Standard, Cloud optional, Nachlass Firebase/Firestore. Aktueller Nachlass-Entry und estate-owner/estate-cloud-guard verwenden Supabase; Suche nach Firebase/EmailJS in aktuellen 20 Estate-/Tool-Entry-Dateien liefert keine Treffer. | Verifizierte Datenflussmatrix erstellen; aktuelle Supabase-Speicherung/Auth, Verschlüsselung, Brevo-Mail und Drittbilder konkret beschreiben. Firebase/EmailJS erst nach vollständiger Runtime-Abhängigkeitssuche streichen. Änderungen als rechtlich prüfpflichtigen Entwurf kennzeichnen. | 1–2 Tage; Dienste-/Vertrags-/Fristenangaben | Hoch (rechtliche Richtigkeit) / Offen, technische Diskrepanz bestätigt; rechtliche Vollständigkeit unbestätigt |
| CONTENT-03 | Hilfe / P3 | 10 reguläre Tools besitzen unterschiedliche Hilfeformen (Modal, ausklappbar, guideSection); Nachlass und aktuelle public.html haben keine vergleichbare benannte Anleitung. | Einheitliche verständliche Hilfe-Struktur pro Tool; echte Schritte, Fehlerfälle, mobile Nutzung; bestehende Hilfe inhaltlich prüfen, nicht doppeln. | 1–3 Tage; vollständige Funktionsprüfung | Mittel / Offen, Struktur bestätigt; Vollständigkeit unbestätigt |
| CONTENT-04 | Legacy-Wishlist / P3 | 13 persönliche/Planungs-/Social-Seiten und workspace.mjs erzeugen weiter Geschenk-/Konto-/Social-Navigation, trotz neuem einfachen public.html-Einstieg. `index.html` ist nur Redirect; alte Hashlinks verlieren ihren bisherigen Zielbereich. | Linkziele und sinnvolle verbleibende Funktion prüfen; abgestimmte Weiterleitung/Archivierung. Kein ungeprüftes Entfernen von Funktionen oder Nutzerdaten. | 1–2 Tage; Produkt-/Datenzugriffsprüfung | Mittel / Offen, Quellcode bestätigt |
| CONTENT-05 | Impressum / P3 | Betreiber-/Kontakt-/Amazon-Partnerhinweis vorhanden, Datenschutz verlinkt. Verwendbarkeit/gesetzliche Vollständigkeit der Angaben wurde nicht rechtlich geprüft. | Betreiberangaben vom Inhaber validieren lassen; technisch belegte Dienste erfassen, fehlende Pflichtangaben gezielt dokumentieren. Keine erfundenen Anschriften oder Rechtsbehauptungen. | 2–4 h plus Prüfung; Inhaber/Jurist | Hoch / Offen, Bestand bestätigt; Rechtskonformität nicht geprüft |
| CONSENT-01 | Funktion/Datenschutz / kritisch prüfen | `toolya-consent.js` fügt Widerrufslink dem ersten vorhandenen Footer hinzu. `platform.mjs` ersetzt oder entfernt alte Footer. Observer des Consent-Moduls wird nur angelegt, wenn vorher kein Footer existiert. Root-Live-AX im Audit zeigt keinen Cookie-Einstellungen-Link. | Verlust im Live DOM nachweisen; Link robust in finalem Footer erhalten und Widerruf testen. Das ist eine mögliche Ausnahme vor Inhaltsphase, da bestehende Funktion betroffen. | 1–2 h; Live DOM + isolierter Test | Mittel / Wahrscheinlich, Live DOM-Prüfung durch Hauptagent erforderlich |

## Qualitätsbewertung und nächster Nachweis

- **Stärken bestätigt:** alle 38 Seiten deklarieren Deutsch und haben einen Titel; 10 reguläre Tools besitzen bereits individuelle Descriptions und Canonicals. Zwei zentrale persönliche/Admin-Bereiche sind noindex. GA4-Consent-Code hält das Laden von Google-Skripten bis zur ausdrücklichen Zustimmung zurück und bereinigt URL-Query/Fragment vor Analytics-Events.
- **Schwächen bestätigt:** Canonical-/Sitemap-Schema uneinheitlich; private Legacy-Seiten ohne Indexierungsstrategie; öffentliches Inhaltsversprechen zu Anmeldung/Speicherung veraltet; Datenschutz nennt nicht den aktuellen Nachlass-Stack.
- **Noch nicht bewertet:** tatsächliche Suchindexierung, Rankings/Suchvolumen, Core Web Vitals, vollständiger Linkcrawl, Screenreader-/Tastaturerlebnis der Hilfe, korrekte Erfassung aller Drittanbieter und rechtliche Vollständigkeit. Keine Zahlen oder Noten dafür erfunden.
- **Nächste Aktion nach P1:** öffentliche/private Seitenmatrix und Auth-Renderingstrategie festlegen; dann SEO-01/02/04/05 gemeinsam umsetzen und live prüfen. Danach FAQ-/Hilfetexte und rechtlich prüfpflichtigen Datenschutzentwurf anhand der Datenflussmatrix bearbeiten.
