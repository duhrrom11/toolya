# DE/EN Tooloberflächen – konkret geprüfter Übersetzungsumfang

Stand 2026-11-21. Quelle: vier vorhandene `tools/*/index.html` im Entwicklungsbranch, ohne Änderung produktiver Daten.

| Tool | HTML-Zeichen | unterschiedliche statische Textkandidaten* | aria/placeholder/title | Inline-Eventhandler |
|---|---:|---:|---:|---:|
| moving | 67.132 | 96 | 35 | 31 |
| housemates | 164.593 | 194 | 33 | 89 |
| plants | 88.909 | 107 | 25 | 65 |
| baking | 74.174 | 145 | 14 | 55 |

*Grobe DOM-Text-Kandidatenzählung mittels HTML-Regulärausdruck, keine vollständige Extraktion und keine Zahl der tatsächlich notwendigen Übersetzungen. Dynamische Meldungen in externen und Inline-JavaScript-Dateien kommen hinzu.

## Bereits integriert (staging-only)
- Existing login/auth guards, Datenmodelle und Eventhandler bleiben unverändert.
- Sprachwahl auf den vier Tool-Einstiegsseiten für den **Kopfbereich** mit expliziter Zwischenstandsmeldung.
- Englische Social-Landingpages leiten per `lang=en` zum passenden Tool; Cookie-/Tracker-Neuanlage findet nicht statt.
- Manuelle Auswahl wird separat unter `toolya-locale-v1` gespeichert und ändert weder Figur noch Tool-Daten.
- Auf allen unvollständig lokalisierten Tool-Seiten bleibt `html lang="de"`, die öffentlichen EN-Ratgeber bleiben vorerst `noindex`.

## Notwendiger nächster Implementierungsumfang
1. Pro Tool exakte, versionierte Kataloge für feste Texte, aria-Labels, Dialoge, Hilfen und Platzhalter anlegen. HTML-Markierungen `data-i18n` an geprüften Textstellen einfügen, keine globale blind-algorithmische DOM-Übersetzung.
2. Alle **dynamisch** erzeugten Meldungen direkt an der Renderstelle aus dem gleichen Katalog beziehen. Interne Daten-Keys/Cloud-Kollektionen und Speicherung dürfen niemals übersetzt werden.
3. Auth-Login, Logout, Registrierung, Passwort-Reset und Fehlerbehandlung in DE/EN synchronisieren; E-Mail-Kommunikation und zugelassene Redirect-URLs in Staging prüfen.
4. Native `Intl`-Formatierung für Datums-/Geldwerte; Einheiten aus gesonderter Einstellung, nicht aus Sprache erraten. UK-/US-Währungen nur mit bewusster Wahl und ohne implizite Umrechnung.
5. PDFs, Drucketiketten, CSV-Exporte und Import-Hinweise übersetzen, ohne die maschinenlesbaren Datenschemata zu verändern.
6. Das bestehende Maskottchen beibehalten; nur sichtbare UI-Kommunikation lokalisieren. Keine 1:1-Zuordnung Farbe ↔ Sprache.
7. Responsive 320px, Tastatur, Screenreader `lang`, Textüberläufe, Fehlerfälle und vollständige Datenzugriffskontrollen in isolierten Browser-Prüfungen testen.
8. Vor der internationalen Veröffentlichung: durchgängiger englischer Auth-Funnel; SEO-hreflang-Paare, Sitemap, Canonical-/OG-Sprachen und `noindex`-Freigabe.

**Freigabe-Schranke:** Der aktuelle Sprachschalter bedeutet nicht, dass das jeweilige Tool bereits vollständig übersetzt ist. Keine automatische EN-Nutzerakquise oder Live-Übernahme dieser unvollständigen Fassung.

## Umsetzung auf PR #291 nach d112e980 (2026-11-21)
- Source-exakte DE/EN-Texte für `alert`, `confirm` und `prompt` der vier Tools. Unbekannte Serverfehler, Freitext, Benutzereingaben und Rückgabewerte bleiben unverändert. Weitere dynamische DOM-Renderstellen sind nicht vollständig erfasst.
- PDF-Kopfzeilen und Berichtslabels für Umzugskisten, WG und Pflanzen werden bei `lang=en` in Englisch ausgegeben; die gespeicherten Datensätze, maschinenlesbaren Backup-Formate und QR-Inhalte bleiben unverändert. PDF-Dateinamen sind mittlerweile sprachabhängig; deutsche Originalnamen bleiben bei DE erhalten.
- Regressionstests für die vier Dialog-Kataloge und für PDF-Sprachumschaltung ergänzt.
- **Noch offen:** vollständige dynamische DOM-Texte, sämtliche Kontozustände/Fehlerfälle, weitere Export-/Druckinhalte und E2E-Authentifizierung. Dieser Stand ist nicht releasefähig. Vor Merge/Deployment alle Workflows des endgültigen Commits abwarten.

