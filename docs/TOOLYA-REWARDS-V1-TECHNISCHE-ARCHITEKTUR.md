# Toolya Rewards V1 – Technische Architektur, Events und sichere XP-Vergabe

**Datum:** 23.11.2026  
**Status:** Technische Vorplanung auf Grundlage von **read-only** GitHub-/Supabase-Bestandsprüfungen. **Keine Migration ausgeführt, keine XP-Daten angelegt, kein produktiver Code geändert.**  
**Umfang:** ausschließlich **XP, Kompetenzpunkte (KP) und Badges**. Keine Mystery-Videos, Ranglisten, Ko-fi-XP, Streaks, Fantasy-Welt, Quests oder neue Levelmechanik.
**Grundlagen:** [V1-Produktplan](TOOLYA-REWARDS-V1-XP-KOMPETENZEN-BADGES.md), [Detailregelwerk](TOOLYA-REWARDS-V1-REGELWERK-UND-ABNAHME.md), [UI-Design](TOOLYA-REWARDS-V1-UX-UI-DESIGN.md), [HTML-Demo](../prototypes/toolya-rewards-v1.html).

## 1. Verifizierter technischer Ist-Zustand

Prüfung des aktuellen `main` im Repository `duhrrom11/toolya` und **lesende** Supabase-Tabelleninventur im Toolya-Projekt `yheogmeaosuigyaxkwth` am 23.11.2026:

1. Produktseite ist ein statisches GitHub-Pages-Frontend mit Einzel-HTML-Tools, gemeinsamem `shared/toolya/platform.mjs` und Dashboard in `dashboard/index.html` / `dashboard/dashboard.js`.
2. Supabase-Auth existiert: `dashboard/account-settings.js` nutzt `auth.getUser`, `signUp`, `signInWithPassword`; einzelne Tools haben eigene Login-/Registrierungslogik. Das `shared/toolya/auth-page-gate.js` prüft auf manchen Seiten Sessions. Die Integration ist **nicht nachweislich überall identisch**.
3. Beim Umzugstool `tools/moving/index.html` existieren `saveBox`, `storeBoxData`, `saveData` und ein Cloud-/Lokal-Datenpfad. Beim Backform-Rechner `tools/baking/index.html` existieren `calculateRecipe`, `saveRecipeToStorage`, `persistRecipes`. Damit sind sowohl browserseitige Rechenereignisse als auch lokal/synchronisierte Speichervorgänge relevant.
4. Im Toolya-Supabase-Projekt sind u. a. `public.user_data`, `public.wg_spaces`, `public.wg_members`, `public.dashboard_tasks`, `public.dashboard_reminders`, `public.vault_cloud_snapshots`, `public.wishlist_profiles`, `public.wishlist_lists` und mehrere weitere Wishlist-Tabellen vorhanden. Die von der Tabelleninventur zurückgegebenen Tabellen in `public` haben RLS aktiviert. **Diese Übersicht ist kein Audit der Wirksamkeit einzelner Policies.**
5. In der read-only Inventur tauchten **keine Tabellen mit eindeutigem Rewards-/XP-/Badge-Namen** auf; das ersetzt keine vollständige Suche in anderen Schemas, Funktionen oder Migrationen. Daher vor Migration eine vollständige Schema-/RLS-/RPC-Inspektion.
6. Die Produktivdatenbank wurde **ausschließlich lesend** abgefragt; kein echter Nutzerdatensatz geöffnet. Insbesondere keine Test- oder Spendenereignisse erzeugt.

**Entscheidende Konsequenz:** Ein Klick auf `saveBox()` oder `calculateRecipe()` im Browser ist **kein** vertrauenswürdiger Beweis eines sinnvollen Abschlusses. Supabase-Daten können teilweise über generische Snapshots/JSON gespeichert sein; eine einzelne sichere Datenspeicherung ist nicht automatisch ein serverseitig beweisbares Tool-Ereignis. Es darf keine direkt vom Frontend beantragbare „vergib mir 20 XP“-Funktion geben.

## 2. Trust-Modell und vorgeschlagene Architektur

```text
[Bestehende Tool-UI] -- fachliche Aktion --> [Bestehender Tool-Datenfluss]
       |                                     |
       | nur nach bestätigtem Erfolg          | verifizierbarer, kontobezogener Beleg
       v                                     v
[Rewards-Ereignisanfrage] -------> [Serverseitiger fachlicher Event-Verifikator]
                                            |
                               prüft Nutzer + Artefakt + Einmaligkeit + Caps
                                            |
                                            v
                                [Atomare Rewards-Gutschrift]
                                  |            |            |
                                  XP           KP        Badge-Vergabe
                                            |
                                            v
                                  [Private Konto-Abfrage]
                                            |
                                            v
                                [Meine Erfolge im Dashboard]
```

