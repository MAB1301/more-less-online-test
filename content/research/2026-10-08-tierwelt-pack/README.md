# Tierwelt: geprüfter Entwurf vom 8. Oktober 2026

20 neue eigenständige Fragen: 2 More/Less, 4 Schätzfragen, 6 Fakt/Fake (3 wahr, 3 falsch, je Schwierigkeitsgrad ausgeglichen), 8 Jeopardy. Keine Live- oder Katalogfreigabe. Basis ist Main `0ca6f66d0f1efea5709b7de9f3256413e0a2f5b1`.

| Tierwelt | More/Less | Schätzen | Fakt/Fake | Jeopardy | Gesamt |
|---|---:|---:|---:|---:|---:|
| Main, eindeutige Laufzeitfragen | 14 | 9 | 6 | 0 | 29 |
| Zusätzlich in offenen Entwürfen | 3 | 3 | 2 | 0 | 8 |
| Bestand einschließlich offener Entwürfe | 17 | 12 | 8 | 0 | 37 |
| Dieses Paket | 2 | 4 | 6 | 8 | 20 |
| Nach Annahme aller Entwürfe, einschließlich dieses Pakets | 19 | 16 | 14 | 8 | 57 |

Die neun geprüften Main-Vergleiche sind nur ein Teil des Laufzeitbestands: fünf weitere eindeutige Legacy-Vergleiche ergeben 14. Legacy-Einträge sind durch diese Zählung nicht nachträglich sachlich freigegeben. Main bleibt unverändert. Die Zählung ist je Spiel; dieselbe Frage in Daily und Frontend wird nicht zu zwei Fragen zusammengerechnet.

`main-inventory.json` enthält alle tatsächlichen Laufzeitkategorien und Unterkategorien sowie die getrennte Verfügbarkeit im Themenfilter. Literal normalisierte Fragen und ungeordnete Paare werden dedupliziert. Semantische Eindeutigkeit bleibt eine redaktionelle Prüfung. Jeopardy hat andere tatsächliche Kategorien als More/Less; sie werden nicht ohne Regel auf dessen Kategorien umgelegt. Themenfilter zeigen Kategorien/Unterkategorien erst ab fünf Fragen. Die zwei neuen Vergleichsfragen bilden allein daher noch keine auswählbare neue Unterkategorie. Die acht Jeopardy-Fragen reichen hingegen für eine neue Tierwelt-Spalte.

`pending-inventory.json` dokumentiert die Bestände der Inhalts-PRs #122, #126, #127, #128, #129 und #130; #57 und #109 enthalten keine relevante neue Kandidatenfrage. Vier vollständige Draft-Pakete wurden aus den aktuellen GitHub-Patches gelesen; #128 wurde nach normalisierten Identitäten gegen Main geprüft. Bei #126 stehen die geprüften gemeldeten Ergänzungsmengen getrennt, weil zugleich bestehende Kategorien umbenannt werden und der große approved.js-Patch nicht verfügbar ist. Eine exakte deduplizierte Gesamtvereinigung aller Kategorien einschließlich dieser Umbenennungen wird deshalb nicht behauptet. Die Tierwelt-Zahlen oben sind davon nicht betroffen. Keiner der parallelen Entwürfe wird übernommen oder verändert.

## Quellen und Inhalt

