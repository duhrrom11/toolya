# Toolya – Roadmap für die englische Übersetzung (DE/EN)

Stand: 2026-11-21 · PR #291 · Nur Entwicklungsbranch, kein Merge/Deployment.

## Projektstatus
- Letzter vor diesem neuen Paket vollständig geprüfter Stand: `c69838dd` (9/9 CI erfolgreich). Für jeden neueren HEAD ist ein eigener CI-Nachweis erforderlich.
- Die englischen Startseiten und vier Tool-Einstiege sind vorhanden. Die Tool-Oberflächen sind noch nicht durchgängig übersetzt; englische öffentliche Inhalte bleiben vorerst `noindex`.
- Gesamtfortschritt **ca. 63 % (Planungsschätzung)**, nicht automatisch gemessen: Summe der Paketgewichte × geschätztem Teilfortschritt = **63,3 %**, gerundet 63 %. Diese Zahl ist keine Aussage über vollständige Testabdeckung oder Releasefähigkeit.
- Datenbanken, Supabase-Berechtigungen, gespeicherte Objekte, Sprach-unabhängige Maskottchen-Einstellung und produktive Seiten bleiben unangetastet.

## Sechs gebündelte Arbeitspakete

| Paket | Gewicht | Geschätzt erledigt | Zustand | Abnahmekriterium |
|---|---:|---:|---|---|
| 1. Sprachsystem & technische Grundlage | 15 % | 100 % | fertig | DE/EN-Umschaltung reversibel; Präferenz unabhängig; bestehende Daten/Maskottchen unverändert |
| 2. Englische Startseiten & Ratgeber | 15 % | 80 % | weitgehend | Vier Ratgeber, Startseite und Rechner vollständig redigiert, zugänglich, funktionale Links |
| 3. Vier Tool-Oberflächen | 30 % | 82 % | aktiv | Umzugskisten, WG, Pflanzen und Backstudio komplett übersetzt: statische und dynamische Zustände, Formulare, Aktionen, Hilfen |
| 4. Konten, Datenwege & Exporte | 20 % | 35 % | teilweise | Auth inklusive Recovery, erlaubte Redirects, Datenkonflikte, PDF/QR/CSV/Import/Export in EN und DE E2E |
| 5. Qualitätssicherung & Sicherheit | 10 % | 47 % | aktiv | vollständige E2E-Tests, 320px/mobile, Keyboard, Screenreader, Auth-Sicherheit, abschließend alle CI erfolgreich |
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

## Sprint A – dynamische WG-Schuldenausgleichs- und Beleglisten (2026-11-21)

- Die dynamisch gerenderten Beträge je vorgeschlagener Schuldentilgung, das Gesamtvolumen des Schuldenausgleichs und die Transaktionsbeträge in der Belegliste nutzen `formatHouseholdDisplayAmount` (englische Tausendertrennzeichen und Dezimalpunkt; bisherige deutsche Anzeige unverändert).
- Das unveränderte Fallback `Privat` erhält bei EN die reine Anzeigeübersetzung `Private`; tatsächlich gespeicherte Zahlernamen bleiben HTML-escaped und unübersetzt.
- Die Schuldenminimierung (`amount / splitWith.length`, `transactions.push(... amount: min)`) und die Erstellung/Speicherung von Belegdaten bleiben unverändert.
- Neuer Regressionstest prüft EN/DE-Anzeigewerte, Schulden-/Belegpfade, escaped Nutzerfelder und unveränderte Finanzalgorithmen und Daten-Payloads.
- **Paket 3 geschätzt 75 %, Gesamt 60,5 % (gerundet 61 %).** Das ist eine Planungsschätzung, keine Vollständigkeitsabnahme.
- Sprint A noch offen: dynamische Inhalte und Sonderzustände in den vier Tools, verifizierte englische End-to-End-Nutzerwege und finale Browser-/CI-Abnahme. PR bleibt Draft, keine Produktion, keine Supabase-Änderung, englische öffentliche Seiten bleiben vorerst `noindex`.

## Sprint A – Umzugshilfe und WG-Budgeteditor: dynamische Labels (2026-11-21)