- **Server authoritative:** Der Client darf nur einen erlaubten `event_type` plus ggf. eine **minimal notwendige Referenz** auf einen bestätigten, zugriffsberechtigten Vorgang liefern. Er darf weder `user_id`, XP-Wert noch KP-Kategorie als entscheidende Berechtigung vorgeben. `auth.uid()` / validierter JWT-Benutzerkontext werden serverseitig abgeleitet.
- **Event-Verifikator erforderlich:** Für Cloudpersistenz bestätigt ein vertrauenswürdiger Datenzustand oder serverseitig signierter Toolprozess den fachlichen Erfolg. Wenn das bestehende Tool nur im Browser rechnet oder lokale JSON-Daten schreibt, ist **kein sicher verifizierbares XP-Ereignis** vorhanden; zuerst ein minimaler sicherer Nachweisweg mit Datenschutzprüfung entwickeln oder Gutschrift für dieses Tool zurückstellen. **Signale aus Browser-`localStorage`, frei editierbare JSON-Felder oder Browser-Events allein sind NICHT vertrauenswürdig.**
- **Gleiche fachliche Quelle wie Tool-Daten:** Keine doppelte Persistenzsensitivität aufbauen. Wo möglich, die bestehende, bereits verlässlich serverseitige Save-Operation um ein atomar bestätigtes Achievement-Ereignis ergänzen. Bei generischem Snapshot-JSON ist ein serverseitiger Beleg über den echten Datenzustand und die tatsächliche Änderung nötig; schlichte „snapshot_saved“-Ereignisse können ohne zusätzliche Verifikation nicht die Bedingung „neue Kiste erstellt“ beweisen.
- **Entkopplung:** Fällt Rewards aus, bleibt das Tool arbeitsfähig; „+ XP“ nur anzeigen, wenn die Gutschrift bestätigt ist. Für Retries eine nachvollziehbare Pending-/Outbox-Strategie für fachlich bestätigte Events vorbereiten; gerade beim lokal-only Ablauf darf ein vermeintlich automatischer Offline-Reward nicht ohne serverseitigen Nachweis gewährt werden.

## 3. Minimales relationales Modell (Entwurf, keine DDL ausgeführt)

**Namen nur Vorschläge, nach aktuellem Schema-Audit finalisieren:**

| Tabelle / Funktion | Relevante Felder | Zweck |
|---|---|---|
| `reward_event_definitions` | `event_type`, `tool_id`, `competency`, `xp`, `kp`, `limit_policy`, `active` | Nur administrativ gepflegter Katalog; explizit zugelassene Eventtypen und feste Werte |
| `reward_event_ledger` | UUID, serverseitig ermittelte `user_id`, `event_type`, `proof_key_hash`, `grant_scope`, `xp_awarded`, `kp_awarded`, `competency`, `created_at` | Append-only, idempotentes Grant-Ledger. **Keine** sensiblen Inhaltsfelder oder Klartext-Referenzen |
| `reward_badge_definitions` | `badge_id`, `title`, `criteria_key`, `private_only` | Festes Regelwerk der neun Badges |
| `reward_user_badges` | `user_id`, `badge_id`, `awarded_at` | Einmalig verliehene Abzeichen; `UNIQUE(user_id,badge_id)` |
| `reward_user_totals` (optional) | `user_id`, `total_xp`, je Kategorie aggregierte KP oder normalisierte Kindtabelle, `updated_at` | Cache/Materialisierung, nicht eigene Wahrheit; aus Ledger rekonstruierbar |
| `grant_verified_reward` (interner Dienst/privat ausführbare Transaktion) | auth-gebundene Identität + erlaubter geprüfter Proof | Validiert fachlichen Abschluss, vergibt XP und KP, aktualisiert Badges **atomar** |

**Datenminimierung:** Ledgereinträge dürfen keine Nachlassinhalte, Diagnosen, Medikamente, GPS-Koordinaten, Wohn-/Kontaktadressen, Wishlist-Klarnamen, Fahrzeugkennzeichen, Währungsbeträge oder sonstige private Tool-Payloads enthalten. Selbst `event_type` kann in sensiblen Tools Rückschlüsse erlauben: RLS und öffentliche APIs sollen ihn deshalb **nur dem eigenen Konto** und dem autorisierten internen Vergabedienst zugänglich machen. Die Kategorie „Vorsorge & Wünsche“ bleibt privat.

