# Toolya Rewards V1 – Pilotkonzept Umzugskisten

**Stand:** 23.11.2026 · **Status:** codebasierter Pilot-Audit und Implementierungsdesign, keine produktive Umsetzung.  
**Scope:** Ausschließlich Rewards-V1-Grundmechaniken XP, Kompetenzpunkte und Badges.  
**Quellen:** GitHub `main`, `tools/moving/index.html`, `shared/toolya/cloud-tool-adapters.mjs`, `shared/toolya/cloud-repository.mjs` und `shared/toolya/cloud-controller.mjs` am 23.11.2026.  
**Planungsbranch:** `planning/toolya-rewards-mystery-v1`. **Keine Änderungen an `main` oder produktiver Supabase-Datenbank.**

## 1. Nachgewiesener aktueller Speichervorgang

| Code-Stelle in `main` | Tatsächliche Funktion | Konsequenz |
|---|---|---|
| `tools/moving/index.html:709–735` – `saveBox()` | Prüft Standort und Kistenname, liest optional Foto und ruft `storeBoxData` auf | Buttonklick oder ausgefülltes Formular allein ist kein Erfolg |
| `tools/moving/index.html:738–760` – `storeBoxData()` | Baut eine neue Kiste mit `id: Date.now()` und sonstigen Angaben, hängt sie an `data.boxes`; ruft `saveData(data)` auf | Kisten-ID ist **clientgeneriert**, folglich kein vertrauenswürdiger Token |
| `tools/moving/index.html:753` | `if (!await saveData(data)) return;` | UI zeigt Abschluss erst nach bestätigtem Speicherrückgabewert |
| `tools/moving/index.html:591–609` – `saveData()` | Auth-UID wird validiert, danach `movingCloudController.replace(data)`; bei Erfolg Erfolgsnotice und `toolya:moving-saved` | Das vorhandene DOM-Event ist ein **generisches Speicherevent**, keine Kisten-Neuanlage-Bescheinigung |
| `tools/moving/index.html:820–849` – `updateBox()` | Bearbeitet vorhandene Kiste und verwendet **dieselbe** `saveData()`-Routine | `toolya:moving-saved` würde auch beim Editieren feuern; darf nicht für XP gelten |
| `tools/moving/index.html:851–862` – `deleteBox()` | Löscht eine Kiste und ruft wieder `saveData()` auf | Löschvorgang darf nie XP geben |
| `tools/moving/index.html:547–583` – `movingCloudBoot()` | Registrierte Auth erforderlich, Accountwechsel wird geprüft, Cloud-Migration verlangt Zustimmung und Sicherung | Einfache Altbestand-/Import-Aktionen sind keine neuen qualifizierten Erfolge |
| `shared/toolya/cloud-tool-adapters.mjs:14–29,65–89` | Cloud-Controller und Legacy-Migration; Adapter für `umzugskisten-inventar` | Gemeinsame Cloud-Abstraktion, Rewards-Bindung nicht pauschal in allen Tools aktivieren |
| `shared/toolya/cloud-repository.mjs:51–88` | `user_data` wird nach `user_id` und Tool gelesen; Speichern via RPC `toolya_save_snapshot(p_tool,p_data,p_expected_revision)`, mit Revision und Payload-Abgleich | Cloud-Speicherung ist **bestätigt**, aber die fachliche Herkunft der **JSON-Payload bleibt vom Client beeinflussbar** |
| `shared/toolya/cloud-controller.mjs:71–96,148–150` | `replace` prüft Version und Snapshotvalidierung, `createMovingCloudController` verwendet Umzugs-Validator | Revision/CAS verhindern bestimmte Cloud-Konflikte, **nicht** das Farming von plausiblen neuen Einträgen |

**Fazit:** Der Pilotenpfad ist gut eingrenzbar, weil eine echte erfolgreiche Cloud-Speicherung bereits erkennbar ist. **Aber:** Ein Browser kann Kisten und deren Zeit-IDs manipulieren. Weder eine erfolgreiche `toolya_save_snapshot`-Revision noch das DOM-Event `toolya:moving-saved` beweist allein eine legitime, eigenständige Handlung.

## 2. Eine Belohnung und genaue Bedingungen

**Einziger Pilot-Belohnungstatbestand:** `moving.first_box_saved.v1`, **einmalig je verifiziertem Nutzerkonto**. Bei berechtigtem Erfolg:

