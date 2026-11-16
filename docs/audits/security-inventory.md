# Toolya: technische und Supabase-Sicherheitsbestandsaufnahme

Stand: 16.11.2026. Quellcodebasis: `28f73ac3181f823cb5fc867ba8673c8461ea3fa9`. Ziel: `yheogmeaosuigyaxkwth` (Projektname „toolya-staging“, tatsächlich in den produktiven Clients referenziert). Nur lesende Katalogabfragen, Advisory-Abfragen und Codeprüfung; keine Nutzerinhalte gelesen, keine Testdatensätze, Alarme oder Mails erzeugt, keine Datenbankänderungen.

## Gesamtbewertung und Grenzen

In diesem Prüfumfang ist kein kritischer Datenzugriff ohne Schutz nachgewiesen. Das ist keine vollständige Sicherheitsfreigabe. RLS ist auf allen 32 Tabellen in `public` und allen vier Tabellen in `estate_private` aktiv. Die privaten Nachlass-Tabellen sind weder für `anon` noch `authenticated` direkt lesbar. Die zehn vom Advisor gemeldeten, für angemeldete Nutzer ausführbaren `SECURITY DEFINER`-Funktionen sind nicht automatisch Sicherheitslücken: alle zehn haben einen leeren `search_path`, verweigern `anon` die Ausführung und enthalten Identitäts-, Eigentums- oder Sichtbarkeitsprüfungen. Mehrbenutzer-/Rennbedingungen wurden hier nicht produktiv erprobt.

Bestätigt ist eine Diskrepanz zwischen WG-Speichercode und aktuellen Datenbankrechten. Datenschutz und Lieferkettenabsicherung benötigen weitere Arbeit. Die Sicherheitswarnungen müssen nach ihrer Bedeutung bearbeitet werden; pauschales Entfernen von RPC-Rechten würde bestehende Funktionen beschädigen.

## Prüfgrundlagen

| Prüfung | Ergebnis | Evidenzgrad |
|---|---|---|
| Tabellen/RLS | `public`: 32/32 mit RLS; `estate_private`: 4/4; `toolya_private`: 1/2 | Bestätigt, `pg_class`/`pg_namespace` |
| Tabellen ohne Policies | Acht vom Sicherheitsadvisor genannte Anwendungstabellen sind für `anon`/`authenticated` nicht direkt lesbar | Bestätigt, `pg_policy`, `has_table_privilege` |
| Private Tabelle ohne RLS | `toolya_private.amazon_bulk_sources`: keine RLS, kein direktes SELECT für beide Clientrollen | Bestätigt; privates Schema und tatsächliche exponierte Schemas separat prüfen |
| Views | Keine Views in `public`, `estate_private`, `toolya_private` | Bestätigt, `pg_class` |
| Nachlass-RPC | `public.estate_release_v2`: `SECURITY DEFINER`, leerer `search_path`, EXECUTE für anon und authenticated gesperrt | Bestätigt, `pg_proc`/`has_function_privilege` |
| Snapshot-RPC | `public.toolya_save_snapshot`: `SECURITY INVOKER`, leerer `search_path`, nur authenticated von beiden Clientrollen ausführbar | Bestätigt |
| Edge Functions | amazon-scrape v20 / amazon-wishlist-scrape v13: JWT-Gateway aktiv. estate-emergency v6 / admin-stats v20: eigene Authentifizierung im veröffentlichten Handler | Bestätigt, `list_edge_functions` und `get_edge_function` |
| Nachlass-Handler | `auth.getUser`, bestätigte E-Mail, Session-ID, frische Passwortbestätigung beim Stoppen, Mail-Konfigurationssperre bei Alarm, begrenzter Request-Body | Bestätigt im veröffentlichten Handler; E-Mail-Zustellung nicht geprüft |
| Statistik-Handler | `auth.getUser`; feste Adminidentität plus E-Mail plus serververwaltetes `app_metadata.toolya_stats_admin` | Bestätigt im veröffentlichten Handler; keine Adminmetriken abgerufen |
| Storage | Tabellen mit RLS, keine Policies in `storage` | Bestätigt im Katalog; konkrete Uploadfunktionen/Bucketkonfiguration nicht vollständig geprüft |
| Health Advisor | Keine Meldungen | Bestätigt zum Abfragezeitpunkt; keine umfassende Verfügbarkeitsmessung |
| Browser-Clientziel | Durchsuchte produktive Clients referenzieren das Toolya-Projekt, kein ehemaliges Helferlein-Projekt gefunden | Bestätigt im aktuellen Quellcode; keine historische Git-Geheimnisprüfung |

