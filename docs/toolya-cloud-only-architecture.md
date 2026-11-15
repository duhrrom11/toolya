# Toolya Cloud-only – Architektur und sichere Umstellung (Entwicklungsbranch)

Status: **Entwurf, nicht produktionsreif.** Keine Migration auf der produktiven Datenbank ausgeführt; keine Veröffentlichung. Die lokale Connect-v1-Übertragung wurde im Branch deaktiviert.

## Verifizierte Bestandsaufnahme (2026-11-15)

- GitHub-Pages-Frontend mit 12 Tool-Kacheln auf `index.html`.
- Werkzeuge: `wishes`, `budget`, `moving`, `plants`, `housemates`, `estate`, `car`, `pet-health`, `parking`, `loans`, `meters`, `baking`.
- Startseite: bestehende Supabase-Auth mit Registrierung, Passwort-Anmeldung, Passwort-Reset und Auth-Status; bisher auch Favoriten und Backup im lokalen Speicher.
- Autokosten: `kfz_tracker_pro_v3` (cars/events/tires) und Cloud-Bridge `autokosten-reifenwechsel`.
- Haushaltsbuch: `kassenbon_data`, `budgetbuch_budgets`, `budgetbuch_goals` als Bundle `haushaltsbuch-kassenbon`.
- Weitere klassische Tools nutzen teils `helferlein-cloud-migration.js` und `helferlein-cloud-store.js`; diese sind derzeit **Opt-in** und schützen bestehende lokale Daten vor Überschreiben.
- Wishlist ist Sonderfall: `tools/wishes/index.html` leitet auf `public.html` um. Öffentliche Wunschlisten, Geschenkreservierungen und geteilter Zugriff brauchen gesonderte Rechte.
- WG-Organisator hat eigene Mitgliedschafts-/Freigaberegeln; nicht auf simples `user_id`-RLS reduzieren.
- Digitaler Nachlass verwendet eine separate, verschlüsselte Tresorlogik und einen Zugang für verifizierte Personen. Keine Migration in `user_data` oder Connect ohne eigenständigen Sicherheitsreview.
- `public.user_data`: `(user_id,tool)` unique, RLS SELECT/INSERT/UPDATE/DELETE mit `auth.uid()=user_id`. Ein Snapshot pro Nutzer und Werkzeug; Revision via `updated_at`.

## Verbindliche Produktregeln

1. Öffentliche Landingpage und Auth-/Passwort-Wiederherstellungsseiten bleiben erreichbar; private Tool-Aktionen erfordern eine **serverseitig verifizierte** Supabase-Identität.
2. Nutzer sehen keine Wahl „lokal oder Cloud“; Cloud ist alleinige persistente Quelle. Temporärer Cache ist zulässig, aber nicht als bestätigte Speicherung.
3. Kein Tool schreibt neue unabhängige Nutzerdaten nur in `localStorage`. Bei fehlendem Netz: schreibgeschützte Ansicht oder explizit als **nicht gespeichert** gekennzeichnete Eingabe; niemals Erfolg behaupten.
4. Historische lokale Daten nicht löschen, bevor ein nachvollziehbarer Import mit Benutzerfreigabe und bestätigtem Cloud-Stand erfolgt ist.
5. Konto-/Mitgliedschafts-RLS, eindeutige Transferidentitäten und serverseitige Autorisierung sind Pflicht.
6. Öffentliche/teilbare Funktionen (Wishlist, WG-Einladungen, Nachlass-Berechtigte) erhalten dedizierte, minimal berechtigte Routen; „alle Tools nur nach Anmeldung“ bedeutet nicht, dass öffentliche Marketing- oder ausdrücklich freigegebene Share-Links blind gesperrt werden.
7. Datenschutz- und FAQ-Aussagen erst **mit** tatsächlicher produktiver Migration aktualisieren.

## Zielmodule

- `shared/toolya/auth-gate.mjs`: `getUser()` bei Start, Login-Weiterleitung, Auth-Änderungsbehandlung, Konto-Wechsel; UI erst nach bestätigter Identität freigeben. Nicht nur CSS/Client-Routing: Datenzugriff muss RLS/Serverprüfung durchsetzen.
- `shared/toolya/cloud-repository.mjs`: per-Tool Repository, schema-validierte Snapshots, CAS/Versionierung, explizite Save-Ergebnisse, Konfliktauflösung.
- `shared/toolya/connect/core.mjs`: Aktionen und Ereignisse, serverseitige, nutzergebundene Transfers.
- `shared/toolya/connect/adapters/car.mjs` und `budget.mjs`: Datenmapping, positive Centbeträge, eindeutige Quellreferenz, keine Belegbilder in Connect.
- `shared/toolya/migration-assistant.mjs`: einmalige lokale Datenübernahme nach Anmeldung mit Export/Backup, Preview, Cloud-Zielprüfung und Bestätigung.

