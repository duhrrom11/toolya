# Toolya – P1-Designfamilien und nächste Arbeitseinheiten

Stand: 16.11.2026 nach PR #91. Lesende Quellcodeprüfung aller 38 HTML-Dateien; keine vollständige Funktions-/Designabnahme daraus ableiten.

| Familie | Seiten | Basis | Nächster sicherer Harmonisierungspunkt |
|---|---:|---|---|
| Startseite | 1 | B3, toolya-home.css, Plattform | Bestehenden Aufbau bewahren, nur gemeinsame Komponenten |
| Persönliches Dashboard | 1 | dashboard.css, Plattform | Eigenen Header gegen gemeinsame Tokens prüfen |
| Rechtstexte | 2 | Tailwind, alpha.css, Plattform | Dokumentheader/Marke; Textinhalt erst P3 |
| Maskottchengalerie | 1 | Inline-CSS, Plattform über gallery.mjs | Gemeinsamer öffentlicher Header, Galeriebedienung erhalten |
| Admin-Statistik | 1 | stats.css, keine Plattform | Markentokens gezielt integrieren; Adminschutz erhalten |
| B3-Tools | 10 | Tailwind, helferlein-b3.css, Themen-CSS | Buttons/Formulare/Karten über vorhandene Variablen harmonisieren |
| Nachlass Besitzer/Erben | 2 | estate-app.css, estate-theme.js, Plattform | Grüne Grundfarben in Türkis umstellen |
| Nachlass Dateiübergabe | 1 | Eigenes dunkles Inline-Design | Separat auf Hellmodus umstellen, Netzwerksperre unverändert |
| Schlüsseldruck | 1 | estate-print.css, estate-print-ready.js | Bewusst isoliert; keine Analytics-/Plattform-/Bildimporte |
| Aktuelle öffentliche Wishlist | 1 | Umfangreiches Inline-CSS, Plattform | Eng begrenztes Stylesheet für Formulare/Karten |
| Wishlist-Einstieg | 1 | Auth-Weiterleitung, Plattform | Funktion erhalten, keine zusätzliche Ansicht |
| Alte Wishlist-Familie | 16 | Inline-CSS, alpha.css, teilweise workspace.css | Produktbedeutung klären; danach Light-Mode/Navi harmonisieren |

35 Seiten laden platform.mjs direkt, die Galerie indirekt (36/38 effektiv). Nur Admin und Schlüsseldruck ohne Plattform. 38/38 HTML-Dateien nach PR #91 ohne maximale Zoom-/user-scalable-Sperre (Quellcodebefund).

Die 16 älteren Wishlist-Seiten enthalten automatische Dark-Mode-Regeln: assistant, bookmarks, cockpit, collection, dashboard, discover, feed, gift-analytics, gift-tasks, notifications, occasions, planner, profile, report, reservations, social. Ihre Existenz ist keine Freigabe zur Löschung. B3-/Estate-Dark-CSS ist teils durch Light-erzwingende Skripte inaktiv; nicht mit tatsächlich aktivem Dunkelmodus gleichsetzen.

## Besondere Sicherheitsgrenze

handover.html erzwingt aktuell color-scheme:dark und importiert die Plattform trotz style-src unsafe-inline und connect-src none. Externe gemeinsame CSS-Dateien werden damit blockiert. Nicht einfach die CSP lockern. Die unabhängige helle Gestaltung muss lokal mit bestehender Netzwerksperre funktionieren. print-key.html bleibt ausdrücklich vollständig isoliert.

## Konkrete nächste P1-Einheit

Zuerst assets/estate-app.css: Grundfarben, Link-/Navigationsgrün und neutrale Flächen auf bläuliches Türkis umstellen. Besitzer-/Erbenseite teilen diese Datei. Auth, Schlüsselverarbeitung, CSP und Datenzugriffe unverändert. Isolierte leere/synthetische Ansichten bei 320/768/1440 px, Fokus und Kontrast prüfen. Danach handover separat; anschließend B3-Buttons und alte Wishlist-Familie. Noch keine SEO-/Textumsetzung beginnen.

Zusätzlich als weitere Optimierung erfasst: mascots.html lädt Consent klassisch und über das Plattformmodul. Bei gespeicherter Zustimmung ist eine doppelte Analytics-Initialisierung aus dem Code wahrscheinlich. Separat mit gezielter isolierter Regression bestätigen; keine pauschale Änderung der Einwilligungsregel.
