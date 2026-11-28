# Toolya Sitemap-Status und IndexNow

## Überprüfung vom 19. November 2026

| Dienst | Beobachtung |
| --- | --- |
| Google Search Console | Die Sitemap `https://toolya.app/sitemap.xml` wurde am 16. November eingereicht und am 19. November erfolgreich gelesen. Google meldete 18 erkannte Seiten. Eine erneute Einreichung war deshalb entbehrlich. |
| Bing Webmaster Tools | Die Sitemap-Einreichung konnte mangels angemeldeter Sitzung nicht geprüft werden. |
| IndexNow | Die öffentliche Verifikationsdatei im Webroot ermöglicht die Meldung einzelner neuer oder geänderter URLs an teilnehmende Suchmaschinen. Die Annahme einer Meldung bestätigt keinen Indexstatus und ist keine Sitemap-Einreichung. |

[Sitemap](https://toolya.app/sitemap.xml) · [Google Search Console](https://search.google.com/search-console/sitemaps?resource_id=sc-domain%3Atoolya.app) · [IndexNow-Protokoll](https://www.indexnow.org/documentation)

Bei künftigen Aktualisierungen über IndexNow nur die tatsächlich geänderten URLs melden. Die Sitemap bleibt das Verzeichnis der öffentlichen kanonischen Seiten. Indexierungsbestätigungen separat erheben.

## Google-URL-Prüfung vom 20. November 2026

Search Console bestätigte 11 der 18 kanonischen Sitemap-URLs als indexiert. Eine URL war gecrawlt und derzeit nicht indexiert. Sechs URLs waren Google laut URL-Prüfung unbekannt. Die Prüfung liest Googles gespeicherten Stand. [Search Console](https://search.google.com/search-console?resource_id=sc-domain%3Atoolya.app)

| Sitemap-Pfad | Google-Status |
| --- | --- |
| `/` | Eingereicht und indexiert |
| `/amazon-wunschliste-veroeffentlichen/` | Eingereicht und indexiert |
| `/autokosten/` | Eingereicht und indexiert |
| `/backform-rechner/` | Google unbekannt |
| `/digitaler-nachlass/` | Eingereicht und indexiert |
| `/haushaltsbuch/` | Eingereicht und indexiert |
| `/legal.html` | Google unbekannt |
| `/mascots.html` | Google unbekannt |
| `/parkplatz-merker/` | Eingereicht und indexiert |
| `/pflanzenpflege/` | Eingereicht und indexiert |
| `/privacy.html` | Google unbekannt |
| `/tiergesundheit/` | Eingereicht und indexiert |
| `/tools/wishes/public.html` | Eingereicht und indexiert |
| `/toolya-dashboard/` | Eingereicht und indexiert |
| `/umzugskisten/` | Gecrawlt, derzeit nicht indexiert |
| `/verliehene-dinge/` | Google unbekannt |
| `/wg-organisator/` | Eingereicht und indexiert |
| `/zaehlerstaende/` | Google unbekannt |

Google wählte für alle elf indexierten Sitemap-URLs die jeweils passende kanonische HTTPS-Adresse. Die alte Adresse `http://www.toolya.app/` erschien zusätzlich mit einem gespeicherten Crawl vom 16. November und leitete beim Live-Abruf auf `https://toolya.app/` weiter. In den finalen Websuchdaten vom 21. Oktober bis 17. November entfiel eine Impression auf diese alte Variante. Bing bleibt ohne bestätigten Indexierungsstand.

Die internen Querverweise auf Backform-Rechner, Zählerstände und Verliehene Dinge wurden ergänzt und live geprüft. [PR #270](https://github.com/duhrrom11/toolya/pull/270)

### Varianten der Startseite

| URL | Live-Antwort | Gespeicherte Google-URL-Prüfung |
| --- | --- | --- |
| `https://toolya.app/` | HTTP 200, Canonical auf sich selbst | Indexiert |
| `http://toolya.app/` | HTTP 301 direkt auf die HTTPS-Startseite | — |
| `https://www.toolya.app/` | HTTP 301 direkt auf die HTTPS-Startseite | Seite mit Weiterleitung |
| `http://www.toolya.app/` | HTTP 301 direkt auf die HTTPS-Startseite | Indexiert mit Crawl vom 16. November |
| `https://toolya.app/index.html` | HTTP 200, Canonical auf die HTTPS-Startseite | URL Google unbekannt |

Die Startversion unter `/index.html` wird als Ziel für die Passwort-Wiederherstellung verwendet. Google hat für die alte HTTP-Variante noch den älteren Crawl gespeichert. Deren Status und den der Umzugskisten nach dem nächsten Google-Crawl erneut prüfen. [Search Console](https://search.google.com/search-console?resource_id=sc-domain%3Atoolya.app)

### Live-Abgleich nach den Ratgeber-Updates

Am 20. November wurden alle 18 URLs aus der Live-Sitemap abgerufen. Das ausgelieferte HTML entsprach jeweils bytegenau dem Stand `7ffce51` auf `main`. Jede Seite enthielt einen Titel, eine Meta-Beschreibung und einen auf sich selbst verweisenden Canonical. In den HTML-Metatags fand sich keine Noindex-Anweisung.

Damit sind die Ergänzungen zum Beschriften von [Umzugskisten](https://github.com/duhrrom11/toolya/pull/272), zur [Verleihliste](https://github.com/duhrrom11/toolya/pull/273), zum [Zählerverbrauch](https://github.com/duhrrom11/toolya/pull/274) und zur [Backform-Umrechnung](https://github.com/duhrrom11/toolya/pull/275) live bestätigt. In der erneuten Google-URL-Prüfung war für diese vier Seiten noch kein neuer Crawl sichtbar. Der nächste Indexierungsvergleich ist nach einer Aktualisierung der Google-Daten aussagekräftig.

### R23 und R27 – Verzeichnisvarianten und interne Linkziele

Die 18 Sitemap-Adressen und ihre 14 zusätzlichen `index.html`-Varianten wurden am 20. November ohne Weiterleitungsverfolgung live abgerufen. Alle 32 Antworten lieferten HTTP 200. Jede enthielt genau einen Canonical. Dieser zeigte bei den Sitemap-Adressen auf die jeweils eigene URL und bei den `index.html`-Varianten auf die passende Verzeichnis-URL. Keine Antwort enthielt `noindex` im `X-Robots-Tag`.

Die statisch im HTML hinterlegten Links auf toolya.app wurden für alle 18 Sitemap-Seiten gegen den Repository-Stand `85bd524` geprüft. Alle geprüften Pfade und HTML-Sprungmarken waren vorhanden. Dynamisch erzeugte Links waren außerhalb dieser Prüfung.

## Indexierungsstand nach dem DE/EN-Release am 27. November 2026

Der Live-Abruf bestätigte für alle 33 Sitemap-URLs HTTP 200, die jeweils eigene Canonical-Adresse und die Freigabe zur Indexierung im HTML und HTTP-Header. Für die 16 Sprachpaare stimmten die DE-/EN-Ziele im HTML mit der Sitemap überein. Die Sitemap setzt zusätzlich den deutschen Rückfallwert `x-default`. Die ausgelieferte Sitemap entsprach bytegenau `d9db348`. [Live-Sitemap](https://toolya.app/sitemap.xml) · [DE/EN-Release](https://github.com/duhrrom11/toolya/pull/327)

| URLs | Gespeicherter Status in der Google Search Console |
| --- | --- |
| 17 deutschsprachige Sitemap-Ziele | 16 bestätigt indexiert. Das Impressum ist Google laut URL-Prüfung unbekannt. |
| 16 englischsprachige Sitemap-Ziele | 11 mit Noindex aus den letzten gespeicherten Crawls vom 24. November ausgeschlossen. Fünf erkannt und derzeit nicht indexiert. |

Die Umzugskisten-Anleitung ist nach dem Crawl vom 24. November indexiert. Die alte Backstudio-App `/tools/baking/index.html` ist mit dem gespeicherten Crawl vom 17. November noch indexiert. Die App-URL steht außerhalb der Sitemap. [Search Console](https://search.google.com/search-console?resource_id=sc-domain%3Atoolya.app)

Der nächste Abgleich prüft, ob Google die englischen Seiten nach einem Crawl der inzwischen indexierbaren Live-Version aufgenommen hat. Für Bing und reale Ladeleistungsdaten liegt in diesem Abgleich kein neuer Nachweis vor. Der 28-Tage-Vergleich ist separat vorgesehen.
