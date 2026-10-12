# Sportregeln: geprüfter Tischtennis-Teilentwurf vom 12. Oktober 2026

20 neue eigenständige Fragen: 2 More/Less, 4 Schätzen, 6 ausgewogene Fakt/Fake und 8 Jeopardy. Das Paket ist ausschließlich ein Review-Entwurf. Es ändert weder `content/approved.js` noch die veröffentlichte App oder die Live-Datenbank. Die vollständige Laufquote von 20 Fragen in allen 37 Themenbezeichnungen wird nicht behauptet.

## Bestand

| Sportregeln | Main vorher | Andere offene Entwürfe | Dieses Paket | Main + dieses Paket | Mit allen Entwürfen |
|---|---:|---:|---:|---:|---:|
| More/Less | 0 | 0 | 2 | 2 | 2 |
| Schätzen | 0 | 0 | 4 | 4 | 4 |
| Fakt/Fake | 0 | 0 | 6 | 6 | 6 |
| Jeopardy | 20 | 0 | 8 | 28 | 28 |
| Gesamt | 20 | 0 | 20 | 40 | 40 |

`Sportregeln` ist die tatsächliche bestehende Jeopardy-Kategorie und wird nicht stillschweigend zu `Sport` umbenannt. `main-inventory.json` ermittelt die Main-Spielbanken nach ihrer echten Laufzeit-Zusammenführung sowie die tatsächlich verfügbaren Themen- und Unterthemenfilter. Fakt/Fake besitzt eine Schwierigkeitsauswahl statt Themenpicker. Vor einer späteren Veröffentlichung müssen More/Less und Schätzen die neue Kategorie/Unterkategorie ausdrücklich in ihre Picker-Registrierung aufnehmen; der Draft behauptet daher noch keine Live-Auswählbarkeit.

Nur Sportregeln erhält in diesem Lauf 20 neue Fragen. Die übrigen 36 Bezeichnungen erhalten 0; damit fehlen 720 Fragen gegenüber der formalen Laufquote. Das ist ein belastbarer Teilentwurf statt erfundener Masse. `category-summary.json` dokumentiert Ziel, vorher/nachher und Lücke. Bestände nachher sind vorgeschlagen, nicht veröffentlicht; alte Fragen werden durch das Zählen nicht nachträglich sachlich zertifiziert.

## Quelle, Stand und Grenzen

Primärquelle ist das offizielle konsolidierte PDF **ITTF Statutes 2026**, tatsächlich geprüft am **12.10.2026**. Der offizielle Dokumentdatensatz und die Statutes-Übergangsseite wurden am selben Tag geprüft. Die ITTF weist darauf hin, dass die neue Constitution seit 03.05.2026 vorrangig gilt und die 2026 Statutes im Übergang weiter gelten, soweit sie nicht ersetzt wurden oder widersprechen. Die verwendeten Laws of Table Tennis stehen weiterhin im offiziellen 2026-Dokument; eine künftige Ausgabe erfordert erneute Prüfung. `sources.json` enthält URL, tatsächliches Prüfdatum, Ausgabestand und Grenze.

Neue Kriterien/Themen: Mindestlänge und Mindestbreite des internationalen Spielraums nach Veranstaltungsrahmen, Tischlänge/-breite/-höhe, Balldurchmesser/-gewicht/-material, Naturholzanteil des Schlägerblatts, Netzhöhe, Standard-Rücksprung, Doppel-Mittellinie, Satzpunkte, Vorsprung ab 10:10, Aufschlagwurf, Aufschlagwechsel, ungerades Best-of-Format, Beschleunigungsregel und Satzpause.

Die beiden More/Less-Vergleiche verwenden jeweils genau dieselbe Kennzahl, Einheit, Ausgabe und Regelstelle: Mindestlänge 14 m gegen 8 m sowie Mindestbreite 7 m gegen 6 m. Verglichen wird der allgemeine internationale Spielraum mit der ausdrücklich erlaubten reduzierten Mindestgröße für Rollstuhl-Veranstaltungen. Es handelt sich um bauliche Regelrahmen, nicht um Leistungsunterschiede. Keine Frauen-/Männerwertung, keine unterschiedlichen Laufstrecken und keine Kombinatorik aus wenigen Objekten.