- **+20 XP**
- **+10 KP** Kategorie `Organisation`
- Falls der erste Rewards-Erfolg dieses Kontos: Badge **Erster Schritt**
- Bei drei bzw. fünf insgesamt **verschiedenen, anerkannten Tool-Erstereignissen** entsprechend **Neugierig** bzw. **Vielseitig** (nicht aus dem Umzugs-Piloten allein).

**Erfolg erst dann**, wenn:
1. Nicht-anonymer gültiger Auth-Account.
2. Der Umzugs-Cloud-Snapshot gehört tatsächlich dieser `auth.uid()` / Konto.
3. Gespeicherter Snapshot besitzt eine valide neue Kiste mit existierendem zulässigem Standort, nichtleerem Namen, geeigneter Struktur.
4. Der Schritt ist eine **Neu-Anlage**, nicht bloß Update/Delete/Import/migration. Vorher-/Nachher-Zustand werden **auf dem Server** geprüft, wenn dieser fachliche Nachweis mit sicherer Herkunft möglich ist.
5. Für `moving.first_box_saved.v1` gibt es noch **keinen** Ledgereintrag für dieses Konto.
6. Beide Schreibvorgänge – fachlicher Save und Rewards-Grant – werden korrekt geordnet/atomar abgesichert, sodass weder verlorene Writes noch doppelte XP-Gutschriften entstehen.

**Ausschlüsse:** Standort ohne Kiste, Fotoimport, QR-Anzeige, Sortieren, Bearbeiten, Löschen, Cloud-Migration/Backup, fünfmal auf „Kiste speichern“ tippen, Reload, generisches `toolya:moving-saved`, Ko-fi, Affiliate-Link.

**Einschränkung gegen Scheinerfolge:** Eine private Cloud-Speicherung mit syntaktisch plausibler Kiste lässt sich bei vollkommen untrusted Client nicht als „echte Umzugskiste in der Welt“ verifizieren. **Sicher erreicht werden können Identität, Persistenz, fachliche Minimalvalidierung, Einmaligkeit und Anti-Farming.** Das ist für einen niedrigen einmaligen Bonus praktikabler als ein Anspruch auf Echtheitsbeweis. Keine größere wiederholbare XP-Vergabe aus Kistenanzahl zulassen.

## 3. Empfohlener Serverfluss

**Wichtig:** Hier steht **keine** ausführbare Migration oder aktive Edge Function. Es handelt sich um Pseudofluss und Designanforderungen.

```text
Anmeldung (gültiger nicht-anonymer Account)
    │
    ▼
Vorhandener saveBox() → storeBoxData()
    │
    ▼
Vorhandene toolya_save_snapshot-Transaktion / kontoeigener Cloud-Snapshot
    │
    ├── Speichern schlägt fehl  → kein Reward, Tool zeigt bestehenden Fehler
    │
    └── Save wird bestätigt
          │
          ▼
Rewards-Prüfung innerhalb geeigneter vertrauenswürdiger Serversequenz:
    Konto / Tool / neue fachlich valide Kiste / kein Import /
    Ersterfolg noch nicht vergeben
          │
          ├── Nicht berechtigt / schon vorhanden → +0
          │
          └── Berechtigt → Ledger-UNIQUE-Erstevent +20 XP/+10 KP
                       und Badges atomar oder reproduzierbar konsistent
                                │
                                ▼
                  Dashboard zeigt Konto-Stand
```

**Implementierungsentscheid vorab:**
- **Variante A, bevorzugt wenn die bestehende SQL-RPC sicher erweiterbar ist:** In einer kontrollierten, migrationsgeprüften DB-Transaktion des `toolya_save_snapshot`-Pfads die **serverseitige** alte und neue `umzugskisten-inventar`-JSON-Struktur vergleichen. Die Rewards-Prüfung arbeitet nur für echte, fachlich valide Neu-Anlage und `first_box_saved`, nicht für generische Saves. Gewährleistet konsistente Server-Zeitordnung und könnte die Gutschrift im selben Commit vornehmen. **Risikopunkt:** Client kann gesamte JSON-Payload ersetzen; ein Snapshot-Diff kann echte Kiste nicht von künstlicher Kiste unterscheiden, so dass nur einmaliger Low-Stakes-Erfolg zulässig ist. Bestehende Tool-Speichertransaktion darf bei Rewardsfehler nicht plötzlich fachlich fehlschlagen – entweder strikte isolierte Fehlerbehandlung oder gesicherte asynchrone Outbox.
- **Variante B, wenn bestehende RPC nicht verändert werden sollte:** Eine isolierte verifizierende Backend-/Edge-Funktion erhält nur einen minimalen Account-/Event-Antrag, **liest selbst** den aktuellen `user_data`-Snapshot und ein manipulationsgeschütztes Save-/Revision-Audit, prüft Erstereignis und schreibt dedupliziert. **Nur den aktuellen Snapshot lesen reicht nicht**, um neue Kiste vs. Altbestand zu unterscheiden; es braucht einen serverseitigen revisionsbezogenen Nachweis/Outbox. Kein Beweis, wenn Client lediglich `boxId` meldet.

