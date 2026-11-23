# Toolya Rewards V1 – Backend-Grundgerüst (nicht produktiv)

**Status 23.11.2026:** Erste echte Quelldateien im **Planungsbranch**; **keine** produktive Datenbankmigration, kein Supabase-Deployment, kein XP-Livebetrieb. Bitte nicht mit einem fertigen Backend verwechseln.

## Dateien

- [`schema-draft.sql`](schema-draft.sql) — SQL-Entwurf für ein **privates** `toolya_rewards`-Schema mit `event_ledger`, `user_badges`, RLS ohne Client-Policies sowie einer internen, nur für `service_role` ausführbaren Vergabefunktion.
- [`rules.mjs`](rules.mjs) — reine, deterministische Berechnung der fünf KP-Kategorien, neun Badges und XP-Anzeige aus *bereits verifizierten* Ereignissen.
- [`rules.test.mjs`](rules.test.mjs) — neun `node:test`-Tests für den Regelkern (kein Supabase-Zugriff, keine echten Nutzer).

## Ausführen der Tests

```sh
node --test prototypes/rewards-v1-backend/rules.test.mjs
```

**Verifikationsstatus:** Die vier ursprünglichen Quelldateien wurden auf GitHub gespeichert. **Inzwischen wurden die neun Regeln- und elf Bridge-Testfälle aus den gespeicherten Testdateien in einer isolierten V8-Testumgebung ausgeführt: 20/20 bestanden.** Das ist ein echter JavaScript-Laufzeittest mit einem kompatiblen Test-Harness, **kein** Node-`node:test`-Kommando und **kein** Supabase-/SQL-Integrationstest. Das SQL wurde weiterhin **nicht** gegen einen isolierten Postgres-Server ausgeführt und ist **nicht** migrationsfreigegeben.

## Sicherheitsgrenze

1. `schema-draft.sql` ist **kein** aktives `supabase/migrations/`-Artefakt. Vor tatsächlicher Anwendung in Staging muss der offizielle Migrationsworkflow und Schema-/Policy-Review erfolgen.
2. `toolya_rewards.record_verified_first_box(p_user_id)` validiert **nicht selbst**, ob eine neue Kiste gespeichert wurde. Es ist ausschließlich der **interne** transaktionale Grant-Baustein für einen noch fehlenden vertrauenswürdigen Beleg. **Niemals direkt aus Browser/öffentlicher API aufrufbar machen.**
3. `service_role` darf nur im geschützten Backend verwendet werden; niemals im statischen Toolya-Frontend, GitHub-Pages-JS oder Nutzergerät.
4. Das bestehende `public.user_data` wird nicht verändert, und sein `toolya_save_snapshot` bleibt unangetastet.
5. Der Pilot `moving.first_box_saved.v1` ist **einmalig** und vergibt **20 XP / 10 KP Organisation**. Die anderen acht Badges können erst durch verifizierte weitere Events entstehen.
6. `rules.mjs` ist eine **Leseprojektion / Testhilfe**; die Funktion darf keine Clientereignisse autorisieren.
7. Default-Verhalten: *kein* Rewards-Grant, solange kein Fach-Event durch einen vertrauenswürdigen Serverprozess belegt ist.

## Noch zu implementieren

- Echter geprüfter Server-Beleg und überprüfter Worker/Edge-Funktions-Einstieg, ohne manipulierbare Clientfreigabe.
- Sicheres konto-eigenes Read-API (private Tabellen bleiben aus Data API ausgeschlossen).
- Staging-Testprojekt oder lokal gestartetes Supabase, reale SQL-Integrations- und RLS-/Parallelitätstests.
- Produktive Frontend-Integration nach Freigabe, Demo-UI ohne Beispielwerte.
- Datenlösch-/Exportprozesse und Datenschutzprüfung, Regression aller zwölf Tools.

**Ausschluss:** Kein Ranking, keine Mystery-Videos, kein Ko-fi-XP, keine zusätzlichen Levels.


## Bridge-Adapter für Umzugskisten (23.11.2026)

