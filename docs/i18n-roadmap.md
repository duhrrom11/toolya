# Toolya – Roadmap für die englische Übersetzung (DE/EN)

Stand: 2026-11-21 · PR #291 · Nur Entwicklungsbranch, kein Merge/Deployment.

## Projektstatus
- Aktueller geprüfter Implementierungsstand vor diesem Roadmap-Commit: `dd413ec486973d66d7075223afd3284949ec1a3b`; 9 von 9 GitHub-Actions-Workflows erfolgreich.
- Die englischen Startseiten und vier Tool-Einstiege sind vorhanden. Die Tool-Oberflächen sind noch nicht durchgängig übersetzt; englische öffentliche Inhalte bleiben vorerst `noindex`.
- Gesamtfortschritt **ca. 60 % (Planungsschätzung, nach Budget- und Pflanzendialog-Lokalisierung)**, nicht automatisch gemessen: Summe aus Paketgewicht × geschätztem Teilfortschritt, 59,0 % gerundet. Diese Zahl ist keine Aussage über Testabdeckung oder Releasefähigkeit.
- Datenbanken, Supabase-Berechtigungen, gespeicherte Objekte, Sprach-unabhängige Maskottchen-Einstellung und produktive Seiten bleiben unangetastet.

## Sechs gebündelte Arbeitspakete

| Paket | Gewicht | Geschätzt erledigt | Zustand | Abnahmekriterium |
|---|---:|---:|---|---|
| 1. Sprachsystem & technische Grundlage | 15 % | 100 % | fertig | DE/EN-Umschaltung reversibel; Präferenz unabhängig; bestehende Daten/Maskottchen unverändert |
| 2. Englische Startseiten & Ratgeber | 15 % | 80 % | weitgehend | Vier Ratgeber, Startseite und Rechner vollständig redigiert, zugänglich, funktionale Links |
| 3. Vier Tool-Oberflächen | 30 % | 74 % | aktiv | Umzugskisten, WG, Pflanzen und Backstudio komplett übersetzt: statische und dynamische Zustände, Formulare, Aktionen, Hilfen |
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

## Sprint A – erstes gebündeltes Umsetzungspaket (2026-11-21)

**Branch:** `feature/i18n-de-en-foundation-20261121` · **Scope:** Nur Oberflächentexte und isolierte Tests, nicht Produktion.

- **110 zusätzliche source-exakte feste Übersetzungspaare** in `shared/toolya/i18n/interface.mjs`: Umzugskisten **25**, WG **50**, Pflanzen **8**, Backstudio **27**. Sie betreffen Standort-/Inventarfilter, Kategorien, Finanz- und Haushaltformulare, Pflanzenlicht/-vermehrung, Backformwahl und Kostenoptionen.
- Die bisherigen UI-Handler, expliziten `value`-Attribute, Datenspeicher-Keys, Original-Maskottchen, Formeln, Währung und Auth bleiben unberührt.
- Regressionstests prüfen die Sprachumstellung DE → EN → DE in vier Tools, erhaltene Inputwerte, `onclick`-Handler und implizite Optionswerte in deutscher Quellsprache (kein Übersetzen der gespeicherten Filter-/Tag-Keys).
- Das erste statische Sprint-A-Teilpaket erhöhte die Schätzung für Paket 3 von 65 auf 68 %. Nach den anschließenden WG-Finanzarbeiten beträgt sie **69 %**; global **58,7 %, gerundet 59 %**. Das ist kein Abschlussnachweis für Sprint A.
- Die neun GitHub-Workflows für den vorherigen Implementierungsstand `dd413ec4` waren vollständig grün. Der neue Sprint-A-Testlauf für den finalen HEAD muss eigens erfolgreich abschließen, bevor weitere Freigaben behauptet werden.

**Sprint A noch offen:** Restliche feste Elemente mit verschachtelten Icons/HTML, dynamische UI-Meldungen aus Inline-/externen Skripten, alle verbliebenen Dialog-/Validierungszustände, systematische Vollabdeckung der vier Tools und echte Browser-Semantik-/Mobilprüfungen. Das folgende Sprint-B-Auth-/Exportpaket ist ebenfalls noch offen.

**Release-Gate unverändert:** PR bleibt Draft; kein Merge, Deployment, SEO-Indexierungswechsel und keine Supabase-Änderungen.

## Sprint A – dynamische WG-Finanzansichten (2026-11-21)

