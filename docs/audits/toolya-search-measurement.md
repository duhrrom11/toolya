# Toolya Suchleistung und Nutzung

## R60 – Messstand vom 19. November 2026

Google Search Console, Property `sc-domain:toolya.app`, Suchtyp Web. Tagesgrenzen gelten für die Zeitzone der Search Console. Die beiden Abfragen verwenden dieselbe Property.

| Zeitraum | Datenstand | Bericht | Beobachtung |
| --- | --- | --- | --- |
| 19. Oktober bis 15. November | Final | Seite, Land, Gerät | Jeweils keine Zeilen geliefert. |
| 19. Oktober bis 15. November | Final | Datum | Eine Zeile am 15. November mit 0 Klicks und 0 Impressionen. Für diese Zeile ist keine Position auswertbar. |
| 16. bis 18. November | Vorläufig | Datum | 10 Impressionen und 0 Klicks in den zurückgegebenen Tageszeilen. Darunter 1 Impression am 16. und 9 am 18. November. |

### Vorläufiger Zeitraum nach Seite, Land und Gerät

| Segment | Wert | Klicks | Impressionen | CTR | Ø Position |
| --- | --- | ---: | ---: | ---: | ---: |
| Seite | `http://toolya.app/` | 0 | 1 | 0 % | 1 |
| Seite | `http://www.toolya.app/` | 0 | 1 | 0 % | 7 |
| Seite | `https://toolya.app/` | 0 | 5 | 0 % | 1,8 |
| Seite | `https://toolya.app/tools/baking/index.html` | 0 | 4 | 0 % | 58,3 |
| Seite | `https://toolya.app/tools/wishes/public.html` | 0 | 2 | 0 % | 5 |
| Land | `deu` | 0 | 10 | 0 % | 24,5 |
| Gerät | `DESKTOP` | 0 | 3 | 0 % | 54,3 |
| Gerät | `MOBILE` | 0 | 7 | 0 % | 11,7 |

Die Seitengruppierung liefert mehr Impressionen als die Property-Gruppierung. Ihre Zeilen werden separat verglichen. Die verschiedenen Gruppierungen ergeben keine gemeinsame Summe. Die vorläufigen Werte können sich ändern.

### Indexierung und kanonische URL

- Beide beobachteten HTTP-Varianten der Startseite leiteten beim Live-Abruf mit HTTP 301 auf `https://toolya.app/` um. Die HTTPS-Seite nennt sich selbst als Canonical.
- Die in der Search Console beobachtete Backform-App unter `/tools/baking/index.html` liefert beim Live-Abruf `noindex, follow`. Der öffentliche Ratgeber `/backform-rechner/` liefert seinen eigenen Canonical und steht in der Sitemap.
Die Google-URL-Prüfung vom 19. November erfasste die 18 Sitemap-Ziele und zusätzlich die ältere Backform-App. Google bestätigte zwei Sitemap-Ziele als indexiert. Die übrigen 16 Sitemap-Ziele meldete Google als unbekannt. Auch die ältere App war im letzten gespeicherten Google-Stand noch indexiert. Sie liefert aktuell `noindex`. Ob ein erneuter Crawl beantragt wurde, lässt sich aus dieser Prüfung nicht ableiten.