- **Umzugskisten:** Der vorhandene Auf-/Zuklapp-Schalter der Hilfe zeigt bei jeder Sprache `Show/Hide help and guide` beziehungsweise den bisherigen deutschen Text an. Das sichtbare `span` wird per `textContent` aktualisiert; die ursprüngliche Schaltfläche mit Handler wird weder ersetzt noch neu aufgebaut. Sprachwechsel aktualisieren das Label ohne die aufgeklappte Ansicht zu schließen.
- **WG-Organisator:** Die Beschriftungen im bei Bedarf erzeugten Budgeteditor verwenden die bekannten englischen Kategorienamen. Die ursprünglichen `data-cat`-Werte (`Wohnen`, `Lebensmittel` usw.), Beträge, Eingabefelder und Speicherlogik bleiben unverändert. Ein offenes Editorformular wird beim Sprachwechsel nicht neu erzeugt, um ungespeicherte Werte zu bewahren.
- Zwei neue isolierte Regressionstests prüfen DE/EN-Hilfe-Zustände, unveränderten Schalter-Handler und WG-Budgetlabels mit stabilen Datenschlüsseln.
- **Paket 3 geschätzt 76 %, Gesamt 60,8 % (gerundet 61 %).** Noch keine Sprint-A-Abnahme; dynamische Spezialzustände und browsergestützte E2E-Abnahme bleiben offen.
- Vor Freigabe sind alle GitHub-Workflows für den finalen Commit erforderlich. PR bleibt Draft, keine produktiven Supabase- oder Webseitenänderungen.

## Sprint A – Live-Sprachwechsel bei offenem WG-Budgeteditor (2026-11-21)

- Der bisher nur beim Öffnen übersetzte WG-Budgeteditor aktualisiert nun beim Sprachwechsel DE ↔ EN seine neun fest definierten Kategorienamen direkt an den vorhandenen `label`-Knoten, solange der Dialog offen ist. Die Felder werden nicht neu erzeugt.
- `data-cat`, Eingabe-`value`, ungespeicherte Beträge, Budget-Speicherschlüssel und Berechnungslogik bleiben unverändert. Ein geschlossener Dialog wird nicht bearbeitet; die Aktualisierung ist rein präsentationsbezogen und erfolgt erst nach dem vorhandenen Cloud-Ready-Guard.
- Neuer isolierter Laufzeittest prüft beide Sprachrichtungen, unveränderte Eingabewerte und Node-Identitäten, geschlossenen Dialog sowie fehlende Speicherzugriffe.
- **Fortschritt unverändert als vorsichtige Schätzung:** Paket 3 **76 %**, Gesamt **61 %**. Der Sprachwechsel-Fix schließt einen konkreten Sonderzustand, ist aber noch kein vollständiges End-to-End-Abnahmekriterium.
- Unverändert: Sprint A offen, alle relevanten CI-Gates am letzten HEAD erforderlich, PR #291 Draft, kein Merge/Deployment, keine produktiven Supabase-/SEO-Änderungen.

## Sprint A – WG-Wochenkochplan: Wochentage und Live-Sprachwechsel (2026-11-21)

- Der Wochenkochplan verwendet ausschließlich für die Anzeige englische Wochentagsnamen (`Monday` bis `Sunday`). Die gespeicherten Werte `Montag` bis `Sonntag` bleiben unverändert; unbekannte oder frei definierte Wochentage werden nicht übersetzt.
- Im offenen Kochplan-Editor werden die sichtbar erzeugten Tagesnamen bei DE ↔ EN direkt an ihren `data-cooking-day`-Labels aktualisiert. Die DOM-Formulare, ungespeicherten Speisen, Zutaten und Koch-Zuordnungen werden weder neu aufgebaut noch gespeichert; bei geschlossenem Dialog erfolgt kein Eingriff.
- Ein weiterer isolierter Regressionstest prüft beide Sprachen, unbekannte Tage, nicht veränderte Eingaben, weiterhin deutsche Speicher-Keys und geschlossenen Dialog.
- **Paket 3 geschätzt 77 %, Gesamt 61,1 % (gerundet 61 %)**. Die neue Zahl ist eine vorsichtige Planungsschätzung, keine Abnahme oder gemessene Übersetzungsquote.
- Sprint A offen: weitere dynamische Stati, vollständige englische E2E-Tests je Tool, finale CI. Kein Merge/Deployment, keine Supabase-Änderung, `noindex` für EN bleibt bestehen.

