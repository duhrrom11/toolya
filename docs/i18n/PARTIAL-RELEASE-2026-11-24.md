# Toolya DE/EN – kontrolliertes Teilrelease vom 24.11.2026

**Ziel:** Bereits isoliert geprüfte, risikoarme Übersetzungen aus Draft-PR #310 in einem separaten Release-PR auf `main` übernehmen, ohne die noch nicht fertig abgenommenen Datenflüsse zu veröffentlichen.

## Enthaltene Änderungen

- Drei bestehende, source-exakte DE/EN-Anzeigekataloge ergänzt: **556 neue Wishlist-COPY-Schlüssel**, **34 neue Estate-COPY-Schlüssel** und **27 neue Admin-COPY-Schlüssel**. Die **617** zuvor freigegebenen bzw. zusätzlichen Key-Zählungen ergeben sich aus dem Vergleich der drei Quellkataloge; **alle vorbestehenden Key-Werte sind bytegleich erhalten**. Hinzu kommt eine Dashboard-Beschriftung (`Zuletzt verwendet`) sowie weitere überprüfte, feste Tool-Oberflächenbeschriftungen/Dialoge und zehn Anwendungstitel im bereits vorhandenen Interface-Adapter.
- Die einzige technische Anpassung im bestehenden i18n-Adapter erweitert seine zugelassenen, quellgenauen Kopietabellen und Alternativtext-/Titel-Behandlung und verhindert den Zugriff auf unbekannte Toolkeys. Kein zweites i18n-System und keine automatische Übersetzung von Nutzerdaten.
- Vier fest definierte, bereits veröffentlichte Wishlist-Einstellungslinks und -Beschriftungen mit `data-wish-copy` ausgezeichnet; Legacy- und redaktionelle Opt-ins sicher zusammengeführt. Die **28** bereits veröffentlichten `data-wishes-copy`-Texte bleiben erhalten.
- Gemeinsamer GA4-Statistik-Einwilligungsdialog auf Deutsch und Englisch mit passendem Datenschutz-Link. Zustimmung, Ablehnung, Widerruf, Nicht-Laden vor Zustimmung und geschützte Nachlass-Unterseiten bleiben funktional identisch.
- Fünf fehlende deutsche Gegenstücke mit reziproken `de`/`en`-`hreflang`-Links ergänzt, ohne Canonicals zu verändern: Startseite, Umzugskisten, WG, Pflanzenpflege, Backform-Rechner. Test prüft **alle 17 DE/EN-Paare**.
- Englischen Ratgeber zum Backform-Rechner mit zusätzlichen englischen Anwendungshinweisen und Berechnungsbeispielen erweitert. Bestehendes `noindex,follow` bleibt erhalten.

## Exakte Sicherheitsgrenze dieses Releases

**Ausgeschlossen:** Änderungen an den zehn komplexen Tool-HTML-Dateien, Speicherroutinen, Authentifizierung, Cloud-Synchronisierung, Supabase-Tabellen/RLS, verschlüsselten Nachlassdaten, Wunschlisten-Publishing und importierten Profilen, Admin-API-Aktionen, CSV-/QR-/PDF-Payloads, Maskottchen-Originalen, Wortmarke und SEO-Freigabeschaltern. Die umfangreiche, noch nicht fertig abgenommene App-Lokalisierung verbleibt in Draft-PR #310.

**Automatische Tests:** vorhandene i18n-, i18next-, Plattform-/Maskottchen-/Nachlass-, Wunschlisten-, Browser-, SEO- und Analytics-Checks; zusätzliche Quelltextschutz- und reversibel testbare Katalogchecks in `tests/i18n/release-safe-catalogues.test.mjs`.

## Freigaberegel

Nur mergefähig, wenn der Release-PR-Diff auf genau diese Dateien begrenzt ist, alle erforderlichen GitHub-Workflows erfolgreich sind und das Release keine produktiven Nutzerdaten bzw. Indexierung verändert. Anschließend den tatsächlichen GitHub-Pages-Deploy-Status für den Release-Commit gesondert nachprüfen.

**Wichtig:** Dies ist **nicht** der Abschluss der gesamten DE/EN-Übersetzung. Die maschinenlesbare Restarbeitenliste und die offenen 34 Anwendungsansichten bleiben unter `docs/i18n/RELEASE-BLOCKERS-2026-11-24.md` im Draft-PR #310 erhalten. Die finale vollständige EN-Indexierung bleibt gesperrt.