Fünf Artenübersichten der San Diego Zoo Wildlife Alliance wurden tatsächlich am **2026-10-08** gelesen: [Capybara](https://animals.sandiegozoo.org/animals/capybara), [Tapir](https://animals.sandiegozoo.org/animals/tapir), [Zweifingerfaultier](https://animals.sandiegozoo.org/animals/two-toed-sloth), [Großer Ameisenbär](https://animals.sandiegozoo.org/animals/giant-anteater), [Roter Panda](https://animals.sandiegozoo.org/animals/red-panda). Evidence, Grenzen und Rundung stehen in sources.json und input.json. Undatierte biologische Übersichten erhalten ausdrücklich `data_year: null`; das Prüfjahr wird nicht als Messjahr erfunden. Nur die historische Erstbeschreibung führt 1825 als Ereignisjahr.

Vergleiche: Zehen pro **Vorderfuß** und obere Enden ausdrücklich bezeichneter Schwanzlängenbereiche. Kein Rang aller Individuen wird daraus abgeleitet. Weitere unabhängige Themen sind Tauchen, Krallen, Zunge, Erstbeschreibung, Zähne, Schwimmen, Verwandtschaft, Ernährung, Verbreitung, Fellrichtung, Rüsselaufbau, Jungtiertransport, Gangart, Pseudodaumen und Tierfamilie. Es werden keine vollständigen Paarungen einer kleinen Objektliste erzeugt. Widersprüchliche Schulterhöhen, fehlerhafte Gewichtseinheiten, veraltete Taxonomie und unbelegte aktuelle Tierbestände wurden ausgeschlossen.

Supabase `ml_private.daily_catalogue` wurde im Projekt `rnwsbgzdrttqtivrwnxo` nur gelesen: 4.228 More/Less, 1.507 Schätzfragen, 1.452 Fakt/Fake; kein Jeopardy. Die Kandidatensuche ergab 39 Treffer. Tapir-Tragzeitfragen und Riesenpanda-Fragen werden nicht wiederholt. Roter Panda und Riesenpanda sind ausdrücklich verschiedene Tiere. Die Suchergebnisse und Entscheidung sind in daily-catalogue-check.json dokumentiert. Die Suche ist ein Kandidatenfilter, keine automatische semantische Volltextgarantie.

Die Main-review-schedule wurde vollständig auf Fälligkeit geprüft: **0 fällige Datensätze** am Prüftag. Neue biologische Aussagen erhalten ein 365-Tage-Review; der historische Jahreswert ist ausdrücklich fest. Die Entwurfsfristen stehen separat, ohne Main zu verändern.

## Bilder und Prüfung

Zwei originale CC0-Vektoren: Karte 720 × 540 (4:3), Detail 960 × 540 (16:9). Wald-/Gewässermotiv, mindestens 24 px Sicherheitsrand und eine vollständig lesbare Themenbeschriftung. Keine Tiere mit abzählbarer Anatomie, Größenrelationen, Zahlen oder Antwortsymbolen. Keine externen Bilder oder ungeklärten Bildrechte. Jeopardy nutzt absichtlich keine Fragebilder. Beide Varianten wurden mit Sharp gerendert und visuell geprüft. Es wurden **0 vorhandene Bilder repariert**; in den für dieses Paket verwendeten neuen Grafiken wurde kein Zuschnittproblem festgestellt. Diese thematische Grafik ersetzt keine artspezifischen Fotos.

Nachbauen und prüfen:

```sh
node scripts/inventory-quiz-draft.mjs
python3 scripts/build-tierwelt-draft.py
python3 scripts/build-tierwelt-draft.py --check
node scripts/tierwelt-draft-check.mjs
node scripts/regression-check.mjs
npm run pwa:build
npm run test:pwa
```

Alle Prüfungen bestanden lokal: Quellen-/Mengen-/Datumsprüfung, umgedrehte Paare und identische Fragen, ausgeglichene Aussagen je Schwierigkeitsgrad, isolierter Import in vorhandenen Spielcode, acht verwendbare Jeopardy-Hinweise, Bildformate, vollständige Spielregression, Offline-Build und PWA-Prüfung. Der Entwurf ist nicht im Live-Spiel oder Offline-Release eingebunden. CI prüft den Entwurf und Offline-Build zusätzlich. Echte Safari/iPad-Darstellung des integrierten Pakets bleibt erst nach einer späteren Freigabe prüfbar.

## Noch fehlende Zielmengen

Die Quote von 20 Ergänzungen wird **nur in Tierwelt** erfüllt. Alle übrigen tatsächlich auswählbaren Kategorien erhalten in diesem Entwurf **0 neue Fragen**, damit fehlen dort jeweils die gewünschten 20. Insbesondere Länder, Städte, Bauwerke, Allgemeinwissen und Rekorde & Extreme bleiben prioritär. Bestehende Entwürfe gelten nicht als die in diesem Lauf erstellten Ergänzungen. Noch offen: exakte Gesamtvereinigung nach Kategorieumbenennungen in #126, weitere Themenpakete, spätere Freigabe und Katalogintegration. Auch Tierwelt bleibt einschließlich aller Entwürfe unter 100. Die fortlaufende Erweiterung endet nicht bei 100.