- **WG-Finanzstatistik:** Gesamt-Einnahmen, Ausgaben, Saldo und Inventarwert sowie Inventar-, Sparziel- und Vertragskarten verwenden bei EN eine Anzeige mit `en-GB`-Dezimal-/Tausendertrennzeichen, bei DE weiterhin die vorherige `toFixed(2)`-Darstellung.
- Das Cashflow-Diagramm aktualisiert seine zwei Achsenbeschriftungen bei einem Sprachwechsel ohne Neuanlage der Diagramminstanz. Neun fest bekannte Kategorien erhalten reine EN-Anzeigenamen im Diagramm und im Screenreader-Zusammenfassungstext; gespeicherte Kategorien (`Lebensmittel`, `Verträge` usw.) und frei definierte Kategorien bleiben original.
- Neue Regressionstests für die isolierte Anzeigenformatierung, Rückwechsel nach DE, negative und Null-Beträge, sichere unbekannte Kategorien, erhaltene Daten-Keys und den bestehenden Schutz vor einem Sprachwechsel-Rendern nicht geladener Haushalte.
- **Fortschrittsschätzung Paket 3: 69 %; Gesamt: 59 % gerundet.** Keine Abnahme von Sprint A oder Auth/Export/SEO.
- Für den endgültigen Commit ist eine neue vollständige CI notwendig; vorzeitige „alle Tests grün“-Aussagen sind nicht zulässig.

## Sprint A – Pflanzenpflege und Backstudio: dynamische Zahlenanzeigen (2026-11-21)

- **Pflanzenpflege:** ROI-Gewinn, Ernte-/Kosten-Zusammenfassung sowie angezeigtes Zisternenvolumen, heutiger Wasserbedarf und Erntestatistik verwenden im englischen UI sprachgerechte Zahlenformate (`en-GB`); die bisherige deutsche Zahlendarstellung bleibt erhalten.
- **Backstudio:** Angezeigte Backzeit (`min`), Kosten und Stückbreite werden englisch formatiert. Der interne Wert in `#res-factor` bleibt als `toFixed(2)` bewusst maschinenlesbar, da die Rezeptberechnung diesen Wert per `parseFloat` erneut ausliest.
- Zwei neue isolierte Regressionstests prüfen Englisch/Deutsch, negative und größere Zahlen, unveränderte ROI-Formeln sowie den unberührten Umrechnungsfaktor.
- **Fortschrittsschätzung Paket 3: 70 %; Gesamt: 59,0 %** nach gewichteter Roadmap. Noch keine Sprint-A-Abnahme: dynamische Freitexte/States, übrige vier Tool-Flows und mobile End-to-End-Prüfung fehlen.
- Keine Cloud-/Supabase-Änderung, kein Merge/Deployment, englische öffentliche Seiten bleiben `noindex`. Für den endgültigen HEAD müssen alle CI-Workflows erneut erfolgreich sein.

## Sprint A – Sprachwechsel in bereits geöffneten Tool-Dialogen (2026-11-21)

- **Pflanzenpflege:** Wenn die Cloud-Daten erfolgreich geladen sind, aktualisiert der Wechsel DE ↔ EN zusätzlich bereits geöffnete Dialoge für ROI, Zisterne, Beetbelegung und Fotogalerie. Dazu werden ausschließlich die vorhandenen Render- und Berechnungsfunktionen verwendet; keine Änderung an Nutzereingaben, Pflanzen-IDs oder gespeicherten Datensätzen.
- **Backstudio:** Der Sprachwechsel ruft zusätzlich `calculateAll()` zur Aktualisierung der sichtbaren Umrechnungs- und Backzeit-Ergebnisse auf, nicht `convertRecipe()` oder `saveRecipeToStorage()`. Der maschinenlesbare Faktor bleibt weiterhin numerisch mit Punkt, damit `parseFloat` korrekt bleibt.
- Isolierte Regressionstests prüfen die sichtbaren und noch nicht geladenen Pflanzenansichten, unveränderte Speicher-/Cloud-Pfade sowie die aktualisierten Backstudio-Ergebnisse und Timer.
- **Paket 3 geschätzt 71 %, Gesamt 59,3 % (gerundet 59 %)**. Die Werte bleiben Planungsannahmen; der Sprint gilt noch nicht als abgeschlossen.
- Verbleibend in Sprint A: weitere dynamische Renderzustände insbesondere im WG-Organisator, Pflanzen-/Backstudio-Sonderdialoge, das vollständige Durchlaufen sämtlicher Tools und ein englischer Browser-E2E-Nachweis.
- Kein Merge, Deployment, Eingriff in Supabase, Entfernen von `noindex` oder Veränderung produktiver Daten.

