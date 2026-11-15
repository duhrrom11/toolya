# Toolya Cloud-only – Konto nach abschließendem Laden prüfen

Datum: 2026-11-15; Branch: `feature/toolya-connect-phase-b`.

## Änderung
`prepareCloudTool()` prüft nach dem abschließenden `controller.load()` erneut den verifizierten Benutzer gegen `review.userId`. Bei Authentifizierungsfehler oder Kontowechsel wird der Controller invalidiert und der Bootstrap abgebrochen. Die Prüfung ergänzt die Authentifizierung der Repository-Aufrufe und die UI-seitige abschließende Kontoprüfung.

## Minimalprüfung
Isolierter Test mit `review.userId = user-a` und abschließend verifiziertem `user-b`: erwarteter Abbruch und Controller-Invalidierung bestätigt. Kein offizieller Node-/CI-/Browser-Lauf.

## Status
Code im Featurebranch committed. Keine Datenbankänderungen, kein Merge, kein Deployment.