| URL auf toolya.app | Google-Status | Google-Canonical auf toolya.app | Letzter Crawl (UTC) |
| --- | --- | --- | --- |
| `/` | Gesendet und indexiert | `/` | 2026-11-16 02:41:22 |
| `/tools/baking/index.html` | Gesendet und indexiert | `/tools/baking/index.html` | 2026-11-17 05:55:09 |
| `/backform-rechner/` | URL ist Google nicht bekannt | Nicht gemeldet | Nicht gemeldet |
| `/tools/wishes/public.html` | Gesendet und indexiert | `/tools/wishes/public.html` | 2026-11-17 06:17:40 |
| `/amazon-wunschliste-veroeffentlichen/` | URL ist Google nicht bekannt | Nicht gemeldet | Nicht gemeldet |
| `/autokosten/` | URL ist Google nicht bekannt | Nicht gemeldet | Nicht gemeldet |
| `/digitaler-nachlass/` | URL ist Google nicht bekannt | Nicht gemeldet | Nicht gemeldet |
| `/haushaltsbuch/` | URL ist Google nicht bekannt | Nicht gemeldet | Nicht gemeldet |
| `/parkplatz-merker/` | URL ist Google nicht bekannt | Nicht gemeldet | Nicht gemeldet |
| `/pflanzenpflege/` | URL ist Google nicht bekannt | Nicht gemeldet | Nicht gemeldet |
| `/tiergesundheit/` | URL ist Google nicht bekannt | Nicht gemeldet | Nicht gemeldet |
| `/toolya-dashboard/` | URL ist Google nicht bekannt | Nicht gemeldet | Nicht gemeldet |
| `/umzugskisten/` | URL ist Google nicht bekannt | Nicht gemeldet | Nicht gemeldet |
| `/verliehene-dinge/` | URL ist Google nicht bekannt | Nicht gemeldet | Nicht gemeldet |
| `/wg-organisator/` | URL ist Google nicht bekannt | Nicht gemeldet | Nicht gemeldet |
| `/zaehlerstaende/` | URL ist Google nicht bekannt | Nicht gemeldet | Nicht gemeldet |
| `/mascots.html` | URL ist Google nicht bekannt | Nicht gemeldet | Nicht gemeldet |
| `/legal.html` | URL ist Google nicht bekannt | Nicht gemeldet | Nicht gemeldet |
| `/privacy.html` | URL ist Google nicht bekannt | Nicht gemeldet | Nicht gemeldet |

Für die Startseite nennt die gespeicherte Google-Version `/index.html` als Nutzer-Canonical. Live steht bereits `/` im HTML. Google hat `/` als Canonical gewählt.

### Bing und Google Analytics

- **Bing Webmaster Tools.** Das Admin-Dashboard besitzt einen geschützten Bing-Abruf. Für diesen Messstand lag kein autorisierter Bing-Bericht vor. Bing-Klicks, Impressionen und Indexierungsstatus bleiben offen.
- **GA4.** Die verbundene Property Toolya lieferte für den 19. Oktober bis 15. November keine Seitenzeilen für organische Suche oder alle Kanäle. Auch der Bericht für Schlüsselereignisse enthielt keine Zeilen. Der vorhandene Website-Code erfasst `tool_open` nach Einwilligung auf bekannten Tool-Routen. Ein solcher Aufruf steht für das Öffnen eines Tools. Ein Nutzungsabschluss wird daraus nicht abgeleitet. Für diese Messung wurden keine Ereignisse erzeugt.

## Wiederholung und 28-Tage-Vergleich

1. In der Search Console wieder `sc-domain:toolya.app` und Web-Suche verwenden. Zwei gleich lange, vollständige 28-Tage-Fenster mit finalen Daten vergleichen. Den Umstellungstag auslassen. Datum, Seite, Land und Gerät jeweils separat exportieren. Leerberichte, Werte von null und fehlende Positionen getrennt ausweisen.
2. Die öffentliche Ratgeber-URL und die ältere App-URL getrennt untersuchen. Für jede URL das Prüfdatum, den von Google gewählten Canonical sowie den bestätigten Indexstatus festhalten. Bing separat prüfen, sobald ein autorisierter Bericht abrufbar ist.
3. In GA4 denselben Zeitraum in der Zeitzone der Property verwenden. Organische Seitenaufrufe und `tool_open` als getrennte Berichte abrufen. Unterbrochene oder fehlende Datenerfassung kennzeichnen.
4. Für Änderungen vom 19. November können die 28 vollen Nachher-Tage frühestens vom 20. November bis 17. Dezember reichen. Für den Abschlussvergleich kommt die Wartezeit bis zur Finalisierung der Berichte hinzu. Aus der kleinen vorläufigen Stichprobe am 19. November wird keine Wirkung abgeleitet.

[OpenSEO · Suchleistung](https://app.openseo.so/p/6eddcfc6-d4a2-403b-a689-d02bc761a969/search-performance) · [Google Search Analytics API](https://developers.google.com/webmaster-tools/v1/searchanalytics/query) · [Google URL-Prüfung](https://support.google.com/webmasters/answer/9012289)
