# Raumfahrtmissionen · geprüfter Entwurf 2026-10-17

Dieser Ordner enthält **20 neue, nicht veröffentlichte Fragen** für die kleine Kategorie `Raumfahrtmissionen`: 2 More/Less, 4 Schätzfragen, 6 ausgewogene Fakt/Fake-Aussagen und 8 Jeopardy-Fragen.

## Abgrenzung

- Main-Bestand: 22 eindeutige Fragen, alle bisher in Jeopardy.
- Vorhandene Voyager-, Cassini-, New-Horizons-, Juno- und Apollo-Inhalte wurden nicht wiederholt.
- Die beiden More/Less-Fragen vergleichen ausschließlich den Starttag innerhalb desselben Kalenderjahres: DART/Lucy 2021 (39 Tage Abstand) sowie TESS/InSight 2018 (17 Tage Abstand).
- Der Daily-Katalog im Supabase-Projekt Marc wurde nur lesend geprüft; es gab keine Treffer und keine Datenbankänderung.
- Die PR-Prüfung fand keine der 22 verwendeten Beobachtungen in parallelen Entwürfen.

## Quellen und Aktualität

Alle neun Quellen stammen direkt von NASA Science oder dem NASA Jet Propulsion Laboratory und wurden tatsächlich am 17.10.2026 geprüft. Historische Missionsdaten werden nach 365 Tagen, aktive Missionspläne und aktuelle Rekordwerte nach 90 Tagen erneut geprüft. Die Baseline `content/review-schedule.json` wird vom Builder auf fällige Datensätze kontrolliert.

## Bilder

`visuals/space-missions-neutral-card.svg` (720×540, 4:3) und `visuals/space-missions-neutral-detail.svg` (960×540, 16:9) sind originale CC0-Vektorgrafiken. Beide besitzen 40 px Sicherheitsrand und zeigen nur abstrakte Raumfahrtmotive ohne Missionsnamen, Zielkörper, Daten, Zahlen oder Jeopardy-Lösungen.

## Reproduzierbare Prüfung

```sh
python3 scripts/build-raumfahrtmissionen-draft-20261017.py --check
node scripts/inventory-raumfahrtmissionen-draft-20261017.mjs --check
node scripts/check-raumfahrtmissionen-draft-20261017.mjs
npm run pwa:build
npm test
```

Der Ordner ist ein Review-Artefakt. Er wird nicht automatisch in Main, Deployment oder die Live-Datenbank übernommen.