## Datenbankentwurf (noch **keine** SQL-Migration erzeugt)

- `connect_rules`: `id uuid`, `user_id uuid`, `source_tool`, `target_tool`, `action`, `mode`, `enabled`, Zeitstempel; Unique je (user,source,target,action).
- `connect_transfers`: `id uuid`, `user_id uuid`, `source_tool`, `source_id`, `target_tool`, `action`, `source_revision`, `target_id`, `status`, Zeitstempel; Unique je (user,source,source_id,target,action). Keine kompletten Belege.
- RLS mit `TO authenticated` und `(select auth.uid())=user_id`, für UPDATE zusätzlich `WITH CHECK`; Statusübergänge dürfen nicht vom Browser frei manipulierbar sein.
- **Transaktionsproblem:** Das aktuelle `user_data`-JSON-Snapshot-Modell ist nicht automatisch kompatibel mit atomaren Connect-Transfers. Erst einen serverseitigen CAS-/RPC-Weg oder normalisierte Budgetbuchungen designen; Transfer und Zielbuchung in **derselben DB-Transaktion** committen. Kein paralleler Browser-Write auf den Snapshot.
- Migration erst über verifizierte Supabase-CLI und `supabase migration new` erzeugen, isoliert prüfen, versioniert committen; **nicht** gegen Produktion anwenden.

## Schrittfolge und Sicherheits-Gates

A. Vollständige Tool-Matrix erstellen: Auth-Quelle, localStorage-Keys, Cloud-Schema, Migrationsstand, Spezialrechte, anonyme/öffentliche Routen. Je Tool auch Backup/Restore, Offline und Seitenwechsel prüfen.

B. Cloud-Repository + Auth-Gate in isolierter Entwicklungsumgebung, mit Testkonten und ohne Produktiv-Testdaten. Login-/Logout- und Passwort-Reset-Fälle abdecken. Erst nach Tests schrittweise in alle zwölf Tools integrieren.

C. Für jeden Tool-Datentyp: lokalen Altbestand nach Nutzerfreigabe in Cloud übernehmen. Vorher Export anbieten; Cloud-Ziel prüfen; keine stille Überschreibung; Bestätigung erst nach erfolgreichem Cloud-Readback; lokale Daten danach zunächst als Backup erhalten.

D. Tool-spezifische Cloud-Write-Pfade umstellen, Opt-in-Bridge schrittweise entfernen. Nach erfolgreicher Speicherung werden Daten auf anderen Geräten verfügbar. Kein verdeckter Fallback auf lokale Persistenz.

E. Connect-Tabellen/RPC mit transaktionalem Idempotenzschutz und RLS implementieren; Car→Budget erst nach erfolgreicher Cloud-Only-Umstellung dieser beiden Tools freischalten.

F. Sonderfälle Wishlist/WG/Nachlass separat prüfen und mit ihren Share-/Tresorberechtigungen migrieren. Nachlass-Geheimnisse nicht unverschlüsselt zentralisieren.

G. Tests: Zugriff ohne Session, Session-Ablauf, Konto-Wechsel, zwei Tabs, zwei Geräte, Offline/Timeout, CAS-Konflikt, Backups, Importabbruch, RLS/IDOR, Freigabe-/Einladungs-Links, Accessibility, CSP, Mobilgeräte.

H. Vor Produktivfreigabe: Migrationen, Sicherheitsadvisor, Backups/Rollback, Datenschutztexte, schrittweise Aktivierung und Monitoring.

## Release-Blocker

- Die zwölf Tool-Speicherpfade sind **nicht** alle auf Cloud-only umgestellt.
- Kein serverseitiger Connect-Transfer, keine transaktionale Buchung, keine neue Migration.
- Keine End-to-End-/Browser-Tests oder Sicherheitsfreigabe.
- Keine Änderung an `main`, produktiver Supabase-Datenbank oder GitHub-Pages-Deployment.
