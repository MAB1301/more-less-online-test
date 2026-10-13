# Arbeitswelt – geprüfter Entwurf vom 13.10.2026

Review-only-Paket mit 20 neuen Fragen: 2 More/Less, 4 Schätzfragen, 6 ausgewogene Fakt/Fake-Aussagen und 8 Jeopardy-Fragen. Es verändert weder `content/approved.js` noch Supabase.

## Umfang und Auswahl

- Zielkategorie: `Arbeitswelt`, da Main dort nur vier eindeutige, quellenbelegte Fakt/Fake-Einträge und in den anderen drei Spielen keine Einträge enthält.
- Bestand: Main 4 → mit diesem Entwurf 24. Die 15 bereits offenen PRs enthalten laut begrenzter Fachbegriffssuche keine Arbeitsrechtsfälle.
- Die beiden More/Less-Fragen vergleichen jeweils dieselbe Kennzahl und Einheit innerhalb eines klar bezeichneten deutschen Rechtsrahmens. Es gibt keine Geschlechter-, Leistungs- oder verschiedenen Sportstreckenvergleiche.
- Alle 20 Fragen verwenden unterschiedliche Beobachtungsschlüssel; das Paket wird nicht aus vielen Paarungen derselben wenigen Objekte aufgefüllt.

## Quellen und Grenzen

Alle Quellen sind amtliche Einzelnormen von `gesetze-im-internet.de`, geprüft am 13.10.2026. `data_year: 2026` bezeichnet den Prüfstand, nicht das ursprüngliche Verkündungsjahr. Gesetzliche Ausnahmen, Tariföffnungsklauseln und Sonderfälle werden in `notes` eingegrenzt. Der Inhalt ist Quizmaterial und keine Rechtsberatung.

Änderbare Gesetzeswerte werden im Entwurf nach 90 Tagen, erstmals am 11.01.2027, erneut geprüft. Im bestehenden `content/review-schedule.json` waren am Prüftag keine Datensätze fällig.

## Bilder

Die deterministische Pipeline erzeugt ein eigenes, antwortneutrales CC0-SVG in 720×540 (4:3) und 960×540 (16:9). Der 40-Pixel-Sicherheitsrand, die ViewBox, verbotene eingebettete Inhalte und sichtbare Lösungstexte werden automatisiert geprüft. Jeopardy erhält bewusst keinen eigenen Bildschlüssel, damit keine Antwort verraten wird.

## Reproduzieren

```sh
python3 scripts/build-workplace-draft-20261013.py
node scripts/inventory-workplace-draft-20261013.mjs
node scripts/check-workplace-draft-20261013.mjs
npm run pwa:build
npm test
```

Die Sollmenge von 20 pro bestehendem Kategorienamen ist in diesem einzelnen belastbar geprüften Lauf nur für `Arbeitswelt` erfüllt. Der maschinell ermittelte Rest wird in `category-summary.json` ausgewiesen; fehlende Kategorien werden nicht mit erfundenen Daten aufgefüllt.
