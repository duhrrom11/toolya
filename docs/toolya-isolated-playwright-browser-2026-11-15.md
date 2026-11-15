# Isolierte Playwright-Cloud-Prüfung

Der Featurebranch enthält `tests/browser/cloud-isolated.spec.cjs` und `playwright.config.cjs`.

## Ausführung

Im Repository mit installierten Entwicklungsabhängigkeiten:

```bash
npx playwright test --config=playwright.config.cjs
```

Playwright startet `scripts/home-preview.cjs` auf `127.0.0.1:4173`. Falls der Chromium-Browser nicht durch Playwright installiert ist, `npx playwright install chromium` ausführen oder `TOOLYA_CHROMIUM_PATH` auf eine lokale Chromium-Binärdatei setzen.

## Sicherheitsgrenzen

- Browser-Anfragen außerhalb des lokalen Preview-Ursprungs werden abgebrochen.
- Authentifizierung, Datenbankabfragen und RPC-Speicherung sind ausschließlich In-Memory-Mocks.
- Kein Supabase-Projekt, kein Benutzerkonto und keine produktiven Datensätze werden angesprochen.
- Beide Cloud-Adapter werden im echten Browser mit den unveränderten Shared-Modulen geladen.
- Die Tests prüfen den Modulpfad, **nicht** die komplette Bedienoberfläche von Autokosten/Haushaltsbuch.
- Kein Merge, kein Deployment.

## Nachweisstatus

Tests wurden im Featurebranch erstellt, jedoch in dieser Sitzung **nicht** als Playwright-Lauf ausgeführt: Der verfügbare Container besitzt zwar Chromium und Python-Playwright, aber weder eine lokale Kopie des privaten Toolya-Repositories noch die Node-Playwright-Abhängigkeit. Kein bestandener Browser-Test wird behauptet.
