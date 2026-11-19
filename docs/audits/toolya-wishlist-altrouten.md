# Wunschlisten-Altrouten und Indexierung

SEO-Roadmap R11 · Stand 19. November 2026

Alle 16 geprüften Adressen antworteten bei der [Live-Inventur](toolya-seo-url-inventory.json) mit HTTP 200 und `noindex`. Keine steht in der Sitemap. Die Tabelle trennt die Funktion im aktuellen Quellcode von der Entscheidung zur öffentlichen Suche. Die Zahl der statischen Verweise zählt andere HTML-Dateien im Repository. Links aus JavaScript und gespeicherte Lesezeichen sind darin nicht enthalten.

| Route unter `/tools/wishes/` | Verbleibende Funktion | Zugriff laut Quellcode | Statische Verweise | Entscheidung |
| --- | --- | --- | ---: | --- |
| `assistant.html` | Geschenkideen und Planungsassistenz | Anmeldung | 2 | Für ältere Planungslinks erhalten. |
| `bookmarks.html` | Persönliche Merkliste für Sammlungen | Anmeldung für persönliche Einträge | 3 | Für gespeicherte Merklisten erhalten. |
| `cockpit.html` | Überblick zur Geschenkplanung | Anmeldung | 1 | Für ältere Planungslinks erhalten. |
| `collection.html` | Detailansicht einer früheren öffentlichen Toolya-Sammlung | Öffentliche, nicht archivierte Sammlung per ID. Kontoaktionen separat. | 0 | Direktlinks auf Sammlungen erhalten. Das Amazon-Verzeichnis zeigt einen anderen Datenbestand. |
| `dashboard.html` | Geschenkübersicht | Anmeldung für persönliche Daten | 0 | Einstieg für bestehende Planungslinks erhalten. |
| `discover.html` | Frühere Toolya-Sammlungen entdecken | Öffentliche, nicht archivierte Sammlungen | 6 | Als älteren Entdecken-Weg erhalten. Das Amazon-Verzeichnis bleibt der öffentliche Sucheinstieg. |
| `feed.html` | Aktivität öffentlicher Toolya-Sammlungen und abonnierter Profile | Öffentliche Basisansicht. Persönliche Abos nur bei Anmeldung. | 2 | Für ältere Community-Links erhalten. |
| `gift-analytics.html` | Jahresauswertung der persönlichen Geschenkplanung | Anmeldung | 2 | Für bestehende Auswertungslinks erhalten. |
| `gift-tasks.html` | Eigene Geschenkaufgaben | Anmeldung | 3 | Für bestehende Aufgabenlinks erhalten. |
| `notifications.html` | Persönliche Mitteilungen | Anmeldung für persönliche Daten | 1 | Für ältere Konto- und Mitteilungslinks erhalten. |
| `occasions.html` | Anlässe wie Geburtstage verwalten | Anmeldung für persönliche Daten | 4 | Für ältere Anlass-Links erhalten. |
| `planner.html` | Geschenke und Budget planen | Anmeldung für persönliche Daten | 3 | Für bestehende Planungslinks erhalten. |
| `profile.html` | Älteres öffentliches Toolya-Profil per Handle | Abfrage per Handle, mit sichtbaren öffentlichen Sammlungen | 0 | Direktlinks mit Handle erhalten und außerhalb der Indexierung halten. Das Amazon-Wunschprofil ist eine andere Ansicht. |
| `report.html` | Privater Aufgaben- und Fortschrittsbericht | Anmeldung | 2 | Für bestehende Berichtslinks erhalten. |
| `reservations.html` | Persönliche Geschenkreservierungen | Anmeldung für persönliche Daten | 3 | Für vorhandene Reservierungen erhalten. |
| `social.html` | Persönliche Community-Übersicht | Anmeldung | 2 | Für ältere Community-Links erhalten. |

Die Module der Altseiten enthalten eigenständige Funktionen. Eine pauschale Weiterleitung auf das öffentliche Amazon-Verzeichnis würde Sammlungs-, Profil- und Planungseinstiege zusammenwerfen. Deshalb behalten alle 16 Adressen ihren aktuellen HTTP-Status und `noindex`. Die gemeinsame Workspace-Navigation enthält zudem Links, die erst per JavaScript erzeugt werden. Ob Nutzer noch eigene Lesezeichen haben, ist nicht messbar und wurde bei der Entscheidung berücksichtigt.

Der [öffentliche Wunschlistenfinder](https://toolya.app/tools/wishes/public.html) bleibt in der Sitemap. Der separate Einstieg `/tools/wishes/index.html` nennt ihn als Canonical und leitet im Browser weiter. Dieser Einstieg gehört nicht zu den 16 Altseiten. Die Übersicht beruht auf HTTP-Antworten und lesender Quellprüfung. Kontospezifische Funktionen wurden nicht mit echten Konten oder Produktivdaten ausgeführt. Die Prüfung von Datenbankrechten wird getrennt dokumentiert.
