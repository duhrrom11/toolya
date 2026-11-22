# Architektur und Projektgrenzen

Stand: 2026-11-22. Repository-Einstieg auf main geprüft: README.md und package.json; weitere technische Einzelheiten aus früheren Projektverläufen, daher vor Eingriff aktuell verifizieren.

| Bereich | Dokumentierter Stand | Prüfhinweis |
|---|---|---|
| Source | github.com/duhrrom11/toolya | main ist produktionsrelevant; Dokumentation auf eigenem Branch |
| Website | https://toolya.app | GitHub Pages laut README |
| Backend | Eigenständiges Toolya-Supabase-Projekt | Projektkennung laut README: `yheogmeaosuigyaxkwth`; keine Secrets dokumentieren |
| Legacy | duhrrom11/Helferlein | nicht verändern oder Daten automatisch migrieren |
| Tools | zwölf Alltagstools laut README | tatsächliche Route-/Featureliste aus aktuellem Code inventarisieren |
| Wishlist | /tools/wishes/ mit Amazon-Importer | öffentliche /tools/wishes/public.html und private Profile unterscheiden |
| Dashboard | /dashboard/ | Account-/Privatdaten schützen |
| Connect | kontrollierte toolübergreifende Transfers | Tabellen/RPC/Status vor Produktivbehauptungen prüfen |
| Tests | package.json: Node-, Connect- und Playwright-Skripte | nur passende Tests ohne produktive Datenmutation |

## Sicherheitsgrenzen
- Keine produktiven Testdatensätze, Migrationsversuche oder Auth-E2E mit echten Nutzerdaten für eine Dokumentationsarbeit.
- Keine Secrets, Zugangstoken oder personenbezogene Datensätze in öffentlich zugängliche Dokumentation.
- RLS, Auth-Redirects, Lösch-/Sichtbarkeitsregeln und Consent vor jeder funktionalen Änderung prüfen.
- Eine CI-Grünmeldung beweist nur die tatsächlich geprüften Szenarien.

## Quellen
- `README.md` und `package.json` auf main, gelesen am 2026-11-22.
- `docs/audits/toolya-master-audit.md` und `docs/audits/toolya-roadmap.md`, beide mit historischen Ständen vom 18.11.2026.
- Frühere Projektentscheidungen vom 13.–21.11.2026; Details ohne aktuellen Repository-Nachweis als historisch behandeln.