## Größeres Übersetzungspaket – vier Tools (2026-11-21)

- In `shared/toolya/i18n/interface.mjs` wurden **41 weitere exakte statische Textpaare** für Umzugskisten (4), WG (22), Pflanzen (5) und Backstudio (10) ergänzt. Nur vorhandene Blatttexte in den bereits freigegebenen Elementtypen (Label, Button, Option, Überschrift) werden ersetzt.
- Dazu kommen **10 gezielte WG-Formular-Platzhalter** für Inventar, Sparziel, Mitgliederkontakte, Putzaufgaben und Verträge. Die Sprachumstellung schreibt nicht in Eingabewerte oder Cloud-Daten.
- DOM-Regressionstests prüfen Hin-/Rückwechsel, Optionswerte, ursprüngliche Button-Handler und unveränderte Nutzereingaben. Der englische UI-Stand bleibt **teilweise** übersetzt; `html[lang]` verbleibt deshalb auf Deutsch.
- Weiterer Stand vor diesem Paket: dynamische WG-Haushalts- und Pflanzenkarten, Saatgut- und Lageranzeigen, Backstudio-Timer, Garten-Monatstipps sowie locale-spezifische PDF-Dateinamen. Ein Sprachwechsel darf keine ungespeicherten Formulare neu initialisieren.
- **Noch offen / Freigabe-Blocker:** durchgängige Authentifizierung inklusive Wiederherstellung und Fehlermeldungen, restliche dynamische UI und externe Backstudio-Skripte, vollständige isolierte Browser- und Zugriffsprüfungen sowie abschließend erfolgreiche CI-Läufe. Kein Merge, kein Deployment, `noindex` bleibt bestehen.

## Backstudio-Laufzeitpaket – externes Skript (2026-11-21)

- `tools/baking/backstudio.js`: 66 zusätzliche feste Textpaare für die von JavaScript aufgebauten Backstudio-Elemente; weitere sprachabhängige Meldungen für Warenkorb, Vorratsliste, eigene Backformen, Zeiten, Füllhöhen, Kuchenlagen, Backhinweise, Foto-OCR und Textdatei-Export.
- Umschaltung über `toolya:locale-change` aktualisiert den vorhandenen UI-Bereich, ohne Formulare neu zu erzeugen oder `localStorage` zu beschreiben. Für die festen Texte werden ausschließlich originale, direkt enthaltene Textknoten der Backstudio-Elemente über einen begrenzten Katalog übersetzt, keine Nutzertexte und keine verschachtelten Eingabekontrollen.
- Zahlen- und Datumsanzeige über `de-DE` beziehungsweise `en-GB`; Einheit, Rezeptzutaten, Pantry-Schlüssel, Pan-Geometrie und Berechnungsformeln bleiben unangetastet. Die Textdatei für Einkaufslisten erhält bei EN einen englischen Dateinamen; die gespeicherten Einträge bleiben original.
- Sponsoring-/Partnerlink-Kennzeichnung und feste Amazon-Partner-ID bleiben sichtbar bzw. unverändert. Der Export kennzeichnet Amazon-Partnerlinks auch in Englisch.
- Ergänzte Regressionstests für Laufzeitmeldungen, Hin-/Rückschalten von Backstudio-Blatttexten, unveränderte Nutzereingaben, Formular-Optionswerte, Amazon-IDs und Datenhaltung.
- **Restrisiko / Release-Schranke:** Das weitere externe `backstudio-pro.js` enthält eigene dynamische Meldungen und benötigt noch eine vollständige DE/EN-Überarbeitung; Browser-, OCR- und End-to-End-Tests sind nicht abschließend nachgewiesen. `noindex` bleibt aktiv, kein Merge/Deployment.

## Backstudio Pro: 3D, OCR, Rezeptimport und Backnotizen (2026-11-21)