## Sprint A – Live-Sprachwechsel im geöffneten WG-Kochplaneditor (2026-11-21)

- Neben den bereits englisch dargestellten Wochentagen werden beim Sprachwechsel jetzt auch die Platzhalter für Gericht und Zutaten sowie das Standard-Kochfeld `Frei`/`Unassigned` direkt an bestehenden DOM-Elementen aktualisiert.
- Die Editorfelder werden **nicht** neu erstellt: ausgewähltes WG-Mitglied, alle `input.value`-Entwürfe, `option.value="Frei"`, `data-idx`, Wochentag-Datenschlüssel und die Speicherlogik bleiben unverändert. Bei geschlossenem Dialog erfolgt keine Veränderung.
- Der vorhandene isolierte Wochentag-Test wurde um Platzhalter, Standard-Option, den unveränderten ausgewählten Koch und DE→EN→DE erweitert. Der letzte Commit benötigt einen neuen grünen CI-Nachweis.
- **Roadmap-Schätzung unverändert: Tool-Oberflächen 77 %, Gesamt 61 %.** Die Korrektur zählt als abgesicherter Sonderzustand, noch nicht als vollständige Browser-Abnahme.
- Sprint A und das Release-Gate bleiben offen; Draft PR #291, kein Merge, Deployment, Entfernen von `noindex` oder Änderungen an Supabase.

## Sprint A – bereits geöffneter WG-Ernährungs-/Allergieeditor (2026-11-21)

- Ein geöffnetes Formular für Ernährung und Allergien wechselt seine beiden Platzhalter jetzt unmittelbar zwischen `Diet`/`Ernährung` und `Allergies`/`Allergien`.
- Die Aktualisierung greift ausschließlich auf bestehende DOM-`input`-Elemente zu. Ausgefüllte, noch nicht gespeicherte Werte, Mitbewohnerzuordnung (`data-mate`), Referenzen der Eingabefelder und Speicherschlüssel bleiben unverändert. Geschlossene Dialoge werden nicht aktualisiert.
- Neuer isolierter Regressionstest für EN→DE, erhaltene Entwurfswerte, unveränderte Eingaben, den Cloud-Ready-Guard und fehlende Speicheroperationen.
- **Fortschrittsschätzung unverändert:** Tool-Oberflächen **77 %**, Gesamtprojekt **61 %**. Sprint A bleibt offen: vollständige englische End-to-End-Journeys und letzte dynamische Sonderzustände sind nicht abgenommen.
- Der vorherige HEAD `cadd0a62` hatte neun erfolgreiche CI-Workflows. Der neue HEAD erfordert eine eigene Prüfung. Draft-PR bleibt unveröffentlicht; kein Merge/Deployment oder Supabase-Eingriff.

## Sprint A – großer Vier-Tool-Batch: sichere Live-Texte und Zahlen (2026-11-21)

- **Backstudio:** Die gespeicherte Rezeptliste wird beim Sprachwechsel nicht länger komplett neu gerendert. Stattdessen werden Faktorlabel, Löschbeschriftung, Notizüberschrift und Platzhalter an bestehenden Knoten aktualisiert. Dadurch bleiben nicht gespeicherte Notizbearbeitungen erhalten. Ein bereits vorhandener fehlerhafter Lösch-Button wurde zu einem gültigen HTML-Button korrigiert.
- **Umzugskisten:** Die vier festen Kennzeichnungen werden in Filterauswahl, neuen/bearbeiteten Kisten, Tag-Zusammenfassung und Kartenansicht englisch angezeigt; die Datenwerte `Standard`, `Zerbrechlich`, `Wertvoll`, `Saison` bleiben unverändert. Die Standort-Auswahl zeigt in EN eine passende Aufforderung. Sprachwechsel erhalten Auswahlwerte und ungespeicherte Formulardaten.
- **WG-Organisator:** Die vorhandenen Titel für neu erstellte/bearbeitete Haftnotizen sowie die Formularüberschrift und Speichern-Beschriftung für Belege wechseln live die Sprache, ohne die eingegebenen Haftnotiz- oder Belegwerte zu ersetzen.
- **Pflanzenpflege:** Große Zisternenvolumen-, Wasserbedarfs- und Erntemengen im Liter-/Milliliter-/Gramm-Bereich werden in EN mit Tausendertrennzeichen angezeigt. Deutsche Zahlenanzeige, gespeicherte Einheiten und Rechen-/Speicherpfade bleiben unverändert.
- **Regression:** Vier zusätzliche isolierte Laufzeit-/Quelltests decken DE→EN→DE, im Editor ungespeicherte Texte, ausgewählte Tagwerte, unveränderte ID-/Speicherschlüssel und numerische Anzeigefunktionen ab.
- **Fortschrittsschätzung:** Paket 3 von 77 % auf **79 %**, gewichtetes Gesamtprojekt **61,7 % ≈ 62 %**. Die Prozentwerte sind heuristisch und kein Ersatz für die finale Sprint-A-Abnahme.
- Weiterhin offen: End-to-End- und Mobilprüfungen über alle vier Tools, dynamische Spezial-/Fehlerzustände sowie die abschließende CI-/Browser-Freigabe. **PR #291 bleibt Draft; kein Merge, Deployment, Supabase-Eingriff oder `noindex`-Wechsel.**

