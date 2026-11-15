# Cloud-only hardening – Entwicklungsstand

Branch: `feature/toolya-connect-phase-b`. Keine Änderung an `main`, produktiver Supabase-Datenbank oder Deployment.

## Geänderte Implementierung
- `shared/toolya/cloud-controller.mjs`: defekte literale `\\n`-Sequenzen repariert (vorher Syntaxfehler im Modul).
- `shared/toolya/cloud-backup.mjs`: Cloud-Import verlangt zwei explizite Zustimmungen und bestätigten Export des bisherigen Cloud-Snapshots. Vor dem Write wird die Revision erneut geprüft. Bei Fehler kein stilles Überschreiben.
- `tools/car/index.html` und `tools/budget/index.html`: Backup-Importe nutzen den neuen Sicherungsablauf; Cloud-Speicherfehler und Kontoänderungen aktivieren eine sichtbare Sperre.
- `shared/toolya/cloud-tool-adapters.mjs`: wenn Cloud und lokale Altbestände gleichzeitig existieren, keine automatische Migration. Bestandskonflikt wird erklärt; lokale Sicherung und Bestätigung sind vor dem Laden erforderlich. Cloud bleibt autoritativ, lokaler Altbestand erhalten.
- `tools/car/index.html`: Tankereignis und aktualisierter Fahrzeugkilometerstand werden in demselben Snapshot gespeichert.
- `tests/cloud-backup.test.mjs`: Tests für Abbruch, fehlende Backup-Bestätigung, erfolgreiche doppelte Zustimmung und Revisionsänderung während Sicherung.
- `.github/workflows/cloud-only-tests.yml`: beide Node-Testdateien aufgenommen.

## Prüfergebnisse
- GitHub-Dateien/Commits erfolgreich geschrieben.
- GitHub-Connector `fetch_commit_workflow_runs` zeigt nur Pull-Request-getriggerte Runs. Leere Antwort ist **kein Nachweis**, dass Push-Workflows nicht liefen oder erfolgreich waren.
- GitHub-Repository ist aus dem isolierten Container nicht erreichbar (DNS-Auflösung für github.com fehlgeschlagen). **Keine tatsächliche Ausführung der Tests mit den committed Dateien bestätigt.**
- Kein Browser-E2E-Test, keine produktive SQL-Abfrage, keine produktiven Testdaten.

## Verbleibende Release-Blocker
1. Tests im echten Checkout mit `node --test tests/cloud-controller.test.mjs tests/cloud-backup.test.mjs` ausführen; Browser-E2E mit lokalem Supabase/Testprojekt.
2. Clientseitige `updated_at`-CAS-Revisionskontrolle durch serverseitig autorisierte atomare Revision ersetzen. Derzeit mögliche Timestamp-Kollisionen; keine verlässliche Multi-Device-Garantie.
3. Vorhandene Cloud- und Gerätedaten: bisher nur getrennte Sicherung und Entscheidung für Cloud; **kein interaktives Merge**. Eine Zusammenführung braucht eigene datensatzspezifische Konfliktlogik.
4. Download-Dialog kann nur die Bestätigung des Nutzers erfassen, nicht den erfolgreichen Dateisystem-Download beweisen. Vor destruktivem Import optional zusätzliche Cloud-Backup-Versionierung schaffen.
5. Browser-UX prüfen: Anmelde-Redirect, Auth-Events, Offline/Timeout, Bild-Uploads, 20-MB-Import, zwei Tabs, Wiederaufnahme nach Fehler.
6. Cloud-Readback nach jedem normalen Write und serverseitige Identitätsbindung/RLS in isolierter Umgebung testen.
7. Andere zehn Werkzeuge sind weiterhin nicht Cloud-only umgestellt.

## Sicherheitsgrenze
Alle Änderungen nur im Featurebranch; keine Migration/Änderung an der Produktivdatenbank, kein Merge, kein Deployment.
