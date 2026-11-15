# Toolya: Tool-Inventar für Cloud-only-Migration

Stand: statische Codeinspektion im Repository, keine Laufzeittests. Die Existenz eines Cloud-Bridge-Moduls beweist **nicht**, dass sämtliche Daten ausschließlich in Supabase liegen.

| Werkzeug | Einstieg | Daten-/Sonderfall | Cloud-only-Status |
|---|---|---|---|
| Wishlist | `tools/wishes/index.html` → `public.html` | Öffentliche Wunschlisten/Share-Links; zusätzliche Wishlist-Routen separat prüfen | Sonderprüfung |
| Haushaltsbuch | `tools/budget/index.html` | `kassenbon_data`, `budgetbuch_budgets`, `budgetbuch_goals`; Opt-in-Cloud-Bundle | Migration nötig |
| Umzugskisten | `tools/moving/index.html` | `mini_homebox_pro`; Opt-in-Cloud-Bridge | Migration nötig |
| Pflanzenpflege | `tools/plants/index.html` | `pflanzen_pass_v10`; Frostwarnungsstatus lokal; Cloud-Bridge | Migration nötig |
| WG-Organisator | `tools/housemates/index.html` | WG-Mitglieder, Freigaben, zahlreiche lokale `wg_*`-Keys | Sonderprüfung |
| Digitaler Nachlass | `tools/estate/index.html` | Verschlüsselter Tresor, gesonderte Besitzer-/Erbenlogik, strikte CSP | Sonderprüfung |
| Autokosten | `tools/car/index.html` | `kfz_tracker_pro_v3`; Opt-in-Cloud-Bridge | Migration nötig |
| Tiergesundheit | `tools/pet-health/index.html` | `haustier_pass_pro_v5`; Opt-in-Cloud-Bridge | Migration nötig |
| Parkplatz-Merker | `tools/parking/index.html` | `park_end_time`, `park_history_pro_v3`; Timer-Sonderfall | Migration nötig |
| Verliehene Dinge | `tools/loans/index.html` | `verleih_tracker_pro_v3`; Opt-in-Cloud-Bridge | Migration nötig |
| Zählerstände | `tools/meters/index.html` | `energie_tracker_pro_v8`; Opt-in-Cloud-Bridge | Migration nötig |
| Backform-Rechner | `tools/baking/index.html` | `helperly_recipes_pro`; Rezepte persistent, Berechnung ggf. flüchtig | Migration nötig |

## Grundsatz

- Authentifizierung auf jedem privaten Werkzeug: Supabase `auth.getUser()`, Fail-closed bei nicht verifizierter Session. Eine clientseitige Anzeige-Sperre allein ersetzt **keine** RLS.
- Öffentliche Marketingseite bleibt öffentlich. Öffentlich geteilte Inhalte, WG-Einladungen und Nachlass-Zugänge werden als explizite, sicherheitsgeprüfte Ausnahmen behandelt.
- Alle **persistenten persönlichen** Daten liegen nach der Umstellung in Supabase. Ein rein flüchtiger UI-Zustand oder Timer ist kein eigenständiger Datenspeicher; persistente Timer-/Historienzustände sind dagegen zu migrieren.
- Lokale Altdaten bis zur bestätigten Migration unangetastet lassen; Backup und Readback sind Pflicht.
- Für die Wishlist alle tatsächlichen Unterseiten und Policies separat auditieren. Nicht pauschal `public.html` blockieren.