**Nicht zulässig:** Browser-RPC `grant_reward(user_id, xp, kp)`; Service-Role im Frontend; XP als Feld in `user_data.data`; Punkte im `localStorage`; Badge-Berechnung durch bloße Clientklicks.

## 4. Minimales Datenmodell für den Pilot

Nur Vorschlag, endgültige Tabellennamen nach Schema- und Rechtemodellprüfung:
- `reward_event_ledger`: `user_id` (auth.uid), `event_type='moving.first_box_saved.v1'`, `rule_version=1`, `xp_awarded=20`, `competency='organisation'`, `kp_awarded=10`, `created_at`. **Eindeutige erste Toolvergabe je Nutzer und Eventtyp**. Für diesen einmaligen Pilot **keine** Speicherung von Kisten-IDs, Standort, Text, Bild, QR, Wert oder GPS.
- `reward_badge_definitions`: statische Regeln und Anzeigenamen. `reward_user_badges`: `UNIQUE(user_id,badge_id)`, ebenfalls durch denselben autorisierten Dienst.
- `reward_user_totals` oder sichere konto-eigene Aggregation: nur Ledger abgeleitet, keine direkt clientbeschreibbaren Zähler.
- `reward_verification_receipt` / interne Audit-Daten **nur soweit wirklich erforderlich**, in einem nicht öffentlich exponierten Schema, minimale Daten, Retention, kein privater Kisteninhalt.

**Missbrauchsschutz:** Datenbank-Uniqueness plus transaktionaler Lock/serialisierbare Konkurrenzbehandlung, RLS, Service-Role niemals in Client, explizite Rechte auf RPCs; klare Tests gegen Parallelrequests. Für den ersten Pilot begrenzt die einmalige Vergabe Schaden durch gefälschte Eingaben.

## 5. Sicherheits- und Datenschutzcheck für die spätere Implementierung

1. Aktuellen SQL-Quelltext/Owner/Rechte für `toolya_save_snapshot` und zugehörige Trigger/Policies **nur lesend** prüfen, bevor eine neue Migration geschrieben wird.
2. Supabase Auth-Verhalten: gültige nicht-anonyme Sessions; nicht aus vom Nutzer editierbaren JWT-Metadaten Rechte ableiten; Besitzer `auth.uid()` serverseitig.
3. Für exposed Schema RLS, konto-eigene Lese-Policies, keine öffentlichen Schreibrechte für XP/KP/Badges. `SECURITY DEFINER` niemals pauschal oder vom `public`-Client frei zugänglich auf neue Privilegien setzen; `EXECUTE` eng begrenzen.
4. Fail-Closed für Reward-Vergaben: Wenn kein glaubhafter Erfolg/Revision-Beleg vorhanden, **0 Punkte** statt imaginärer Erfolg. Dennoch bleibt reguläre Toolnutzung möglich.
5. Legacy-Migration: Import bereits vorhandener Kisten **nicht** als neue Rewards-Ereignisse zählen. Kein rückwirkendes Vergüten von Produktivdaten ohne separaten Beschluss.
6. Leichte, optional ausblendbare Erfolgsmeldung; bei Rewards-Ausfall wird keine Gutschrift behauptet.
7. Grundsatz: Die zuerst in `main` vorhandene Cloud-RPC und Datenmigration dürfen weder Accountdaten gefährden noch Cloud-/Gerätedaten verlieren.

## 6. Präzise Pilot-Tests (isolierte Staging-Umgebung)