## Sprint A – Mischkultur und Backhelfer im laufenden Sprachwechsel (2026-11-21)

- **Pflanzenpflege:** Bekannte feste Mischkultur-Empfehlungen zeigen bei EN auch die Pflanzen- und Kräuternamen auf Englisch an. Neben deutschen Stichwörtern werden ausdrücklich auch `tomato`, `carrot` und `strawberry` als sichere Suchaliasse erkannt. Deutsche Bestandswerte und der frei eingegebene Artenname bleiben unangetastet. Ein bereits sichtbarer Mischkultur-Hinweis wird bei DE ↔ EN aktualisiert.
- **Backstudio:** Bereits berechnete Hinweise für Zuckerersatz, Raumklima und Formenfinder werden beim Sprachwechsel gezielt neu aufgebaut; noch nicht berechnete Ergebnisse bleiben leer. Die speichernde Funktion `calculateRecipe()` wird bei einem Sprachwechsel nicht ausgeführt.
- Zwei neue isolierte Regressionstests prüfen Quelltext-Erkennung, die Rückumschaltung und unveränderte Eingaben sowie das gezielte Neurendern der Backhelfer ohne Rezept-Persistenz.
- **Paket 3: geschätzt 72 %; Gesamt: 59,6 % (gerundet 60 %).** Keine Vollständigkeits- oder Release-Freigabe. Für den letzten Commit sind alle CI-Workflows zu prüfen.
- **Noch offen:** Weitere dynamische Texte, Sonderfälle bei Dialogen/Fehlerzuständen, vollständige DE/EN-End-to-End-Journeys aller Tools, Staging-Auth und abschließende Browser-/Sicherheits-/SEO-Gates.

## Sprint A – dynamische WG-Budgetkarten (2026-11-21)

- Bei einem Sprachwechsel wird der bereits bestehende `renderApp()`-Pfad genutzt, um die Beschriftungen aller neun fest definierten Budgetkategorien und die angezeigten Ausgaben- und Grenzbeträge im Budget-Fortschrittsbereich in der gewählten Sprache darzustellen.
- `formatHouseholdCategoryLabel(cat)` übersetzt nur den sichtbaren Kategorietext; die Budget-/Ausgaben-Lookups verwenden weiterhin die originalen `budgets[cat]`- und `categoryExpenses[cat]`-Schlüssel. Frei definierte Kategorien bleiben unverändert und die Darstellung erfolgt weiterhin HTML-escaped.
- `formatHouseholdDisplayAmount` passt Beträge nur im englischen UI an und erhält die zuvor bestehende deutsche Darstellung.
- Neuer Regressionstest überprüft neun Kategorien über die vorhandene Mapping-Funktion, Beispielwerte, unveränderte unbekannte Kategorien, sichere Anzeige und Original-Schlüssel.
- **Paket 3 geschätzt 73 %, Gesamt 59,9 % (gerundet 60 %).** Sprint A noch nicht vollständig abgenommen. End-to-End- und finale CI-Gates stehen aus.
- Produktivdatenbank, Maskottchen, `main`, SEO-Indexierung und Live-Deployment bleiben unverändert.

## Sprint A – WG-Budgetanzeigen und Pflanzen-Fehlerdialoge (2026-11-21)

- Die WG-Budgetkarten verwenden jetzt sowohl übersetzte Kategorienamen als auch sprachabhängig formatierte Ausgaben und Grenzbeträge; Zuordnung, Grenzwertberechnung und Budget-Datenschlüssel sind unverändert.
- Pflanzenpflege übersetzt zwei zusätzliche konkrete Fehlerfälle: nicht verarbeitbares Pflanzenfoto (keine Speicherung) und misslungene Vergabe einer eindeutigen Pflanzen-ID. Unbekannte Fehler-/Servertexte werden nicht heuristisch verändert.
- Zwei ergänzende Regressionstests prüfen Anzeige- und Datengrenzen sowie die deutsche/englische Dialogzuordnung.
- **Paket 3 geschätzt 74 %, Gesamt 60,2 % (gerundet 60 %).** Sprint A weiterhin nicht vollständig abgenommen; vollständige dynamische Abdeckung und Ende-zu-Ende-Browserprüfung stehen aus.
- Der letzte zuvor geprüfte Stand `1a10e9a7` hatte bei der Abfrage acht erfolgreiche und einen noch laufenden isolierten Browserworkflow; der endgültige Commit dieses Pakets erfordert einen eigenen grünen CI-Lauf.
- Kein Merge, Deployment, Supabase-Eingriff oder öffentliches Indexieren englischer Seiten.
