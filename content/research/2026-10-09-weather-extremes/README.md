# Rekorde & Extreme: WMO-Wetterrekorde – geprüfter Entwurf vom 9. Oktober 2026

20 neue eigenständige Fragen: 2 More/Less, 4 Schätzfragen, 6 Fakt/Fake (3 wahr, 3 falsch; in jedem Schwierigkeitsgrad ausgeglichen) und 8 Jeopardy. Review-only auf Main `0ca6f66d0f1efea5709b7de9f3256413e0a2f5b1`; keine App-Einbindung und keine Datenbankänderung.

| Rekorde & Extreme | More/Less | Schätzen | Fakt/Fake | Jeopardy | Gesamt |
|---|---:|---:|---:|---:|---:|
| Main, eindeutige Laufzeitfragen | 13 | 14 | 6 | 14 | 47 |
| Zusätzlich in offenen Entwürfen | 0 | 0 | 0 | 0 | 0 |
| Dieses Paket | 2 | 4 | 6 | 8 | 20 |
| Nach Annahme dieses Pakets | 15 | 18 | 12 | 22 | 67 |

`main-inventory.json` dokumentiert die tatsächlich geladenen Kategorien und Unterkategorien nach dem Merge des geprüften Main-Pakets. Dedupliziert werden normalisierte Textidentitäten beziehungsweise ungeordnete More/Less-Paare zusammen mit ihrer Einheit. Diese technische Eindeutigkeit ersetzt keine semantische Redaktion; die 20 Kandidaten wurden zusätzlich einzeln auf bloße Umformulierungen geprüft. Jeopardy behält seine tatsächlichen Board-Kategorien und wird nicht künstlich auf Kategorien anderer Spiele umgelegt.

Im Themenfilter erscheinen Kategorien und Unterkategorien erst ab fünf Fragen. „Rekorde & Extreme“ ist in Main auswählbar. Die neue Unterkategorie Wetterrekorde wäre mit 2 More/Less- und 4 Schätzfragen allein noch nicht als eigener Unterfilter sichtbar; das wird nicht als erfüllte Unterkategorie behauptet. Die acht Jeopardy-Fragen verstärken die bereits bestehende Spalte.

## Quellen, Datenjahre und Grenzen

