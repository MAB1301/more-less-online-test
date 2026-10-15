# Champions League: geprüfter Fragenentwurf vom 15.10.2026

Review-only-Paket mit 20 neuen Fragen für die bestehende Kategorie **Champions League**: 2 More/Less, 4 Schätzfragen, 6 Fakt/Fake-Aussagen und 8 Jeopardy-Hinweise. Es ändert weder `content/approved.js` noch die Live-Datenbank.

## Warum dieses Paket

Main enthält 27 eindeutige Fragen in dieser Kategorie, sämtliche in Jeopardy. Der Entwurf ergänzt deshalb drei bislang leere Spielbanken und erweitert Jeopardy ohne bestehende Sieger-, Finalstadt- oder Vereinstitelfragen zu wiederholen. Die beiden Vergleiche sind absichtlich knapp (98:95 Einsätze und 446:417 Tore), nutzen identische UEFA-Phasen, Einheiten, Definitionen und denselben Quellenstand. Es gibt keine Männer-/Frauen- oder Distanz-/Disziplinmischung und keine Paarinflation.

## Geprüfte Quellen und Grenzen

Fünf offizielle UEFA-Seiten wurden tatsächlich am **15.10.2026** gelesen:

- Gruppen-/Ligaphasenrekorde, von UEFA am 12.10.2026 aktualisiert: <https://www.uefa.com/uefachampionsleague/news/0257-0e994d4dc7ad-61a6d5d372dd-1000--champions-league-group-stage-league-phase-records-and-stati/>
- Schnellste Tore, UEFA-Stand 31.05.2026: <https://www.uefa.com/uefachampionsleague/news/0237-0e966468be2a-209986d8dffd-1000--fastest-champions-league-goals-roy-makaay-heads-list-includ/>
- Finalrekorde, UEFA-Stand 30.05.2026: <https://www.uefa.com/uefachampionsleague/news/0252-0e98c715bb79-dea77f56e2bd-1000--champions-league-final-records-and-statistics/>
- Perfekte Gruppen-/Ligaphasen, UEFA-Stand 28.01.2026: <https://www.uefa.com/uefachampionsleague/news/0253-0d7f933ba08d-eedf53763db3-1000--champions-league-group-stage-league-phase-perfection-arsen/>
- UEFA-Saisonrückblick 2025/26, Stand 30.05.2026: <https://www.uefa.com/uefachampionsleague/news/02a5-20a9b1d54074-d4a2c11aa589-1000--champions-league-2025-26-season-in-numbers/>

UEFA grenzt Gruppenphase (1992/93–2023/24), ausgelassene zweite Gruppenphase und Ligaphase (ab 2024/25) ausdrücklich ab. Finalfragen sagen jeweils, ob nur die Champions-League-Ära oder der gesamte Europapokal gemeint ist. Altersfragen verlangen vollendete Jahre und dokumentieren zusätzlich Tage. Alle Rekordwerte sind veränderlich und erhalten einen 90-Tage-Review bis **13.01.2027**; bei neuen Rekorden früher.

## Duplikat- und Bestandsprüfung

- Main: `dced74bb1385014445e186969a09ccd92c20edb5`, 27 → 47 mit diesem Entwurf.
- 17 offene PRs mit insgesamt 940 ausstehenden Fragen geprüft; 0 der 22 Beobachtungen bereits als neue PR-Frage gefunden.
- Marc-Supabase-Projekt `rnwsbgzdrttqtivrwnxo` ausschließlich lesend: 7.187 Daily-Zeilen. Eine breite Champions-League-Suche ergab 50 andere Fußballinhalte; die gezielte Suche nach den neuen Rekordbeobachtungen ergab 0 Treffer.
- `content/review-schedule.json`: 941 Main-Einträge, am 15.10.2026 kein fälliger Eintrag.

## Grafiken

Ein originales, antwortneutrales CC0-Motiv wird deterministisch als 720×540 (4:3) und 960×540 (16:9) erzeugt: abstraktes Flutlichtstadion, neutraler Ball und Sterne. Es enthält keine UEFA-Marke, Vereinszeichen, Spielernamen, Jahreszahl, Statistik oder Lösung. Der 40-Pixel-Sicherheitsrand und die vollständig sichtbare Beschriftung werden automatisiert und nach Rasterung visuell geprüft. Jeopardy erhält bewusst kein Antwortbild.

## Reproduktion

```sh
python3 scripts/build-champions-league-draft-20261015.py
node scripts/inventory-champions-league-draft-20261015.mjs
node scripts/check-champions-league-draft-20261015.mjs
npm run pwa:build
npm test
git diff --check
```

Die formale Laufquote wird nur für Champions League erfüllt. Für die übrigen 34 bestehenden Kategoriebezeichnungen fehlen in diesem Lauf 680 Fragen; das wird ausgewiesen, statt unbelegte Inhalte zu erfinden. Redaktionelle Annahme und spätere explizite Registrierung in der freigegebenen Katalogpipeline bleiben erforderlich.
