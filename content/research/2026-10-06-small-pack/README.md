# Geprüfter Quiz-Entwurf vom 6. Oktober 2026

Review-only: 10 More/Less-Vergleiche, 5 Schätzfragen, 5 Fakt/Fake-Aussagen und 5 Jeopardy-Fragen. Dieser Ordner wird weder von der App geladen noch in Supabase importiert.

## Themen und Quellen

Je zwei Vergleiche behandeln US-Flusslängen, Höhen großer US-Talsperren, Primärspiegel von Weltraumteleskopen, Öffnungsjahre großer Museen und Längen benannter Großflugzeugvarianten. Die 13 Quellen sind ausschließlich Primärquellen: USGS, U.S. Bureau of Reclamation, NASA, British Museum, Louvre, Prado, Boeing und Airbus. `sources.json` dokumentiert URL, Herausgeber, tatsächlichen Prüfstand 2026-10-06, Bezugsjahr und die verwendete Belegstelle.

Flusslängen sind methodenabhängig und gelten ausdrücklich für die verlinkte USGS-Liste. Beim A380 veröffentlicht Airbus aktuell einen auf 73 m gerundeten Wert, während der A350-1000 mit 73,78 m angegeben wird. Dieser knappe Vergleich bleibt deshalb als redaktionell zu bestätigender Draft markiert.

## Duplikat- und Parallelprüfung

- `daily-catalogue-check.json`: read-only Abgleich mit 7.187 Einträgen im Supabase-Daily-Katalog; 0 identische Kandidaten.
- `parallel-pr-check.json`: Abgleich mit den offenen Inhalts-PRs #122 und #126; die Themen wurden bewusst getrennt gewählt.
- Der Builder prüft zusätzlich gegen `content/approved.js`, eindeutige IDs und den bestehenden Review-Plan.
- `content/review-schedule.json` enthielt zum Prüfstand keine fälligen oder fehlenden `next_review`-Einträge.

## Bilder und Build

`visuals/` enthält pro Thema eine selbst erstellte, antwortneutrale SVG-Grafik als 720×540-Karte (4:3) und 960×540-Detailbild (16:9). Die Motive enthalten keine Zahlen, Maßstäbe oder Lösungshinweise; Text und Motiv liegen innerhalb der ViewBox.

Reproduzieren: `python3 scripts/build-draft-quiz-pack-20261006.py`. Prüfen: `python3 scripts/build-draft-quiz-pack-20261006.py --check`. Die CI führt den Check zusätzlich zu den bestehenden Spiel-Regressionsprüfungen aus.

## Freigabegrenze

Vor einer Übernahme sind Schwierigkeit und Formulierungen redaktionell zu bestätigen; insbesondere der gerundete A380-Wert. Der Entwurf verändert weder `content/approved.js` noch den Live-Daily-Katalog.