## Sprint A – großes Paket: sichere Sprachwechsel von Standortwahl, Rezeptvorschau und Kontaktformular (2026-11-21)

- **Umzugskisten:** Die Sprachumschaltung ändert jetzt nur die sichtbaren `-- Standort wählen --`-/`-- Choose location --`-Optionen. Die vorherige Neuerstellung beider Standort-`select`-Elemente während der Umschaltung wurde entfernt, da sie eine noch nicht gespeicherte Standortwahl zurücksetzen konnte. Standortdaten und Filter werden unverändert gelesen.
- **Backstudio:** Die Rezeptanzeige wurde von der speichernden Aktion getrennt. `renderRecipePreview()` erzeugt die übersetzte Vorschau ohne Persistenz, während `calculateRecipe()` weiterhin bei ausdrücklicher Nutzeraktion einmalig speichert. Ein Sprachwechsel aktualisiert nur eine bereits vorhandene Vorschau; Rezepttext und Eingaben bleiben erhalten, keine unbeabsichtigten Rezeptduplikate.
- **WG-Organisator:** Der Titel eines geöffneten Mitgliederformulars reagiert jetzt auf DE↔EN sowohl im Erstellen- als auch im Bearbeiten-Modus. Der bearbeitete Datensatzindex und alle ungespeicherten Kontaktdaten bleiben erhalten. Geschlossene Formulare bleiben unangetastet.
- Drei zusätzliche isolierte Regressionstests prüfen reversible Anzeige, unveränderte selektierte Optionen, Formular-Entwürfe und den speicherfreien Vorschaupfad.
- **Fortschritt: Paket 3 geschätzt 80 %, Gesamt 62,0 %** (heuristische gewichtete Planungsschätzung). Keine Sprint-A-Endabnahme; verbleibend sind vollständige englische End-to-End-Journeys der vier Tools, 320-px-/Accessibility-Prüfungen und restliche Sonderfälle.
- Veröffentlichungs-Gate unverändert: PR #291 Draft, kein Merge, Deployment, Supabase-Schreibzugriff oder EN-Indexierungsänderung.

## Sprint A – Chromium-Prüfung mit isolierten 320px-/768px-Nutzerabläufen (2026-11-21)

**Testumgebung:** `tests/browser/tool-pages-ui.spec.cjs` verwendet weiterhin den vorhandenen isolierten lokalen HTTP-Preview-Server und ausschließlich synthetische Cloud-Snapshots. Supabase wird in Chromium vollständig durch einen lokalen Fake ersetzt; externe Applikationsanfragen werden abgebrochen. Die neuen Tests laufen unter `.github/workflows/toolya-browser-tests.yml` auf GitHub Actions und erstellen Screenshots pro Ansicht/Breite zur Sichtprüfung.