Alle numerischen Werte werden in der veröffentlichten Präzision übernommen. 23 cm beim Rücksprung ist ausdrücklich ungefähr; der 30-cm-Falltest definiert die Spielfläche und nicht jeden Ballwechsel. Die Beschleunigungsregel nach zehn Minuten gilt nicht, wenn bereits mindestens 18 Punkte erzielt wurden; außerdem kann sie auf beiderseitigen Antrag früher beginnen. Ein Match besteht aus einer ungeraden Anzahl von Sätzen, die konkrete Anzahl wird nicht behauptet. 22 Beobachtungsschlüssel über 20 Fragen sind verschieden; keine Regel wird in einem zweiten Spieltyp umformuliert.

## Abgleich und Review

Aktuelles Main: `dced74bb1385014445e186969a09ccd92c20edb5`. Alle 14 offenen PRs wurden mit vollständigen Diffs an erneut bestätigten Head-SHAs geprüft. Der vollständige normalisierte 860-Fragen-Snapshot des Vortags wurde nur nach SHA-Bestätigung weiterverwendet; PR #145 ergänzt 20 andere Squash-Fragen. Insgesamt wurden damit 880 offene Fragen berücksichtigt. Enge Wortgrenzen und semantische Tischtennis-/ITTF-Begriffe ergaben 0 Treffer. `parallel-pr-check.json` dokumentiert Scope, Heads und Grenze.

Supabase Marc (`rnwsbgzdrttqtivrwnxo`) ausschließlich lesend: 7.187 Daily-Kandidaten, davon 4.228 More/Less, 1.507 Schätzen und 1.452 Fakt/Fake. Katalogweite Suche über Frage-, Aussage-, Paar- und Quellenfelder ergab 0 Tischtennis-/ITTF-Treffer. Daily besitzt keinen Jeopardy-Katalog. Keine Spieler-/Antwortdaten gelesen, keine Schreiboperation. `daily-catalogue-check.json` hält Query und Ergebnis fest.

Die 941 Datensätze in `content/review-schedule.json` wurden gegen 12.10.2026 geprüft; 0 sind fällig. Dies ist eine Terminprüfung, keine neue Zertifizierung aller Altwerte. Der getrennte Entwurfsplan setzt für die 2026-Regeln 90 Tage bis 10.01.2027 an und gibt nichts automatisch frei.

## Grafiken und Prüfungen

Zwei originale CC0-SVGs: 720 × 540 (4:3) und 960 × 540 (16:9), jeweils mit 40 px Sicherheitsrand. Abstraktes Tischtennismotiv mit Schläger, Ball, Netz und Tisch; keine Maße, Punkte, Regelaussagen oder Lösungsbegriffe. Für alle More/Less-Gegenstände sowie Schätz- und Faktfragen ist ein Bildschlüssel vorhanden. Jeopardy-Zeilen enthalten keinen eigenen Bildschlüssel. Die Varianten wurden als 720 × 540 und 960 × 540 gerendert und visuell auf Beschnitt, lesbare Beschriftung und sichere Ränder geprüft; nichts ist abgeschnitten. Bestehende Live-Bilder wurden nicht verändert.

Reproduktion:

```sh
python3 scripts/build-table-tennis-draft-20261012.py
node scripts/inventory-table-tennis-draft-20261012.mjs
node scripts/check-table-tennis-draft-20261012.mjs
npm run pwa:build
npm test
```

Der Builder erzeugt deterministisch Review-Pack, Review-Fristen, Validierungsbericht und beide SVGs. Die Prüfung deckt Quellen/Datum/Ausgabe, Rohwerte, Beobachtungsunabhängigkeit, exakte und umgedrehte Duplikate, offene PRs, Daily, Fakt/Fake-Balance je Schwierigkeitsstufe, echten Import in die vorhandenen Spielbanken, Bildabdeckung, SVG-Sicherheit und beide Formate ab. Der Offline-Build enthält den Entwurf absichtlich nicht; der öffentliche Katalog bleibt unverändert.

Offen bleiben redaktionelle Annahme, Schwierigkeitseinstufung ohne Spielerdaten und die spätere bewusste Kategorie-/Katalogregistrierung samt Pfad-Anpassung. Keine echte iPad- oder Zwei-Geräteprüfung wird behauptet.
