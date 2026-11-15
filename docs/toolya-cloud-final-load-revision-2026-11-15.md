# Toolya Cloud-only – Cloud-Version nach abschließendem Laden prüfen

Datum: 2026-11-15; Branch: `feature/toolya-connect-phase-b`.

## Änderung
Bei gleichzeitig vorhandenen Cloud- und Gerätedaten wird nach der ausdrücklichen Prüfung und dem Backup die erneut geprüfte Cloud-Revision gespeichert. Nach `controller.load()` muss die geladene Revision weiterhin übereinstimmen. Bei Abweichung wird der Controller invalidiert und der Bootstrap abgebrochen. Damit ist ein Versionswechsel zwischen dem zweiten `inspect()` und dem endgültigen Laden erkennbar.

## Minimalprüfung
Gezielter isolierter Race-Test mit Stub-Repository/Controller: Revision 1 geprüft, Revision 2 geladen. Erwartete Ablehnung und Controller-Invalidierung bestätigt. Keine produktiven Daten, keine DB-Änderung, kein vollständiger Node-/CI-/Browser-Lauf.

## Status
Code im Featurebranch committed. Kein Merge, kein Deployment.
