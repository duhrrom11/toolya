# Cloud-only serverseitige Revisionen – isolierter Entwicklungsstand

Branch: `feature/toolya-connect-phase-b`, Stand 2026-11-15.

## Architektur
- Der alte clientseitige `updated_at`-Vergleich wurde im Cloud-Repository durch `rpc('toolya_save_snapshot')` ersetzt.
- Die RPC-Funktion ist `SECURITY INVOKER`, verwendet `auth.uid()`, prüft registrierte Anmeldung, validiert Toolname und JSON-Payload und schreibt mittels `UPDATE ... WHERE revision = expected` atomar mit `revision = revision + 1`.
- `INSERT ... ON CONFLICT DO NOTHING` verhindert das Überschreiben eines bereits existierenden Snapshots bei Erstübernahme.
- Die Funktion gibt die serverseitige integer-Revision zurück; der Client prüft die exakte Erhöhung und den JSON-Inhalt.
- Das SQL-Skript `docs/isolated-toolya-revision-rpc.sql` ist **nur für ein isoliertes Supabase-Testprojekt** vorgesehen und wurde **nirgends ausgeführt**.
- **Wichtig:** Der Featurebranch ist ohne diese Datenbankerweiterung nicht lauffähig. Nicht auf `main` mergen.

## Tests
- `tests/cloud-repository.test.mjs`: Mock-RPC, Create/Update, Duplicate-Insert, veraltete Revision, Kontowechsel.
- `tests/cloud-controller.test.mjs`: Controller-State und Fehler.
- `tests/cloud-backup.test.mjs`: Sicherungsfreigabe, Abbruch, Revisionswechsel.
- Workflow `.github/workflows/cloud-only-tests.yml` führt alle drei Dateien mit Node 22 aus.
- GitHub-Connector bietet keinen direkten Start für Push-Workflows; der verfügbare Commit-Run-Endpunkt filtert auf PR-Runs. Erfolgreiche CI-Ausführung **nicht nachgewiesen**.
- Lokale Checkout-Ausführung nicht möglich: github.com im Container nicht auflösbar. Keine isolierte Supabase-Instanz eingerichtet, keine SQL-Ausführung und kein echter Datenbank-Konkurrenztest.

## Noch zu erledigen vor Freigabe
1. SQL in einem **separaten Testprojekt** auf Basis eines geprüften Schema-Dumps anwenden und SQL-RLS/GRANTs, anonymen Zugriff, Konkurrenzzugriffe und JSONB-Readback prüfen.
2. **Wichtig:** SQL-Skript ist ein Entwicklungsentwurf: prüfen, ob vorhandene Constraint-Namen, `user_data`-Typen und RLS-Policies exakt zum Projekt passen. `revision`-Constraint bei Wiederholung idempotent gestalten.
3. GitHub-Actions-Run tatsächlich prüfen und Browser-E2E ausführen.
4. Auth-Event-Lifecycle, Bilder, lokale Bestandskonflikte, Backup-Download und Import im Browser prüfen.
5. Alle zwölf Werkzeuge erst nach vollständiger Umstellung freigeben; bisher nur zwei im Featurebranch angepasst.
6. Vor Release Supabase-Schemaänderung und Anwendung in einer koordinierten, rückrollbaren Reihenfolge planen; derzeit keine Produktivänderung erlaubt.

Keine Produktivdatenbankänderung, kein Merge, kein Deployment.
