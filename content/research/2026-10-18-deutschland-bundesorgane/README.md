# Deutschland · geprüfter Entwurf 2026-10-18

Dieser Ordner enthält **20 neue, nicht veröffentlichte Fragen** für `Deutschland`: 2 More/Less, 4 Schätzfragen, 6 ausgewogene Fakt/Fake-Aussagen und 8 Jeopardy-Fragen. Der neue Themenblock heißt `Bundesorgane & Wahlen`.

## Abgrenzung

- Main-Bestand: 26 eindeutige Deutschland-Fragen, bisher ausschließlich Jeopardy.
- Vorhandene Fragen zu Bundesländern, Hauptstädten, Berlin und den Gründungsjahren der Bundesrepublik wurden nicht wiederholt.
- Beide More/Less-Vergleiche nutzen exakt dieselbe Kennzahl, Einheit, Wahl und amtliche Tabelle: Zahl der Bundestagswahlkreise 2025. Berlin und Schleswig-Holstein liegen nur einen Wahlkreis auseinander.
- Der Daily-Katalog im Supabase-Projekt Marc wurde ausschließlich lesend geprüft; drei technische Rohkandidaten waren sachfremde Berlin-Stadtflächenfragen, inhaltliche Treffer gab es nicht.
- 20 offene Entwürfe mit zusammen 1.000 ausstehenden Fragen wurden auf parallele Inhalte geprüft; keine der 22 Beobachtungen wurde gefunden.

## Quellen und Aktualität

Alle sieben Quellen stammen direkt von Bundeswahlleiterin, Bundestag, Bundesrat, Bundesministerium der Justiz/Bundesamt für Justiz oder Bundesverfassungsgericht und wurden am 18.10.2026 geprüft. Aktuelle Organ- und Mitgliederzahlen werden nach 90 Tagen, gesetzlich beziehungsweise historisch gebundene Werte nach 365 Tagen erneut geprüft. Die Baseline `content/review-schedule.json` enthält am Prüftag keine fälligen Datensätze.

## Bilder

`visuals/federal-institutions-neutral-card.svg` (720×540, 4:3) und `visuals/federal-institutions-neutral-detail.svg` (960×540, 16:9) sind originale CC0-Vektorgrafiken. Beide besitzen 40 px Sicherheitsrand und zeigen nur ein abstraktes Parlamentsgebäude, Wahlurne und föderale Punkte ohne Namen, Zahlen oder Jeopardy-Lösungen. Beim gerenderten Sichttest wurde die anfangs zu hohe Beschriftung nach unten versetzt; beide Endformate sind danach vollständig lesbar und ohne Anschnitt.

## Reproduzierbare Prüfung

```sh
python3 scripts/build-deutschland-bundesorgane-draft-20261018.py --check
node scripts/inventory-deutschland-bundesorgane-draft-20261018.mjs --check
node scripts/check-deutschland-bundesorgane-draft-20261018.mjs
npm run pwa:build
npm test
```

Der Ordner ist ein Review-Artefakt. Er wird nicht automatisch in Main, Deployment oder die Live-Datenbank übernommen.