**Integritätsanforderungen:**
- Fachlich geeigneter Idempotenzschlüssel, **UNIQUE** je Nutzer × Ereignistyp × Beleg / einmaliger Ersterfolg. Konkurrenzsichere Transaktion; doppelte Requests antworten konsistent mit bestehendem Ergebnis statt doppelt XP zu vergeben.
- Zahl und Kategorie werden **nicht** als frei übermittelte Clientwerte verarbeitet. Server liest sie aus vertrauenswürdig verwaltetem Regelkatalog und wendet Caps an.
- Kein direkter `INSERT` / `UPDATE` / `DELETE` auf XP-, KP- oder Badge-Tabellen für normale `authenticated`/ `anon`-Clients; Client erhält nur read-only, konto-eigene Totals/Badges.
- RLS auf allen öffentlich exponierten Tabellen; `USING ((select auth.uid())=user_id)` für eigene Lesezugriffe. Privilegierte Vergabedienste außerhalb des vom Client ausführbaren `public`-Schemas halten, `EXECUTE`-Berechtigungen einschränken; kein blindes öffentliches `SECURITY DEFINER` zum Umgehen der RLS.
- Auth-Berechtigungen nicht aus editierbaren `user_metadata`-Claims bestimmen; keinerlei Service-Role-/Secret-Key im GitHub-Pages-JavaScript.
- Rewards-Regeln werden **versioniert**, damit spätere Formeländerungen nicht alte Gutschriften unkontrolliert rückwirkend verändern.
- `reward_user_totals` bei Fehler aus Ledger reparierbar und mit Überwachungscheck auf Summenkonsistenz.

## 4. Zwölf Tool-Adapter – technische Verifikationsklassen

**Wichtig:** Die konkreten Adapterpunkte werden erst nach Tool-spezifischer Codeprüfung endgültig festgelegt. Keine Bestätigung eines Events allein durch das Vorhandensein einer Funktion im Frontend.

| Tool/Route | Potenzieller Erstmeilenstein | Aktuell erforderliche Verifikation | V1-Umsetzungsgate |
|---|---|---|---|
| Umzug `tools/moving/` | erste wirklich gespeicherte Kiste | `saveBox`/`storeBoxData`/`saveData`: Cloud-Snapshot von lokalem Speicher unterscheiden; serverseitigen Zustand/Neuheit beweisen | Nachweis einer echten neuen Kiste ohne lokal fälschbares Event |
| Backform `tools/baking/` | gültige konkrete Berechnung | `calculateRecipe` findet im Client statt; reine Rechenergebnisse sind manipulierbar | Sicherer, rate-limitierter Rechennachweis oder nur echtes verifiziertes Speicherereignis |
| Haushalt `tools/budget/` | erster gespeicherter Datensatz | Art der Persistenz und Owner-Prüfung prüfen | Keine Betragsdaten in Ledger |
| Pflanzen `tools/plants/` | erster Pflegeplan | Zustand nach bestätigtem Speichern belegen | Kein Gieß-/Streak-Farming |
| WG `tools/housemates/` | verifizierbarer Organisationsabschluss | Owner/Mitgliedsrechte, Statuswechsel, Zahl neuer Aufgaben prüfen | Kein client-gefälschtes „erledigt“ |
| Digitaler Nachlass `tools/estate/` | neutraler sicherer Einrichtungsmeilenstein | Sicherheitszustände, Snapshot/verschlüsselte Payload, Notfall-Mails | Keine Daten-/Alarm-/E-Mail-Inhalte oder sicherheitskritischen Trigger |
| Auto `tools/car/` | erster persistierter Vorgang | Bestands-Cloud-/Local-Sync und Eigentum des Eintrags prüfen | Keine Kennzeichen/Kosteninformationen |
| Tiergesundheit `tools/pet-health/` | neutraler Einrichtungserfolg | nur minimaler nicht-medizinischer Nachweis | Keine Medikations-/Impf-/Diagnoseereignisse |
| Parkplatz `tools/parking/` | erstmals gespeicherter Merkhinweis | Speicherkontext, kein GPS im Rewardspayload | Kein bloßes Tippen oder GPS-Tracking |
| Verliehenes `tools/loans/` | tatsächlich erfasster Leihvorgang | Neuheit/Eigentümerschaft/Konsistenz prüfen | keine Kontakt-/Gegenstandsnamen |
| Zählerstände `tools/meters/` | valide Messperiode | Zeit-/Eigentümerprüfung, Update von Neuanlage unterscheiden | keine Verbrauchshöhe |
| Wunschlisten `tools/wishes/public.html` | **nur** sichere nicht-offenlegende eigene Aktion | öffentliche Such-/Publikationsfunktion separat; kein Drängen zum Publizieren | bis dahin **0 verifizierte XP**, kein künstlicher Event |

