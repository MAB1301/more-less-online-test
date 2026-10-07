# Geprüfter Quiz-Entwurf vom 7. Oktober 2026

Review-only: 10 More/Less-Vergleiche, 5 Schätzfragen, 5 Fakt/Fake-Aussagen und 5 Jeopardy-Fragen über die TRAPPIST-1-Planeten b bis f. Der Ordner wird weder von der App geladen noch in Supabase importiert.

## Quellen und Bezugsrahmen

Alle Werte stammen aus fünf offiziellen NASA-Seiten des Exoplanetenkatalogs, tatsächlich geprüft am 2026-10-07. Die Seiten wurden zuletzt im Juni/Juli 2025 aktualisiert; deshalb ist 2025 als Datenjahr dokumentiert. `sources.json` enthält URL, Herausgeber, Seitenstand und die verwendeten Belege.

Die zehn Vergleiche sind die zehn ungeordneten Paare der fünf Planeten und verwenden ausschließlich dieselbe Kennzahl: die von NASA auf eine Dezimalstelle ausgegebene Umlaufzeit in Erdtagen. Umgedrehte Paare, gleiche Antworten und gemischte Messgrößen sind ausgeschlossen.

## Duplikat- und Parallelprüfung

- Supabase-Projekt Marc wurde nur lesend geprüft: 7.187 Daily-Kandidaten; die Suche nach `trappist` in `payload::text` ergab 0 Treffer.
- Die offenen Inhalts-PRs #122, #126, #127 und #128 behandeln andere Themen.
- Der Builder prüft zusätzlich normalisierte Identitäten gegen `content/approved.js` und innerhalb des Pakets.
- `content/review-schedule.json` enthielt zum 2026-10-07 keine fälligen oder fehlenden Review-Daten.

## Bilder, Build und Freigabegrenze

`visuals/` enthält eine originale, antwortneutrale Systemgrafik als 720×540-Karte (4:3) und 960×540-Detailbild (16:9). Sie zeigt keine Werte, Planetennamen oder maßstäblichen Abstände. Jeopardy-Fragen erhalten die Grafik nicht, damit die Antwort nicht angedeutet wird.

Reproduzieren: `python3 scripts/build-draft-quiz-pack-20261007.py`. Prüfen: `python3 scripts/build-draft-quiz-pack-20261007.py --check`. Vor einer Übernahme sind Schwierigkeit und Formulierungen redaktionell zu bestätigen. Der Entwurf verändert weder `content/approved.js` noch den Live-Daily-Katalog.
