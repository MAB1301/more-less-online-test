# Mix · Offizielle Standards & Zahlenmix (Entwurf)

Geprüfter, nicht veröffentlichter Entwurf auf Basis von Main `dced74b`.

- 20 neue Fragen: 2 More/Less, 4 Schätzen, 6 Fakt/Fake, 8 Jeopardy
- 22 eigenständige Beobachtungen aus sieben offiziellen Quellen (EZB, BIPM, UNESCO, NobelPrize.org)
- Main vor/nach diesem Entwurf: 28 → 48 eindeutige Fragen in `Mix`
- 29 offene PRs mit 1.180 ausstehenden Fragen und 7.187 Daily-Katalogzeilen wurden auf exakte, umgedrehte und semantische Wiederholungen geprüft
- beide Vergleiche nutzen gleiche Ausgabe, Kennzahl und Einheit; Abstände 5,26 % und 4,30 %
- Fakt/Fake je Schwierigkeitsgrad ausgeglichen wahr/falsch
- zwei neue antwortneutrale SVGs: 720×540 (4:3) und 960×540 (16:9), 40 px Sicherheitsrand, keine Texte oder Lösungswerte
- `content/review-schedule.json`: 941 Datensätze geprüft, am 27.10.2026 keine fälligen Werte
- Supabase ausschließlich lesend; keine Live-Daten geändert

## Reproduzierbarer Build

```sh
python3 scripts/build-mix-official-standards-draft-20261027.py
node scripts/inventory-mix-official-standards-draft-20261027.mjs
node scripts/check-mix-official-standards-draft-20261027.mjs
```

`input.json`, `sources.json` und `observations.json` sind die Eingaben. Der Builder erzeugt `draft-pack.json`, den Entwurfs-Prüfplan, die beiden SVGs und `validation.json` deterministisch. Das Inventarskript erzeugt Main-Bestand, Duplikatprüfung und Kategoriensumme.

## Grenzen

Dieser Lauf erfüllt die Quote nur für `Mix`. Für die übrigen 34 aktuell auswählbaren Kategorien bleiben formal 680 Fragen bis zu 20 je Kategorie in demselben Lauf. Das Paket ist `review-only`, wird nicht automatisch importiert und verändert weder Main noch Supabase.
