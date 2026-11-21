# Toolya – Roadmap für die englische Übersetzung (DE/EN)

Stand: 2026-11-21 · PR #291 · Nur Entwicklungsbranch, kein Merge/Deployment.

## Projektstatus
- Aktueller geprüfter Implementierungsstand vor diesem Roadmap-Commit: `dd413ec486973d66d7075223afd3284949ec1a3b`; 9 von 9 GitHub-Actions-Workflows erfolgreich.
- Die englischen Startseiten und vier Tool-Einstiege sind vorhanden. Die Tool-Oberflächen sind noch nicht durchgängig übersetzt; englische öffentliche Inhalte bleiben vorerst `noindex`.
- Gesamtfortschritt **ca. 58 % (Planungsschätzung)**, nicht automatisch gemessen: Summe aus Paketgewicht × geschätztem Teilfortschritt, 57,5 % gerundet. Diese Zahl ist keine Aussage über Testabdeckung oder Releasefähigkeit.
- Datenbanken, Supabase-Berechtigungen, gespeicherte Objekte, Sprach-unabhängige Maskottchen-Einstellung und produktive Seiten bleiben unangetastet.

## Sechs gebündelte Arbeitspakete

| Paket | Gewicht | Geschätzt erledigt | Zustand | Abnahmekriterium |
|---|---:|---:|---|---|
| 1. Sprachsystem & technische Grundlage | 15 % | 100 % | fertig | DE/EN-Umschaltung reversibel; Präferenz unabhängig; bestehende Daten/Maskottchen unverändert |
| 2. Englische Startseiten & Ratgeber | 15 % | 80 % | weitgehend | Vier Ratgeber, Startseite und Rechner vollständig redigiert, zugänglich, funktionale Links |
| 3. Vier Tool-Oberflächen | 30 % | 65 % | aktiv | Umzugskisten, WG, Pflanzen und Backstudio komplett übersetzt: statische und dynamische Zustände, Formulare, Aktionen, Hilfen |
| 4. Konten, Datenwege & Exporte | 20 % | 35 % | teilweise | Auth inklusive Recovery, erlaubte Redirects, Datenkonflikte, PDF/QR/CSV/Import/Export in EN und DE E2E |
| 5. Qualitätssicherung & Sicherheit | 10 % | 40 % | aktiv | vollständige E2E-Tests, 320px/mobile, Keyboard, Screenreader, Auth-Sicherheit, abschließend alle CI erfolgreich |
| 6. SEO-Freigabe & Veröffentlichung | 10 % | 0 % | gesperrt | hreflang, Canonicals, Sitemap, OG/JSON-LD, noindex nur nach Freigabegates aufheben, kontrollierter Release |

Die Prozentwerte sind **heuristische Planungswerte**, keine gezählten fehlenden Strings. Ab sofort wird ein Paket erst auf 100 % gesetzt, wenn sein Abnahmekriterium nachgewiesen ist.

## Empfohlene Ausführungsreihenfolge in gebündelten Sprints

### Sprint A – Tool-Oberflächen vollständig lokalisieren (Paket 3)
1. Pro Tool den noch verbliebenen Textbestand gegen DE/EN-Kataloge prüfen; bekannte UI-Texte mit stabilen Schlüsseln bzw. source-exakten Zuordnungen statt generischer Freitext-Übersetzung.
2. Zunächst Umzugskisten und WG: Inventar/Karten/Filter, Validierung, dynamische Fehler, Dialoge, Hilfe, mobile Ansichten.
3. Dann Pflanzen und Backstudio: Saison- und Gießmeldungen, Saatgut-/Lageranzeigen, Timer, OCR, Rezept- und Kostenberechnung.
4. Für jedes Tool getrennte Tests für Sprachwechsel EN→DE, erhaltene Eingaben, unveränderte gespeicherte Schlüssel/Handler und 320px-Layout. Kein heimliches Übersetzen von Nutzerfreitext.

### Sprint B – Authentifizierung und Daten-/Exportpfade (Paket 4)
1. Einheitlich Registrierung, Login, Logout, Sitzung ohne Login, E-Mail-Verifizierung, Passwortreset, Netzwerk- und Supabase-Fehler.
2. Sprachwahrung auf Rückleitungen mit strikt erlaubten Redirect-URLs; keine neue RLS/Backend-Struktur ohne notwendigen Nachweis.
3. PDFs, QR-/Drucklabels, CSV-Export und Backup/Import inklusive Dialogen und maschinenlesbaren Formaten prüfen.
4. Formate per Intl und gewählte Einheiten/Währung anzeigen, aber numerische Speicherdaten und Datenformate nicht ändern.

### Sprint C – Qualitäts- und Abschlussprüfung (Pakete 2 & 5)
1. Englischsprachige End-to-End-Journeys je Tool mit isolierten synthetischen Daten prüfen: Gast, Konto, Fehlerfälle, Export und Wiederkehr.
2. Accessibility / Screenreader / Tastatur / kleine Displays; keine Überläufe oder falsches `lang` auf vollständig EN-Inhalten.
3. Englische Ratgeber redigieren, Links prüfen; bestehende deutsche Routen, CI und Maskottchenwahl regressionsprüfen.
4. Vor Freigabe alle relevanten Workflows am **endgültigen** Head erfolgreich.

### Sprint D – SEO, Rollout und Abschluss (Paket 6)
1. Erst nach Abnahme und funktionierenden EN-Journeys: Canonical-/hreflang-Paare, Sitemap, OG und JSON-LD, gezielte `noindex`-Entfernung bei öffentlichen EN-Seiten; private Tools weiterhin passend `noindex`.
2. Auth-/Tracking-Redirects, Consent und produktive Backend-Zuordnung prüfen.
3. Branch mit aktuellem `main` versöhnen; Code-Review, Sicherheitsfreigabe, danach erst Merge/Deployment.
4. Nach Release Indexierung, Fehler und DE/EN-Nutzerwege prüfen, ohne reale Nutzerdatentests zu erzeugen.

## Fortschrittsregel für weitere Arbeiten
- Jede Änderung wird einem Paket und einem der vier Tools zugeordnet.
- Nach jedem Umsetzungspaket: Commit, Regressionstests, GitHub CI, aktualisierte Restpunkte und nachgewiesene Abnahme.
- Keine Prozentzahl allein aus Anzahl der Commits ableiten.
- Sicherer Release-Gate: **alle 6 Pakete abgenommen, 9/9 finale CI erfolgreich, Auth-/E2E-/SEO-Gates erfüllt**.