Alle sieben Quellen sind Seiten oder Publikationen der [World Meteorological Organization](https://wmo.int/site/world-weather-and-climate-extremes-archive), tatsächlich am **2026-10-09** gelesen. Zentrale Referenz ist die WMO-Rekordtabelle mit Stand **25.07.2025**. Jeder Inhalt führt zusätzlich das jeweilige Ereignisjahr von 1913 bis 2021 beziehungsweise 2020 bei den Blitzrekorden. Das Tabellenjahr wird nicht als Messjahr ausgegeben.

- [WMO-Rekordtabelle, Stand 25.07.2025](https://wmo.int/sites/default/files/2025-07/Table_Records_25Jul2025.pdf)
- [829-km-Megablitz und 17,102-Sekunden-Blitz](https://wmo.int/news/media-centre/wmo-certifies-megaflash-lightning-record-usa)
- [24-Stunden-Niederschlag in Foc-Foc](https://wmo.int/asu-map?book=21486&map=Rain_081&original_nid=21824)
- [Windstoß auf Barrow Island](https://wmo.int/asu-map?map=Wind_028)
- [Ein-Minuten-Niederschlag in Unionville](https://wmo.int/es/asu-map?map=Rain_031)
- [60-Minuten-Niederschlag in Holt](https://wmo.int/fr/asu-map?map=rain_030)
- [Bestätigter Temperaturrekord für Kontinentaleuropa](https://wmo.int/media/news/wmo-confirms-verification-of-new-continental-european-temperature-record)

Die zwei Vergleiche verwenden jeweils exakt dieselbe WMO-Rekordklasse und Einheit: maximaler Windstoß je Hemisphäre in m/s sowie 24-Stunden-Niederschlag je Hemisphäre in mm. Messsysteme historischer Windrekorde unterscheiden sich, weshalb keine Aussage über typische Windverhältnisse abgeleitet wird. Niederschlagsfenster werden nicht gemischt. Blitzwerte übernehmen die publizierte Messunsicherheit; Schätzantworten verwenden den Zentralwert. Der Cilaos-Wert von 1.870 mm ist laut WMO ein alter Fehler und erscheint nur als bewusst falsche Aussage mit Erklärung.

Das WMO-Archiv ist ein lebendes Register. Potentielle Rekorde in Prüfung sind nicht automatisch enthalten. Deshalb sind sämtliche neuen Fragen als zeitabhängig markiert und in `draft-review-schedule.json` nach 90 Tagen erneut fällig. Die Main-review-schedule enthält am Prüftag **0 fällige Datensätze**.

## Duplikate und parallele Arbeit

Alle neun offenen PRs wurden erneut geprüft; als Inhalts-PRs gelten #122, #126, #127, #128, #129, #130 und #131. Keiner ergänzt „Rekorde & Extreme“ oder einen der ausgewählten WMO-Datensätze. `pending-inventory.json` dokumentiert die Zuordnung und ihre Grenzen. PRs #57 und #109 sind UI-/Backend-Arbeit ohne passende Inhaltskandidaten.

Der Supabase-Daily-Katalog im Projekt Marc wurde ausschließlich gelesen: 7.187 Kandidaten, davon 4.228 More/Less, 1.507 Schätzfragen und 1.452 Fakt/Fake; kein Jeopardy. Die Suche nach Orten, Rekordereignissen und Zahlen der Kandidaten ergab **0 Treffer**. Main, offene PRs und Daily werden getrennt gezählt und nicht zusammengerechnet. Die Suchprüfung ist ein Kandidatenfilter, keine automatische Garantie gegen jede denkbare Umschreibung.

## Grafik und Tests

Zwei originale CC0-SVGs: 720 × 540 (4:3) und 960 × 540 (16:9). Abstrakte Wolke, Regen, Windlinien und Blitz; keine Orte, Zahlen, Rekordhalter oder messbaren Antwortwerte. Jeopardy-Bilder sind ausdrücklich deaktiviert. Beide Varianten wurden mit Sharp gerendert und visuell geprüft: Beschriftung vollständig lesbar, keine abgeschnittenen Elemente, sichere Außenränder. **0 bestehende Bilder repariert**, 2 neue Vektorvarianten erstellt.

Reproduzierbare Prüfung:

```sh
node scripts/inventory-weather-draft.mjs
python3 scripts/build-weather-draft.py
python3 scripts/build-weather-draft.py --check
node scripts/weather-draft-check.mjs
node scripts/regression-check.mjs
npm run pwa:build
npm run test:pwa
```

Bestanden: deterministischer Build, Quellen-/Datenjahr-/Reviewprüfung, Main-/Spiegel-/interne Duplikate, identische Vergleichsrahmen, ausgeglichene Fakt/Fake-Stufen, isolierter Spielimport, Jeopardy ohne Antwortbild, SVG-Formate und -Sicherheit, vollständige Spielregression, Offline-Build und PWA-Prüfung.

## Offene Zielmengen

Die Quote von 20 Ergänzungen wird in diesem Lauf **nur für Rekorde & Extreme** erfüllt. Alle übrigen bestehenden Kategorien erhalten in diesem Entwurf **0 neue Fragen**; dort fehlen somit jeweils die gewünschten 20. Auch Rekorde & Extreme bleibt mit 67 Fragen einschließlich dieses Entwurfs unter 100. Redaktionelle Freigabe, Integration in die freigegebene Katalogpipeline und ein späterer Browser-/iPad-Test der integrierten Darstellung bleiben offen. Die fortlaufende Erweiterung endet nicht beim Erreichen von 100.
