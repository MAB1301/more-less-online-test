# Geografie · Wasser, Wüsten & Tiefsee (Review-Entwurf)

20 neue, unveröffentlichte Fragen: 2 More/Less, 4 Schätzfragen, 6 Fakt/Fake und 8 Jeopardy. Die 22 Beobachtungen stammen aus sechs offiziellen EPA-, NOAA- und NASA-Seiten und wurden am 26.10.2026 geprüft.

Die More/Less-Paare vergleichen ausschließlich dasselbe EPA-Feld, dieselbe Einheit, denselben Niedrigwasser-Bezugsrahmen und denselben Tabellenstand: Wasserfläche (57.800:59.600 km²) sowie Maximaltiefe (282:244 m). Das Paket verteilt sich auf Große Seen, Baikalsee, Totes Meer, Sahara und Tiefsee.

Main enthält 20 Geografie-Fragen. Der normalisierte Union-Abgleich der einzigen offenen PRs mit `content/approved.js` (#128 und #126) ergab fünf zusätzliche Geografie-Jeopardy-Hinweise aus #128. Der lesende Daily-Abgleich über alle behaltenen deutschen und englischen Motive ergab in 7.187 Zeilen null Treffer.

Zwei originale CC0-SVGs liefern 720×540 (4:3) und 960×540 (16:9), jeweils mit 40-px-Sicherheitsrand, ohne Text, Kartenlabels, Zahlen oder Antwortmotive.

Reproduktion:

```sh
python3 scripts/build-geografie-wasser-wuesten-draft-20261026.py --check
node scripts/check-geografie-wasser-wuesten-draft-20261026.mjs
```

Review-only: keine Änderung an `content/approved.js`, Main, Deployment oder Live-Datenbank. Werte und Seitenstände werden nach 90 Tagen erneut geprüft.
