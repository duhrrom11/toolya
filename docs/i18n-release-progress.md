# Toolya DE/EN – Release-Fortschritt

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
