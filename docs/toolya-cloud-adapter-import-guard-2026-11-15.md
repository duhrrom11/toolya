# Toolya Cloud-only – Ungeschützten Adapter-Import entfernt

Datum: 2026-11-15. Branch: `feature/toolya-connect-phase-b`.

## Änderung
`shared/toolya/cloud-tool-adapters.mjs` stellte `importBackup(snapshot)` bereit, das direkt `controller.replace(snapshot)` aufrief. Diese öffentliche Adaptermethode umging den verpflichtenden Ablauf mit Datensicherung und doppelter Bestätigung in `confirmCloudReplacement`. Der ungeschützte Einstiegspunkt wurde entfernt.

## Minimale Prüfung
Aktueller Branch-Code geprüft: Die Adaptermethode `importBackup` ist nicht mehr vorhanden; die regulären Speicheradapter bleiben erhalten. `tools/car/index.html` und `tools/budget/index.html` rufen für den Cloud-Import weiterhin `confirmCloudReplacement` auf und verwenden den entfernten Adapter-Einstiegspunkt nicht. Keine vollständigen Node-, Browser- oder CI-Tests durchgeführt.

## Status
Codeänderung im Featurebranch committed. Keine Datenbankänderungen, kein Merge, kein Deployment, keine produktiven Daten verändert.
