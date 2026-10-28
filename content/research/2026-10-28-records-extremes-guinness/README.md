# Rekorde & Extreme · Guinness (Entwurf)

Geprüfter, unveröffentlichter Entwurf auf Main `dced74b`.

- 20 Fragen: 2 More/Less, 4 Schätzen, 6 Fakt/Fake, 8 Jeopardy
- 22 eigenständige Beobachtungen aus zwölf offiziellen Guinness-Rekordseiten, geprüft am 28.10.2026
- eindeutiger Main-Bestand: 47 → 67 mit diesem Entwurf
- 30 offene PRs / etwa 1.200 ausstehende Fragen und 7.187 Daily-Katalogzeilen geprüft; keine Konflikte
- neue Kriterien: Hauptspannweite, Widerristhöhe, Brückendeckhöhe, Gesamt-/Glasbrückenlänge und Wasserfallbreite
- Vergleiche: 2.023:1.991 m (1,61 %) sowie 100,7:97,5 cm (3,28 %)
- der Tiervergleich ist eine ausdrücklich gekennzeichnete Ausnahme: gleiche Spezies, gleiche Guinness-Messmethode, gleicher Bezugsrahmen und enger Abstand; keine menschlichen Geschlechter- oder Sportdisziplinvergleiche
- Fakt/Fake je Schwierigkeitsgrad 1:1 wahr/falsch
- originale, antwortneutrale SVGs in 720×540 und 960×540, 40 px Sicherheitsrand
- `content/review-schedule.json`: 941 Main-Datensätze geprüft, keine am Prüfdatum fällig
- alle neuen Rekordwerte erhalten wegen möglicher Titelwechsel eine 90-Tage-Wiedervorlage
- Supabase nur gelesen; keine Live-Daten geändert

## Reproduzierbarer Build

```sh
python3 scripts/build-records-extremes-guinness-draft-20261028.py
node scripts/inventory-records-extremes-guinness-draft-20261028.mjs
node scripts/check-records-extremes-guinness-draft-20261028.mjs
```

Eingaben sind `input.json`, `sources.json` und `observations.json`. Builder und Inventarskript erzeugen Pack, Review-Plan, SVGs, Main-Inventar, Duplikataudit und Validierungsbericht deterministisch.

## Grenzen

Guinness weist darauf hin, dass Rekorde täglich wechseln können und Online-Seiten nicht immer sofort aktualisiert werden. Deshalb bleibt das Paket `review-only`. Dieser Lauf erfüllt die 20er-Quote nur für `Rekorde & Extreme`; für die anderen 34 Kategorien bleiben formal 680 Fragen offen.
