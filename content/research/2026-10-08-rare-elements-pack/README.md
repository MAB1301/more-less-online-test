# Geprüfter Quiz-Entwurf vom 8. Oktober 2026

Review-only: 10 More/Less-Vergleiche, 5 Schätzfragen, 5 Fakt/Fake-Aussagen und 5 Jeopardy-Fragen zu Hafnium, Rhenium, Iridium, Thallium und Bismut. Der Ordner wird weder von der App geladen noch in Supabase importiert.

## Quellen und Bezugsrahmen

Alle Angaben stammen aus den fünf Elementseiten des Periodensystems der Royal Society of Chemistry, tatsächlich geprüft am 2026-10-08. Die Seiten nennen CRC/NIST 2015 als Grundlage der physikalischen Referenzdaten und Emsley 2011/2012 für Beschreibungs- beziehungsweise Historientexte. Diese tatsächlichen Bezugsjahre sind je Inhalt in data_years dokumentiert.

Die zehn Vergleiche sind die zehn ungeordneten Paare der fünf Elemente. Sie verwenden ausschließlich die Ordnungszahl, die von der RSC als Protonenzahl eines Atoms definiert wird. Umgedrehte Paare, gleiche Antworten und gemischte Messgrößen sind ausgeschlossen.

## Duplikat- und Parallelprüfung

- Supabase-Projekt Marc wurde nur lesend geprüft: 7.187 Daily-Kandidaten; die Suche nach allen fünf deutschen/englischen Elementnamen ergab 0 Treffer.
- Die offenen Inhalts-PRs #122, #126, #127, #128 und #129 behandeln andere Themen.
- Der Builder prüft normalisierte Identitäten gegen content/approved.js und innerhalb dieses Pakets.
- content/review-schedule.json enthielt zum 2026-10-08 keine fälligen oder fehlenden Review-Daten.

## Bilder, Build und Freigabegrenze

visuals/ enthält eine originale, antwortneutrale Atom-/Tabellensilhouette als 720×540-Karte (4:3) und 960×540-Detailbild (16:9). Sie enthält weder Elementsymbole noch Zahlen oder Lösungswerte. Jeopardy-Fragen erhalten die Grafik nicht.

Reproduzieren: python3 scripts/build-draft-quiz-pack-20261008.py. Prüfen: python3 scripts/build-draft-quiz-pack-20261008.py --check. Vor einer Übernahme sind Schwierigkeit und deutsche Benennung redaktionell zu bestätigen. Der Entwurf verändert weder content/approved.js noch den Live-Daily-Katalog.
