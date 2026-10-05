# Kleines geprüftes Quizpaket – 5. Oktober 2026

**Entwurf:** 10 neue More/Less-Vergleiche, 5 Schätzfragen, 5 Fakt/Fake-Aussagen (3 wahr, 2 falsch) und 5 Jeopardy-Fragen. Je zwei Vergleiche in Bauwerke, Städte, Weltkultur, Raumfahrt und Natur. Die anderen Spiele erhalten jeweils einen Inhalt pro Themenbereich. Die fünf Jeopardy-Fragen ergänzen bestehende Kategorien; sie sind kein eigenständiges vollständiges Board.

## Quellenprüfung

Alle verwendeten Primärseiten wurden am **2026-10-05** gelesen. `sources.json` enthält URLs, paraphrasierte Belege, tatsächliches Prüfdatum und Ereignisjahre; `input.json` ordnet jedem Inhalt die Belege zu. Historische Datenjahre sind ausdrücklich vom heutigen Prüfdatum getrennt. Quellen: Brückenbetreiber HSBE, NPS, TfL, RATP, Comunidad de Madrid, UNESCO, NASA und U.S. Government Publishing Office/GovInfo.

Die Golden-Gate-Hauptspannweite wurde aus dem NPS-Wert 4200 ft mit 0,3048 m/ft in 1280,16 m umgerechnet. Gesamtlänge und Hauptspannweite werden nicht vermischt. Keine Behauptung über einen heutigen Brücken-Weltrekord. Madrid wurde 1919 eingeweiht und später im selben Jahr öffentlich geöffnet; verglichen wird nur das Jahr. Biscayne zählt hier als **Nationalpark ab 1980**, nicht als National Monument ab 1968. Redwood bezeichnet den Bundes-Nationalpark ab 1968, nicht seine älteren State Parks. Die NASA-Missionsseite belegt auch Besatzung/Earthrise; Apollo 13 hat trotz der ursprünglichen Missionsart keine Mondlandung vollzogen.

## Abgleich und parallele Arbeit

Ausgangsbasis zunächst `f9c6c9d`, vor PR-Erstellung aktualisiert auf `8cc47183c77104a836a895ab2978c7cb53bedbbd` (Main). Die zusätzliche Frame-Änderung verändert keine Quizdaten. Offene PRs #109 (Profil/Musik/Shop) und #57 (Jeopardy-Synchronisierung) enthalten keine neuen Quiz-Inhaltsdateien. Ihre Änderungen werden nicht übernommen. Ein erneuter PR-Abgleich erfolgt unmittelbar vor Veröffentlichung dieses Entwurfs.

Der Daily-Katalog im Projekt Marc `rnwsbgzdrttqtivrwnxo` wurde ausschließlich lesend geprüft: **891 More/Less, 343 Schätzfragen, 246 Fakt/Fake = 1480 Einträge**. `daily-identities.json` enthält nur normalisierte SHA-256-Inhaltsidentitäten, keine Spieler- oder Antwortdaten. Der Builder prüft dagegen und gegen `content/approved.js` auf wiederholte/gespiegelte Vergleiche und identische Fragen/Aussagen. Zusätzlich wurden alle neuen Themenbezeichnungen semantisch in lokalem Katalog, Trivia, Inline-Katalog und Daily-Payloads gesucht: keine inhaltlichen Treffer.

`content/review-schedule.json` hat am 5. Oktober **keine fälligen oder undatierten Einträge**, darunter keine fälligen veränderlichen Werte. Daher wurden bestehende Prüfstände nicht neu datiert. Neue Inhalte betreffen feste historische Ereignisse oder technische Abmessungen und erhalten nach der vorhandenen Richtlinie eine Prüfpflicht am 2027-10-05. `draft-review-schedule.json` bleibt bis zur Annahme vom Live-Prüfplan getrennt.

## Reproduzierbare Pipeline

```sh
python3 scripts/build-draft-quiz-pack.py
python3 scripts/build-draft-quiz-pack.py --check
node scripts/regression-check.mjs
```

`input.json` + `sources.json` + Daily-Identitäten + bestehender Katalog → `draft-pack.json`, `draft-review-schedule.json`, `validation.json` und zehn originale SVGs. Der Check verweigert Duplikate, Gleichstände, ungültige Antworten/Einheiten, fehlende Quellen oder Datenjahre und veraltete Build-Ausgaben. Die GitHub-Validierung führt denselben Check aus. Der Builder schreibt weder `content/approved.js` noch Datenbank-/Import-SQL und bindet keine Entwurfsdatei in die Website ein.

## Grafiken und Grenzen

Fünf antwortneutrale Themenmotive, jeweils **720×540 (4:3)** und **960×540 (16:9)**. Originale CC0-1.0-SVGs; keine Fotos/Lizenzen von Dritten nötig. Sie zeigen keine Jahre, Zahlen, Namen von Antwortpersonen, Stationsanzahlen, Flaggen oder maßstäbliche Brückenlängen. Motive und Text liegen mit Abstand innerhalb beider ViewBoxen. Alle zehn Dateien wurden nativ gerendert und visuell kontrolliert: keine abgeschnittenen Beschriftungen.

Inhaltsprüfung und vollständige Spiel-Regressionsprüfung bestehen. Offen bleiben redaktionelle Annahme, Schwierigkeitseinstufung ohne Spielerdaten und spätere bewusste Übernahme über den freigegebenen Katalog-Build. Die Grafiken sind Themenillustrationen, keine exakten Darstellungen der genannten Bauwerke. Kein Merge, keine Änderung der Live-Datenbank, keine Änderung an bestehenden Daily-Sets.
