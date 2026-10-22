# Autotechnik · Fahrzeugsicherheit — geprüfter Draft vom 22.10.2026

Dieser Review-Entwurf ergänzt **20 eigenständige Fragen**: 2 More/Less, 4 Schätzfragen, 6 ausgewogene Fakt/Fake-Aussagen und 8 Jeopardy-Fragen. `Main` bleibt unverändert; das Paket wird nicht automatisch veröffentlicht und schreibt nicht nach Supabase.

## Neue Vergleichskriterien

- **Euro-NCAP-Erwachsenenschutz 2025**: Leapmotor B10 (93 %) gegen Volvo EX90 (92 %).
- **Euro-NCAP-Safety-Assist 2025**: Tesla Model Y (92 %) gegen Volvo EX90 (86 %).

Beide Paare stammen aus derselben offiziellen Veröffentlichung vom 19.11.2025, demselben Protokolljahr, derselben Säule, Skala und Einheit. Der Abstand beträgt 1 beziehungsweise 6 Prozentpunkte. Testjahre werden nicht vermischt. Vorhandene Motor-, Leistungs-, Abmessungs-, Wendekreis- und Kofferraumfragen wurden ausgeschlossen.

## Bestand und Abgrenzung

`Main` enthält 26 eindeutige Autotechnik-Fragen, bislang ausschließlich Jeopardy. Keiner der 24 offenen PRs ergänzt eine weitere exakte Autotechnik-Identität. Mit diesem Paket läge der geprüfte Entwurfsbestand bei 46: 2 More/Less, 4 Schätzen, 6 Fakt/Fake und 34 Jeopardy. Die übrigen 33 tatsächlich auswählbaren Kategoriebezeichnungen erhalten in diesem Lauf keine künstlich erzeugten Ergänzungen; gegenüber der formalen Tagesquote fehlen dort 660 Fragen.

Der Daily-Katalog wurde im Projekt `rnwsbgzdrttqtivrwnxo` ausschließlich lesend geprüft: 7.187 Zeilen, **0 breite Treffer und 0 Konflikte** zu den 22 neuen Beobachtungen. Geprüft wurden Modellnamen, Wertungssäulen und Fachbegriffe. Sämtliche Quellen wurden tatsächlich am 22.10.2026 geöffnet: drei offizielle Euro-NCAP-Seiten und die offizielle EU-eCall-Seite.

## Bilder

Zwei selbst erstellte, antwortneutrale SVGs zeigen ein abstraktes Testlabor mit Fahrzeugkontur, Barriere und Sensorwellen. Keine Marke, kein Modell, kein Prozentwert und kein gesuchter Fachbegriff ist enthalten. Formate: 720×540 (4:3) und 960×540 (16:9), jeweils mit 40 px Sicherheitsrand. Lizenz: CC0-1.0.

## Reproduktion

```bash
python3 scripts/build-autotechnik-euroncap-draft-20261022.py
python3 scripts/build-autotechnik-euroncap-draft-20261022.py --check
node scripts/check-autotechnik-euroncap-draft-20261022.mjs
npm run pwa:build
npm test
```

Euro-NCAP-2025-Ergebnisse, Bewertungsmethodik und eCall-Rechtsstand werden nach 90 Tagen geprüft; technische Glossarbegriffe nach 365 Tagen. Keine Frist aus `content/review-schedule.json` war am 22.10.2026 fällig.
