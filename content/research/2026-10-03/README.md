# Trivia-Erweiterung vom 3. Oktober 2026

60 Jeopardy-Fragen und 60 Fakt-oder-Fake-Aussagen aus dem recherchierten Faktenkatalog. Die Fragen sind neue Spielinhalte, keine 120 zusätzlichen numerischen Vergleichswerte.

## Jeopardy

Sechs neue Kategorien: Chemie (12), Planetenkunde (10), Nationalparks (6), Raumfahrtmissionen (6), Sportregeln (6), Autotechnik (6). Zusätzlich Kultur (4), Fußball (4), Geschichte (3), Geografie (3). Jede neue Kategorie enthält mindestens fünf Fragen und alle fünf Schwierigkeitsstufen.

Antwortalternativen werden durch `|` getrennt. Die Anzeige verwendet die erste Antwort, die Wertung berücksichtigt alle Alternativen. Bei Fragen, deren Antwort ein Planet oder Land ist, bleibt das Motiv neutral, damit kein Bild die Antwort verrät.

## Fakt oder Fake

Je 20 Aussagen pro Stufe (easy, medium, hard), jeweils zehn wahre und zehn falsche. Jede Aussage hat eine Erklärung und HTTPS-Quellen. NASA-Temperaturangaben unterscheiden Oberfläche und 1-bar-Atmosphäre; UNESCO-Aufnahmejahre sind nicht Bau- oder Eröffnungsjahre.

`verified` bezeichnet den Kuratierungstag. Die Grundwerte stammen aus den zuvor recherchierten offiziellen Quellen im Katalog; zusätzliche Erklärungen verlinken die NASA-Tabellennotizen, UNESCO und die offizielle Geschichte der Sydney Opera House.

## Erstellung und Prüfung

Autorendaten: `content/trivia.json`. Generieren mit `python scripts/build-content-pack.py content/catalogue.json`. Der Builder prüft Freigabestatus, Antworttypen, Stufen, Quellen, Motivauflösung und doppelte Prompts. Tests: `python scripts/content-pack-check.py`, `node scripts/trivia-content-check.mjs`, `node scripts/regression-check.mjs`.

Die Integrationstests führen den tatsächlichen Import, die Brettauswahl und die Fakt/Fake-Rundenauswahl aus. Keine Live-Datenbankänderung und kein Deployment.
