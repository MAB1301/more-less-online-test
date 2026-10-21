# Bauwerke · Architekturwissen — geprüfter Draft vom 21.10.2026

Dieser Entwurf ergänzt **20 eigenständige Fragen**: 2 More/Less, 4 Schätzfragen, 6 ausgewogene Fakt/Fake-Aussagen und 8 Jeopardy-Fragen. `Main` bleibt unverändert; das Paket wird nicht automatisch veröffentlicht und schreibt nicht nach Supabase.

## Neue Vergleichskriterien

- Zahl der **oberirdischen Geschosse**: PETRONAS Twin Towers gegen Shanghai World Financial Center.
- **Etage der höchsten benannten Aussichtsebene**: SWFC Sky Arena gegen Willis Tower Skydeck/The Ledge.

Die Paare nutzen jeweils dieselbe Kennzahl und denselben Bezugsrahmen. Keller-, Antennen- und Meterhöhen werden nicht vermischt. Bereits offene Höhen-, Brücken-, UNESCO-Jahres- und Aussichtsebenen-Höhenfragen wurden ausgeschlossen.

## Bestand und Abgrenzung

`Main` enthält 47 eindeutige Bauwerke-Fragen. Vier offene Entwürfe enthalten weitere 50 eindeutige Bauwerke-Identitäten. Mit diesem Paket läge der geprüfte Entwurfsbestand bei 117. Die übrigen 34 Kategoriebezeichnungen erhalten in diesem Lauf keine künstlich erzeugten Ergänzungen; gegenüber der formalen Tagesquote fehlen dort 680 Fragen.

Der Daily-Katalog wurde im Projekt `rnwsbgzdrttqtivrwnxo` ausschließlich lesend geprüft: 7.187 Zeilen, 105 breite Namens-Treffer, aber **0 Konflikte** auf die 22 konkreten neuen Beobachtungen. Alle 23 offenen PRs wurden berücksichtigt.

## Bilder

Zwei selbst erstellte, antwortneutrale SVGs zeigen eine abstrakte Architektursilhouette ohne konkrete Bauwerke, Namen, Etagenzahlen oder Lösungen. Formate: 720×540 (4:3) und 960×540 (16:9), jeweils mit 40 px Sicherheitsrand. Lizenz: CC0-1.0.

## Reproduktion

```bash
python3 scripts/build-bauwerke-architektur-draft-20261021.py
python3 scripts/build-bauwerke-architektur-draft-20261021.py --check
node scripts/check-bauwerke-architektur-draft-20261021.mjs
npm run pwa:build
npm test
```

Historische Werte werden nach 365 Tagen geprüft; die aktuell benannten Aussichtsebenen nach 90 Tagen. Keine Frist aus `content/review-schedule.json` war am 21.10.2026 fällig.
