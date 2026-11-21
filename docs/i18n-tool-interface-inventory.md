# DE/EN Tooloberflächen – konkret geprüfter Übersetzungsumfang

Stand 2026-11-21. Quelle: vier vorhandene `tools/*/index.html` im Entwicklungsbranch, ohne Änderung produktiver Daten.

| Tool | HTML-Zeichen | unterschiedliche statische Textkandidaten* | aria/placeholder/title | Inline-Eventhandler |
|---|---:|---:|---:|---:|
| moving | 67.132 | 96 | 35 | 31 |
| housemates | 164.593 | 194 | 33 | 89 |
| plants | 88.909 | 107 | 25 | 65 |
| baking | 74.174 | 145 | 14 | 55 |

*Grobe DOM-Text-Kandidatenzählung mittels HTML-Regulärausdruck, keine vollständige Extraktion und keine Zahl der tatsächlich notwendigen Übersetzungen. Dynamische Meldungen in externen und Inline-JavaScript-Dateien kommen hinzu.

## Bereits integriert (staging-only)
- Existing login/auth guards, Datenmodelle und Eventhandler bleiben unverändert.
- Sprachwahl auf den vier Tool-Einstiegsseiten für den **Kopfbereich** mit expliziter Zwischenstandsmeldung.
- Englische Social-Landingpages leiten per `lang=en` zum passenden Tool; Cookie-/Tracker-Neuanlage findet nicht statt.
- Manuelle Auswahl wird separat unter `toolya-locale-v1` gespeichert und ändert weder Figur noch Tool-Daten.
- Auf allen unvollständig lokalisierten Tool-Seiten bleibt `html lang="de"`, die öffentlichen EN-Ratgeber bleiben vorerst `noindex`.

## Notwendiger nächster Implementierungsumfang
1. Pro Tool exakte, versionierte Kataloge für feste Texte, aria-Labels, Dialoge, Hilfen und Platzhalter anlegen. HTML-Markierungen `data-i18n` an geprüften Textstellen einfügen, keine globale blind-algorithmische DOM-Übersetzung.
2. Alle **dynamisch** erzeugten Meldungen direkt an der Renderstelle aus dem gleichen Katalog beziehen. Interne Daten-Keys/Cloud-Kollektionen und Speicherung dürfen niemals übersetzt werden.
3. Auth-Login, Logout, Registrierung, Passwort-Reset und Fehlerbehandlung in DE/EN synchronisieren; E-Mail-Kommunikation und zugelassene Redirect-URLs in Staging prüfen.
4. Native `Intl`-Formatierung für Datums-/Geldwerte; Einheiten aus gesonderter Einstellung, nicht aus Sprache erraten. UK-/US-Währungen nur mit bewusster Wahl und ohne implizite Umrechnung.
5. PDFs, Drucketiketten, CSV-Exporte und Import-Hinweise übersetzen, ohne die maschinenlesbaren Datenschemata zu verändern.
6. Das bestehende Maskottchen beibehalten; nur sichtbare UI-Kommunikation lokalisieren. Keine 1:1-Zuordnung Farbe ↔ Sprache.
7. Responsive 320px, Tastatur, Screenreader `lang`, Textüberläufe, Fehlerfälle und vollständige Datenzugriffskontrollen in isolierten Browser-Prüfungen testen.
8. Vor der internationalen Veröffentlichung: durchgängiger englischer Auth-Funnel; SEO-hreflang-Paare, Sitemap, Canonical-/OG-Sprachen und `noindex`-Freigabe.

**Freigabe-Schranke:** Der aktuelle Sprachschalter bedeutet nicht, dass das jeweilige Tool bereits vollständig übersetzt ist. Keine automatische EN-Nutzerakquise oder Live-Übernahme dieser unvollständigen Fassung.

## Umsetzung auf PR #291 nach d112e980 (2026-11-21)
- Source-exakte DE/EN-Texte für `alert`, `confirm` und `prompt` der vier Tools. Unbekannte Serverfehler, Freitext, Benutzereingaben und Rückgabewerte bleiben unverändert. Weitere dynamische DOM-Renderstellen sind nicht vollständig erfasst.
- PDF-Kopfzeilen und Berichtslabels für Umzugskisten, WG und Pflanzen werden bei `lang=en` in Englisch ausgegeben; die gespeicherten Datensätze, maschinenlesbaren Backup-Formate, QR-Inhalte und Dateinamen bleiben unverändert.
- Regressionstests für die vier Dialog-Kataloge und für PDF-Sprachumschaltung ergänzt.
- **Noch offen:** vollständige dynamische DOM-Texte, sämtliche Kontozustände/Fehlerfälle, weitere Export-/Druckinhalte und E2E-Authentifizierung. Dieser Stand ist nicht releasefähig. Vor Merge/Deployment alle Workflows des endgültigen Commits abwarten.