**Priorität für Umsetzung:** Zuerst ein **sicher verifizierbarer** Toolworkflow als technischer Pilot (z. B. Umzug, **falls** Cloudverifikation machbar ist); danach konkrete Nachweise für alle weiteren Tools erfassen. **Nicht** 12 Browser-Click-Adapter als Abkürzung schreiben.

## 5. Ereignisfluss und Zustandsübergänge

`NO_EVENT` → fachliche Aktion → `TOOL_SUCCESS_CONFIRMED` → (verifizierter Backend-Beleg) → `REWARD_ELIGIBLE` → (atomare grant-Prüfung) → `REWARD_GRANTED` oder `ALREADY_GRANTED` oder `NOT_ELIGIBLE`.

**Antwortbedingungen:**
- `REWARD_GRANTED`: Konto/XP/KP/Badges aus serverseitiger Transaktion aktualisiert; erst jetzt UI-Toast.
- `ALREADY_GRANTED`: nichts addieren, bestehendes Konto/Badge-Ergebnis zurückgeben; kein zweites Toast.
- `NOT_ELIGIBLE`: fachliche Aktion nicht bestätigt, Cap überschritten oder kein verifizierbarer fachlicher Nachweis; Tool selbst bleibt erfolgreich.
- `REWARD_UNAVAILABLE`: Rewards temporär nicht erreichbar; Tool-Zustand bleibt bestehen, kein falscher XP-Erfolg; Retry nur mit sicherem Event-Beleg.

**Badge-Berechnung:** Im selben Transaktionskontext oder unmittelbar kontrollierter eventbasierter Aktualisierung: `first_success`, `three_tools`, `five_tools`, Kategorie-Schwellen (Organisation/Finanzen 30 KP, Fürsorge/Planung/Vorsorge 20 KP) und `three_days` ohne Streak-Frist. Ein Badge kann pro Nutzer genau einmal verliehen werden. **Badges dürfen auf keinen Fall XP selbst auslösen**, sonst entsteht ein unvorhersehbarer Vergabezyklus.

## 6. Umsetzungsschritte für spätere Codex-/Work-Arbeit

### T0 – Verifikation der Ist-Architektur
- GitHub `main`, Auth, Tool-Speicherpfade, Supabase-Schema inkl. Policies, Trigger, Funktionen, RLS, Providerkonfiguration **read-only** untersuchen.
- Pro Tool dokumentieren: fachliche Erfolgsmeldung, Persistenzquelle, UID-Bindung, Änderungsreferenz, Authvorgabe, sichere Erfolgsbeweisbarkeit, Risiko.
- Bestehende `user_data`-Snapshots nicht als vertrauenswürdiges Fachereignis missinterpretieren.

### T1 – Architekturentscheidung und Testumgebung
- Entscheiden, welche Events über kontrollierte Backend-/Edge-Funktion, Privatschema-Service oder bereits serverseitig verifizierte Datenbankänderungen garantiert sind.
- Migrationsplan, RLS-Policy-Matrix und sichere Staging-Umgebung definieren. Aktuelle Supabase-Version/Docs vor tatsächlicher Implementierung erneut prüfen.
- Ohne isolierte Umgebung **keine** Probeinsertions in Produktion.

### T2 – Backend und Event-Pilot
- Regelkatalog, Ledger, Badges, kontrollierte Grant-Transaktion und read-only konto-eigene Views unter geprüfter Rechtevergabe implementieren; migrationierbar und rückrollbar.
- Den einen verifizierbaren Pilot-Toolflow anbinden. Test: fachlicher Erfolg → exakt 20 XP und 10 passende KP → Badge „Erster Schritt“, Reload unverändert.
- Beweis gegen manipulierte Clientdaten/UID, 10 parallele Requests ergeben genau einen Grant.

### T3 – Rewards-Dashboard
- Technisch den vorhandenen `prototypes/toolya-rewards-v1.html` als **visuelle Referenz**, nicht als fertig nutzbaren Account-Bestand, verwenden.
- Dynamische Felder ersetzen Demo-Zahlen; keinen XP-Demo-Knopf in Produktivansicht; nicht veröffentlichte Vor-/Nachnamen nicht zeigen.
- Fünf KP-Karten, neun Badges, leises Feedback nach bestätigtem Grant, Datenschutz/Screenreader.

