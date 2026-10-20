# Kultur · geprüfter Entwurf 2026-10-20

Dieser Ordner enthält **20 neue, nicht veröffentlichte Fragen** für `Kultur`: 2 More/Less, 4 Schätzfragen, 6 ausgewogene Fakt/Fake-Aussagen und 8 Jeopardy-Fragen. Der Themenblock heißt `Museumskunst · Werke, Maße & Details`.

## Abgrenzung

- Main: 26 eindeutige Kulturfragen, bislang ausschließlich Jeopardy.
- Offene Entwürfe enthalten bereits Künstlerfragen zu Mona Lisa, Sternennacht, Denker, Guernica und Sonnenblumen; diese wurden nicht wiederholt.
- More/Less vergleicht ausschließlich dieselbe Katalogkennzahl: Bildbreite 92,1/92,0 cm beziehungsweise Bildhöhe 82,2/84,1 cm.
- 22 offene PRs mit 1.040 Entwurfsfragen und der Supabase-Daily-Katalog mit 7.187 Zeilen wurden geprüft; keine der 22 neuen Beobachtungen wurde gefunden.

## Quellen und Aktualität

17 offizielle Museumsseiten von MoMA, Musée d’Orsay, National Gallery, Art Institute of Chicago, Mauritshuis, Rijksmuseum, Met, Prado, Belvedere, Reina Sofía, Musée Rodin und Louvre wurden am 20.10.2026 geprüft. Jede Frage dokumentiert Werkjahr, Messwert, Rundung und Grenze. Erneute Prüfung nach 365 Tagen; im Main-Prüfplan sind am Prüftag keine Datensätze fällig.

## Grafiken

Zwei originale CC0-SVGs (720×540 und 960×540) zeigen eine abstrakte Galerie ohne konkrete Werke, Namen, Zahlen oder Lösungen. Beide besitzen einen 40-px-Sicherheitsrand; Maße, verbotene Elemente und Textposition werden automatisiert geprüft. **Offen:** Der manuelle Render-Sichttest konnte wegen der nicht verfügbaren Ausführungsumgebung nicht durchgeführt werden. Der PR bleibt deshalb Draft.

## Reproduktion

```sh
python3 scripts/build-kultur-museumskunst-draft-20261020.py --check
node scripts/check-kultur-museumskunst-draft-20261020.mjs
npm run pwa:build
npm test
```

Keine automatische Veröffentlichung, kein Merge und keine Änderung der Live-Datenbank.