- [`moving-first-box-bridge.mjs`](moving-first-box-bridge.mjs) — fachlicher Validator für den **ersten** verifizierten Save-Übergang von null auf eine Kiste, Revision +1, bestehender Standort, gültiger Name, kein Migrationsflag. Ruft anschließend nur eine injizierte **interne** idempotente Grantfunktion auf. Übergibt **keine** Kisteninformationen.
- [`moving-first-box-bridge.test.mjs`](moving-first-box-bridge.test.mjs) — elf zusätzliche Unit-Testfälle zu Erfolgen, Fehlversuchen, Edit/Delete, Migration, Revision, Standort, Datenschutz und Deduplizierung.
- **Laufzeitprüfung:** 20/20 Tests (11 Bridge + 9 Regelkern) aus den auf GitHub gespeicherten Quellen mit einem isolierten JavaScript-V8-Harness bestanden. Zusätzlich 12 gezielte interaktive Szenarien im selben Harness erfolgreich. **Nicht** identisch mit einem echten Node.js-/Supabase-Stagingtest.
- **Wichtige Grenze:** Der Bridge-Code enthält bewusst keine öffentliche HTTP-Funktion und keine direkte Verbindung zur Live-Website. Ein Attacker könnte frei gewählte Browser-Snapshots und `persistenceConfirmed=true` behaupten. Die Bridge darf deshalb **nur** von einem noch zu implementierenden kontrollierten Serverprozess mit **serverseitig ermitteltem** Vorher-/Nachher-Zustand und verifiziertem Persistenzbeleg aufgerufen werden. Browser-/DOM-Events sind keine Belege. Ohne diesen Prozess: kein Grant.

Zusätzlicher Testbefehl für eine später geklonte lokale Arbeitskopie:

```sh
node --test prototypes/rewards-v1-backend/*.test.mjs
```



## Geschützter First-Box-Endpunkt (Entwurf vom 23.11.2026)

**Zusätzliche Dateien:**
- [`first-box-transaction-draft.sql`](first-box-transaction-draft.sql): **nicht ausgeführte**, transaktionale SQL-RPC für eine einfach angelegte erste Kiste; sperrt und liest `public.user_data` serverseitig, kontrolliert Benutzerkonto/Revision/Standort/Leere der bisherigen Kistenliste, erstellt serverseitig genau eine minimale Kiste und schreibt die einmalige Rewards-Gutschrift im selben Transaktionspfad. `EXECUTE` ausschließlich `service_role`; RLS und bestehende `toolya_save_snapshot` bleiben unangetastet.
- [`edge-first-box-draft.ts`](edge-first-box-draft.ts): **nicht deployter** Supabase-Edge-Function-Entwurf. Prüft die Supabase-Bearer-Session über `getUser`, weist anonyme Nutzer ab, kontrolliert HTTP-Methode, erlaubte Origins, Body-Größe und strikt drei Eingabefelder (`expectedRevision`, `locationId`, `boxName`). Leitet die geprüfte Benutzer-ID an die interne service-role-only RPC weiter. Keine vom Client gelieferten XP/KP-Werte, Snapshots oder Reward-Belege.

**Prüfergebnis:** 11/11 isolierte HTTP-Verhaltensprüfungen mit gemocktem Auth-/RPC-Dienst in einer JavaScript-V8-Testumgebung erfolgreich (OPTIONS 204, POST-only, CORS-Origin, fehlende JWT, zurückgewiesenes XP-Feld, ungültiger Standort/Kistenname, gültige Antwort, private RPC- und Auth-Bindung). Drei SQL-Code-Invarianten geprüft: Transaktionssperre + Revisionskontrolle, interner Grant-Aufruf und entzogene öffentlichen EXECUTE-Rechte. **Kein echter Deno-/Node- oder PostgreSQL-Staging-Integrationstest.**

