# Hauptseiten-Redesign – 15.11.2026

Branch `design/home-mascot-duo`, Entwurf https://github.com/duhrrom11/toolya/pull/12.

Umgesetzt ist der gewählte helle Header mit beiden großen Originalfiguren und Lavendelbogen, horizontalen Favoriten und breiten Pastellkarten. Akzent: bläuliches Türkis; Karten: Rosa, Hellblau, Lavendel und Pfirsich. Alle zwölf bestehenden Tool-Routen und gespeicherten Favoriten bleiben erhalten; maximal drei Favoriten erscheinen im Schnellstart.

Buttons und Karten haben Hover-Anheben, Lichtsaum/Schatten und Druckeffekt; Toolkarten zusätzlich dezente Mausneigung und Symbolbewegung, Favoriten einen Stern-Pop. Kategorien wechseln weich. Das Duo reagiert auf Entdecken und erfolgreich gesetzte Favoriten, erhält Kategorie-Outfits und hat ein Fünf-Tipp-Kitzel-Easteregg. Eigene gezeichnete Blink-, Wink-, Zeige-, Lach- und Blickzustände sind pro Figur unabhängig auswählbar. Das sind Frameanimationen, kein frei riggbares Skelett. Hintergrundwellen, wenige Lichtpunkte und weiche Schatten ergänzen den Header.

Auf dem Smartphone stehen Duo, Überschrift, Favoriten und Toolkarten untereinander. Die Karten verwenden einen Symbol-/Titelkopf und volle Breite für Beschreibungen. Ruhemodus, Ausblenden, reduzierte Bewegung, Warnungen, offene Dialoge und pausierte/unsichtbare Seiten werden berücksichtigt.

Geprüfter Codecommit: `2d07ebd9b2e8ac3804394cee44f7eb1eb5dbf48b`.68 Modulprüfungen und isolierte Chromium-Prüfungen bestanden; keine Laufzeitfehler oder produktiven Schreibversuche. Plattform/Nachlass: https://github.com/duhrrom11/toolya/actions/runs/43659941158 . Amazon: https://github.com/duhrrom11/toolya/actions/runs/43659941228 . Desktop1440px und Mobil320px anhand echter CI-Screenshots geprüft (Artefakt14139696956). Original-PNGs unverändert.

Die direkte Cloud-Browser-Vorschau bleibt durch einen lokalen Verbindungsfehler blockiert. Deshalb bleibt die interaktive Übergabe in `design-qa.md` gesperrt; die CI-Prüfung und Screenshot-Sichtung ersetzen keine funktionierende lokale Vorschau. Keine Veröffentlichung, kein Merge, keine Produktivdatenänderung und keine Änderung am parallelen Wishlist-Branch.

## Transparente Begleiterbilder

Drei alte Atlanten (beide Emotionssammlungen und Outfits) freigestellt. Das Raster8×4 und1774×887px mit32 Posen pro Bild bleibt erhalten. Echte Alpha-Transparenz geprüft. Original-PNGs und neue Headerbilder waren bereits transparent und bleiben unverändert. Die zusätzliche weiße CSS-Fläche hinter den Sprite-Bildern sowie der Blend-Modus-Workaround für Outfits wurden entfernt. Alle68 Modulprüfungen bestanden; ein gezielter Browsercheck prüft den transparenten Frame-Hintergrund. Freistellungsauftrag: ausschließlich Hintergründe entfernen, Charaktere, Weißfell, Kleidung, Posen und Zellreihenfolge erhalten. Built-in-Bildbearbeitung verwendet. Veröffentlichung steht aus.
