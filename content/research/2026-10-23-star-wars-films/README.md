# Star-Wars-Filmpaket — geprüfter Entwurf

Dieser Review-Entwurf ergänzt die exakte Kategorie `Star Wars` um 20 eigenständige Fragen: 2 More/Less-Vergleiche, 4 Schätzfragen, 6 ausgewogene Fakt/Fake-Aussagen und 8 Jeopardy-Fragen. Er verändert weder `content/approved.js` noch Supabase und wird daher nicht automatisch veröffentlicht.

Die neuen Kriterien sind Disney+-Laufzeit, Erscheinungsjahr, offizielle Handlungsangabe und Regiecredit. Laufzeiten sind ausdrücklich an das zitierte Disney+-Locale und dessen Anzeige am Prüftag gebunden; Stunden/Minuten wurden ohne Rundung in Gesamtminuten umgerechnet. Die beiden More/Less-Paare unterscheiden sich nur um 4 beziehungsweise 1 Minute und vergleichen exakt dasselbe Feld und dieselbe Einheit.

## Quellen, Duplikate und Bestand

Alle 11 Quellen sind offizielle Disney+-Detailseiten und wurden am 2026-10-23 geprüft. `main-inventory.json`, `parallel-pr-check.json`, `daily-catalogue-check.json` und `duplicate-audit.json` dokumentieren Main, alle 25 offenen PRs sowie den read-only geprüften Daily-Katalog. Main enthält 15 Star-Wars-Fragen, alle in Jeopardy; offene Entwürfe und Daily-Katalog enthalten keine konfliktträchtige Star-Wars-Beobachtung. Mit diesem Entwurf läge die Kategorie bei 35 Fragen.

## Bilder und Build

Die zwei selbst erstellten CC0-SVGs liefern echtes 4:3 (`720×540`) und 16:9 (`960×540`), 40 px Sicherheitsrand und ein antwortneutrales Weltraum-Kino-Motiv ohne Figuren, Titel, Namen, Zahlen oder Lösungen. Die deterministische Pipeline erzeugt Paket, Reviewplan, Inventar und Prüfberichte aus `input.json`, `sources.json` und `observations.json`.

```sh
python3 scripts/build-star-wars-films-draft-20261023.py --check
node scripts/check-star-wars-films-draft-20261023.mjs
```

Die formale Laufquote bleibt absichtlich offen: 33 weitere auswählbare Kategorien erhielten in diesem Lauf keine 20 Fragen. Keine fehlende Menge wurde mit unbelegten Daten aufgefüllt.