**Grenzen und Risiken:**
1. Es handelt sich um einen **separaten, stark vereinfachten** Anlegeweg: nur Kistenname und Standort. Die bisherige reichhaltige Umzugskistenmaske unterstützt auch Beschreibung, Wert, Tag, Barcode, Ablaufdatum, Unterartikel und Foto. Diese Funktionen sind im Entwurf **nicht** abgedeckt. Vor einer späteren Integration muss ein kompatibler, datensicherer Save-Pfad definiert werden.
2. `user_data` erlaubt angemeldeten Nutzern weiterhin direkte eigene JSON-Schreibzugriffe. Kein Beweis realer physischer Arbeit; einmalige Low-Stakes-Gutschrift statt Farming pro Kiste.
3. Eine Rewards-/SQL-Transaktionsstörung lässt **diesen neuen Pilot-Endpunkt** fehlschlagen; die reguläre aktuelle Tool-Speicherung bleibt unberührt. Vor Integration sind Fehlerverhalten, Retries und möglicher reiner Tool-Save-Fallback ausdrücklich zu prüfen.
4. Die SQL-Entwürfe sind **keine aktiven Migrationen** und wurden nicht angewendet. Die Edge Function ist nicht in `supabase/functions/` eingecheckt, nicht deployt und nicht in `main` eingebunden.
5. `service_role`-Schlüssel ausschließlich als Supabase-Edge-Secret; niemals Client, Github-Pages-JavaScript oder App-Payload. Die Origin-Prüfung ergänzt die JWT-Prüfung, ersetzt sie aber nicht.
6. Vor Staging mit echten Supabase-Migrationskommandos: aktuelle Dokumentation prüfen, SQL-Parser/Schema/RPC-Signaturen und RLS-Rechte isoliert testen, kritische Fehlerpfade und gleichzeitige Requests prüfen.



## Vollständiger Kistenvertrag und Cache-Reconciliation (23.11.2026)

**Neue, nicht produktive Komponenten:**
- [`moving-box-contract.mjs`](moving-box-contract.mjs) und [`moving-box-contract.test.mjs`](moving-box-contract.test.mjs): Der geplante Endpoint nimmt **alle neun originalen Felder** aus `storeBoxData` an: `name`, `desc`, `value`, `tag`, `barcode`, `expiry`, `lentTo`, `subItems`, `photo`. Zusätzlich erwartet er die vorhandene Cloud-`expectedRevision` und `locationId`; Benutzer-ID und XP bleiben ausschließlich serverseitig. Maximal 4 MB Request und 3 MB Foto-Daten-URL, begrenzte Textlängen und Teilobjekte. Ein nicht unterstütztes Fotoformat (z. B. GIF/HEIC) oder größere Dateien dürfen **nicht** stillschweigend zerstört werden: bestehende Tool-Speicherung beibehalten, dafür kein Rewards-Pilot.
- [`moving-first-box-ui-adapter.mjs`](moving-first-box-ui-adapter.mjs) mit [Tests](moving-first-box-ui-adapter.test.mjs): Ergänzt optional den ersten Cloud-Kisten-Save, nur wenn der Cache zuvor keine Kiste enthielt. Nach dem Endpunkt-Aufruf muss `controller.load()` die neue Revision / Kisten-ID bestätigen. Bei fehlender Serverantwort ist der Ausgang **ungewiss**; kein automatischer neuer Save, kein versprochenes XP, Datenstand erneut laden. Auth-Kontowechsel vor/nach Save abweisen.
- [`edge-first-box-draft.ts`](edge-first-box-draft.ts) und [`first-box-transaction-draft.sql`](first-box-transaction-draft.sql) wurden auf den vollständigen Vertrag mit `p_box jsonb` umgestellt. Die SQL-RPC schreibt die neun Felder und beachtet das bekannte Snapshot-Größenlimit; `toolya_save_snapshot` und RLS bleiben unverändert.

**Laufzeitprüfungen:** 8/8 gespeicherte Contract-Unit-Tests, 8/8 gespeicherte Cache-Adapter-Tests und 13/13 simulierte Edge-HTTP-Verhaltenstests erfolgreich in einer isolierten JS-V8-Testumgebung mit gemockten Auth-/RPC-Diensten. Die bereits zuvor geprüften Bridge-/Regeltests bleiben unabhängig davon bestehen. **Kein echter Deno-HTTP-Server, keine PostgreSQL-Instanz und kein Ende-zu-Ende-Supabase-Staging-Test wurde ausgeführt.**

**Noch offen:** Eine vollständige Produktintegration erfordert besonders die Wahl des UI-Pfads für bestehende sehr große oder nicht unterstützte Fotos, Anlegen der erforderlichen Kisten-/Standortdaten im Serverpfad, Absicherung aller RPC-Rechte, SQL-Staging-/Parallelitätsprüfung sowie den Umgang mit einem Konto-/Netzwerkwechsel während des Speicherns. Die jetzigen Dateien sind **kein** aktiver Deployment-Einstiegspunkt. Die produktive UI verwendet weiterhin den bisherigen `saveBox → storeBoxData → saveData`-Weg.

