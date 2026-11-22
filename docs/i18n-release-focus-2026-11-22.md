# Toolya DE/EN – fokussierter Release-Plan (22.11.2026)

## Ausgangslage (GitHub-Abgleich)
- Repo: duhrrom11/toolya; Branch: feature/i18n-de-en-foundation-20261121; Draft-PR #291.
- Branch gegenüber main: 0 Commits zurück; 540 voraus (Vergleich am 22.11.).
- 72 HTML-Seiten mit englischem Einstieg bzw. Route, davon 17 öffentliche EN-Seiten mit noindex.
- 34 noch teilweise übersetzte Ansichten: 10 Haupttools, 17 Wünsche, 4 Nachlass, Dashboard und 2 Admin.
- 48 heuristisch gefundene Laufzeitdateien müssen triagiert werden; Treffer sind keine bestätigten Fehler.
- Letzter ausdrücklich dokumentierter i18n-Node-Nachweis: 223/223 auf f2ca1097. CI-Ergebnisse älterer HEADs sind keine finale Freigabe.
- Kein Merge, Deployment oder Zugriff auf produktive Nutzerdaten.

## Priorisierte Umsetzung
1. **Vollständige Oberflächenübersetzung (P0):** Zehn Haupttools, dann 17 Wunschlistenansichten, vier Nachlassansichten, Dashboard und zwei Adminansichten. Je Ansicht statische Texte, dynamische Zustände, Dialoge, Validierung, Leerseiten, ARIA, Datums-/Zahlenformate und DE/EN-Rückwechsel. Audit-Funde triagieren und echte Lücken beheben.
2. **Gemeinsame Abläufe (P0):** Auth, Session, Recovery, CloudOnly-Fehler, Consent, PDF/CSV/ICS/QR/Druck/Backup und Sprachwahrung auf Redirects. Nutzerfreitext, persistierte Codes, Formeln und Datenverträge niemals übersetzen oder verändern.
3. **Gezielte Abnahme (P0):** Pro betroffenem Flow nur fokussierte synthetische Regressionen; kritische Auth-/Daten-/Export-Wege mit isoliertem Chromium, 320px und Tastatur/Screenreader prüfen. Bestehende erfolgreiche Tests nicht unnötig wiederholen. Vollständige relevante CI einmal auf dem finalen Release-HEAD.
4. **Releasevorbereitung (P0):** Vollständige DE/EN-Abdeckung nachweisen, rechtliche Texte prüfen, hreflang/Canonical/Sitemap/SEO vorbereiten. Öffentliche EN-Seiten bis zur Freigabe auf noindex lassen. Danach kontrollierter Merge/Deployment und Live-Smoke ohne Testdatensätze.

## Abnahmebedingungen
- Alle 34 Ansichten vollständig auf DE/EN abgenommen; 48 Laufzeitkandidaten entschieden.
- Auth-/Recovery-Rückweg und kritische CloudOnly-Datenintegrität isoliert bestätigt.
- Betroffene Export- und Druckformate funktionieren mit synthetischen Daten in beiden Sprachen.
- Mobile/Accessibility-Kernpfade und alle relevanten finalen CI-Workflows grün.
- Keine Änderungen an produktiven Supabase-Daten, gespeicherten Nutzerwerten, Maskottchen oder Markenassets.
- PR bleibt Draft und kein Deployment, bis die Release-Gates tatsächlich erfüllt sind.

## Arbeitsweise
Übersetzungen in größeren, nachvollziehbaren Batches committen. Nach jedem Batch nur die betroffenen kleinen Regressionen ausführen; Status und offene Fehler dokumentieren. Keine Feature-Erweiterungen oder breit angelegten Testkampagnen vor dem Release. Zeitkorridor 6,5–10 Arbeitstage ist eine grobe Planungsschätzung, keine Zusage.
