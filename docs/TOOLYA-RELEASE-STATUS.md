# Toolya Release – 14.11.2026

Ziel: https://toolya.app, Repository duhrrom11/toolya, PR #9.

Nachlass-Migration und estate-emergency v1 aktiv. RLS/EXECUTE-Rechte geprüft. Mail-Secrets nach Nutzereinrichtung erkannt: schreibfreier Live-Health-Check ready=true, notifications=true, mailProvider=brevo. Dies bestätigt Konfiguration, keine tatsächliche Mailzustellung. Keine Testalarme oder Testmails ausgelöst. Minütlicher autorisierter Outbox-Worker estate-mail-delivery-v2 aktiv. Frühere Secret-/Bestätigungsblocker in der historischen Roadmap sind damit erledigt.

Letzte vollständige CI für f33d26e9 erfolgreich: https://github.com/duhrrom11/toolya/actions/runs/43621213299 und https://github.com/duhrrom11/toolya/actions/runs/43621213313 . Code unverändert zu geprüftem a1db13a4; Folgeänderungen dokumentarisch.

Nächster Release-Schritt: Merge und Pages-Deployment, anschließend öffentliche Routen/Assets prüfen. Erst nach tatsächlichem Deployment als live abgeschlossen kennzeichnen.
