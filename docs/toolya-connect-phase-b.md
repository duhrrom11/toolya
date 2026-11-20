# Toolya Connect – integrierte Ausgabe

## Produktregel
Connect hat keine eigene Seite oder einen eigenen Hauptbereich. Die Wahl erscheint
bei einer passenden Erfassung direkt oberhalb des Speichern-Knopfs, standardmäßig aus,
und ist nur bei einem tatsächlich positiven, centgenauen Betrag aktiv.
Die Quelle wird zuerst bestätigtermaßen in Toolya Cloud gespeichert; erst danach
wird die gesondert bestätigte Übertragung ins Haushaltsbuch ausgelöst.

## Aktive Verbindungen
| Quelle | Auslöser | Ziel | Kategorie |
| --- | --- | --- | --- |
| Autokosten | neuer Ereignis-Eintrag mit realen Kosten | Haushaltsbuch | Auto |
| Parkplatz-Merker | neuer Parkvorgang mit tatsächlicher Gebühr | Haushaltsbuch | Auto |
| Haustier-Gesundheitspass | neues Ereignis mit tatsächlichen Kosten | Haushaltsbuch | Haustiere |

Der Betrag, Datum und Titel werden aus der bereits gespeicherten Cloud-Quelle
serverseitig übernommen. Fotos, Belege, GPS-Positionen, medizinische Zusatzdaten,
Seriennummern und sonstige vertrauliche Metadaten werden **nicht** übertragen.
Zahlungsart wird als **Bargeld (prüfen)** angelegt, nicht als behauptete
tatsächlich benutzte Zahlungsart.

Ein Ausgabeneintrag bleibt bei abgebrochener Übertragung bestehen; ein manueller
Retry ist direkt an der Eingabe möglich. Ein serverseitiges Transferjournal
verhindert Mehrfachverbuchungen. Revisionen beider Cloud-Snapshots werden geprüft.
Die Übertragung verlangt dieselbe verifizierte Benutzeridentität auf beiden Seiten.
Das Journal hat RLS und keine direkten Schreibrechte für Browserrollen.

## Geprüfte, bewusst nicht automatisch verbundene Bereiche
- **WG-Kasse**: Buchungen können gemeinsam sein, Kostenträger und Cloud-Eigentümer
  müssen nicht identisch sein. Keine heimliche Übernahme in ein privates Budget.
- **Zählerstände**: Tarif- und Jahreskostenprognosen sind keine realen Zahlungen.
- **Pflanzen**: ROI-/Ertragsrechnung ist eine Simulation, kein Beleg.
- **Verleih**: Kautionen sind Forderungen/Sicherheiten und keine laufenden Ausgaben.
- **Umzugskisten, Backformen/Rezeptrechner, Wunschliste**: keine verifizierte
  vollständige Zahlung bei der normalen Eintragsanlage.
- **Digitaler Nachlass**: vertraulicher Sonderbereich ohne finanzielle Buchung.

Erst bei echten Zahlungen und klarer Kostenverantwortung kann eine weitere
Verbindung samt passender Serverregel ergänzt werden; keine Platzhalter-Checkboxen.

## Qualität und Betrieb
Die Backend-Migration ist auf Toolya Supabase angewendet und die Berechtigungen
wurden schreibfrei geprüft. Das CI nutzt ausschließlich synthetische Benutzer und
isoliertes PostgreSQL/Browserkontexte. Eine echte Buchung im produktiven Konto wird
nicht zu Testzwecken erzeugt.
