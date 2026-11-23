# Toolya Rewards V1 – Read-only Prüfung der produktiven Supabase-Speicherfunktion

**Datum:** 23.11.2026  
**Projekt:** Toolya Supabase `yheogmeaosuigyaxkwth`  
**Gegenstand:** `public.toolya_save_snapshot(text,jsonb,bigint)`, `public.user_data`, RLS, GRANTs, Constraints, Trigger.  
**Vorgehen:** Ausschließlich lesende SQL-Abfragen der Systemkataloge (`pg_proc`, `pg_policies`, `pg_class`, `pg_constraint`, `pg_indexes`, `pg_trigger`, `information_schema.columns`). **Keine Benutzerdatensätze gelesen; keine INSERT/UPDATE/DELETE/DDL/Migration oder Funktion ausgeführt.**

## 1. Verifizierte Ergebnisse

### RPC `public.toolya_save_snapshot(text,jsonb,bigint)`

- Funktion vorhanden; `LANGUAGE plpgsql`, Volatilität `VOLATILE`, Eigentümer `postgres`, `SECURITY INVOKER` (`prosecdef=false`), `SET search_path TO ''`.
- Direkte `EXECUTE`-Rechte für `authenticated` und `service_role`; `anon` hat **keine** Ausführungsberechtigung. Prüfung mit `has_function_privilege` bestätigt.
- Funktion leitet `v_uid := (select auth.uid())` ab und weist fehlende UID oder JWT-`is_anonymous` zurück.
- Verlangt `p_tool` mit erlaubtem Zeichensatz/Zeichenlänge, `p_data` als JSON-Objekt, Umfang bis 4.200.000 Bytes; `p_expected_revision` muss NULL oder ≥1 sein.
- Bei erster Anlage `INSERT INTO public.user_data(user_id,tool,data,revision)` mit `revision=1`, bei Update `UPDATE ... WHERE user_id=v_uid AND tool=p_tool AND revision=p_expected_revision`, erhöht Revision um 1. Konfliktcode `40001`, also Compare-and-Swap.
- Gibt die neue Revision und den gespeicherten JSON-Datenstand zurück.
- **Keine fachliche Tool-Kistenvalidierung und kein Rewards-Ereignis im RPC-Quelltext.** JSON-Objektbehandlung und Revision sind Speicherkontrollen, keine Bestätigung einer im Alltag existierenden Kiste.

### Tabelle `public.user_data`

- Spalten: `id bigint`, `user_id uuid`, `tool text`, `data jsonb`, `created_at timestamp`, `updated_at timestamp`, `revision bigint`.
- `PRIMARY KEY(id)`; `UNIQUE(user_id,tool)`; `CHECK(revision>=1)`. Die Uniqueness sichert genau eine Zeile pro Benutzer/Tool, **nicht** einzelne Kisten oder Reward-Ereignisse.
- RLS ist **aktiv**; nicht auf Tabelleninhaber erzwungen (`relforcerowsecurity=false`). Eigentümer `postgres`.
- Policies für `authenticated`: SELECT/DELETE jeweils `auth.uid()=user_id`; INSERT `WITH CHECK auth.uid()=user_id`; UPDATE mit `USING` und `WITH CHECK` derselben Eigentümerbedingung.
- Grants: `authenticated` darf diese Tabelle **direkt SELECT, INSERT und UPDATE** auf eigene Zeilen. `anon` hat hier weder SELECT noch INSERT. Die Funktion ist damit **nicht** der einzige Schreibweg.
- **Keine nutzerdefinierten Trigger** auf `public.user_data` gefunden.
- Indizes: PK und `(user_id,tool)`-Unique; kein Ereignis-/Reward-Index.

## 2. Wichtigste Schlussfolgerung: Verifizierbarkeit und Vertrauen

Die bereits vorhandene RPC schützt die Cloud-Version und Eigentümerschaft, aber der angemeldete Nutzer kann sowohl über die RPC als auch direkt per Data API den **eigenen** JSON-Datenstand verändern. `id: Date.now()` in `storeBoxData` ist ebenfalls vollständig clientkontrolliert.

