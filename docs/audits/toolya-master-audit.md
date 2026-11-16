# Toolya – Master-Audit und Produktionsoptimierung

Stand: 16.11.2026. Ausgangscommit: `28f73ac3181f823cb5fc867ba8673c8461ea3fa9`.

## Management-Zusammenfassung

Toolya ist eine statische GitHub-Pages-Plattform mit zwölf Tool-Einstiegen, einem persönlichen Dashboard, eigenem Supabase-Backend und gemeinsamen Maskottchen-/Layoutmodulen. Der aktuelle Quellcode enthält 38 HTML-Seiten und 93 Remote-Branches (zuzüglich origin/HEAD). Drei alte PRs sind offen (#13, #26, #47); sie werden nicht ungeprüft integriert. Die letzten Plattform-, Amazon- und Pages-Läufe für den Ausgangscommit sind erfolgreich (43921114382, 43921114304, 43921113071).

Die Live-Startseite besitzt bereits die beschlossenen Originalmaskottchen und den gemeinsamen Footer. Ein Verlust des Cookie-Einstellungen-Links nach Footerersetzung ist live bestätigt. Die Datenschutzseite zeigt zwei Footer und eine zusätzliche Begleiterkarte. Wortmarken erben je nach Seite verschiedene Schriftfamilien; Pflanzen-/Tier-Header verwenden trotz Markenpräferenz Grün. Die Footer-CSS enthält zwei konkurrierende Ko-fi-Definitionen. Eine vollständige Designabnahme liegt noch nicht vor.

FAQ und Datenschutz enthalten nachweislich veraltete Aussagen zu Anmeldung, lokaler Speicherung und Firebase. Inhaltliche Änderungen folgen erst nach P1/P2, ausgenommen kritische Funktions-/Sicherheitskorrekturen. Rechtstexte sind nicht juristisch freigegeben.

Supabase-Metadatenprüfung: alle 32 public-Tabellen mit RLS, auch vier estate_private-Tabellen. Advisor-Warnungen sind keine automatisch bestätigten Schwachstellen. Insbesondere können fehlende Policies absichtlich jeden Clientzugriff sperren. Öffentliche Profile und WG-Schreibrechte benötigen gesonderte Detailprüfung. Keine produktiven Nutzerdaten wurden zum Test verändert.

## Verbindliche Gestaltung und Reihenfolge

P1 Design → P2 SEO → P3 Texte/Recht → weitere Optimierungen. Kritische Sicherheits-/Datenverlustfehler dürfen vorgezogen werden. Bestehende Hauptseite erhalten; gemeinsame Komponenten harmonisieren. Nur Hellmodus, bläuliches Türkis, beide Originalfiguren unverändert. Der aktuelle Auftrag verlangt Footer Variante 3 mit kleinem nutzergewähltem Maskottchen und überschreibt die ältere Entfernungsvorgabe. Themenfarbe und Charakterauswahl bleiben unabhängig. Original-PNGs über SHA256SUMS schützen.

## Belegstufen und Prüfgrenzen

- **Bestätigt:** aktueller Quellcode, aktuelle Live-DOM-/Screenshotbeobachtung oder aktuelle Metadatenabfrage belegt den Befund.
- **Wahrscheinlich:** Ursache im Code erkennbar; relevante End-to-End-Funktion noch nicht nachgewiesen.
- **Nicht prüfbar:** fehlender Sitzungskontext, echte Zustellung oder rechtliche Angaben fehlen.

Live-Browser: Startseite und Datenschutz bei ca. 1348 px; ausgeloggter Direktaufruf Haushaltsbuch führt auf die Startseite zurück. Keine echte Anmeldung und keine private Datenmutation. Keine Behauptung vollständiger WCAG-Konformität, realer Mobilgeräteabnahme oder gemessener Core Web Vitals.

## Maßnahmenkatalog und Fortschritt

Die vollständige erfasste Maßnahmenliste mit IDs, Gewichten, Ist/Soll, Aufwand, Abhängigkeiten, Risiken, Status und Nachweisen steht in [toolya-roadmap.md](toolya-roadmap.md). Die Seiteninventur steht in [page-inventory.json](page-inventory.json). Vertiefende Befunde stehen in [SEO-/Inhaltsinventar](seo-content-inventory.md) und [Sicherheitsinventar](security-inventory.md). Diese präzisieren die übergeordneten Aufgaben; ihre Unterpunkte werden nicht doppelt gewichtet. Prozentwerte beziehen sich ausschließlich auf den erfassten Katalog, nicht auf den unbekannten Gesamtumfang. Neue Befunde können den Nenner erhöhen.

## Qualitätsbewertung

| Bereich | Nachvollziehbare Bewertung | Grenze |
|---|---|---|
| Markenassets | Zwei bestehende Identitäten, Originale mit Prüfsummen vorhanden | Hashprüfung vor Integration erforderlich |
| Gemeinsame Komponenten | Header/Footer zentral vorhanden; Footer-Montage nachweislich inkonsistent | Private Tool-Inhalte nicht live abgenommen |
| Veröffentlichung | CI und Pages für Ausgangscommit erfolgreich | Jeder Folgecommit separat prüfen |
| Zugriffsschutz | Haushaltsbuch-Direktaufruf ausgeloggt umgeleitet; RLS auf 32 public-Tabellen aktiv | Kein vollständiger Funktions-/Angriffsnachweis |
| SEO | Inventar mit canonical/noindex vorhanden | Indexabdeckung, Rankings, CWV nicht gemessen |
| Inhalte | FAQ-/Datenschutzwidersprüche bestätigt | Juristische Freigabe offen |
| Analytics | Opt-in-Oberfläche vorhanden, Widerrufslink auf Startseite verloren | Tatsächliche GA4-Auswertung nicht Teil dieses Pakets |

## Bildschirmnachweise – Ausgangslage

1. Startseite: klare Toolkarten und Originalfiguren; FAQ mit veralteter Kontobehauptung. Footer-Widerrufslink fehlt im DOM nach Montage. Screenshot `evidence/01-home-before.jpg`.
2. Datenschutz: lesbare Textspalte, aber eigener Header und Begleiterkarte; zwei contentinfo-Footer im DOM. Screenshot `evidence/02-privacy-before.jpg`.
3. Ausgeloggter Haushaltsbuch-Direktaufruf: Rückleitung auf index.html bestätigt; damit ist keine private Tool-Bedienung geprüft.

## Integrations- und Rollback-Regeln

Neue Änderungen in eigenem Branch/PR. Nur nach relevanten Checks integrieren. Kein Datenbankschema in diesem ersten Designpaket ändern. Rollback über gezielten Revert des jeweiligen Mergecommits; Originalassets unberührt. Code vorhanden, PR integriert und live verifiziert werden getrennt dokumentiert. Ältere Release-Dokumente sind historische Nachweise, kein Beleg für den gesamten aktuellen Auftrag.

## Erstes Paket – Stand vor CI

D01–D04 im Branch implementiert. 75 bestehende Node-Tests bestanden; Syntax und Originalasset-Hashes erfolgreich. Lokaler Chromium-Start ist durch die Laufzeit gesperrt (socket Operation not permitted); Browserregression wird deshalb auf isoliertem GitHub-Runner ausgeführt. Cloud-Browser kann den lokalen Preview-Port nicht erreichen; Live-Sichtprüfung folgt nach erfolgreicher CI und Integration. Kein Sicherheitsmechanismus wird dafür abgeschaltet.

### CI-Nacharbeit

Der erste GA4-CI-Lauf 43925565469 scheiterte an einer älteren Testerwartung: Der Test verbot Analytics auf Nachlassseiten vollständig, während der aktuelle produktive Consent-Code diese Seiten ausdrücklich bei Einwilligung einbezieht. Die Produktfunktion wird nicht geändert. Der Regressionstest wird auf die bestehende Einwilligungsregel und insbesondere das Ausschließen von Query-Strings, Schlüsselfragmenten und Referrern aus page_view ausgerichtet. Die Footer-Wortmarkenprüfung normalisiert dekorative Leerzeichen; die Markenbezeichnung bleibt Toolya. Keine Abschwächung der Auth-/Tresorschutztests.

## HTTP-Baseline

Alle 38 inventarisierten HTML-Adressen am 16.11.2026 per GET abgefragt: 38 × HTTP 200, 38 Antworten bytegleich zu den HTML-Dateien des Ausgangscommits. Rohdaten: [live-http-baseline.json](live-http-baseline.json). Dies belegt statische Auslieferung; clientseitige Auth-Redirects und private Nutzerabläufe sind damit nicht abgenommen. Gemeinsame CSS/JS-Änderungen werden nach Deployment separat auf Bytegleichheit geprüft.

### Weitere visuelle Befunde im ersten Paket

Runner-Bilder für Pflanzenpflege, Startseite und öffentliche Wishlist bei 320 px gesichtet. Header-/Footer-Figuren folgen der lila Auswahl. Pflanzenheader ist bläulich, grüne Bedienelemente im Tool bestehen weiterhin (D06). Zahlreiche andere ältere Maskottchen-Routenscreenshots zeigen nach dem Auth-Redirect die Startseite; sie zählen nicht als echte Tool-Designabnahme. Öffentliche Wishlist: allgemeines section-Padding verengt den gemeinsamen Header zusätzlich; gemeinsamer Header erhält ausdrücklich padding:0, die innere Komponente behält ihre Abstände. Ein künstliches zusätzliches Sternsymbol vor dem bereits vorhandenen Herz entfällt. Der neue Layouttest erfasst auch diese echte öffentliche Route.

OpenSEO-Projekt Toolya (6eddcfc6-d4a2-403b-a689-d02bc761a969) ist verbunden, sein Kontext und Research-Log sind leer. Noch keine kostenpflichtige Recherche gestartet. Amplitude ist erreichbar, aber das Projekt default ist nicht belastbar Toolya zugeordnet; daraus werden keine Nutzerkennzahlen abgeleitet.

### Nachgewiesener 320-px-Fehler

Der neue responsive Test zeigte auf privacy.html eine Dokumentbreite von 354 px bei 320 px Viewport: der Zurück-Link ragte rechts aus der nicht umbrechenden Headerzeile. Datenschutz und Impressum erhalten einen umbrechenden Header mit Abstand. Das ist eine gezielte Korrektur im P1-Paket; Inhalt/Rechtsaussagen bleiben unverändert. Nachweis: CI 43926412098, platform-Job 133506951996.

Der nachfolgende Test fand auf Impressum zusätzlich das untrennbare Wort Verbraucherstreitbeilegung (337 px Dokumentbreite bei 320 px). Beide Rechtstextspalten erhalten Wortumbruch. Die dortige Viewport-Sperre gegen Benutzerzoom wird entfernt; Textinhalt bleibt unverändert. Fehlerbild aus Runner-Artefakt 14257311127 visuell bestätigt.
