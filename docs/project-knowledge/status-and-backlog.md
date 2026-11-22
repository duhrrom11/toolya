# Status, offene Arbeiten, Nachweise

Erfasst 2026-11-22. **Keine neue Live-/CI-Abnahme durch diese Dokumentationsarbeit.**

## Aus dem Repository bestätigt
- README: zwölf Tools, GitHub Pages, Wishlist/Amazon-Importer, separates Supabase-Projekt.
- Bestehende Audits: `docs/audits/toolya-master-audit.md` und `docs/audits/toolya-roadmap.md`. Beide tragen Stand 18.11.2026; einzelne Statusfelder können inzwischen überholt sein.
- package.json enthält Tests für Amazon, Cloud-only/Connect und Browser.

## Historische Nachweise – vor Weiterentwicklung aktualisieren
- Frühere Arbeit meldete PR #140 (SEO/GEO), #172 (Startseite) sowie weitere Design- und Sicherheits-PRs; nicht als aktueller HEAD-Status interpretiert.
- Früherer Sprint A: Draft-PR **#291**, HEAD **4e341b01f0c4bb701a18d23d0208e94171d8d829**, neun erfolgreiche Actions-Workflows gemeldet (21.11.2026). **Nicht gemergt/deployt laut damaligem Stand**. Offene Gates: dynamische UI-Übersetzung, Auth/Recovery-E2E, Import/Export-Journeys, PDF/QR-Rendering, Screenreader; englische Seiten noindex.
- Toolya Connect: früherer Abgleich (17.11.) meldete fehlende `connect_transfers`, `connect_rules` und RPC, lokalen Prototyp deaktiviert. **Nicht als aktueller Datenbankzustand bestätigt**.
- Profilregeln Wishlist (früherer Bericht 19.11.): Privatperson Vor-/Nachname, Organisation Organisationsname, Land stets Pflicht; bestehende Profile unverändert.
- Social Assets: Paket aus 15 Dateien laut früherem Bericht vom 21.11.; Veröffentlichung von Posts nicht bestätigt.

## Priorisierte Nachprüfung
1. Aktuellen main-HEAD, offene PRs (insbesondere #291), Branches und letzte CI-/Pages-Runs lesen.
2. Vollständige zwölf Tool-Routen, dynamische Abhängigkeiten, Auth-/Cloud-Speichergrenzen und aktuellen Connect-Stand inventarisieren.
3. Alte Audit-Aufgaben mit tatsächlich gemergtem Code und Live-Nachweisen abgleichen; Status nur mit Beleg ändern.
4. Originalmaskottchen-/Wortmarken-Assets und deren Referenzpfade prüfen.
5. Historische Chats systematisch gegen diese Wissensbasis abgleichen, bevor sie gelöscht werden.

## Quellenklassifikation
**R** = direkt am 22.11. aus Repository gelesen; **H** = frühere Gesprächs-/Arbeitsmeldung; **U** = ungeprüft/offen. Ein H-Eintrag ist niemals ein Ersatz für R oder aktuelle Live-Evidenz.
