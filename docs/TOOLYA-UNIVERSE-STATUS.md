# Toolya Universe – Entwicklungsstatus

Ausgangspunkt ist der Übergabe-Commit `88769b3` auf `feature/gamification-mascot-levels-v1`. Der frühere Browserprototyp mit 50 XP für Kartenklicks ist durch eine optionale kontogebundene Spielwelt ersetzt. Die zwölf kostenlosen Tools bleiben eigene Anwendungen. Die öffentliche Wishlist-Suche und vorhandene Wunschlisten-Links bleiben erreichbar.

| Etappe | Stand |
| --- | --- |
| W0 | Repository, bestehende Anmeldung, zwölf Toolrouten, Originalgrafiken, Shopmodule und Schema-Metadaten geprüft. |
| W1–W2 | Die Nebelinseln mit drei Regionen, zwölf Orten, einem Kapitel und drei Rätseln entworfen. Karten- und Versteckmotive erzeugt, optimierte Bilder und zwei Kostüme pro Figur integriert. |
| W3 | Gemeinsame Registrierung und Profil, optionaler Spieleinstieg, Versteck, Fundstücke, zwölf kontogebundene Meilensteine, private Wunschprofil-Ablage und freiwillige Rangliste im Branch. |
| W4 | Synthetische SQL-Prüfung mit zwei Migrationsanwendungen und zwölf Meilensteinen erfolgreich. Die Chromium-Vorschau lief auf Desktop und 320 Pixeln. 436 Node-Regressionen und elf gezielte Bestands-Browsertests erfolgreich. Echter lokaler GoTrue- und PostgreSQL-Durchlauf mit Pflichtnamen, E-Mail-Bestätigung, Rückkehrpfad und Profilanlage erfolgreich. Alle acht Originale stimmen mit SHA-256-Manifest überein. |
| W5 | Gehostete Migration, Kontotrennung, Spielstand und persönlicher Export geprüft. Die private HTTPS-Vorschau der Oberfläche ist erreichbar. Bestätigung und Passwort-Reset wurden im lokalen GoTrue-Test mit einer HTTPS-Rücksprungadresse geprüft. Offen sind die Freigabe der HTTPS-Weiterleitung im gehosteten Testprojekt, der anschließende Mailtest im Browser, der vollständige Produktionsschema-Export und die Entscheidung zu den Pflichtnamen. Im Umzugskatalog steht noch kein aktuell bestätigter Artikel. |
| W6 | Merge, Live-Veröffentlichung und produktive Migration erfordern Endabnahme. |

Alle 16 Workflows auf `d88a3c6` waren grün, einschließlich des JSON-Downloads in Chromium. Seit dem 23.11.2026 steht das getrennte Projekt `toolya-universe-acceptance` zur Verfügung. Dort ist der Export installiert. Die Prüfung bestätigte die Rechte für angemeldete Konten, die Sperre für Gäste und null verbliebene Testkonten. Der schreibgeschützte Abgleich im bestehenden Backend fand keine aktiven benutzerdefinierten Trigger auf `auth.users`. Alle 47 gefundenen Fremdschlüssel auf diese Tabelle verwenden Löschregeln ohne `RESTRICT` oder `NO ACTION`. Das Universe-Schema ist dort noch nicht eingerichtet. Die lokale Rückrollprobe bestätigte die Wiederherstellung der alten Registrierung ohne Verlust der Universe-Punkte. Der letzte Abruf des Umzugsartikels mit dem vorhandenen Amazon-Scraper ergab HTTP 503.

[Weltbeschreibung und Gestaltung](TOOLYA-UNIVERSE-WORLD-BIBLE.md) · [Abnahme, Vorschau und offene Punkte](TOOLYA-UNIVERSE-ABNAHME.md)