- **Umzugskisten:** Standort auswählen und Kistenname als ungespeicherten Entwurf eingeben; DE→EN→DE bei 320/768px; bestehende Standortauswahl, Kistenname, Tag-Filter und Hilfe-Button bleiben bedienbar und korrekt übersetzt, ohne Cloud-Schreibzugriff.
- **Pflanzenpflege:** Mit leerem synthetischem Bestand Zisternendialog öffnen, noch nicht gespeichertes Fassungsvermögen ändern und den Sprachwechsel bei 320/768px überprüfen; Prozentstatus und Formularwert werden kontrolliert.
- **Backstudio:** Synthetisches vorhandenes Rezept mit ungespeichert bearbeiteter Notiz; neue Rezeptvorschau, Sprachwechsel und Rückwechsel bei 320/768px; Quellrezept, Notizen, Vorschauüberschrift und unveränderte Schreibanzahl werden geprüft.
- **WG-Organisator:** Synthetische geschützte WG mit sieben Kochplantagen und Budgetwerten; Budgeteditor mit ungespeichertem Betrag sowie geöffneter Wochenkochplan mit ungespeichertem Gericht. Bei 320/768px werden übersetzte Kategorien/Wochentage/Platzhalter, Eingabewerte und fehlende Cloud-Schreibzugriffe geprüft.
- Die Prüfungen verwenden reale Chromium-DOM-Knoten und aufnehmenbare Screenshots. Sie sind **zusätzliche fokussierte Browserregressionen**, keine Abnahme sämtlicher Funktionen, Bildschirmgrößen, Fehlerfälle oder realer Benutzerkonten.
- **Fortschrittsschätzung bleibt vor Browserabnahme bei Paket 3: 80 %, Paket 5: 40 %, Gesamt: 62 %.** Erst nach grünem, abschließendem CI-Head darf für diesen Teilbereich ein Testnachweis gelten.
- **Weiterhin offen:** vollständige Testmatrix der Tool-Flows (inkl. Auth/Recovery und Exporte), 320px-Audit von tatsächlich gerenderten modalen Inhalten, Screenreader-/Tastaturführung, redaktionelle EN-Vollständigkeit und verifizierter Release-Gate. Keine Veröffentlichung, kein Merge/Deployment oder Änderung an realen Daten/Maskottchen/SEO-Indexierung.

## Sprint A – geprüfte echte Sprachschalter, mobile Bildkontrolle und sichtbare Labelkorrekturen (2026-11-21)

- Der zuvor hinzugefügte Browserlauf für alle vier Tools bei **320px und 768px** ist mit streng isolierten, synthetischen Daten erfolgreich gewesen (Commit `b055588a`, 9/9 GitHub-Workflows). Die Bildartefakte wurden manuell kontrolliert: Alle geprüften Dialoge passten in die Telefonbreite; das Cookie-Panel verdeckte zunächst einen Teil der Test-Screenshots.
- Die Browserprüfungen schließen das Cookie-Panel daher jetzt vor der Aufnahme, kontrollieren horizontale Überläufe im Umzugskisten-/Backstudio-Dokument sowie im WG-Budget-/Kochplan- und Pflanzen-Zisternendialog, und betätigen die **wirklichen DE-/EN-Bedienelemente** statt nur ein künstliches Lokalisierungsereignis.
- **Umzugskisten:** Auch das mobile Feld `Kisten-Name` wird als `Box name` angezeigt, ohne dessen Wert oder Eingabeknoten zu ersetzen.
- **Pflanzenpflege:** Im Zisternendialog werden `Restbestand` und `Schließen` nun als `Remaining volume` und `Close` angezeigt, ohne Fassungsvermögen/Cloud-Daten zu ändern.
- **Backstudio:** Die im mobilen Screenshot verbliebenen `Mein Rezept` und `Meine Zutaten` erhalten eigene source-exakte Labelübersetzungen. Für Überschriften und den Berechnen-Button mit verschachtelten Lucide-Icons werden ausschließlich **direkte Textknoten** übersetzt, sodass Icons, Click-Handler und editierbarer Rezepttext unangetastet bleiben.
- Neuer isolierter DE→EN→DE-Regressionstest kontrolliert alle drei Werkzeugbereiche inklusive Knoten-/Handlerstabilität; die Chromium-Tests prüfen die zusätzlichen sichtbaren englischen Beschriftungen auf Telefonbreite.
- **Schätzung jetzt:** Paket 3 **81 %**, Paket 5 **45 %**, gewichteter Gesamtwert **62,8 % ≈ 63 %**. Die höhere QA-Schätzung betrifft reale synthetische Browserabdeckung, **nicht** ein vollständiges mobiles, barrierefreies oder produktives E2E-Abnahmeergebnis.
- **Noch offen:** restliche gemischte Sprachabschnitte (insbesondere dynamisch zusammengesetzte B3-Karten), weitere Sonder-/Fehlerzustände, vollständige Routen-/Auth-/Export-Journeys, Screenreader und finaler Release-Gate.
- Letzter Implementierungsstand vor diesem Abschlusscommit benötigt einen eigenen erfolgreichen CI-Lauf. PR #291 bleibt Draft, keine produktiven Datenbank-/Maskottchen-/SEO-Änderungen, kein Merge oder Deployment.

