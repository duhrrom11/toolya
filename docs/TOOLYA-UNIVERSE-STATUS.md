# Toolya Universe – Entwicklungsstatus

Ausgangspunkt ist der Übergabe-Commit `88769b3` auf `feature/gamification-mascot-levels-v1`. Der frühere Browserprototyp mit 50 XP für Kartenklicks ist durch eine optionale kontogebundene Spielwelt ersetzt. Die zwölf kostenlosen Tools bleiben eigene Anwendungen. Die öffentliche Wishlist-Suche und vorhandene Wunschlisten-Links bleiben erreichbar.

| Etappe | Stand |
| --- | --- |
| W0 | Repository, bestehende Anmeldung, zwölf Toolrouten, Originalgrafiken, Shopmodule und Schema-Metadaten geprüft. |
| W1–W2 | Die Nebelinseln mit drei Regionen, zwölf Orten, einem Kapitel und drei Rätseln entworfen. Karten- und Versteckmotive erzeugt, optimierte Bilder und zwei Kostüme pro Figur integriert. |
| W3 | Gemeinsame Registrierung und Profil, optionaler Spieleinstieg, Versteck, Fundstücke, zwölf kontogebundene Meilensteine, private Wunschprofil-Ablage und freiwillige Rangliste im Branch. |
| W4 | Synthetische SQL-Prüfung mit zwei Migrationsanwendungen und zwölf Meilensteinen erfolgreich. Die Chromium-Vorschau lief auf Desktop und 320 Pixeln. 436 Node-Regressionen und elf gezielte Bestands-Browsertests erfolgreich. Echter lokaler GoTrue- und PostgreSQL-Durchlauf mit Pflichtnamen, E-Mail-Bestätigung, Rückkehrpfad und Profilanlage erfolgreich. Alle acht Originale stimmen mit SHA-256-Manifest überein. |
| W5 | Isoliertes CI und lokale Vorschau eingerichtet. Ausstehend sind die Prüfung gegen die spätere gehostete Konfiguration und die abschließende Datenschutzprüfung der Pflichtnamen. Im Umzugskatalog steht noch kein aktuell bestätigter Artikel. |
| W6 | Merge, Live-Veröffentlichung und produktive Migration erfordern Endabnahme. |

Die Anschlussprüfung für Draft-PR #312 hat alle 16 grünen Workflows auf dem Ausgangscommit `fbc0279` bestätigt. Danach wurden die Registrierungsdaten aus den Auth-Zugriffstokens entfernt. Die isolierte PostgreSQL-Prüfung und der echte GoTrue-Bestätigungsablauf prüfen die Änderung. Der Supabase-Abgleich ergab keine getrennte gehostete Toolya-Testumgebung.

[Weltbeschreibung und Gestaltung](TOOLYA-UNIVERSE-WORLD-BIBLE.md) · [Abnahme, Vorschau und offene Punkte](TOOLYA-UNIVERSE-ABNAHME.md)
