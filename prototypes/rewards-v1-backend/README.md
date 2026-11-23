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

**Verifikationsstatus:** Quelldateien auf GitHub gespeichert und per Read-back kontrolliert. **Der Node-Testlauf konnte in dieser Sitzung nicht auf den geklonten Repository-Dateien ausgeführt werden**, da der lokale Container keinen Zugriff auf das GitHub-Raw-Repository hatte. Die beigefügten Tests sind vorhanden, aber **noch nicht als bestanden zu behaupten**. Das SQL wurde noch **nicht** gegen einen isolierten Postgres-Server ausgeführt und ist **nicht** migrationsfreigegeben.

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
