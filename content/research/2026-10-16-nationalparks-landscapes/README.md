# Nationalparks: Landschaften und Geologie – Review-Entwurf 16.10.2026

20 neue Fragen für die bestehende Kategorie **Nationalparks**: 2 More/Less, 4 Schätzen, 6 Fakt/Fake und 8 Jeopardy. Main enthält derzeit 22 eindeutige Fragen, alle in Jeopardy; mit diesem Entwurf wären es 42. Keine Zeile wird automatisch freigegeben oder in Supabase geschrieben.

## Inhalt und Vergleichsqualität

Die Vergleiche sind bewusst knapp und verwenden identische Bezugsrahmen: Katmai gegen Lake Clark als Park-and-Preserve-Fläche im selben NPS-Index (4.093.229 : 4.030.025 Acres) sowie Lassen Peak gegen Haleakalā als Gipfelhöhe über dem Meeresspiegel (10.457 : 10.023 ft). Keine Geschlechter-, Disziplin- oder Einheitenmischung und keine Paarinflation.

Weitere Themen: Crater Lake, Star Dune, White Sands, Badwater Basin, Dry Tortugas, Carlsbad Caverns, Vulkanformen, Wizard Island, Fort Jefferson, Brooks Camp, Bumpass Hell, Puʻuʻulaʻula und das Tularosa Basin. Vorhandene Gründungs-, Yellowstone-/Yosemite-/Grand-Canyon-Flächen- und Besuchsfragen wurden ausgeschlossen.

## Quellenprüfung

19 offizielle Seiten beziehungsweise Dokumente des U.S. National Park Service wurden am **16.10.2026** gelesen. `sources.json` dokumentiert URL, tatsächliches Prüfdatum, Seiten-/Datenjahr, Rundung und Grenzen. Flächenwerte sind veröffentlichte ganze Acres; Höhen und Tiefen veröffentlichte ganze Fuß. Die Star-Dune-Höhe ist naturbedingt veränderlich, die White-Sands-Zahl beschreibt ausdrücklich das gesamte Dünenfeld und nicht die Parkgrenze, Badwater wird als positiver Betrag unter dem Meeresspiegel abgefragt.

## Abgleich und Review

- Main `dced74bb1385014445e186969a09ccd92c20edb5`: 22 → 42 einschließlich Entwurf.
- 18 offene PRs / 960 Entwurfsfragen: 0 Treffer auf die 22 neuen Beobachtungen.
- Marc-Daily-Katalog read-only: 7.187 Zeilen, 0 Treffer auf die gewählten Landschaften und Messwerte, 0 Schreibzugriffe.
- Main-Reviewplan: 941 Einträge, am 16.10.2026 nichts fällig.
- Neue Einträge: jährlicher Review bis 16.10.2027 oder früher bei NPS-Neumessung/Grenzänderung.

## Bild und Reproduktion

Ein originales CC0-Motiv kombiniert abstrakt Vulkan, See, Düne, Baum und Höhle. Es wird deterministisch als 720×540 (4:3) und 960×540 (16:9) erzeugt, besitzt 40 px Sicherheitsrand und enthält keine Parknamen, Karten, Messwerte oder Lösungen. Jeopardy erhält kein Antwortbild.

```sh
python3 scripts/build-nationalparks-draft-20261016.py
node scripts/inventory-nationalparks-draft-20261016.mjs
node scripts/check-nationalparks-draft-20261016.mjs
npm run pwa:build
npm test
git diff --check
```

Die formale 20er-Quote ist in diesem Entwurf nur für Nationalparks erfüllt. Für die übrigen 34 Kategoriebezeichnungen bleiben in diesem Lauf 680 Fragen offen; es werden keine Werte erfunden.
