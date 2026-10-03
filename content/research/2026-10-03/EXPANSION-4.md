# More/Less und Schätzfragen: vierte Erweiterung

44 neue Fakten ergeben 290 zusätzliche Vergleiche und 44 neue Schätzfragen. Der freigegebene Pack enthält danach 556 Vergleiche und 128 Schätzfragen; der gesamte More/Less-Pool enthält einschließlich bestehender Basisfragen 629 Vergleiche.

| Bereich | Neue Fakten / Schätzfragen | Neue Vergleiche |
| --- | ---: | ---: |
| Weltraum | 24 | 84 |
| Wissenschaft | 6 | 105 |
| Natur | 5 | 40 |
| Raumfahrt | 5 | 40 |
| Weltkultur | 4 | 21 |

Die Vergleiche verbinden neue Werte mit passenden bisherigen Einträgen. Keine gespiegelten Paare und keine Paare mit gleichen Werten, etwa Machu Picchu und Taj Mahal (beide 1983).

## Recherche

Am 3. Oktober 2026 gegen offizielle Quellen geprüft. Einzelwerte, URLs, Definitionen und Fragen stehen in `expansion-4.json` und im Hauptkatalog.

- NASA Planetary Fact Sheet plus Notes: mittlere Dichte, Fluchtgeschwindigkeit und mittlere Bahngeschwindigkeit der acht Planeten. Gerundete Tabellenwerte; keine Werte aus verschiedenen Detailtabellen mischen. Neue Durchmesserfragen wurden vermieden, weil sie bereits im Basispool existieren.
- Royal Society of Chemistry: Ordnungszahlen von Bor, Fluor, Phosphor, Kalium, Silber und Gold.
- National Park Service: erste Ausweisung von Grand Teton (1929), Shenandoah (1935), Arches (1971), Canyonlands (1964) und Joshua Tree (1994) als Nationalpark. Frühere Monument-, Genehmigungs- und spätere Erweiterungsdaten bleiben getrennt.
- NASA/JPL: Startjahre von Explorer 1, Mariner 2, Pioneer 10, Galileo und Juno. Keine Ankunfts- oder Vorbeiflugjahre.
- UNESCO: erste Einschreibung von Rom, Machu Picchu, Petra und Angkor. Rom 1980, nicht Erweiterung 1990; die gesamte Welterbestätte wird benannt.

## Format und Kontrolle

20 originale Motive mit jeweils zwei lokalen SVGs: 720×540 für Karten und 960×540 für Detailansichten. Große Elementsymbole, sonst keine kleinen Bildbeschriftungen oder Antwortzahlen. Die Dateiinhalte sind über `scripts/build-expansion-4.py` reproduzierbar.

SVGs erhalten in den tatsächlichen Karten- und Fragenrenderern `visualContain`, auch wenn eine Detaildatei existiert. Dadurch bleiben Motive und frühere Grafikbeschriftungen vollständig sichtbar. Fotos verwenden weiterhin ihr bestehendes Format. Die Vergleichsfrage benennt Dichte und beide Geschwindigkeitsarten explizit; Dichte wird nicht als Gewicht formuliert.

Alle 40 neuen SVGs wurden gerendert und in schmalen Karten- und Detailcontainern visuell geprüft. Ein Integrationstest führt die tatsächlichen Renderfunktionen aus und prüft die CSS-Klasse und Datei für beide Varianten. Vollständige Node-Regression und Python-Validierung bestanden. Ein kompletter Browserlauf war lokal nicht verfügbar.

Kein Deployment und keine Live-Datenbankänderung. Die Änderungen ergänzen PR #94.
