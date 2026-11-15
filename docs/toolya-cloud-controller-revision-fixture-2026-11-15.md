# Toolya Cloud-only: Controller-Testdoppel und isolierte Sicherheitskontrolle

Datum: 2026-11-15. Branch: `feature/toolya-connect-phase-b`.

## Fehlerkorrektur
Das Test-Repository in `tests/cloud-controller.test.mjs` lieferte bei einer ersten Anlage ohne bestehenden Snapshot Revision **2** statt Revision **1**. Damit wich der Test von der echten PostgreSQL-CAS-Funktion ab. Korrigiert auf `revision === null ? 1 : revision + 1`, sodass Erstschreiben und Updates die gleiche Versionssemantik wie der SQL-RPC verwenden.

## Verifikation
- Alle **7 Controller-Testkörper** mit den aktuellen Featurebranch-Modulen im isolierten JavaScript-Harness ausgeführt: **7/7 bestanden**.
- Supabase `toolya-staging`: ausschließlich lesende SQL-Kontrolle von `toolya_test`: **0 Testdatensätze**; keine dauerhaften Schema-USAGE-Rechte für `anon` oder `authenticated`.
- Keine Datenbankänderung in diesem Schritt.
- Ein offizieller `node --test`- oder Browser-E2E-Lauf konnte nicht bestätigt werden; diese Prüfung ist kein Ersatz dafür.

## Offen
Signierte JWT- und Browser-E2E-Tests, parallele Datenbankverbindungen sowie ein bestätigter CI-Run. Keine Änderungen an bestehenden Tabellen oder Produktivdaten; kein Merge, kein Deployment.
