# Weltkultur · immaterielles kulinarisches Erbe — Entwurf vom 5. November 2026

Review-only-Paket mit 20 neuen Fragen aus acht offiziellen UNESCO-Elementseiten. `content/approved.js` und die Live-Datenbank bleiben unverändert.

| Spiel | Main vorher | Neu | Mit Entwurf |
|---|---:|---:|---:|
| More/Less | 42 | 2 | 44 |
| Schätzen | 17 | 4 | 21 |
| Fakt/Fake | 12 | 6 | 18 |
| Jeopardy | 19 | 8 | 27 |
| **Gesamt** | **90** | **20** | **110** |

Die Vergleiche verwenden entweder dasselbe historische UNESCO-Einschreibungsjahr oder die aktuelle Zahl beteiligter Staaten derselben Repräsentativliste. Fakt/Fake ist je Schwierigkeitsgrad 1:1 wahr/falsch. 22 atomare Beobachtungen werden nicht zwischen Fragen wiederverwendet.

`sources.json` dokumentiert URL, Prüfdatum, Datenjahr und Grenzen; `observations.json` die atomaren Befunde; `input.json` die kuratierten Fragen. Builder, Inventar und Checker erzeugen bzw. prüfen das Paket deterministisch. Die komplette Kategorien-/Unterkategorien-Inventur liegt in `category-summary.json`, der lesende Daily-Abgleich in `daily-catalogue-check.json` und die PR-Prüfung in `parallel-pr-check.json`.

Zwei originale CC0-SVGs (720×540 und 960×540) zeigen abstrakt einen gemeinsam gedeckten Tisch. Sie besitzen 40 px Sicherheitsrand und enthalten keine Namen, Flaggen, Zahlen, Daten oder Lösungshinweise; Jeopardy bleibt bildfrei.

```sh
python3 scripts/build-weltkultur-foodways-draft-20261105.py --check
node scripts/inventory-weltkultur-foodways-draft-20261105.mjs --check
node scripts/check-weltkultur-foodways-draft-20261105.mjs
npm test
npm run pwa:build
```
