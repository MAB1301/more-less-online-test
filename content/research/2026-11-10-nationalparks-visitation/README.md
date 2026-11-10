# Nationalparks · NPS-Besucherstatistik 2025 · Review-Entwurf 2026-11-10

20 eigenständige Fragen: 2 More/Less, 4 Schätzen, 6 Fakt/Fake und 8 Jeopardy. Die 22 atomaren Beobachtungen stammen aus den finalen offiziellen NPS-/IRMA-Berichten für das Kalenderjahr 2025. Eine Beobachtung wird höchstens einmal verwendet.

Main enthält 22 Nationalparks-Fragen, sämtlich Jeopardy. Der offene PR #150 ergänzt 20 Landschafts- und Geologiefragen. PR #128 enthält keine zusätzlichen Nationalparks-Fragen jenseits des heutigen Main-Bestands. Mit diesem Entwurf läge der nachvollziehbare Bestand einschließlich offener Entwürfe bei 62: More/Less 4, Schätzen 8, Fakt/Fake 12 und Jeopardy 38. Alle 40 offenen PRs wurden einbezogen.

Die zwei neuen Vergleichskriterien sind (1) absolute Freizeitbesuche im Kalenderjahr 2025 und (2) prozentuale Veränderung 2025 gegenüber 2024. More/Less mischt weder Einheit noch Ausgabe, Zeitraum oder Parkebene: Cuyahoga Valley gegen Joshua Tree liegt 3,16 Prozent auseinander; Mount Rainier gegen Glacier Bay 0,44 Prozentpunkte. Fakt/Fake ist auf jeder Schwierigkeitsstufe wahr/falsch ausgeglichen.

Der Supabase-Daily-Katalog im Konto Marc wurde ausschließlich lesend geprüft: 7.187 Zeilen (4.228 More/Less, 1.507 Schätzen, 1.452 Fakt/Fake, 0 Jeopardy). Yellowstone 2025 war bereits in der Kategorie Natur vorhanden und wurde ausgeschlossen. Für die 22 gewählten Park-und-Wert-Beobachtungen gab es 0 Treffer. Keine Live-Daten wurden verändert.

Die fünf offiziellen Quellen wurden am 10.11.2026 tatsächlich geprüft. Werte sind ganze NPS-Freizeitbesuche oder die von NPS publizierte Prozentänderung mit zwei Dezimalstellen. Gezählt werden Besuche, nicht unterschiedliche Personen. Der NPS-Presseüberblick und eine einzelne Yosemite-Statistikseite zeigten voneinander abweichende 2025-Werte; Yosemite wurde deshalb vollständig ausgeschlossen. Alle Werte erhalten eine jährliche Wiedervorlage, falls NPS historische Reihen revidiert.

Die zwei originalen CC0-SVGs sind antwortneutral: 720×540 (4:3) und 960×540 (16:9), je 40 px Sicherheitsrand. Sie zeigen nur eine generische Parklandschaft, einen Weg, anonyme Besucher und ein Fernglas – keine Parknamen, Karten, Zahlen, Jahre, Rangfolgen oder Lösungen. Nach dem ersten Render wurden die Besuchersilhouetten nach innen versetzt, damit Wegkante und Sicherheitsrahmen frei bleiben. Jeopardy bleibt bildfrei; bestehende Bilder mussten nicht repariert werden.

Reproduzierbar mit:

```bash
python3 scripts/build-nationalparks-visitation-draft-20261110.py --check
node scripts/inventory-nationalparks-visitation-draft-20261110.mjs --check
node scripts/check-nationalparks-visitation-draft-20261110.mjs
npm run pwa:build
npm test
```

Der Entwurf ändert weder `content/approved.js` noch Supabase. Er erfüllt die 20er-Quote nur für Nationalparks; für die übrigen 33 auswählbaren Kategorien bleiben in diesem Lauf 660 Fragen offen.