- `tools/baking/backstudio-pro.js`: **42 feste DE/EN-Beschriftungspaare** für 3D-Backform, Pan-Finder, Rezept-/Fotoimport, Kamera, Tortenplanung und Backnotizen. Die bestehenden Controls werden bei `toolya:locale-change` am Ort aktualisiert, statt Eingaben oder Kamerasteuerung neu zu initialisieren.
- Zusätzlich wurden **45 Laufzeit-Textstellen** u. a. in 3D-Status, Größenvergleich, Kamera-/OCR-Rückmeldung, Zutatenfreigabe, Torten-Creme-Kalkulation und Backnotizen lokalisiert. Der exportierte JSON-Dateiname ist abhängig von der Sprache; der JSON-Inhalt und das Format bleiben unverändert.
- **Wichtiges Datenformat-Fix:** `applyReviewed()` darf erkannte Dezimalzahlen unter Englisch nicht durch `en-GB`-Tausendertrennzeichen und die bisherige deutsch-spezifische Punktentfernung verfälschen. Englisch verwendet für die übernommene editierbare Rezeptzeile die unveränderte numerische Zahl; Deutsch behält die ursprüngliche Kommaschreibweise. Beispiel: 1000.5 g bleibt unter EN `1000.5 g`, unter DE `1000,5 g`.
- Die Erkennungsmodelle `deu+eng`, die Backform-/Creme-Rechenformeln, die lokale Speicherkennung und die Datenstruktur bleiben unverändert. Lokalisierung ist ausschließlich ein Darstellungsschritt; die Freigabe erkannter Zutaten bleibt explizit.
- Zusätzliche Regressionstests prüfen DE/EN-Umschaltung, Kamera-/3D-Beschriftungen, erhaltene Optionswerte und Nutzereingaben, OCR-/Berechnungsformeln, unveränderte Speicherstruktur sowie englische/deutsche Dezimalmengen. Ein direkter Funktions-Check der Mengenübernahme und JavaScript-Syntaxprüfung wurden durchgeführt.
- **Weiter offen:** durchgehende Auth- und Recovery-Flows, übrige Inhalte außerhalb der vier Tools, tatsächliche Browser-/Kamera-/OCR-Ausführung, CI-Workflow-Abschluss und Freigabeentscheidung. Kein Merge oder Deployment; `noindex` bleibt bestehen.

## Konto- und Authentifizierungsoberfläche (2026-11-21)

- Übersetzte Auth-Gate-Überschriften für alle vier Tools, außerdem reversible Konto-Ladezustände (`Checking your account…`) und vorhandene Anmeldestatus-Texte. E-Mail-Adressen, Serverfehler und Nutzerdaten werden nicht übersetzt.
- Hilfe-Links auf den gesperrten Tool-Seiten führen bei expliziter englischer Auswahl zu den passenden `/en/`-Ratgebern und bei Deutsch zum unveränderten bisherigen deutschen Link. Der Auth-Gate-Bereich erhält bei der Auswahl die passende Screenreader-Sprache.
- Hinweistext zur teilweise vorhandenen Englischübersetzung wurde dem Fortschritt angepasst. Die Tools bleiben weiterhin `noindex` und `html[lang]="de"`, solange die gesamte Oberfläche nicht vollständig lokalisiert ist.
- Beim Wiederöffnen einer gespeicherten WG-ID bleibt ein explizites `?lang=de` oder `?lang=en` im Redirect erhalten. Fremde URL-Parameter werden nicht durchgereicht; der vorhandene Auth-/WG-Speichermechanismus bleibt unverändert.
- Für die Registrierung in Umzugskisten, Pflanzenpflege und Backstudio wird eine Anfrage ohne zurückgegebene Sitzung **nicht mehr als sofort abgeschlossene Registrierung** bezeichnet; bei möglicher E-Mail-Verifizierung ist die Rückmeldung entsprechend vorsichtig. Der `signUp`-Aufruf bleibt derselbe. Die beiden Statusmeldungen sind in DE/EN verfügbar.
- Tests prüfen den Hin-/Rückwechsel der Gate- und Kontomeldungen, unveränderte Identitäten, zugelassene Locale-Redirects sowie Registrierung ohne und mit zurückgegebener Sitzung anhand simulierter Rückgabewerte ohne produktive Supabase-Zugriffe.
- **Weiter offen:** Anmeldung/Registrierung/Recovery in realen isolierten Browser-Sessions, alle serverseitigen Sonderfälle und erfolgreiche GitHub-Workflows. Keine Aussage zur Releasefähigkeit; kein Merge/Deployment.