## Maßnahmen

| ID | Kategorie/Priorität | Ist → Soll und Empfehlung | Aufwand/Abhängigkeit | Risiko | Status/Nachweis |
|---|---|---|---|---|---|
| SEC-01 | Stabilität, nach P3; bei bestätigtem Produktionsausfall vorziehen | `saveSecureWg` schreibt `.update({payload, updated_at})`, `authenticated` besitzt aktuell auf keiner `wg_spaces`-Spalte UPDATE. Funktionierendes Speichern mit unveränderlichen Identitätsspalten herstellen. Nur `payload` und `updated_at` freigeben, nachdem isolierte Eigentümer-/Mitglieder-/Fremdnutzer-/CAS-Tests die konkrete Lösung bestätigen. Niemals pauschal Tabellen-UPDATE erteilen. | 2–4 h; isolierte PostgreSQL-Umgebung, Migration/Rollback | Hoch bei falscher Rechteerweiterung; keine Produktivmutation zur Reproduktion ausgeführt | Offen; Code `tools/housemates/index.html:1164`, Live `has_column_privilege` für id/owner_id/payload/updated_at jeweils false |
| SEC-02 | Datenschutz/P3 | `wishlist_profiles` ist mit SELECT `USING (true)` öffentlich, einschließlich Vorname, Nachname, Land, Bio und Avatar, unabhängig von einer veröffentlichten Liste. Gewünschte Öffentlichkeit und Einwilligung mit Profil-UI/Datenschutz abgleichen. Ggf. Eigentümersicht und gezielte öffentliche Projektion trennen; vorhandene öffentliche Listen erhalten. | 3–6 h; Produktentscheidung aus tatsächlichem Veröffentlichungsablauf, rechtliche Prüfung | Mittel; derzeitige Namensöffentlichkeit ist teilweise ausdrücklich gewollt, daher kein pauschaler Datenleckbefund | Offen; Live Policy und Spaltenmetadaten, keine Profilinhalte gelesen |
| SEC-03 | Sicherheitsabsicherung, nach P3 | Leaked Password Protection laut Advisor deaktiviert. Verfügbarkeit/Tarif und Auswirkungen prüfen, dann einschalten, ohne Passwörter oder bestehende Konten zu verändern. | 0,5–1 h; Auth-Konfiguration/Tarif | Niedrig bis mittel | Offen; Advisor `auth_leaked_password_protection` |
| SEC-04 | Sicherheitsabsicherung, nach P3 | `pg_net` liegt im Schema public. Installationsanforderungen/Abhängigkeiten und unterstützten Umzug prüfen; Scheduler und Mailversand nicht durch spontanen Schemawechsel beschädigen. | 1–3 h; Extension-/Cron-Abhängigkeiten, Rollback | Mittel | Offen; Advisor `extension_in_public` |
| SEC-05 | Sicherheit/Wartbarkeit, nach P3 | Zehn angemeldeten Nutzern zugängliche SECURITY DEFINER-RPCs werden gewarnt. Berechtigte Nutzung und minimale Rechte je RPC dokumentieren, isolierte Fremdnutzer-/anonyme Tests ergänzen; keine pauschale Revocation. | 4–8 h; isolierte Fixtures, aktuelle DB-Definitionen | Mittel bis hoch bei falscher Einschränkung | Offen; Definitionen statisch geprüft, kein ausnutzbarer Zugriff nachgewiesen |
| SEC-06 | Sicherheit/Wartbarkeit, nach P3 | Private `amazon_bulk_sources` ohne RLS. Exponierte Data-API-Schemas und Schema-USAGE/EXECUTE-Pfade prüfen; RLS als zusätzliche Absicherung erwägen, funktionierende privilegierte Importpfade bewahren. | 1–2 h | Niedrig bis mittel | Offen; keine direkte Leseberechtigung für Clientrollen |
| SEC-07 | Performance, nach P3 | Advisor meldet elf Fremdschlüssel ohne abdeckenden Index, zwei Fälle mehrerer permissiver SELECT-Policies und vier ungenutzte Indizes. Reale Abfragepläne/Last untersuchen; nur belegbar nützliche Indizes ergänzen. Ungenutzte Indizes nicht aufgrund kurzer Betriebszeit löschen. | 3–6 h; EXPLAIN ohne Nutzerinhalte, Workload | Niedrig bis mittel | Offen; kein nachgewiesener Performanceausfall |
| SEC-08 | Lieferkette/Performance, nach P3 | Homepage/WG laden Tailwind-CDN-Runtime; WG lädt Chart.js ohne feste Version, Tesseract nur auf Major festgelegt; öffentliche Wishlist lädt Supabase `@2` vom CDN. Versionen und lokale Produktionsassets vereinheitlichen, Lockfile und gegebenenfalls Integritätswerte nutzen. | 4–8 h; Build/Styles/Browservergleich | Mittel bei Styles-/API-Änderung | Offen; Script-Tags im Code |
| SEC-09 | Inhalte/P3 | Datenschutzerklärung behauptet weiterhin Firebase/Cloud Firestore beim digitalen Tresor, aktuelle Nachlass-Implementierung/CSP verwendet Supabase. Nach vollständiger Datenflussinventur faktisch korrigieren und wesentliche Rechtstextänderungen als prüfpflichtig kennzeichnen. | 2–4 h; vollständige Diensteliste | Rechtlich prüfpflichtig | Offen; `privacy.html:66`, `assets/estate-owner.js`, Estate-CSP |
| SEC-10 | QA/CI, nach P3 | Ein isolierter Estate-Workflow und Cloud-only-Workflow laufen nur auf historischem Featurebranch/manuell. Plattformworkflow testet Estate auf PostgreSQL 17, zusätzlicher Estate-Workflow PostgreSQL 16. Abdeckung konsolidieren und relevante PR-Trigger sicherstellen, ohne doppelte Volltests. | 2–4 h; CI-Inventar und bestehende Pflichtchecks | Mittel bei Verlust von Prüfungen | Offen; `.github/workflows/estate-postgres-integration.yml`, `cloud-only-tests.yml`, `mascot-release.yml` |

