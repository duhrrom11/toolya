# Toolya Cloud-only – Fortsetzung: Snapshot-Validierung und CI-Status

Datum: 2026-11-15. Branch: `feature/toolya-connect-phase-b`.

## Änderungen
- `shared/toolya/cloud-repository.mjs`: zyklische JavaScript-Objekte und BigInt-Payloads erzeugen jetzt eine verständliche Validierungsfehlermeldung statt eines rohen `JSON.stringify`-Fehlers. Ein RPC-Aufruf erfolgt in diesen Fällen nicht.
- `tests/cloud-repository.test.mjs`: Regressionstest für beide fehlerhaften Snapshot-Typen ergänzt.

## Tatsächliche Tests
- Sechs Repository-Testkörper aus dem Branch im isolierten JavaScript-Harness ausgeführt: **6/6 bestanden** (einschließlich Multibyte-UTF-8-Grenzen, Zyklus und BigInt). Das ist kein vollständiger Node-Testlauf.
- GitHub Commit Combined Status für Commit `a30d30ec0b94243ae0a44521ef9388a0afd89c6a` lieferte **keine Statuschecks**. Damit ist kein erfolgreicher GitHub-Actions-Lauf belegt.
- Read-only-Datenbankprüfung im Schema `toolya_test`: 0 Datensätze, weder `anon` noch `authenticated` mit dauerhafter Schema-USAGE.
- Statische Prüfung der Auth-Listener und Bootstrap-Gates in beiden Toolseiten fortgeführt. **Keine echte Chromium-Browser-E2E-Sitzung und keine signierte Supabase-Session ausgeführt.**

## Sicherheitsstatus
Keine SQL-Schreiboperationen in diesem Schritt, keine Änderungen außerhalb des genehmigten Testschemas, kein Merge und kein Deployment.

## Offen
Vollständige Node- und Browser-E2E-Ausführung, unabhängige parallele PostgreSQL-Verbindungen und signierte Auth-Integration. Bei GitHub Actions Status-/Run-Zugriff prüfen, warum die CI-Checks nicht sichtbar sind.
