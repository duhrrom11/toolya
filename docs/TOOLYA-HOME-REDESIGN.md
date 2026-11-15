# Hauptseiten-Redesign – 15.11.2026

Branch: `design/home-mascot-duo`.

Gewählt: heller Header mit beiden großen Originalfiguren und Lavendelbogen, horizontale Favoritenleiste; farbige breite Toolkarten. Akzent bläuliches Türkis; rosa, hellblaue, lavendelfarbene und pfirsichfarbene Karten. Keine grünen Karten.

Implementiert: neue Hauptseite mit allen zwölf bestehenden Tool-Links, vorhandene echte Favoriten (bis zu drei Schnellzugriffe), Einstellungen/Konto weiterverwendet. Neue transparente Header- und Kartenbilder. Hover-Anheben, Lichtsaum/Schatten, dezente Mausneigung, Druckeffekt, Symbolbewegung und Stern-Pop. Maskottchen reagieren auf Entdecken, Kategorien und erfolgreich gesetzte Favoriten. Kategorie-Outfits, Fünf-Klick-Kitzelreaktion, begrenzte Begrüßung und gelegentlicher Framewechsel in Kategorie-Outfits. Mobile Reihenfolge: Duo, Überschrift, Favoriten, Karten. Warnungen und Dialoge haben Vorrang; Ruhemodus, Ausblenden und reduzierte Bewegung berücksichtigt.

Animationen beruhen auf vorhandenen Emotion-/Outfit-Frameillustrationen und Ganzfigurbewegungen. Kein Skelett-Rig oder echte unabhängige Blicksteuerung. Das ist bei weiterer visueller Verfeinerung zu beachten.

68 vorhandene Node-Prüfungen bestanden. JavaScript-Syntax geprüft. Cloud-Browser-Vorschau ist durch lokalen Verbindungsfehler blockiert. Details und offene Abnahme: `design-qa.md`. Noch keine visuelle Abnahme, kein Merge und keine Veröffentlichung. Wishlist-Branch und Produktivdaten unverändert.

## Fortsetzung

Beide Figuren erhalten eigene Acht-Posen-Atlanten mit gezeichneten Blink-, Wink-, Zeige-, Lach- und Blickzuständen. Der Bogen ist separat. Zeitversetzte Reaktionen und Blick-/Pfoten-Framewechsel sind unabhängig pro Figur steuerbar; kein Skelett-Rig. Laufende Animationen werden bei Warnungen, Dialogen oder reduzierter Bewegung abgebrochen, nach Rückkehr aus dem Browser-Cache korrekt wieder aufgenommen.

Der erste Plattform-Browsertest scheiterte an einem veralteten Startseiten-Locator. Dieser Test prüft den alten Begleiter jetzt weiterhin auf einer Toolseite; neue Startseitentests prüfen das Duo, echte Favoritenpersistenz, Kategorien, Sichtbarkeit und Bewegungseinstellungen sowie Desktop-/Mobile-Screenshots. Produktive Requests bleiben gesperrt. Erneuter CI-Lauf und visuelle Abnahme stehen noch aus.
