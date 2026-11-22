# Toolya Universe – Entwicklungsstatus

Ausgangspunkt ist der Übergabe-Commit `88769b3` auf `feature/gamification-mascot-levels-v1`. Der frühere Browserprototyp mit 50 XP für Kartenklicks ist durch eine optionale kontogebundene Spielwelt ersetzt. Die zwölf kostenlosen Tools bleiben eigene Anwendungen. Die öffentliche Wishlist-Suche und vorhandene Wunschlisten-Links bleiben erreichbar.

| Etappe | Stand |
| --- | --- |
| W0 | Repository, bestehende Anmeldung, zwölf Toolrouten, Originalgrafiken, Shopmodule und Schema-Metadaten geprüft. |
| W1–W2 | Die Nebelinseln mit drei Regionen, zwölf Orten, einem Kapitel und drei Rätseln entworfen. Karten- und Versteckmotive erzeugt, optimierte Bilder und zwei Kostüme pro Figur integriert. |
| W3 | Gemeinsame Registrierung und Profil, optionaler Spieleinstieg, Versteck, Fundstücke, zwölf kontogebundene Meilensteine, private Wunschprofil-Ablage und freiwillige Rangliste im Branch. |
| W4 | Synthetische SQL-Prüfung mit zwei Migrationsanwendungen und zwölf Meilensteinen erfolgreich. Die Chromium-Vorschau lief auf Desktop und 320 Pixeln. Node-Regressionen: 190 erfolgreich. Alle acht Originale stimmen mit SHA-256-Manifest überein. |
| W5 | Isoliertes CI und lokale Vorschau eingerichtet. Ausstehend sind der Test am isolierten Supabase-Auth-Endpunkt mit E-Mail-Verifizierung und die abschließende Datenschutzprüfung der Pflichtnamen. Im Umzugskatalog steht noch kein aktuell bestätigter Artikel. |
| W6 | Merge, Live-Veröffentlichung und produktive Migration erfordern Endabnahme. |

[Weltbeschreibung und Gestaltung](TOOLYA-UNIVERSE-WORLD-BIBLE.md) · [Abnahme, Vorschau und offene Punkte](TOOLYA-UNIVERSE-ABNAHME.md)