### T4 – Tool-Integration
- Restliche Tooladapter jeweils nur nach erfolgreicher fachlicher Verifikation hinzufügen und in der Event-Matrix abhaken.
- Bei lokalen Calculators/Speicherpfaden dokumentierte Entscheidung „kein sicherer Serverbeleg“ respektieren statt Click-XP zu vergeben.
- Alle 12 Toolregressionen nach Änderungen testen, einschließlich Bestandsdaten, Cloud/Lokal-Migration und öffentlicher Wishlist-Funktionen.

### T5 – Abschluss und Freigabe
- Reproduzierbare Staging-/Unit-/Integration-/Sicherheitstests, Screenshots Desktop/Mobile, Datenschutzreview, Kostenschätzung für eventuelle Edge-Calls, Rückrollplan.
- Fertigen Release-Kandidaten **nur** in separatem Entwicklungsbranch bereitstellen, nicht nach `main` mergen oder produktiv migrieren, bevor der Nutzer zustimmt.

## 7. Präzise QA-Szenarien

| Szenario | Erwartung |
|---|---|
| Kontobezogener erster gültiger Tool-Abschluss | 20 XP, 10 Kategorie-KP, `first_success` genau einmal |
| Zweiter Request mit derselben fachlichen Proof-ID | kein weiterer Punkt, Badge unverändert |
| 10 gleichzeitige Requests desselben fachlichen Ereignisses | exakt eine Gutschrift |
| Browser sendet `xp=99999` / fremde `user_id` | ignoriert/abgelehnt, keine Gutschrift |
| Browser verändert lokales Rezept-/Kisten-JSON | ohne unabhängigen vertrauenswürdigen Beleg keine XP |
| Nicht autorisierter Client fragt fremden Benutzer ab | keine fremden XP/KP/Badges sichtbar |
| Erfolgreiches Tool, Rewards-Service offline | fachliche Aktion erfolgreich, **kein** falscher XP-Toast |
| Unangemeldeter Nutzer einer weiterhin öffentlichen Wishlist-Funktion | Funktion unverändert, keine Konto-XP |
| Sensibler Erfolg | neutrales minimales privates Event oder keine Gutschrift; kein Inhaltsleck |
| Accountwechsel/Logout | vorheriges Konto nicht aus Cache sichtbar |
| Gesamtsumme nach Rebuild | identisch mit signiertem/verifiziertem Ledger |
| Badges bei 3/5 verschiedenen Tool-Ersterfolgen | `three_tools`/`five_tools` nur bei tatsächlich verschiedenen IDs |
| Ko-fi oder Amazon-Link | V1 immer 0 XP |
| Keine Nutzeraktivität über 30 Tage | Punkte und Badges bleiben erhalten |
| Zurückrollen der UI | Toolfunktion bleibt intakt, Rewards-Daten verlieren nicht ungeplant Integrität |

## 8. Unsicherheiten / vor Implementierung zu klären

1. Welche zwölf Toolflows sind **wirklich** serverseitig belegbar? Die gezeigten Funktionsnamen im Frontend beweisen es nicht.
2. Ist eine sichere, kostengünstige Edge-/Backend-Verifikation auf dem vorhandenen Hosting für alle gewünschten ersten Erfolge praktikabel? Ein kostenloser Browser-Rechner lässt sich durch clientseitige Aufrufe allein nicht manipulationssicher gamifizieren; einen Missbrauchsgrad und minimale Schutzmaßnahmen bewusst definieren.
3. Wie können bestehende Gast-/Lokal-Datensätze Rewards nachträglich erhalten, **ohne** Fremddaten, Duplikate oder unerwartete XP-Grants? Standard: **kein automatisches Backfill ohne getrennte Nutzerentscheidung**.
4. Wie bleiben die bisher öffentlichen Wishlist-Such-/SEO- und Teilen-URLs erhalten? Keine Registrierungspflicht als Nebenprodukt einer Rewards-UI einführen.
5. Welches Privatschema, Grant-RPC-/Edge-Funktions-Rechtemodell, Authentifizierungs- und RLS-Konzept schützt Eventbelege zuverlässig? Kein öffentliches privilegiertes SQL-RPC ohne enges Rollenmodell.

**Sperre:** Bis zu neuem ausdrücklich erteiltem Implementierungsauftrag bleibt dieses Dokument ein rein technisches Konzept. Kein Code auf `main`, keine produktiven Supabase-Änderungen, keine Medien-/Ranking-/Ko-fi-XP-Features.