Advisor-Referenzen: [Passwortschutz](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), [Extension-Schema](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public), [privilegierte RPCs](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [Fremdschlüsselindizes](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys).

## Bewusste Einschränkungen / nächste Sicherheitsabnahme

- Keine vollständige Prüfung aller SQL-Funktionskörper und Transitivrechte, Auth-Einstellungen, API-exponierten Schemas, Buckets, Backups oder Wiederherstellbarkeit.
- Keine aktiven Angriffe, keine echten Fremdnutzerzugriffe, keine produktiven Schreibtests und keine Zustelltests. Alle Aussagen über ausstehende Funktionsprüfungen bleiben entsprechend eingeschränkt.
- Keine vollständige Überprüfung der Logredaktion, Datenspeicherfristen, Auftragsverarbeitungsverträge oder Rechtsgrundlagen.
- Der GA4-Code fordert Einwilligung vor dem Laden, reduziert URLs auf Origin/Pfad und schickt keine Formularinhalte im sichtbaren Implementierungspfad. Das ist Codeevidenz, kein in dieser Teilprüfung ausgeführter Netzwerknachweis.
- Sicherheitssensible Nachlass-Druck-/Übergabeseiten besitzen bewusst enge CSPs; Designharmonisierung darf sie nicht aufweichen oder vertrauliche Schlüssel in Analyseereignisse übertragen.

Nächste konkrete Aktion: SEC-01 isoliert reproduzieren und minimalen Spalten-Grant gegen Eigentümerwechsel absichern; P1-Designarbeit kann parallel zur lesenden Sicherheitsprüfung fortgesetzt werden.
