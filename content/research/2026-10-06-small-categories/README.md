# Kleine Kategorien erweitert – 6. Oktober 2026

120 neue Vergleiche, 40 Schätzfragen, acht ausgewogene Fakt/Fake-Aussagen und acht Jeopardy-Fragen. Tatsächlicher Quellencheck: 2026-10-06. Belege und Bezugsjahre: data.json. Es wurden nur die technisch relevanten Felder der Primärquellen gelesen: EZB, Rat der EU, Australian Olympic Committee und San Diego Zoo.

| Kategorie | Vorher | Neu | Danach |
|---|---:|---:|---:|
| Allgemeinwissen | 7 | 81 | 88 |
| Länder | 9 | 21 | 30 |
| Städte | 9 | 15 | 24 |
| Tierwelt | 9 | 3 | 12 |

Neue Kriterien: Euro-Münzdurchmesser, Masse und Dicke; historische EU/EG-Beitrittsjahre; erstes reguläres Sommerolympia als Hauptgastgeber; obere gerundete Tragzeit-Richtwerte. Gleichstände werden ausgelassen. Die Zahlen stammen aus Primärquellen, nicht aus KI-Schätzungen. Die Tragzeiten sind Richtwerte und ausdrücklich gerundet; individuelle Werte können abweichen. Keine neuen Behauptungen über aktuelle Rekorde.

19 neue Original-Themenmotive mit jeweils 4:3-Karten und 16:9-Details; Landes-/Stadt-/Münzmotive sind ohne quantitative Darstellung. Bestehende passende Tiermotive werden weiterverwendet. Jeopardy-Identifikationsfragen tragen keine Antwortbilder. Vektoren: CC0-1.0.

Nachbauen: python3 scripts/expand-small-categories.py; python3 scripts/build-content-pack.py content/catalogue.json; python3 scripts/build-review-schedule.py; python3 scripts/build-asset-manifest.py.

Prüfen: node scripts/small-categories-check.mjs; node scripts/regression-check.mjs. Historische Releases werden weiterhin separat geprüft; der neue Release besitzt eigene Mengen-, Duplikat- und Quellenprüfungen. Keine Live-Datenbankänderung und keine Übernahme aus den offenen Drafts #122/#127 oder dem parallelen Fußball-/Gaming-PR #126.

Overlay: Runde Profilavatare dienen jetzt als Positionierungsanker für ihren eigenen Rahmen. Der Dock reserviert Platz für Rahmenornamente und kompakte Touch-Buttons. Ein echter Safari/iPad-Sichttest steht noch aus.
