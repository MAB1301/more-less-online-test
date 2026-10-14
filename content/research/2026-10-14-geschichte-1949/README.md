# Geschichte – Bundesrepublik 1948–1953

Geprüfter Review-Entwurf vom 14.10.2026 mit 20 neuen Fragen: 2 More/Less, 4 Schätzfragen, 6 ausgewogene Fakt/Fake-Aussagen und 8 Jeopardy-Fragen. Keine Zeile wird automatisch freigegeben oder in Supabase geschrieben.

## Auswahl und Bestand

- `Geschichte` hatte in Main 31 eindeutige Fragen: 0 More/Less, 0 Schätzen, 1 Fakt/Fake und 30 Jeopardy.
- Mit diesem Entwurf wären es 51: 2 / 4 / 7 / 38.
- Bereits vorhandene Fragen nach Konrad Adenauer und der Verkündungsstadt Bonn wurden erkannt und ausdrücklich ausgeschlossen.
- Zwei Vergleiche verwenden je dieselbe amtliche Kennzahl und Definition für 1949 und 1953: Wahlberechtigte sowie Wahlbeteiligung. Keine Geschlechter-, Leistungs- oder verschiedenartigen Disziplinvergleiche.

## Quellen

Neun offizielle Quellen wurden tatsächlich am 14.10.2026 geprüft, darunter die historischen Bundesergebnisse der Bundeswahlleiterin sowie stenographische Originalberichte von Bundestag und Bundesversammlung. Fünf Quellen sind amtliche Primärtabellen oder Primärprotokolle; vier redaktionelle Bundestagsseiten liefern eingegrenzten historischen Kontext.

Jede Frage dokumentiert URL, historisches Datenjahr, genaue Tabellen-/Dokumentstelle, Rundung und Grenzen. Die Fakten sind historisch stabil und erhalten einen 365-Tage-Review. Im bestehenden Reviewplan waren am Prüftag keine Einträge fällig.

## Bilder und Pipeline

Die deterministische Pipeline erzeugt ein eigenes CC0-SVG mit Wahlurne, Stimmzettel und abstrahiertem Parlamentsbau: 720×540 (4:3) und 960×540 (16:9), jeweils mit 40 Pixel Sicherheitsrand. Es enthält keine Daten, Namen, Zahlen, Parteisymbole oder Lösungen. Jeopardy-Fragen haben absichtlich keinen eigenen Bildschlüssel.

```sh
python3 scripts/build-history-1949-draft-20261014.py
node scripts/inventory-history-1949-draft-20261014.mjs
node scripts/check-history-1949-draft-20261014.mjs
npm run pwa:build
npm test
```

Der Entwurf erfüllt die formale Laufquote nur für `Geschichte`. Für die übrigen 34 in Main ermittelten Kategorien bleiben rechnerisch 680 Fragen offen; diese Lücke wird nicht mit unbelegten Angaben gefüllt.