| Fall | Erwartung |
|---|---|
| Konto A speichert erstmals gültige Kiste in bestehendem Standort | genau +20 XP, +10 Organisation; ggf. Badge Erster Schritt |
| Nochmals speichern, dieselbe Kiste ändern/löschen | keine weitere Gutschrift |
| Dieselbe Person legt zehn zusätzliche Kisten an | keine weiteren **first_box**-XP |
| Gleichzeitige 10x Retry-Saves des Erstereignisses | Ledger enthält **exakt einen** Grant |
| Fehlende Standortzuordnung oder Kistenname | Save abgelehnt, keine XP |
| RPC-Speicherung schlägt fehl / Revision 40001 | keine XP, keine behauptete Gutschrift |
| Konto B versucht Event für Konto A | keine Fremd-Gutschrift; keine privaten Daten anderer Nutzer sichtbar |
| Bearbeiteter Browser sendet `xp=100000` | ignoriert/abgelehnt |
| Client schickt künstliche `boxId` oder JS-DOM-Event | kein unmittelbarer Reward; nur verifizierter Save-/Diff-Pfad möglich |
| Legacy-Migration enthält alte Kiste | **keine** Erstgutschrift beim Import |
| Rewards-System nicht verfügbar | Tool speichert weiterhin, keine falsche XP-Meldung |
| Konto wird gewechselt während Save | keine Gutschrift an altes/neues falsches Konto |
| Session abgemeldet / unverified | keine XP, bestehende Save-Auth-Grenze bleibt intakt |
| Zwei verschiedene Geräte mit legitimen Saves | Cross-Device-Gutschrift einmalig, persönliches Dashboard identisch |
| Keine Veröffentlichung sensibler Kisten-/Foto-/Wertdaten | Rewards-Ledger enthält nur minimale Meta-/Punktefelder |

**Keine Staging-Umgebung in diesem Arbeitsschritt angelegt.** Keine echten Nutzerdaten für Tests verwenden.

## 7. Umsetzbare Aufgabenliste für Codex/Work

### P0 – Letzte Schema-/RPC-Bestandsprüfung
- `public.user_data`-Policies und exakte Definition von `toolya_save_snapshot` lesend inspizieren.
- JSON-Validator `validateMovingSnapshot` und Cloud-RPC-Validierung auf Kistenstruktur/Standortkonsistenz untersuchen.
- Prüfen, ob beim Cloud-Migration-/Backfill dieselbe Save-RPC aufgerufen wird und wie Importe eindeutig unterscheidbar sind.
- Architekturentscheid **A oder B** nachvollziehbar schriftlich begründen.

### P1 – Isolierte Rewards-Basis auf eigenem Dev-Branch
- Staging/Supabase-Testprojekt verwenden, niemals echte Nutzerdatensätze erzeugen.
- Minimalversion von Event-Ledger, Badge-Grants und eigener Rewards-Abfrage bauen.
- Idempotenz-/RLS-/Transaktionstests zuerst; Punktewerte fix aus Regelkatalog.

### P2 – Pilot in Umzugskisten
- Fachlicher Erstsave mit sicherem Serverbeleg integrieren, keine globalen Änderungen an `saveData`-DOM-Events für Punktevergabe.
- Bestehenden `saveBox`-Flow und Cloud-Revisionskonflikte unverändert sicher lassen.
- Nach autoritativem Grant diskreten Erfolgsstatus anzeigen; Belohnung darf Tool-Save nicht blockieren.

### P3 – Pilot-Abnahme
- Alle Tests aus Abschnitt 6 in isolierter Umgebung, auf Smartphone/PC prüfen, Badge-/XP-UI integrieren.
- Vollständige Quellen-, Migrations- und Sicherheitsnachweise sowie Review-Screenshots bereitstellen.
- **Kein Merge nach `main`, keine Live-Veröffentlichung/Produktivdatenbankmutation ohne ausdrückliche Freigabe.**

## 8. Übergabe

**Fertig:** Pilot-Codepfad geprüft und enger, risikoarmer Einmal-Reward spezifiziert.  
**Nicht fertig:** DB-RPC-Definition und -Policies im Detail geprüft, Staging, Migration, Implementierung, Tests mit Daten und Live-Aktivierung.  
**Priorität:** Dieses Pilotdokument präzisiert die vorherige generische Architektur. Alte, ungesicherte Browser-Klick-XP-Prototypen dürfen nicht als Lösung wiederverwendet werden.
