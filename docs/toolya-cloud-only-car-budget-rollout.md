# Cloud-only rollout gate – Autokosten und Haushaltsbuch

## Implementierungsstand

`shared/toolya/cloud-repository.mjs` stellt eine **noch nicht eingebundene** Supabase-Repository-API bereit:
- `read()`: verifiziertes `auth.getUser()`, RLS-gebundener `user_data`-Snapshot mit Revision.
- `save(payload, expectedRevision)`: kein lokaler Fallback; INSERT nur bei `null`-Revision; UPDATE nur mit exakter `updated_at`-Revision. Ergebnis wird auf Benutzer/Werkzeug/Revision/Payload geprüft.
- Konflikte und Verbindungsprobleme führen zu Fehlern, nicht zu einer lokalen Erfolgsmeldung.

**Keine Produktivfreigabe:** Die bisherige Opt-in-Cloud-Bridge ist noch aktiv. `saveData` in Autokosten und Haushaltsbuch schreibt weiterhin synchron lokal und meldet lokalen Erfolg. Eine direkte Umschaltung auf das neue asynchrone Repository würde die bestehenden synchronen Aufrufstellen und ihre Return-Value-Verträge brechen.

## Erforderliche Umstellung der beiden Tools

1. Alle `saveData`-, `saveBudgets`-, `saveGoals`-Aufrufstellen und Event-Handler auf asynchrone Cloud-Transaktionen inventarisieren. Keine UI als erfolgreich markieren, bevor `await repository.save(...)` bestätigt ist.
2. Nach verifizierter Anmeldung zunächst Cloud-Snapshot laden. Bei vorhandenem lokalem Altbestand einen **nicht-destruktiven Migrationsdialog** zeigen. Kein automatisches Zusammenführen oder Überschreiben.
3. Einmalige Migration: lokalen Bestand exportierbar sichern, Cloud-Ziel mit Revision lesen, Nutzerfreigabe, Datenvalidierung, CAS-Upload, anschließendes Cloud-Readback, Migrationsprotokoll. Lokalen Altbestand bis zur ausdrücklichen Freigabe erhalten.
4. Jede Änderung auf Grundlage der zuletzt geladenen Revision durchführen. Bei CAS-Konflikt neu laden und Nutzereingabe erhalten; niemals blind überschreiben.
5. Haushaltsbuch-Bundle (`entries`, `budgets`, `goals`) immer vollständig und schema-validiert aktualisieren; keine separaten veralteten Snapshots zurückschreiben.
6. Offline und Auth-Fehler: keine Cloud-Erfolgsmeldung; Eingaben dürfen für eine manuelle Wiederholung erhalten bleiben, aber nicht als dauerhaft gespeichert gelten.
7. Toolya Connect erst auf einer transaktionalen, serverseitig idempotenten Transferoperation freischalten. Ein normales `read`/`save`-Paar ist **keine** atomare Übertragung zwischen zwei Werkzeugen.
8. Testmatrix in isolierter Umgebung: zwei Tabs/Geräte, Konto-Wechsel, Offline, Session-Ablauf, Konflikte, wiederholter Import, Migration mit vorhandener Cloud, leere Daten, beschädigte lokale Daten, Datensatzgrößen, RLS.

## Abnahmebedingungen

- Alle persistierenden Aktionen gehen ausschließlich über die verifizierte Cloud-API.
- Bestehende Nutzer verlieren keine Daten; Migration ist nachvollziehbar und wiederaufnehmbar.
- Weder Client noch UI können andere Nutzer lesen/schreiben; RLS unabhängig geprüft.
- Browser- und Integrationstests bestehen; keine produktiven Testdaten.
- Erst danach alten lokalen Schreibpfad deaktivieren und auf die anderen Tools übertragen.

Status: Entwicklungsartefakt. Keine SQL-Migration, kein Deployment, keine Änderungen an `main`.