**Ein Server-Diff zwischen alter und neuer `data.boxes`-Liste beweist daher nur eine gespeicherte Datenänderung unter einem Nutzerkonto, nicht eine ehrliche Nutzung der Tool-Oberfläche oder ein „echtes“ Objekt in der physischen Welt.**

**Zusätzliche kritische Grenze:** Würde man die erste Rewards-Gutschrift ausschließlich in die vorhandene `toolya_save_snapshot`-Funktion einbauen, könnten angemeldete Nutzer diesen zusätzlichen Weg **durch direkte INSERT-/UPDATE-Aufrufe auf `public.user_data` umgehen**. Dann könnten (a) legitime Tool-Erfolge ohne XP bleiben oder (b) direkt veränderte Datenstände spätere Rewardprüfungen verfälschen. Eine pauschale Änderung der vorhandenen Policy-/Grant-Architektur ist daher **nicht** als schnelle Lösung akzeptabel – sie könnte andere produktive Tools beschädigen.

**Empfehlung:** Für V1 den Begriff „verifizierter Erfolg“ präzise als **autorisiertes, plausibel valides und einmalig vergebenes kontobezogenes Nutzungsereignis** definieren, nicht als unmöglichen Beweis realer physischer Arbeit. Für den Umzugs-Pilot **nur** einmalig +20 XP/+10 KP, niemals Punkte nach Boxenanzahl. Ein eng begrenzter Fraud-Rest bleibt trotz Serverprüfung.

## 3. Architekturentscheidung und Alternativen

### Bevorzugtes Prinzip: separates Rewards-System, nicht `user_data` als Punktekonto

- XP/KP und Badges in neuen, privat abgesicherten Tabellen; Client darf diese ausschließlich lesen (eigenes Konto), **niemals** direkt beschreiben.
- Verbindliche Vergabe ausschließlich über serverseitigen Dienst (Edge Function oder nicht exponierte interne DB-Logik). Dieser leitet die Kontoidentität aus einer verifizierten Supabase-Sitzung ab; die `service_role` darf niemals im statischen GitHub-Frontend stehen.
- Vergabe einmalig über `UNIQUE(user_id,event_type)` für den Piloten, transaktional. Eingehende frei wählbare `xp`, `kp` oder fremde `user_id` ignorieren.
- Die bestehende `toolya_save_snapshot` unverändert lassen, sofern ein sicherer Zusatzweg möglich ist. Nur wenn später eine migrations-/regressionsgeprüfte, vollständige Neugestaltung der Tool-Persistenz erfolgt, die vorhandenen Direct-Write-GRANTs/Policies zentral einschränken.
- **Nicht** den bestehenden Cloud-JSON-Inhalt als vertrauenswürdige Bescheinigung behandeln. Für einen sicheren Trigger entweder (A) einen dedizierten kontrollierten Fachvorgang serverseitig ausführen, mit begrenzter JSON-Validierung, Eigentümerprüfung und verlässlichem Eventbeleg oder (B) für diesen Toolflow den Reward zurückstellen, bis ein solcher Beleg technisch vorliegt.
- Ein isolierter serverseitiger erster Save kann die eigentliche Speicheränderung plus Reward-Gutschrift in **einer** transaktionalen Operation koordinieren, wenn dadurch bestehende Clientflows nicht umgangen werden und die Berechtigungen sauber begrenzt sind. Sonst Outbox/Recovery mit identischem idempotentem Eventbeleg vorsehen.
- Da bisherige direkte Nutzerschreibrechte unverändert bleiben sollen, dürfen **keine** Aussagen wie „alle Kistenänderungen lösen garantiert XP aus“ veröffentlicht werden. Berechtigte Rewards entstehen nur auf dem neuen, klar abgegrenzten Pilotweg; Nutzer müssen die bestehende Funktion uneingeschränkt weiter nutzen können.

### Explizit verworfene Abkürzungen

