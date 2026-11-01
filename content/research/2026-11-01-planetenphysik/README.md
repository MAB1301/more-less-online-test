# Planetenphysik – geprüfter Review-Entwurf vom 1. November 2026

Dieser Ordner enthält 20 neue, eigenständige Fragen für die auswählbare Kategorie `Planetenphysik`: 2 More/Less, 4 Schätzfragen, 6 ausgewogene Fakt/Fake-Aussagen und 8 Jeopardy-Fragen. Der Entwurf wird weder von der App geladen noch in Supabase importiert.

## Abgrenzung und Kriterien

Main enthält 54 Planetenphysik-Fragen, alle in Jeopardy. Die vorhandenen Identitäten decken Sonnenentfernung, mittlere Temperatur, Dichte, Flucht- und Bahngeschwindigkeit, Masse, Äquatorgravitation und Rotation ab. Dieser Entwurf ergänzt andere Messgrößen: geometrische und Bond-Albedo, solare Bestrahlungsstärke, Kernradius, Abplattung, Schwarzkörpertemperatur, topografische Spannweite, polare Beschleunigung, Magnetfeldgeometrie, atmosphärische Skalenhöhe und Molekulargewicht, Trägheitsmoment, J₂ und Windbereich.

Die zwei More/Less-Paare vergleichen ausschließlich dieselbe Kennzahl, Einheit, NASA-Fact-Sheet-Familie und Datenedition. Sie sind keine umgedrehten Paare und verwenden vier getrennte Beobachtungen. Fakt/Fake ist in jeder Schwierigkeitsstufe exakt 1:1 wahr/falsch.

## Quellen und Grenzen

Alle zehn Quellen sind offizielle NASA-NSSDCA-Fact-Sheets bzw. deren Definitionsseite und wurden tatsächlich am 2026-11-01 geprüft. `sources.json` dokumentiert URL, Seitenstand, Datenjahr und Grenzen. NASA weist selbst darauf hin, dass die Tabellen Forschungsstände und keine einzige endgültige Menge offizieller Konstanten darstellen. Die Fragen übernehmen daher die publizierte Genauigkeit, nennen den Fact-Sheet-Bezug und erhalten eine jährliche Wiedervorlage.

Werte mit bekannten Abgrenzungsproblemen wurden ausgeschlossen: aktuelle Mondzahlen, Mars-Kernradius, unbekannter Oberflächendruck der Gasriesen sowie gemischte Oberflächen-/1-bar-Werte. Die Grafiken sind original, CC0, antwortneutral und zeigen keine Namen, Skalen, Zahlen oder Lösungshinweise.

## Duplikat- und Parallelprüfung

- Main `dced74bb1385014445e186969a09ccd92c20edb5`: 54 Planetenphysik-Fragen.
- 33 offene PRs geprüft; der TRAPPIST-Entwurf #129 gehört zu `Weltraum`, nicht `Planetenphysik`.
- Supabase-Projekt Marc ausschließlich gelesen: 7.187 Daily-Zeilen. Zwölf gezielte Kriterienabfragen ergaben null Treffer; breite Planetenabfragen führten zum Ausschluss bereits vorhandener Standardwerte.
- `content/review-schedule.json`: keine zum Prüfdatum fälligen Main-Einträge.

## Reproduktion und Prüfung

```sh
python3 scripts/build-planetenphysik-draft-20261101.py --check
node scripts/inventory-planetenphysik-draft-20261101.mjs --check
node scripts/check-planetenphysik-draft-20261101.mjs
npm run pwa:build
npm test
```

Ohne `--check` erzeugt der Python-Builder deterministisch `draft-pack.json`, `draft-review-schedule.json`, `validation.json` und beide SVG-Varianten. Der Inventar-Builder erzeugt `category-summary.json`.
