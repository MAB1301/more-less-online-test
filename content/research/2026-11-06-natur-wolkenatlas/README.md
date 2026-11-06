# Natur · Internationaler Wolkenatlas — Entwurf vom 6. November 2026

Review-only-Paket mit 20 neuen Fragen aus dem offiziellen Internationalen Wolkenatlas der WMO. `content/approved.js` und die Live-Datenbank bleiben unverändert.

| Spiel | Main vorher | Neu | Mit Entwurf |
|---|---:|---:|---:|
| More/Less | 60 | 2 | 62 |
| Schätzen | 20 | 4 | 24 |
| Fakt/Fake | 12 | 6 | 18 |
| Jeopardy | 0 | 8 | 8 |
| **Gesamt** | **92** | **20** | **112** |

Die Vergleiche zählen Arten beziehungsweise Varietäten innerhalb derselben WMO-Ausgabe und Klassifikation. Fakt/Fake ist je Schwierigkeitsgrad 1:1 wahr/falsch. 22 atomare Beobachtungen werden nicht zwischen Fragen wiederverwendet.

Quellen, Prüfdatum, Ausgabe, Rundung und Grenzen stehen in `sources.json`, `observations.json` und `input.json`. `category-summary.json` enthält die vollständige Kategorien-/Unterkategorien-Inventur; Daily- und PR-Abgleich sind getrennt dokumentiert.

Zwei originale CC0-SVGs (720×540 und 960×540) zeigen eine abstrakte, geschichtete Wolkenlandschaft. Sie besitzen 40 px Sicherheitsrand und enthalten keine Wolkennamen, Kürzel, Höhen, Zahlen oder Lösungshinweise; Jeopardy bleibt bildfrei.

```sh
python3 scripts/build-natur-wolkenatlas-draft-20261106.py --check
node scripts/inventory-natur-wolkenatlas-draft-20261106.mjs --check
node scripts/check-natur-wolkenatlas-draft-20261106.mjs
npm test
npm run pwa:build
```