## Sprint A – gebündelte native Dialoge, Backup und synthetische Browserprüfung (2026-11-21)

- **Umzugskisten (Backup):** Exakte Anwendungsmeldungen `Backup erfolgreich importiert!` und `Backup-Datei konnte nicht gelesen werden.` erhalten englische Varianten. Der bestehende Browserdialog-Wrapper wird verwendet; Backupdatei, Einleseformat, Bestätigungsdialog und gespeicherte Kisten bleiben unverändert.
- **WG-Organisator (Konto, Migration, QR):** Neue exakte Übersetzungen für die Eingabe des WLAN-Netznamens sowie die mehrzeilige Meldung nach Anlage einer geschützten WG-Kopie; `Mitgliederverwaltung:` als begrenztes Präfix lokalisiert lediglich das durch die Anwendung erzeugte Fehleretikett. Nachgelagerte Backend-/Auth-Fehler bleiben original.
- **WG-Kontaktimport:** Die dynamische Erfolgsmeldung mit `contacts.length` wird ausdrücklich DE/EN formuliert. Datenimport, gespeicherte Kontaktnamen und -felder bleiben unberührt.
- **Regression:** Ein neuer Node-Test deckt die statischen Dialogpaare in beiden Richtungen, unbekannte Servermeldungen, dynamisches Mitgliederfehlerpräfix und den Kontaktimport-Quellpfad ab. Die Chromium-Suite enthält zwei zusätzliche mobile 320-px-Browsertests mit den realen DE-/EN-Buttons für Backup-Hinweise, WLAN-Prompt und Mitgliederausnahme. Der Browser benutzt für `alert()` jedoch Toolyas eigenes `role="alertdialog"`-Overlay; nur `prompt()` ist ein nativer Dialog. Die Tests überprüfen deshalb die tatsächliche Oberfläche, korrektes Übersetzen, den initialen Tastaturfokus, Schließen per Enter sowie ausbleibende Cloud-Schreibzugriffe.
- **Befund:** Eine zunächst fehlgeschlagene Regression für die WG-Migrationsmeldung lag an `String.raw` im Test (mehr Backslashes als im tatsächlichen JavaScript-Meldungstext); der Test wurde auf einen normalen Template-String korrigiert, um die echte Nachricht zu prüfen. Ein erster Browserlauf hatte 158 bestandene Tests und zwei Fehlannahmen zur nativen `alert()`-Darstellung; diese wurden nach Inspektion von `assets/helferlein-dialogs.js` durch Assertions auf das echte zugängliche Hinweisfenster ersetzt.
- **Roadmap-Schätzung:** Paket 3 **82 %**, Paket 5 **47 %**, gewichteter Gesamtwert **63,3 % ≈ 63 %**. Die Änderung ist keine Abnahme aller Auth-, Import- oder Export-Journeys.
- **Noch offen:** vollständige End-to-End-Validierung des echten Backup-Imports (synthetische Daten), Migration und Auth-Recovery, weitere dynamische B3- und Fehlermeldungen, PDF-/QR-Exportinhalte, Screenreader und endgültige redaktionelle EN-Vollständigkeit.
- **Sicherheitsgrenze:** Isolierte Mocks und lokale Browser-Prompts; keine Produktivkonten, keine Datenbankmigration, kein Supabase-Schreibzugriff, kein Merge/Deployment oder `noindex`-Wechsel. PR #291 bleibt Draft. Den abschließenden HEAD nur nach 9/9 grünen Workflows als CI-geprüft bezeichnen.