## Konto-Stabilität und Backstudio-Pro-Feinschliff (2026-11-21)

- In Umzugskisten, Pflanzenpflege und Backstudio haben Anmeldung und Registrierung nun explizite Fehlerbehandlung für **geworfene** Netzwerk-/Supabase-Fehler. Die zugrunde liegenden `signUp`- und `signInWithPassword`-Aufrufe und ihre Parameter bleiben unverändert. Eine fehlgeschlagene Anfrage meldet keinen Erfolg, übersetzt werden nur feste Präfixe, nicht Serverfehlermeldungen oder persönliche Daten.
- Abmeldung in denselben drei Tools behandelt sowohl zurückgegebene Fehlerobjekte als auch Exceptions. Nur nach erfolgreichem `signOut` wird der sichtbare Anmeldestatus aktualisiert und (wo vorher vorhanden) „Abgemeldet“ gezeigt. Bestehende WG-spezifische Logout-Sicherungen bleiben unverändert.
- Konto-Statusabrufe unterscheiden einen regulären, fehlenden Login (`AuthSessionMissingError`) von Netz-/Serverproblemen. Bei Problemen zeigt die Oberfläche „Status: Verbindung oder Sitzung nicht überprüfbar“ beziehungsweise „Status: Unable to verify connection or session“, nicht fälschlich „Nicht angemeldet“.
- `backstudio-pro.js` übersetzt außerdem die dynamisch erzeugten Buttons „Diese Form nehmen“/„Beide nehmen“ und Anzeigenamen gespeicherter Backformtypen, **ohne** die gespeicherten `shape`-Schlüssel oder das Auswahlergebnis zu verändern.
- Regressionstests für 3 Tools × 5 Kontostatusfälle, 3 Tools × 3 Logoutfälle und 3 Tools × 2 Auth-Aktionen × 2 Netzwerkfehlerfälle. Zusätzlich wurde der isolierte Backstudio-Pro-Dezimaltest korrigiert, sodass der Übersetzungs-Helper korrekt im Testkontext bereitsteht.
- Direkte isolierte Funktionschecks wurden auf Basis des letzten GitHub-Quellcodes ausgeführt. **Ein vollständiger Node-/Browser-/CI-Lauf wurde nicht als erfolgreich nachgewiesen.** Die GitHub-Actions-Jobs blieben bei der letzten Prüfung in der Warteschlange.
- Freigabe-Blocker: vollständige End-to-End-Anmeldung/Recovery im isolierten Browser, CI-Ergebnisse, verbleibende Übersetzungen und anschließend ausdrückliche Releaseentscheidung. Keine Produktionseinträge oder Supabase-Konfiguration geändert.

## GitHub Actions – CI-Fehlerbehebung (2026-11-21)

- Der GitHub-Workflow `i18n static checks` war auf `f5d55030` **rot** (53/56 Teiltests erfolgreich). Die offiziellen Workflow-Logs zeigten drei konkrete Probleme in isolierten Tests: fehlender `plantsCloudReady`-Mock im Kalender-VM-Test, LinkeDOM-`select.value` statt expliziter Optionswerte und fehlender Backstudio-Pro-`proUi`-Helper in einem VM-Test.
- Der Helper war im Branch bereits nachgerüstet; die beiden verbleibenden Fixtures wurden mit `28cea109` korrigiert. Für diesen Commit meldet GitHub Actions `i18n static checks` **success**.
- Im ergänzenden Backstudio-Layout ist der 3D-Startbutton auch dann auffindbar, wenn Pro-Steuerelemente zuvor schon auf Englisch lokalisiert wurden. Der Button behält die passende Sprachbeschriftung; WebGL-Kamera-/Maskottchen-/Baking-Datenlogik bleibt unverändert.
- Neue Regressionstests prüfen den bilingualen 3D-Start und schützen die zentrale Passwort-Wiederherstellung auf `index.html` vor versehentlicher Duplizierung in den Tool-Auth-Gates. Der vorhandene Token-Workflow bleibt unangetastet.
- Ein neuer vollständiger CI-Lauf für die nachfolgenden Commits muss erneut erfolgreich abgeschlossen sein, bevor ein Merge oder Deployment infrage kommt.
