# Toolya Cloud-only – Auth-Gate Regression und CI-Erweiterung

Datum: 2026-11-15. Branch: `feature/toolya-connect-phase-b`.

## Fehlerbehebung
`requireVerifiedUser` in `shared/toolya/cloud-auth-gate.mjs` behandelte bislang Supabase-`getUser()`-Fehler (etwa Netzwerkprobleme) genauso wie eine tatsächlich fehlende Anmeldung. Damit landeten technische Auth-Fehler im `onUnauthorized`-Zweig. Jetzt wird ein Auth-Prüffehler mit separater Meldung und `cause` geworfen; `createCloudOnlyGuard` leitet ihn an `onError` weiter. Anonyme und fehlende Sessions bleiben gesperrt.

## Tests
Neue Datei `tests/cloud-auth-gate.test.mjs` mit drei Testfällen:
1. Registrierter Nutzer akzeptiert; anonyme und fehlende Sessions abgewiesen.
2. Auth-Servicefehler als `onError`, nicht als `onUnauthorized`; Subscription bei Dispose abgemeldet.
3. Ausstehende Autorisierung nach `dispose()` darf den Gate-Zustand nicht wieder öffnen.

**3/3 Testkörper** mit dem aktuellen Branch-Code im isolierten JavaScript-Harness bestanden. Der Workflow `.github/workflows/cloud-only-tests.yml` enthält nun zusätzlich `tests/cloud-auth-gate.test.mjs`. Dies belegt noch keinen GitHub-Actions-Erfolg und ist kein offizieller Node-Testlauf.

## Sicherheitsstatus
Read-only-Abfrage im Schema `toolya_test`: 0 Testdatensätze; `anon` und `authenticated` ohne dauerhafte Schema-USAGE. Keine SQL-Schreiboperationen, keine produktiven Datenänderungen, kein Merge und kein Deployment.

## Offen
Vollständiger CI-/Node-Lauf, Browser-E2E, signierte Supabase-Sessions und parallele PostgreSQL-Verbindungen.