1. Direktes `client.from('reward_user_totals').update({xp:...})`.
2. Öffentlich ausführbare, privilegierte RPC `grant_xp(amount,user_id)`.
3. DB-Trigger auf **jede** `user_data`-Revision.
4. Reward nach DOM-Event `toolya:moving-saved`, Browser-LocalStorage oder bloßem Frontend-`saveBox()`-Aufruf.
5. Dynamische XP auf Basis der Kistenzahl, Mengen, Geldwerte, Dauer oder Veröffentlichungen.
6. Ohne Regressionsprüfung `authenticated`-Schreibrechte auf `user_data` entziehen.
7. Altdaten und Cloud-Migrationen rückwirkend für XP belohnen.

## 4. Technische Sicherheitsanforderungen des neuen Dienstes

- Verifizierte nicht-anonyme Supabase-Auth; Benutzer-ID aus geprüfter JWT-Identität und **nie** frei aus dem Request.
- Servereigene Eventregeln `moving.first_box_saved.v1`: +20 XP, +10 `organisation` KP, einmalig je Konto; Nachweis mindestens valide neue Kistenstruktur und erfolgreiche Cloud-Persistenz im dedizierten Pilotweg.
- Unprivilegierte Browseraufrufe dürfen **keine** Rewards-Tabellen schreiben; RLS plus restriktive GRANTs; getrennte Privatschema-/Edge-Konfiguration.
- Erstelltes Konto, UID-Wechsel, CAS-Konflikt, direkte Tabellen-Updates, 10 parallele Grants, fehlende Tokens, wiederholter Request, Lösch-/Updatevorgänge, Import müssen isoliert getestet werden.
- Keine Kistenbilder, Freitexte, Anschriften, Kistenwerte, QR-Codes, JSON-Snapshots oder GPS im Reward-Ledger. Nur minimale Eventmetadaten, Zeitstempel und Punkte.
- Bei Rewards-Ausfall Toolfunktion priorisieren und nie einen nicht bestätigten Erfolg toasten.
- Die bestehende öffentliche/geschützte Nutzung aller anderen Tools wird **nicht** angepasst.

## 5. Folgeschritte vor jeder Implementierung

1. **Read-only** Quelltext des bestehenden JSON-Validators und die echten Speicheraufrufe aller Tool-Flows untersuchen; beim Umzug insbesondere Migration und alternative Snapshot-Schreiber. Das vorherige Codeaudit liegt unter [Pilot Umzugskisten](TOOLYA-REWARDS-V1-PILOT-UMZUGSKISTEN.md).
2. Explizite Entscheidung, ob bei vorhandenen Direct-Write-GRANTs ein **separater kontrollierter, einmaliger** Pilot-Grant verhältnismäßig ist oder ob die Voraussetzungen für sichere Punktevergabe erst durch Persistenzhärtung entstehen.
3. Sicherheitsreview neuer Privattabellen/Edge-Autorisierung und dokumentierter Rollbackplan.
4. Nur in Staging, ohne echte Produktivdaten: Schema, Dienst, Idempotenz, getrennte Konto-/RLS-Tests und UI-Einbindung auf Entwicklungsbranch.
5. Regression der zwölf Tools; kein Merge/Produktivmigration/Deployment ohne neue ausdrückliche Nutzerfreigabe.

## 6. Prüfumfang und Verifikationsstatus

**Erledigt:** Funktionsdefinition, Owner, `SECURITY INVOKER`, tatsächliche `EXECUTE`-Rechte, RLS-Policies, Rollen-/Tabellen-Grants, Spalten, Primary-/Unique-/Check-Constraints, Indexe und vorhandene Trigger vollständig für die bezeichnete Tabelle/Funktion per Katalogabfrage erfasst.

**Nicht erledigt:** Durchlauf von Testkonten, transaktionale Simulation, reale Backendumsetzung, Audit *aller* Supabase-Funktionen und sämtlicher Toolpfade. Diese Arbeit benötigt isolierte Staging-Umgebung und einen konkreten Entwicklungsauftrag.

**Livezustand:** Unverändert. **GitHub:** Nur Planungsdokumentation.
