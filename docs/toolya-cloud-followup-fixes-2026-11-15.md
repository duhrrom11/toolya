# Cloud-only – weitere Fehlerbehebung und Teststatus

Stand 2026-11-15, Branch `feature/toolya-connect-phase-b`.

## Änderungen
- SQL-Entwurf `docs/isolated-toolya-revision-rpc.sql`: **kritischen Fehler korrigiert**. Beim UPDATE wurden `RETURNING`-Werte zuvor in die OUT-Parameter `data,revision` statt in die geprüften internen Variablen `v_data,v_revision` geschrieben. Dadurch hätte jeder erfolgreiche UPDATE-Versuch anschließend einen Konflikt gemeldet. Nun sind INSERT und UPDATE symmetrisch.
- SQL-Kommentar und `updated_at`-Zuweisung an das tatsächlich lesend geprüfte Schema (`timestamp without time zone`) angepasst.
- Controller-/Backup-Testdoubles verwenden jetzt integer-Revisionen statt der alten String-Zeitstempel.
- Controller verhindert reentrante Mutation während der synchronen Transformationsphase; Regressionstest ergänzt.
- Autokosten- und Haushaltsbuchoberfläche: `SIGNED_IN` derselben Benutzer-ID wird nicht mehr automatisch als Kontowechsel gewertet; tatsächlicher Kontowechsel und Logout sperren weiter die private Oberfläche.

## Testgrenzen
- Vorangegangene fünf isolierte Modultests wurden ausgeführt und bestanden (siehe `toolya-cloud-isolated-validation-2026-11-15.md`).
- **Nach den jetzigen Änderungen wurde kein neuer vollständiger Node-Testlauf durchgeführt.** Es liegt kein verifizierter GitHub-Actions-Run vor.
- Keine isolierte Supabase-Instanz wurde erstellt. `toolya-staging` wird nicht als sichere, beschreibbare Testumgebung vorausgesetzt. Es wurde keine SQL-Änderung an irgendeiner Datenbank ausgeführt.

## Release-Blocker
1. Eigenständige, ausdrücklich als Testprojekt ausgewiesene Supabase-Instanz mit isolierten Testnutzern und eigenem Schema.
2. SQL-RPC-Integration und RLS-/Konkurrenztests, einschließlich erfolgreichem UPDATE, Fehlkonflikt, gleichzeitiger Erstübernahme und Fremdkonto.
3. Node-Test-Suite aus echtem Checkout und Browser-E2E für beide Werkzeuge.
4. Überprüfung der Migration/Importe bei Kontowechsel während modaler Bestätigungen.
5. Prüfung, ob alle zwölf Werkzeuge Cloud-only sind, bevor eine Cloud-only-Produktfreigabe erfolgt.

Keine Änderung an `main`, keine Produktivdatenmutation, kein Merge, kein Deployment.
