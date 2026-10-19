# Chemie · geprüfter Entwurf 2026-10-19

Dieser Ordner enthält **20 neue, nicht veröffentlichte Fragen** für `Chemie`: 2 More/Less, 4 Schätzfragen, 6 ausgewogene Fakt/Fake-Aussagen und 8 Jeopardy-Fragen. Der neue Themenblock heißt `Elementeigenschaften · Dichte, Phasen & Herkunft`.

## Abgrenzung

- Main-Bestand: 32 eindeutige Chemiefragen, bislang ausschließlich Jeopardy und fast nur zu Elementsymbolen, Protonenzahlen sowie drei relativen Atommassen.
- Neu sind Dichte, Schmelz- und Siedepunkte, Aggregatzustand, Gruppen/Perioden, Entdeckung, Namensherkunft und Anwendungen.
- Beide More/Less-Paare vergleichen dieselbe RSC-Dichteangabe nahe Raumtemperatur in g/cm³. Die Unterschiede betragen nur rund 0,45 % beziehungsweise 2,94 %.
- Der Supabase-Daily-Katalog im Projekt Marc wurde ausschließlich lesend geprüft. Die gezielte Suche nach den neuen Kriterien und Beobachtungen ergab null Treffer; vorhandene Ordnungszahl-/Protonenzahlfragen wurden ausgeschlossen.
- 21 offene Entwürfe mit zusammen 1.020 ausstehenden Fragen wurden geprüft. Insbesondere der Chemie-nahe PR #130 behandelt andere Elemente; keine der 22 Beobachtungen dieses Pakets kommt dort vor.

## Quellen und Aktualität

Zehn Elementseiten der Royal Society of Chemistry und die offizielle IUPAC-Periodentafel wurden am 19.10.2026 geprüft. Jede Frage dokumentiert URL, Prüftag, Datenstand, Rundung und Bezugsrahmen. Die Werte sind elementare Stoffdaten, keine laufenden Statistiken; eine erneute Prüfung ist nach 365 Tagen vorgesehen. In der Baseline `content/review-schedule.json` ist am Prüftag kein Datensatz fällig.

## Bilder

`visuals/chemistry-properties-neutral-card.svg` (720×540, 4:3) und `visuals/chemistry-properties-neutral-detail.svg` (960×540, 16:9) sind originale CC0-Vektorgrafiken. Beide besitzen 40 px Sicherheitsrand und zeigen nur Atommodell, Laborgefäße und Kristall ohne Elementnamen, Werte oder Lösungshinweise. Nach dem ersten Render wurden Gefäße und Kristall um 25 px nach oben versetzt, damit sie die Beschriftung nicht berühren; beide Endformate wurden danach erneut ohne Anschnitt geprüft.

## Reproduzierbare Prüfung

```sh
python3 scripts/build-chemie-elementeigenschaften-draft-20261019.py --check
node scripts/inventory-chemie-elementeigenschaften-draft-20261019.mjs --check
node scripts/check-chemie-elementeigenschaften-draft-20261019.mjs
npm run pwa:build
npm test
```

Der Ordner ist ein Review-Artefakt. Er wird weder automatisch veröffentlicht noch in Main oder die Live-Datenbank übernommen.
