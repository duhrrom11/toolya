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

## Google-URL-Prüfung vom 23. November 2026

Die URL-Prüfung aller 18 Sitemap-Adressen bestätigt 14 indexierte Seiten. Für alle 14 entspricht Googles Canonical der Sitemap-Adresse. Neu bestätigt sind der Backform-Rechner, Zählerstände und Verliehene Dinge nach dem Crawl vom 22. November. Umzugskisten bleibt gecrawlt und derzeit nicht indexiert. Maskottchen, Impressum und Datenschutz sind laut URL-Prüfung weiterhin unbekannt. [Search Console](https://search.google.com/search-console?resource_id=sc-domain%3Atoolya.app)

Die ältere Backstudio-App `/tools/baking/index.html` steht separat noch mit dem Crawl vom 17. November im Index. Die zuletzt live bestätigte Noindex-Anweisung wird nach dem nächsten Crawl erneut gegen den Google-Status abgeglichen.

### Englische Beta

Alle 17 geprüften öffentlichen englischen HTML-Seiten waren live erreichbar und lieferten einen auf sich selbst verweisenden Canonical sowie `noindex` im HTML. Keine steht in der Sitemap des geprüften Repository-Stands `a837e53`. Die Indexierungsfreigabe ist ein eigener Schritt nach Abschluss und Abnahme der Lokalisierung. [DE/EN-Releaseplan](../i18n-de-en-rollout.md)

Als Nächstes stehen der erneute Google-Abgleich für Umzugskisten und die alte Backstudio-URL nach einem neuen Crawl sowie die bereits geplante 28-Tage-Wirkungsmessung an. Ein bestätigter Bing-Indexstatus und Felddaten zur Ladeleistung fehlen weiterhin.
