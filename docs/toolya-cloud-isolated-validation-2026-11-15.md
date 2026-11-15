# Toolya Cloud-only – isolierte Prüfung am 2026-11-15

Branch: `feature/toolya-connect-phase-b`. Kein Merge, kein Deployment, keine produktive Datenbankmutation.

## Projektisolation
Die Supabase-Projektliste enthält:
- `yheogmeaosuigyaxkwth` – Name `toolya-staging`, aber bereits für Toolya genutzt. **Nicht als schreibbare Testumgebung eingestuft.**
- `avapuibsidubuzxjtyld` – `Helferlein`, ebenfalls kein Testziel.

Es wurde **kein** neues Supabase-Projekt angelegt und keine SQL-DDL/DML ausgeführt.

## Read-only Schema-Audit (toolya-staging)
- `public.user_data` mit `id bigint GENERATED ALWAYS AS IDENTITY`, `user_id uuid`, `tool text`, `data jsonb`, `created_at/updated_at timestamp without time zone`.
- Unique-Index `(user_id,tool)` vorhanden.
- RLS aktiviert. `authenticated`-Policies für SELECT, INSERT, UPDATE (USING und WITH CHECK), DELETE auf `auth.uid()=user_id` eingeschränkt.
- Spalte `revision` fehlt; Funktion `toolya_save_snapshot` fehlt.
- Das SQL-Entwurfsskript wurde korrigiert: `revision`-Constraint wiederholbar; PL/pgSQL OUT-Variablen von internen RETURNING-Zielvariablen getrennt.

## Tatsächlich ausgeführte isolierte Modultests
Quellmodule wurden über den GitHub-Connector aus dem Featurebranch geladen, ihre ESM-Imports/Exports in einer temporären JavaScript-Ausführungsumgebung zu Funktionen umgewandelt und **ohne echte Datenbank** mit Mock-Repositories ausgeführt.

Ergebnis: **5 von 5 bestanden**
1. Asynchrone Controller-Mutation wird abgewiesen.
2. Bestätigte Speicherung und veraltete Revision werden korrekt behandelt.
3. RPC-Revisionsantwort und Kontowechsel werden geprüft.
4. Migration verlangt Bestätigung/Backup und erhält den lokalen Bestand.
5. Cloud-Backup-Import erfordert zwei Bestätigungen.

Einschränkungen: Dies sind gezielte Modultests im JavaScript-Isolat, **nicht** der vollständige `node --test`-Lauf und kein Browser- oder Postgres-Integrationstest. `node v22.16.0` ist im Container verfügbar, aber der GitHub-Checkout ist nicht über das Containernetz erreichbar. `psql`, Supabase CLI und Docker sind im Container nicht vorhanden. GitHub Actions hat keinen verifizierten erfolgreichen Run.

## Zusätzliche Änderungen
- `tools/car/index.html`: alte Backup-Dateien ohne `tires` erhalten ein leeres Reifenarray; ungültige Reifenstruktur wird abgewiesen.
- `tests/cloud-migration.test.mjs`: vier Regressionstests für Cloud-Bestand, explizite Zustimmung, Erhalt lokaler Daten und Fremdkonto-Schutz.
- GitHub Actions führt vier Testdateien aus.

## Noch offene Freigabesperren
1. Eine **explizit isolierte**, neu eingerichtete Supabase-Testinstanz bereitstellen; die beiden bestehenden Projekte nicht für schreibende Tests verwenden.
2. SQL-Entwurf in dieser Testinstanz mit echten Transaktionen/RLS/konkurrierenden Sitzungen validieren; PostgREST RPC-Signatur und GRANTs testen.
3. Node-Test-Suite auf einem echten Checkout ausführen, GitHub-Actions-Status prüfen.
4. Browser-Tests der beiden Toolseiten (Login, Auth-Wechsel, Offline, Import/Export, Bilder, mehrere Tabs).
5. Koordinierte Schema- und Client-Migration erst nach separater Freigabe planen.

**Kein SQL angewendet, keine produktiven Datensätze verändert, kein Merge, kein Deployment.**
