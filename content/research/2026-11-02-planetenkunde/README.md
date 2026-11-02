# Planetenkunde — geprüfter Entwurf vom 2. November 2026

Dieser Ordner enthält einen **review-only** Entwurf mit 20 neuen Fragen über Zwergplaneten. Er verändert weder `content/approved.js` noch die Live-Datenbank.

## Umfang

| Spiel | Main vorher | Neu | Mit Entwurf |
|---|---:|---:|---:|
| More/Less | 0 | 2 | 2 |
| Schätzen | 0 | 4 | 4 |
| Fakt/Fake | 0 | 6 | 6 |
| Jeopardy | 23 | 8 | 31 |
| **Gesamt** | **23** | **20** | **43** |

Die Fakt/Fake-Aussagen sind je Schwierigkeitsgrad 1:1 wahr/falsch verteilt. Die zwei Vergleiche verwenden dieselbe Kennzahl, Einheit, NASA-Seitenfamilie und denselben Prüfstand; die Abstände betragen 7,02 % und 15,11 %.

## Nachvollziehbarkeit

- `sources.json`: sieben offizielle NASA-Quellen, tatsächliches Prüfdatum, Datenstand und Grenzen.
- `observations.json`: 22 atomare, zitierfähige Beobachtungen.
- `input.json`: kuratierte Fragen mit Rundung, Bezugsrahmen und semantischem Schlüssel.
- `draft-pack.json`: deterministisch erzeugtes Review-Paket.
- `category-summary.json`: vollständige Main-Inventur nach Kategorien/Unterkategorien und Ziel-Bestand vorher/nachher.
- `daily-catalogue-check.json`: nur lesender Supabase-Abgleich.
- `parallel-pr-check.json`: Abgleich aller offenen PRs.
- `draft-review-schedule.json`: 90 Tage für veränderliche Mond-/Ring-/Anerkennungsstände, sonst jährlich.

## Bilder

Zwei originale, antwortneutrale SVG-Varianten (CC0-1.0) werden deterministisch erzeugt: 720×540 (4:3) und 960×540 (16:9). Beide besitzen einen sichtbaren Sicherheitsrand von 40 px, enthalten keine Texte, Größen, Namen oder Lösungshinweise und werden gerendert visuell geprüft. Jeopardy erhält bewusst keine Bilder.

## Reproduktion

```sh
python3 scripts/build-planetenkunde-draft-20261102.py --check
node scripts/inventory-planetenkunde-draft-20261102.mjs --check
node scripts/check-planetenkunde-draft-20261102.mjs
```

Anschließend laufen die vollständigen Inhalts-/Spieltests und der Offline-Build über `npm test` und `npm run pwa:build`.
