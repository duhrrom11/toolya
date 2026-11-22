# Toolya DE/EN – Release-Fortschritt

## Aktueller Wiederaufnahmepunkt – 22.11.2026

**Aktueller Code-HEAD:** `f2ca109737f262149b7f64801496c08abe7fd928` · [Feature-Branch](https://github.com/duhrrom11/toolya/commits/feature/i18n-de-en-foundation-20261121/) · [PR #291](https://github.com/duhrrom11/toolya/pull/291), weiterhin Draft. Der Branch enthält den Hauptbranch-Stand `c75b247a`, 0 Commits hinter main.

**Verifizierter Zwischenstand:** **223/223 isolierte i18n-Node-Tests** auf dem Code-HEAD grün ([CI](https://github.com/duhrrom11/toolya/actions/runs/44993279217)). Auf dem Vorgänger `930d21d3` **6/6 Chromium-Smoke-Tests grün**. Die größere CI-Matrix für den aktuellen Code-HEAD war bei dieser Dokumentationsänderung **noch in Ausführung**. Historischer gesicherter kompletter grüner Lauf: 18/18 Workflows auf `6b606891`; nicht auf neue Commits übertragen.

**Neue Pakete seit dem letzten vollständigen Bericht:** Main-Connect-Rückgabe- und readonly-Auto-/Tier-Termine in i18n-Branch integriert; quellbezogene Accessible Names erhalten; feste EN-Frist-Begriffe über nicht persistierte Display-Metadaten übersetzt; tatsächliche Dashboard-Chromium-Sprachwechsel auf Datenintegrität geprüft; Verleih-Select-Platzhalter und ICS-Validierungen DE/EN; dynamische Budgetvalidierung DE/EN. Alle Commits nur auf dem Feature-Branch.

**Release-Status NOT READY:** 34 teilweise lokalisierte Ansichten, 48 zu prüfende Laufzeit-Dateien, vollständige Auth-Recovery-Mail-E2E-, Export-/Druck-/QR-/Screenreader- und mobile Abnahme fehlen. `noindex` bleibt geschützt. [Checkliste](i18n-release-checklist.md) · [Release-Bericht](i18n-release-report.md) · [Roadmap](i18n-roadmap.md).


Stand 21.11.2026. **Release-Gate offen.** [Draft-PR #291](https://github.com/duhrrom11/toolya/pull/291) · [aktueller Branch-HEAD und Actions](https://github.com/duhrrom11/toolya/commits/feature/i18n-de-en-foundation-20261121/). Maßgeblich für CI ist der SHA des aktuell geprüften Kandidaten, nicht ein älterer grüner Lauf.

| Commit | Arbeitspaket |
| --- | --- |
| `3416d11fa7d45c4fee07cbaaad7224065541585c` | Start-HEAD bestätigt. 199 von 200 lokalen i18n-Tests erfolgreich. Der fehlende englische Registrierungsstatus von Umzugskisten verursachte den Fehler. |
| `182d6892e5737a32297b5fb2d0d54c9ccc367fcf` | DE/EN-Anmeldemeldungen und Schutz gegen überholte Kontoabfragen im Umzugskisten-Tool. 201 von 201 i18n-Tests grün. GitHub-Push-Workflow für den statischen i18n-Check grün. |
| `4c265510c0f6f02ef93080a7a36aa86a181f0cc9` | Kisteneditor mit Unterartikeln repariert. Inventartexte werden als Text dargestellt, QR-Knöpfe sind zweisprachig, der sichtbare Kistenname bleibt erhalten. 202 von 202 i18n-Tests grün. |
| `ee2b271f458757a2d21221b2fdf54654678fbdfb` | Backup vor Wiederherstellung und beide Download-Bestätigungen wiederhergestellt. Browserabnahme an das bestehende Backstudio und das echte Sprachwahl-Verhalten angepasst. 154 Chromium-Fälle bestanden, 16 optionale Fälle übersprungen. |
| `58dfa798fc166c97827a0861f75be0c2e45c729d` | `main` mit Stand `98451fc941a8fe6536247244195f38fb324e4378` in den Entwicklungsbranch übernommen. Konflikte in Dashboard, Haushaltsbuch, Umzugskisten und Browser-Tests gelöst. Die bestehende Umzugsprojekt-Warnung beim Import ist zweisprachig. |
| `2d68e5faba8dc4abf70630c48fb23bcb009225c1` | Temporäre Helferansicht auf Deutsch und Englisch mit Sprachwechsel bei gleichbleibender Freigabe, Auswahl und Status. Übersetzte Status-, Scanner- und Vorfallmeldungen. |

## Tatsächlich ausgeführte Prüfungen

- Auf dem mit `main` abgeglichenen Quellbaum bestanden 271 Node-Tests für i18n, Amazon, Umzugsmodell und Haushaltsbuch. Drei separate Szenarien für CloudOnly, Connect und simulierte Geräte-/Kontowechsel bestanden.
- Chromium auf `58dfa798` und `2d68e5fa` mit synthetischem Backend: 158 von 158 ausgeführten Tests bestanden. 16 zusätzliche Start-/Performance-Fälle liefen ohne das optionale CI-Flag nicht. Für die Darstellung nutzte der lokale Runner eine unveränderte, separat heruntergeladene Tailwind-Datei. Das installierte System-Chromium scheiterte am Prozess-Socket der Umgebung. Der lokale Lauf verwendete deshalb einen vorhandenen Chromium Headless Shell.
- Alle drei Helfer-Browserfälle bestanden nach der Lokalisierung, einschließlich DE/EN/DE, unveränderter Kisten- und Raumnamen, gültigem Linkfragment und identischer Anzahl bestätigter Schreibvorgänge. Kamerazugriff mit einem physischen Gerät ist offen. Der anschließende Umzugsnavigationstest bestätigte My move, My inventory und Moving in bei unveränderter aktiver Phase, wörtlichem Projektnamen und unverändertem Schreibzähler.
- Acht Original-Maskottchen stimmen mit ihren gespeicherten SHA-256-Prüfsummen überein.
- `node scripts/i18n-coverage-audit.mjs --strict` schlägt erwartungsgemäß fehl. Der Audit zählt 72 Anwendungs- und Inhaltsseiten, 17 öffentliche EN-Seiten, 34 teilweise lokalisierte Anwendungsansichten und 49 Dateien mit heuristischen Treffern für deutsche Laufzeittexte. Test-Fixtures werden vom Seitenaudit ausgenommen.
- Die PDF- und QR-Regressionsfälle der Browser-Suite verwenden Attrappen für die Bibliotheken. Sichtprüfung der fertigen PDFs, Lesbarkeit im Druck und echte Kamera-QR-Abnahme stehen aus.

## GitHub Actions

Auf `2d68e5fa` bestanden zunächst zehn PR-Workflows und der statische Push-i18n-Check. Der Haushaltsbuch-Livecheck verglich die veröffentlichte HTML-Datei mit der absichtlich unveröffentlichten PR-Fassung. Der Hash der Live-Datei stimmte mit der Datei in `main` überein. Im Plattform-Workflow bestand der Job für Nachlass-Sicherheit. Der separate Handover-Designtest blockierte neue statische Sprachdateien, weil sie in seiner exakten Test-Allowlist fehlten. Der isolierte Browser-Workflow war bei der ersten Abfrage noch im Lauf.

## Nächste Arbeitsschritte vor der Freigabe

1. Ausstehende Actions am aktuellen HEAD auswerten. Bei roten Jobs anhand der Job-Logs zwischen einem Fehler im Kandidaten und einem Live-Vergleich unterscheiden. Der Haushaltsbuch-Live-Check vergleicht produktiv ausgelieferte Dateien und kann bei absichtlich unveröffentlichtem Code Abweichungen melden.
2. Begonnenen Abgleich der neuen Umzugsplanung und Haushaltsbuch-Funktionen vervollständigen. Danach die 34 Teilansichten aus dem Audit einzeln abnehmen. Insbesondere Laufzeittexte, Einwilligung, Formulare, Validierungen, Accessibility-Texte und Formatierung auf beiden Sprachpfaden prüfen.
3. Registrierung, Anmeldung, Abmeldung, Passwort-Recovery, Sitzungsablauf und Benutzerwechsel durchgängig mit isolierten Testkonten prüfen. Reale Mailzustellung über eine geeignete Testumgebung separat bestätigen.
4. PDF, QR, Druckansichten und Kalender mit synthetischen Daten einschließlich Umlauten und Sonderzeichen auf beiden Sprachpfaden prüfen. Mobile Ansichten, Tastatur und Screenreader je relevanter Route prüfen. Nach vollständiger Lokalisierung die Dokumentsprache mit der Benutzerwahl abgleichen.
5. Finale Codebasis und PR-Prüfungen erneut vollständig abnehmen. Erst dann den Status **READY FOR RELEASE APPROVAL** vergeben und die ausdrückliche Freigabe für Merge, Produktion und gegebenenfalls Indexierung einholen.

PR #291 bleibt Draft. Die 17 englischen öffentlichen Seiten bleiben bei `noindex`. Ein Merge nach `main`, ein Deployment und produktive Supabase-Nutzerdaten oder Testdatensätze waren nicht Teil der Ausführung.

## Nachtrag zum neueren Prüfstand

- `4b607a20e8ba46e0a298d8f5ae973b2f00afe6df` ergänzt die zweisprachige Umzugsnavigation und diesen Wiederaufnahmepunkt. Der gezielte Chromium-Navigationstest und die 271 Node-Tests sind lokal grün.
- Der isolierte GitHub-Browser-Workflow auf `2d68e5fa` ist abgeschlossen und grün. Die zwei übrigen roten Jobs wurden diagnostiziert. Der Nachlass-Sprachschalter hing im vom gemeinsamen Header ausgeblendeten Bereich. Er wird im sichtbaren Header montiert. Der lokal grüne Handover-Test prüft den englischen Druckknopf, 28 exakt zugelassene statische GETs, unveränderte CSP, den verschlüsselten Dateiaustausch und das Verhalten bei falschem Passwort.
- Der Livecheck des Haushaltsbuchs vergleicht in PRs die veröffentlichte Seite mit `main`. Die PR-Fassung wird durch den getrennten Haushaltsbuch-Workflow geprüft. Nach einem Merge bleibt der Livevergleich mit dem veröffentlichten Commit erhalten.
- Den tatsächlichen endgültigen HEAD und die zugeordneten Actions über den Branch-Link oben prüfen. Ein abschließender grüner Lauf allein schließt die offenen Übersetzungs-, Auth-/Recovery-, Export- und A11y-Gates nicht.

### Dashboard-Passwortwiederherstellung

Browserlauf mit der echten Dashboard-Oberfläche bei 320 px und isolierter Auth-Attrappe bestanden. Beim Öffnen der Kontoeinstellungen bleibt ein explizites `lang=en` erhalten. Der Test prüft initialen Passwortfokus, gesperrte Doppelauslösung, englischen Fehler beim Passwort-Update, unveränderte Eingaben bei einem Update-Fehler, gelöschte Eingaben nach einem erfolgreichen Update sowie die manuelle Abmeldung nach fehlgeschlagenem automatischem Sign-out. Der Test verzeichnet keine Schreibzugriffe auf Anwendungstabellen und verwendet keinen Maildienst. Der echte Versand und der vollständige Link-Rückweg stehen zur Abnahme aus.

### Gerenderte Umzugskisten-PDFs und Nachlass-Navigation

- Auf `a5300270` meldete der lokale Komplettlauf 158 bestandene Fälle, einen sporadischen Fehler beim Warten auf den QR-Ladevorgang in Playwright und 16 optionale, ausgelassene Fälle. Der Browserfall beobachtet jetzt den sichtbaren Fehlerdialog, ohne auf eine nicht im Seitenkontext gehaltene Promise zu warten.
- In Chromium wurden mit jsPDF 2.5.1 und QRCode.js 1.0.0 vier echte Dateien erzeugt und als PDF gerendert. Inventarbericht und QR-Etiketten zeigten auf beiden Sprachpfaden wörtliche Namen mit Umlauten, Apostroph und kaufmännischem Und. Die extrahierten QR-Bilder wurden dekodiert und verwiesen in beiden Sprachen auf dieselbe synthetische Kisten-ID. Der Prüflauf erzeugte keine Cloud-Schreibzugriffe. Die PDF-Geldbeträge verwenden nun je nach ausgewählter Sprache beispielsweise `12,50` oder `12.50` bei unveränderter Währung. Jeder QR-Aufruf rendert in einem eigenen Hilfselement.
- Der Nachlass-Banner lässt den bestehenden CSS-Nachbarselektor für den ausgeblendeten zweiten Startseitenlink intakt. Der gezielte lokale Chromium-Test für die Vertrauenspersonen-Seite und der Nachlass-Handover-Test waren grün. Der vollständige PostgreSQL-/Nachlass-Lauf gehört weiterhin zu GitHub Actions.
- Der korrigierte Haushaltsbuch-Livecheck bestand lokal mit vier von vier öffentlich ausgelieferten Dateien und anschließend in GitHub Actions. Dieser Check prüft produktive statische Dateien auf Übereinstimmung mit `main`. Er belegt keine Veröffentlichung des PR-Codes.

### Umzugsplanung und letzte Wiederholungsprüfung

Der Browser-Volltest auf `647363989c55113483a37beeabae756464ffb26e` bestand lokal mit 159 ausgeführten Fällen und 16 ausgelassenen optionalen Startmessungen. Der separate Plattform-CI-Workflow einschließlich beider Nachlass-Jobs war für diesen Commit grün.

Die darauf aufbauende Änderung übersetzt Zielräume, Kistenzuordnung, 72-Stunden-Übersicht, Projektfortschritt, Eingabeaufforderungen und Fehlermeldungen der Umzugsplanung. Der gezielte isolierte Chromium-Test prüft den Wechsel mit aktivem Projekt, die Formatierung desselben gespeicherten Datums als `05.12.2026` und `5 Dec 2026`, unveränderte Räume und Kistennamen sowie genau die drei vorgesehenen Schreibvorgänge. Die erweiterten 271 Node-Prüfungen sind grün. Der separate Eigentümerbereich für Transport und Helferfreigaben benötigt weitere Übersetzung und Abnahme.

### Ganztägige Kalenderdateien

Der Exportdialog von Autokosten und Tiergesundheit lädt den Termin über seine vorhandene ID. Termintitel und Fahrzeug- beziehungsweise Tiername bleiben wörtliche Daten, auch mit Apostrophen und Umlauten. Die gemeinsam erzeugte ICS-Datei enthält unter anderem eine stabile UID, UTC-Zeitstempel, ganztägigen Start, eine zweisprachige Beschreibung und korrekt umgebrochene UTF-8-Felder. Der gespeicherte Tag bleibt derselbe. [iCalendar-Spezifikation RFC 5545](https://www.rfc-editor.org/rfc/rfc5545.html)

Zwei isolierte Chromium-Fälle lösten die echten Download-Knöpfe aus und lasen vier heruntergeladene ICS-Dateien. Beide Sprachpfade, Originaltitel und Datum waren korrekt, ohne Anwendungsschreibzugriffe. Die zwölf einschlägigen Konto-/Kalender-Node-Tests und die kombinierte Node-Suite wurden ausgeführt. Kalenderimport in externen Kalenderprogrammen bleibt Teil der abschließenden Abnahme.

### Transport und Helferfreigaben

`68cb0080` lokalisiert die Eigentümeransicht für Transportstatus, Vorfälle, Helferlinks und QR-Aktionen einschließlich Statuslabels, Anzahl und Zeitangaben. Ein synthetischer JavaScript-Test bestätigte den Sprachwechsel, die unveränderte Anzeige eines gespeicherten Kistennamens und den Erhalt einer begonnenen Notiz. Die Entwicklungsumgebung war für einen lokalen Node- oder Chromium-Lauf nicht verfügbar. GitHub Actions und die vollständige Browserabnahme sind separat zu prüfen.

### Englische Anleitungen für zusammenhängende Alltagsabläufe

Vier Anleitungen am deutschen Funktionsstand ergänzt: Haushaltsbuch (Monatsrechnung und fehlende Speicherbestätigung), Dashboard (gemeinsamer Einkauf, Druckansicht, lokale und synchronisierte Daten sowie Zählerablesung), Autokosten (Wartung, Reifen, ICS und bestätigte Kostenübernahme) und Tiergesundheit (Kalenderdatum und bestätigte Kostenübernahme). Der Vergleich erfolgte anhand der deutschen Leitfäden und des bereits geprüften ICS-Exports. Statisch geprüft: eindeutige Einfügepunkte, ausgeglichene Abschnitte, englisches Sprachattribut und fortbestehendes `noindex`. Der lokale Checkout war nicht verfügbar. Auf dem vorherigen HEAD `56f2c96c` waren bei der Abfrage 12 von 13 PR-Workflows grün. Der strikte Abgleich der Anwendungsoberflächen bleibt offen.

### Zweites Paket englischer Anleitungen

Sechs englische Leitfäden anhand der deutschen Fassungen ergänzt. WG-Organisator erklärt Teilgruppen, Zugriff und Rückzahlungen, Pflanzenpflege Gießintervalle und Vorräte, Backstudio den Flächenvergleich und die Rezeptumrechnung für zwei Formen. Verliehene Dinge erläutert geänderte Rückgabetermine, Zählerstände den Zählerwechsel und die Gasumrechnung, Parkplatz-Merker die Orientierung im Parkhaus und den Gebührenexport. Einfügepunkte, Abschnittsgrenzen, englische Sprachkennzeichnung und `noindex` statisch geprüft. Die vollständige Funktions- und Sprachabnahme ist weiterhin offen.

### Übergänge von englischen Anleitungen zu den Tools

Die englischen Leitfäden für digitalen Nachlass und öffentliche Amazon-Wunschlisten enthalten jetzt konkrete Schritte für Sicherung, Schlüsselübergabe und Notfallfrist sowie für Linkprüfung, Profilvorschau, Suche und Verwaltung. Alle 13 englischen Tool-Anleitungen übergeben `lang=en` direkt in ihren Anwendungslinks. Das gilt auch ohne das Marketing-Skript auf der Anleitung. Der Profilanker der Wunschliste bleibt erhalten. Geprüft wurden die Linkziele, die Zahl der Links je Seite und `noindex`. Die Sprach- und Browserabnahme in den Anwendungen bleibt offen.

### Regression für englische Anleitungslinks

Die statische i18n-CI auf `fde5504b` meldete drei Fehler in `marketing.test.mjs`, weil die Tests Anwendungslinks ohne `lang=en` erwarteten. Die Tests prüfen nun für alle 25 Links die Anzahl pro Anleitung, Herkunft, Zielpfad, den Sprachparameter und den Profilanker. Der lokale Node-Runner war in dieser Ausführung nicht verfügbar. Das Ergebnis des vollständigen Node- und Chromium-Laufs wird über die CI des aktualisierten HEAD geprüft.

### Zweisprachige Fehler bei Dashboard-Kontoaktionen

Anmeldung, Registrierung, Abmeldung und die Anforderung eines Rücksetzlinks verwenden umschaltbare Meldungen für bekannte Kontofehler und aktionsspezifische Meldungen für unbekannte Fehler. Der DE/EN-Rundlauf, die Zuordnung der Fehlercodes und der Fallback wurden mit synthetischen JavaScript-Daten geprüft. Eine Node-Regression ist Teil der statischen CI. Der vollständige Rücksetzablauf mit Mailzustellung bleibt offen.

### Sprachhinweis beim Öffnen geschützter Tools

Der Kontohinweis auf der Startseite übernimmt Englisch aus dem geschützten Tool. Eine explizite Sprachwahl hat Vorrang vor der gespeicherten Voreinstellung. Vier synthetische Weiterleitungsvarianten wurden geprüft. Der übrige Startseiten-Kontodialog und der vollständige Rücksetzablauf bleiben Teil der Sprachabnahme. Der Standardpfad zur Anmeldung bleibt bestehen.

### Übersetzungen direkt in der gemeinsamen Tool-Vorlage

Zehn Werkzeugseiten verwenden dieselbe vorhandene Anwendung für DE und EN. In diesem Paket sind 202 Stellen in den deutschen Vorlagen mit englischen Labels, Hinweisen oder zugänglichen Beschriftungen versehen. Ein gemeinsamer Helfer setzt diese Texte bei Englisch ein und stellt bei Deutsch die Ausgangstexte wieder her. Die statische Kontrolle bestätigte, dass abgesehen von den Übersetzungsattributen alle zehn HTML-Dateien bytegleich sind. Ein synthetischer Test überprüfte den Hin- und Rückwechsel, unveränderte Optionswerte und den Erhalt eines geänderten Laufzeittexts. Vollständige Browserabnahme und weitere Laufzeitmeldungen bleiben offen.

### Laufzeitmeldungen für Umzug, WG-Kopie und Haushaltsbuch

Vier Dialoge für Löschschutz, private WG-Kopie und doppelte Buchungen sind DE/EN erfasst. Die Cloud-Importvorschau des Haushaltsbuchs zeigt verständliche Bereichsnamen und Warnungen in beiden Sprachen. Die Dialogübersetzungen wurden synthetisch ausgeführt. Die statische CI auf `bdb9d622` scheiterte an einer Prüfung der alten Auth-Weiterleitungsform. Die aktualisierte Regression simuliert vier Weiterleitungsvarianten ohne produktiven Auth-Zugriff.

### Terminverlauf in Autokosten und Tiergesundheit

Terminstatus im Verlauf, Datumsanzeige, Filter-Leerzustände, Kalender-Schaltflächen und das Ablaufdatum bei Tiergesundheit folgen der gewählten Sprache. 205 lokale i18n-Node-Tests und beide gezielten Chromium-Tests bestanden. Die Browserfälle prüften DE/EN-Anzeige, den unveränderten synthetischen Titel, vier ICS-Downloads und null Cloud-Schreibvorgänge. Alle 13 PR-Workflows des Ausgangscommits `a6f2f440` waren grün.

### 22.11.2026 – Parkplatz-Anzeigesicherheit und DE/EN-Laufzeitansichten

Ausgangs-HEAD: `308ba4c0d91b4cbbddc7335414aaa4592afaac2b`. Aktuellen HEAD über [Branch-Verlauf](https://github.com/duhrrom11/toolya/commits/feature/i18n-de-en-foundation-20261121/) prüfen.

- Parkplatz-Historie escaped Nutzertext ausschließlich bei der Anzeige, begrenzt Bilder auf Raster-Data-URLs, validiert GPS und schützt ungültige Lösch-IDs. Keine Änderung an gespeicherten Werten.
- Parkplatz, Autokosten und Tiergesundheit: weitere zweisprachige Leerzustände, englische Anzeige von Parkplatzbetrag und Datum, lesender Locale-Refresh bei bestätigter CloudOnly-Bereitschaft.
- Neue isolierte Node-Regression: `tests/i18n/parking-history-safety.test.mjs`. **Nicht vor erfolgreichem CI-Lauf als bestanden werten.**
- Vorheriger vollständiger PR-Lauf `a6f2f440`: 13/13 grün. Auf `308ba4c0`: nur statischer Push-i18n-Check nachweislich grün. Neue CI-Ergebnisse auswerten. Ohne lokalen Checkout keine vollständigen lokalen Browser-/Node-Läufe.
- **Release-Gate OFFEN**: 34 Teilansichten, strikter Coverage-Audit, Auth-Recovery-E2E, Exporte, Accessibility und finale CI ausstehend. Draft/noindex unverändert; kein Merge, Produktion oder produktive Testdaten.

### 22.11.2026 – Verleih/Zähler und erweiterte Test-CI

Ausgangs-HEAD `2912d45e9e3b05a0485541db248bb9e0289d8210` – [statischer i18n-Check grün](https://github.com/duhrrom11/toolya/actions/runs/44964111209). [Aktueller Branch-HEAD](https://github.com/duhrrom11/toolya/commits/feature/i18n-de-en-foundation-20261121/).

- Verleih: DE/EN-Statusanzeige ohne Änderung der persistenten Codes, Leerzustände und Erfolgsmeldung. Zähler: EN-Leerzustand und Teilen-Überschrift. Keine Datenübersetzungen.
- Lesende Sprachwechsel-Refreshes bei Verleih und Zähler erfordern einen bestätigten CloudOnly-Snapshot. Synthetische Node-Regression ergänzt.
- Fünf isolierte CI-Workflows für Entwicklungsbranch-Push aktiviert (Chromium, Plattform/Maskottchen, Connect/Postgres und Umzug). Browser-, Node- und Plattform-Ergebnisse müssen erst tatsächlich erfolgreich sein.
- **Release-Status NOT READY / Draft.** Fehlende Vollabdeckung (34 Teilansichten), strikter Audit, Auth-/Recovery-Mailzustellung, alle Exporte/Druck, mobile und Screenreader-Abnahme bleiben offen. Kein Merge, Deployment, noindex-Entfernung, produktive Supabase-Daten oder Assetänderung.

### 22.11.2026 – Browser-Regressionspaket zu DE/EN-Laufzeitlisten

Basis `394d42d6d2fa874dd103a6eb431fb0a52893f33a`: statische i18n-CI, Connect-CI mit isoliertem PostgreSQL und Umzugsplaner-CI nachweislich grün. Browser- und Plattformjobs waren bei der Abfrage noch in Arbeit. [Actions](https://github.com/duhrrom11/toolya/actions).

- Parking-Historie: ISO-8601-Zeitstempel in vorhandenen CloudOnly-Daten werden beim englischen Anzeigen korrekt lokalisiert; ungültige Strings verbleiben beim gespeicherten Anzeigewert. Foto-Platzhalter zweisprachig.
- Drei zusätzliche Chromium-Fälle in `tests/browser/tool-pages-ui.spec.cjs`: realer 320px-Sprachwechsel, XSS-escaped Parkplatz-Daten, originale Verleihstatus-/Nutzerdaten und leere Zählerliste. Strikt synthetischer Mock-Snapshot, Prüfung ohne DB-Schreibzugriffe.
- Browser- und vollständige Node-/CI-Ergebnisse der neuen Revision auswerten, ggf. Fehler beseitigen. **Die Erstellung der Browsertests ist keine Abnahme.**
- Release-Status weiterhin **NOT READY**, kein Merge/Deployment, `noindex` bleibt, keine produktiven Daten/Assets verändert.

### 22.11.2026 – Verleih-Kalender und lokalisierte Erinnerungen

Basis `cc9876d92ce5dfefc1504098ea73a3fd03969dac`: 209/209 statische Node-i18n-Tests, Umzug, Connect und Plattform-CI grün; Browser-Abnahme zum Abfragezeitpunkt noch offen. [Aktueller HEAD](https://github.com/duhrrom11/toolya/commits/feature/i18n-de-en-foundation-20261121/).

- Verleih-ICS über gemeinsamen UTF-8-/RFC-5545-Exporter mit stabiler UID und DE/EN-Betreff/Beschreibung, ursprüngliche Nutzertexte und Datum unverändert. Google Calendar mit korrektem exklusivem Tagesende und lokalisierter Beschreibung, Reminder via WhatsApp auf DE/EN.
- Dynamische Verleihkarten zeigen weitere DE/EN-Labels, Datum, Kaution und zugängliche Titel. Keine Persistenz- oder Auth-Änderung.
- Isolierte Node- und Chromium-Regression für realen DE/EN-Kalenderdownload ergänzt. **Testlauf auf dem neuen HEAD noch auswerten.**
- **Release-Status: NOT READY / Draft.** Weitere 34 Teilansichten/48 Laufzeitdateien, Auth-Recovery-Mailrückweg, weitere Exporte, mobile A11y und finale GitHub-CI offen. Kein Merge, Deployment, noindex-Wechsel oder Zugriff auf produktive Daten.

### 22.11.2026 – Chromium-Fehler nach Sprachwechsel analysiert

- [Run 44964495544](https://github.com/duhrrom11/toolya/actions/runs/44964495544): 161/164 ausgeführte Playwright-Tests grün, 3 fehlgeschlagen (Parkplatz-, Verleih-, Zählerlisten nach DE-Toggle); 16 übersprungen. Der andere isolierte Browser-Workflow, Connect, Moving, Plattform und 209 i18n-Node-Tests waren auf dem vorherigen HEAD grün.
- Locale-Listener auf das bestehende CloudReady-Lade-Gate ausgerichtet; `getData()` bleibt zusätzlich durch controller.ready geschützt. Tests für dieses Gate aktualisiert, Browser prüft aktiven Sprachschalter. Diese Änderung ist noch nicht browser-verifiziert.
- Draft/NOINDEX/Prod-Sperren bleiben. **Release-Status OFFEN**.

### 22.11.2026 – Ungebundene DOM-Ereignisse in Chromium

- [Run 44964965114](https://github.com/duhrrom11/toolya/actions/runs/44964965114): 161 Playwright-Tests bestanden, 16 übersprungen, 4 fehlgeschlagen (die 3 DE-Listenwechsel plus echter Verleih-ICS-Download). Der DE-Schalter blieb nach Klick im Test `aria-pressed=false`; damit war die Ursache nicht die CloudOnly-Ready-Bedingung allein.
- Ergänzende dokumentweite Delegation für neu konstruierte Sprachschalter und aktualisierte `aria-pressed`-Werte. Verleihaktionen werden nun einmalig auf Dokumentebene behandelt und verwenden aktuelle gefilterte CloudOnly-Snapshots statt potenziell verlorener Listener auf DOM-Rekonstruktionen. Synthetische Node-Regression aktualisiert.
- Neuer kurzer Chromium-Smoke-Workflow im Feature-Branch für Parkplatz, Verleih, Zähler und ICS. Er muss erst als grün bestätigt werden; vollständige Browser/Plattform-CI bleibt erforderlich.
- **Release-Status weiterhin NOT READY / PR Draft**, auch bei erfolgreichem Smoke bleiben 34 partielle Tools, 48 Laufzeitdateien, echte Auth-Mailrunde und manuelle A11y-Abnahmen offen. Kein Merge/Deploy/Produktivzugriff.

### 22.11.2026 – Root-Cause-Fix: fehlende versteckte Dialog-CSS bei isolierten Browsern

- [Diagnose 44965929859](https://github.com/duhrrom11/toolya/actions/runs/44965929859): Sprachbutton stand bei scrollY=1242 oberhalb des Viewports und der Klick traf BODY. Wichtiger: der Verleih-ICS-Button hatte den Vorfahren `.b3-shell[inert]`, obwohl keine modale Interaktion erwartet war.
- Die isolierten Tests blockieren die externe Tailwind-CDN-Datei. `assets/helferlein-accessibility.js` behandelte deswegen den dialogeigenen `.hidden`-Wert ohne CSS-Effekt als sichtbaren Dialog und blockierte die übrige App. Enger `display:none!important`-Fallback für bekannte `.hidden`-Dialoge und CSS-unabhängige Sichtbarkeitsprüfung ergänzt. Das behebt zugleich einen realen Offline-/CDN-Ausfallpfad.
- Browser-Regression prüft versteckten Dialog, fehlendes `inert` am Tool-Shell, 320px-Sprachwechsel und echten ICS-Download. Node-Regression ergänzt. Noch keine positive Aussage zu den neu ausgelösten CI-Läufen.
- Release weiterhin **NOT READY** bis vollständiger CI-Nachweis plus breite Auth-/A11y-/Coverage-Abnahme. Keine produktiven Änderungen.

### 22.11.2026 – Veröffentlichung auf main nachgezogen, ohne geschützten Merge

- Verglichen: `main` bei `23507b160bc8779ef4f197863cb9304de866c39e` (PR #306: ausgewählte Toolya-Maskottchen mit korrekter thematischer Kleidung). Feature war einen Commit hinter main; 7 von 8 geänderten Pfaden hatten keine Feature-Abweichung.
- Neuester akzeptierter main-Code aus Footer/Header/Platform-CSS, Platform-MJS und zugehörigen Tests wurde in den Feature-Branch übernommen. Die **einzige** branch-eigene Zeile `document.dispatchEvent(new Event('toolya:tool-hero-ready'))` blieb im neuen Mount-Flow unmittelbar nach `refreshFrames()` erhalten; notwendig für reaktiven DE/EN-Header.
- Echter Merge-Commit mit zwei Eltern, **ausschließlich auf dem Feature-Branch**, kein Push zu main. Keine Bild-/Maskottchen-Assets verändert, nur bereits auf main veröffentlichte Darstellungs-/Teständerungen übernommen.
- Vor dem Merge: 214/214 i18n-Node-Tests und 4/4 mobile Chromium-Smoke-Tests auf `ebfecf17` bestanden, vollständige Browser-/Plattform-CI war noch im Lauf. Nach Merge **alle relevanten CI-Workflows auf dem neuen Merge-HEAD erneut prüfen**.
- **Release bleibt NOT READY / Draft**, weil vollständige 34 Teilansichten, 48 dynamische Dateiquellen, Auth-E2E und A11y offen sind.

### 22.11.2026 – zusätzliche Tastatur-Abnahme (synthetisches Chromium)

- Ausgangsstand `288011ce`: Zwei-Eltern-Merge von main, Branch 0 Commits hinter main. Erster Pull-Request-CI-Batch war bis 15/17 erfolgreich, zwei Chromiumläufe noch offen; PR bleibt Draft.
- Neuer echter 320px-Chromium-Test für Account-Dialog ohne Tailwind-CDN: initial `hidden`, interaktive B3-Shell, Öffnen per Button, `aria-modal`, Hintergrund-`inert`, Fokusfalle, Escape schließt und restauriert Hintergrund, null CloudOnly-Schreibvorgänge.
- Workflow i18n-runtime-browser erweitert, für neuen HEAD erneut Node-/Chromium-/Plattform-CI auswerten. Tests wurden beim Schreiben noch nicht erfolgreich ausgeführt.
- Release-Gate bleibt NOT READY: vollständige Sprach-/Auth-/Export-/A11y-Abnahme offen.

### 22.11.2026 – Neues Connect-Dashboard von main konfliktarm übernommen

- Neueren Stand von `main` (Commit `c75b247ad3401bd75cf38f3b4d4da4df314d67a2`, PR mit Rückgaben aus Verleih und read-only Auto-/Tiergesundheitsterminen) auf den **Entwicklungsbranch** integriert. Die sechs unberührten Pfade wurden exakt übernommen; in `dashboard/dashboard.js` wurde der neue Aufgabenrenderer dreiseitig mit der bestehenden DE/EN-Darstellung zusammengeführt. **Zwei Eltern im Merge-Commit, keine Änderung an main.**
- Im Dashboard bleiben Leih-Rückgaben als abschließbare Aufgaben und Auto-/Tier-Fristen strikt nur als lesbare Hinweise markiert; englische Beschriftung, Quellnamen und Datumsformat ergänzt, Freitexte bleiben unverändert. Isolierte Node-Regression für Readonly und Datenintegrität ergänzt.
- Vor diesem Integrationspaket: 18/18 Actions grün auf `6b606891`; Dokumentations-HEAD `e72f4d304b27f54d82ba72c9138967605123261f` war ebenfalls grün, aber nicht jede der 18 Prüfungen wurde auf einem reinen Dokumentationscommit neu angestoßen. **CI für den neuen Merge-HEAD ist separat nachzuweisen.**
- Release weiterhin **NOT READY / Draft**: i18n-Gesamtaudit, 34 Tool-Ansichten, 48 Laufzeitdateien und Auth-/Export-/A11y-Prüfungen offen. Keine produktiven Daten, kein Deployment, kein Entfernen von `noindex`, keine Markenasset-Änderungen.

### 22.11.2026 – Dashboard-Connect-A11y-CI: Regression und Korrektur

- Auf dem ersten Main-Integrations-HEAD `d8d57f057650eda03c1d46cd896efae6306f8ae1` schlugen die beiden Connect-Browser-Workflows [44992417252](https://github.com/duhrrom11/toolya/actions/runs/44992417252) und [44992417364](https://github.com/duhrrom11/toolya/actions/runs/44992417364) fehl: die isolierte Chromium-Prüfung erwartet für den Verleih-Checkbox-Accessible-Name den Quellnamen `Verliehene Dinge` vor dem Rückgabetitel. Die neue i18n-Beschriftung hatte den Quellnamen versehentlich entfernt; 11/11 und 12/12 vorherige Node-Tests waren grün.
- Korrektur: Zugängliche Checkbox-Namen erhalten in DE die originalen Quellnamen und den wörtlichen Aufgabentext; EN übersetzt nur den bekannten Quellnamen und die UI-Aktionsformulierung. Persistierte Statuscodes, Nutzertexte und Aufgabenhoheit bleiben unverändert. Isolierte Node-Regression dafür ergänzt.
- **Verifikation der Korrektur steht aus, bis die neuen CI-Läufe grün sind.** Release weiterhin NOT READY und PR Draft.

### 22.11.2026 – EN-Connect-Fristen ohne Nutzerdatenübersetzung

- Quellseitig abgeleitete, nicht persistierte `display`-Metadaten für Loan/Car/Pet ergänzt; EN-Dashboard nutzt die Struktur für bekannte Wortbestandteile der Rückgaben, Fahrzeugfristen, Impf- und Entwurmungstermine. Personen-, Tier-, Gegenstands- und Ereignisnamen bleiben wörtlich. Originaltext, ID, readonly und CloudOnly-Mutationspfade bleiben unverändert.
- Neues Modul `shared/toolya/i18n/connect-due-display.mjs` und synthetischer Node-Test `tests/i18n/connect-due-display.test.mjs`. Die Tests dürfen erst nach GitHub-CI-Ergebnis als bestanden erklärt werden.
- Release weiterhin NOT READY / Draft; keine produktiven Daten, kein Merge nach main, keine Indexierung oder Markenasset-Änderung.

### 22.11.2026 – Echte DE/EN-Connect-Browserabnahme ergänzt

- Im isolierten Chromium-Test des Dashboards wird jetzt nach Verleih-/WG-Abschluss der reale EN-Sprachbutton gedrückt. Die schreibgeschützten Fahrzeug-/Haustiertermine müssen wörtliche Benutzerwerte und englische Anwendungsbegriffe anzeigen, ohne Bestätigungs-Checkboxen und ohne neue CloudOnly-Mock-Schreibvorgänge. DE-Rückwechsel geprüft.
- Testdatei `tests/platform/dashboard-shopping-browser.cjs` erweitert; tatsächlichen neuen CI-Lauf vor Erfolgsbehauptung abwarten. Release bleibt Draft/NOT READY.

### 22.11.2026 – Verleih: DE/EN-Dropdowns ohne Datenverlust

- Systemeigene Kontakt-/Inventar-/Custom-/Filter-Optionsbeschriftungen folgen DE/EN sowohl nach `loadDropdowns()` als auch beim Sprachwechsel; ausgewählte Werte und frei eingegebene Namen bleiben unverändert. Kalenderdatei-Validierungsfehler zweisprachig.
- Node-Regression für deutsche und englische ICS-Fehler sowie echter 320px-Chromiumtest der Dropdowns mit Sonderzeichen und ohne Cloud-Schreiboperationen hinzugefügt. CI-Ergebnis auf diesem HEAD noch offen.
- Draft/noindex/Prod-Daten/Markenassets unverändert. Release-Gate offen.

### 22.11.2026 – DE/EN-Budgetvalidierung mit dynamischem Namen

- Haushaltsbuch-Meldung bei negativem/nicht numerischem Kategoriebudget lokalisiert; Benutzerkategorie wird nicht übersetzt. Neue synthetische Node-Regression `tests/i18n/budget-amount-validation.test.mjs` prüft 2 Fehlerpfade ohne Schreiboperationen und den positiven Persistenzpfad mit unverändertem Kategorienamen.
- Ziel-CI für diesen Code-HEAD steht vor der Prüfung; Release weiterhin NOT READY / PR Draft und keine produktiven Datenbankaktionen.

### 22.11.2026 – Wiederaufnahme nach Budget-Validierung: aktuelle CI-Matrix

- GitHub-HEAD bei Wiederaufnahme: `2725d849e29ce49b830f0e4c96d0087a3c10f4ce`; Branch-Vergleich zu `main`: **539 Commits voraus, 0 zurück**, PR #291 weiterhin Draft. HEAD enthält den neuen Budget-Validierungs-/Dokumentationsstand; keine automatische Freigabe aus früheren CI-Läufen.
- **15 von 16 am HEAD erfassten Actions-Läufen abgeschlossen und erfolgreich**, darunter [i18n static checks #44993409414](https://github.com/duhrrom11/toolya/actions/runs/44993409414), [Connect-Browser #44993409468](https://github.com/duhrrom11/toolya/actions/runs/44993409468), [Plattform-/Maskottchen #44993409444](https://github.com/duhrrom11/toolya/actions/runs/44993409444), [Security/Moving #44993409387](https://github.com/duhrrom11/toolya/actions/runs/44993409387), Budget, Dashboard und Amazon. **Isolated Toolya browser tests #44993409442 lief zum Abfragezeitpunkt noch**, daher keine vollständige CI-Freigabe behaupten.
- 34 Teilansichten, 48 heuristische Laufzeitdateien und Auth-Mail-/Export-/A11y-Gates unverändert offen. Die bestehenden 223/223 Node-i18n-Tests sind auf dem vorherigen Code-HEAD `f2ca1097` dokumentiert; die aktuelle CI ist erfolgreich, ohne die exakte neue Testzahl hier zu behaupten.
- Nächste Schritte: vollständigen Chromiumlauf auswerten; danach Haupttool-Coverage, Wünsche/Nachlass, Auth-E2E und Exporte isoliert bearbeiten. Release weiterhin **NOT READY**, keine produktiven Aktionen.
