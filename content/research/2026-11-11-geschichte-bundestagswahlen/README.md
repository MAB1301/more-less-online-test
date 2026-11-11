# Geschichte: Bundestagswahlen 1961–1983

Review-only-Entwurf mit 20 neuen Fragen: 2 More/Less, 4 Schätzen, 6 Fakt/Fake und 8 Jeopardy. Alle 22 tatsächlichen Beobachtungen stammen aus den endgültigen Bundesergebnissen der Bundeswahlleiterin und werden genau einmal verwendet.

## Abgrenzung

- Main und sämtliche 41 offenen PRs wurden geprüft. Der einzige offene Geschichts-Entwurf (#148) behandelt 1948–1953; dieses Paket beginnt 1961.
- Der Supabase-Daily-Katalog im Projekt `rnwsbgzdrttqtivrwnxo` wurde ausschließlich lesend geprüft. Unter 7.187 Einträgen gibt es keinen Treffer für „Bundestagswahl“ zusammen mit einem der verwendeten Wahljahre.
- More/Less vergleicht ausschließlich gleiche amtliche Kennzahlen, Einheiten, Wahlebenen und Definitionen. Beide Paare liegen weniger als 0,5 % auseinander.
- Die amtlichen technischen Fußnoten zu den Zweitstimmensummen 1980 und 1983 sind in den Fragennotizen dokumentiert.

## Reproduzierbare Prüfung

```sh
python3 scripts/build-geschichte-bundestagswahlen-draft-20261111.py --check
node scripts/inventory-geschichte-bundestagswahlen-draft-20261111.mjs --check
node scripts/check-geschichte-bundestagswahlen-draft-20261111.mjs
```

Die SVGs sind eigene CC0-Vektorgrafiken in 720×540 (4:3) und 960×540 (16:9). Sie enthalten keine Parteien, Jahreszahlen, Werte oder Lösungen; Jeopardy erhält bewusst kein Bild.

Der Entwurf ändert weder `content/approved.js` noch Supabase und wird nicht automatisch veröffentlicht.
