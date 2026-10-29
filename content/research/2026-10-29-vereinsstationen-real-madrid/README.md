# Vereinsstationen · Real Madrid – geprüfter Entwurf vom 29.10.2026

Review-only-Paket mit 20 neuen Fragen: 2 More/Less, 4 Schätzfragen, 6 Fakt/Fake und 8 Jeopardy. `content/approved.js`, die Website und die Live-Datenbank bleiben unverändert.

## Auswahl und Bestand

`Vereinsstationen` ist mit 18 eindeutigen Main-Fragen die kleinste noch nicht separat ausgebaute, nicht-planetare Kategorie. Main enthält dort ausschließlich Jeopardy. Unter Einbezug der offenen Entwürfe existieren vor diesem Paket keine zusätzlichen eindeutigen Vereinsstationen-Fragen. Nach diesem Paket läge der Bestand bei 38: 2 More/Less, 4 Schätzen, 6 Fakt/Fake und 26 Jeopardy.

## Inhalt und Vergleichbarkeit

Die 22 Beobachtungen verwenden 22 verschiedene Spieler. Die beiden Vergleiche messen ausschließlich offizielle Real-Madrid-Pflichtspiele abgeschlossener Vereinszeiten:

- Guti 542 gegen Marcelo 546 (0,74 % Abstand)
- Sami Khedira 161 gegen Mesut Özil 159 (1,26 % Abstand)

Keine Paarung mischt Geschlechter, Wettbewerbe, Sportarten, Strecken oder Einheiten. Die übrigen Fragen behandeln Pflichtspielzahlen, unmittelbar vorherige Vereine und einen abschließenden Karriereverein. Falschaussagen benennen in der Erklärung ausdrücklich die richtige Station.

## Quellen und Grenzen

22 offizielle Real-Madrid-Profile, historische Vereinsartikel beziehungsweise eine offizielle Pressemappe wurden tatsächlich am 29.10.2026 geprüft. Quelle, Abschnitt, historisches Bezugsjahr, Rundung und Grenze stehen in `sources.json`; jede normalisierte Beobachtung steht in `observations.json`. Historische Vereinswege sind stabil. Da Clubseiten redaktionell geändert werden können und einzelne englische/anderssprachige Profile uneinheitlich formulieren, ist vor Veröffentlichung dennoch eine jährliche Prüfung vorgesehen. Für Zahlen wurden nur Profile mit eindeutig bezeichneten Real-Madrid-Pflichtspielen verwendet; die widersprüchliche englische Figo-Einsatzzahl wurde bewusst ausgeschlossen.

## Duplikate und Bilder

Main, 31 offene PRs mit rund 1.220 ausstehenden Fragen sowie 7.187 Supabase-Daily-Einträge wurden geprüft. Für die 22 retained subjects und Beobachtungen wurden keine Konflikte gefunden. Die Daily-Prüfung war ausschließlich lesend.

Die Original-SVGs `visuals/club-paths-neutral-card.svg` (720×540, 4:3) und `visuals/club-paths-neutral-detail.svg` (960×540, 16:9) zeigen nur einen abstrakten Stadiontunnel, leere Trikots und Wegpunkte. Sie enthalten keine Namen, Vereinslogos, Rückennummern, Spielzahlen oder Antwortvereine. Ein 40-px-Sicherheitsrahmen schützt den Zuschnitt. Jeopardy-Fragen erhalten keine Bildzuordnung.

## Reproduktion

```sh
python3 scripts/build-vereinsstationen-real-madrid-draft-20261029.py --check
node scripts/inventory-vereinsstationen-real-madrid-draft-20261029.mjs --check
node scripts/check-vereinsstationen-real-madrid-draft-20261029.mjs
npm run pwa:build
npm test
```

Die formale Laufquote von 20 Fragen in allen 35 Kategorien ist mit diesem Paket nicht erfüllt: 20 sind für `Vereinsstationen` fertig; für die übrigen 34 Kategorien bleiben in diesem einzelnen Lauf 680 Fragen offen.
