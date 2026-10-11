# Sport: geprüfter Squash-Teilentwurf vom 11. Oktober 2026

20 neue Fragen: 2 More/Less, 4 Schätzen, 6 ausgewogene Fakt/Fake und 8 Jeopardy. Review-only, kein Import in approved.js, keine Veröffentlichung und keine Live-Datenbankänderung. Die vollständige 20er-Quote über sämtliche Themen wird in diesem Lauf **nicht** erfüllt.

## Bestand und Umfang

| Spiel, Kategorie Sport | Main vorher | Andere offene Entwürfe | Dieses Paket | Main plus dieses Paket | Mit sämtlichen Entwürfen |
|---|---:|---:|---:|---:|---:|
| More/Less | 25 | 20 | 2 | 27 | 47 |
| Schätzen | 17 | 0 | 4 | 21 | 21 |
| Fakt/Fake | 12 | 0 | 6 | 18 | 18 |
| Jeopardy | 25 | 0 | 8 | 33 | 33 |
| Gesamt | 79 | 20 | 20 | 99 | 119 |

Nachher bezeichnet vorgeschlagene Bestände, keine bereits veröffentlichten Fragen. Summen über Spiele sind keine nachträgliche Behauptung semantisch unabhängiger Altfragen. Die kleine Unterkategorie ist Squash · Regeln 2025; die tatsächlichen Filter haben Mindestmengen, daher behaupten wir kein separat auswählbares Zwei-Fragen-Thema. Jeopardy ergänzt die vorhandene Kategorie Sport, nicht eine beliebig umbenannte Kategorie. Sportregeln bleibt separat und erhält hier 0.

main-inventory.json ermittelt die aktuellen Spielbanken nach ihren tatsächlichen Zusammenführungen einschließlich FACT_EXTRA/FACT_CURATED. Nicht belegte Legacy-Fakten zählen nicht als geprüft. Tatsächliche Themen-/Unterthemenfilter sind gesondert vom allgemeinen Kategorienbestand aufgeführt. Fakt/Fake nutzt Schwierigkeitsstufen.

category-totals.json enthält alle 37 Kategoriebezeichnungen aus Main und offenen PRs, pro Spiel vorher/offene Entwürfe/Ergänzungen/nachher und die Fehlmenge. Nur Sport erhält in diesem Lauf 20 Fragen. Die übrigen 36 Bezeichnungen erhalten 0 und haben jeweils 20 fehlend zur Laufquote. Kategorien mit bereits mehr als 100 bleiben für zukünftige Erweiterungen berücksichtigt; die wiederkehrende Erweiterung wird nicht nach Erreichen dieser Zahl beendet.

## Quellen, Kriterien und Grenzen

Die World Squash Singles Rules 2025 wurden am **11.10.2026** über das offizielle World Squash Officiating-Portal und das Original-PDF geprüft. Das Regelwerk gilt ab 01.09.2025; auf der Titelseite steht V1.2, während der Dateiname V1.2.2 enthält. Quellen-URLs, tatsächliches Prüfdatum und diese Ausgabengrenze stehen in sources.json. Jede Frage nennt die Ausgabe WSF 2025. Wir behaupten weder neue Regeln von 2026 noch ein sportliches Leistungsdatenjahr.

Neue Kriterien/Themen: maximale Regelpausen je Phase, erste ausdrücklich gewährte Regelzeit bei verschiedenen selbstverursachten Verletzungsfällen, reguläre Satzpunkte, gemeinsames Ball-Aufwärmen, Matchformat, Ausrüstungswechsel, Rally-Point-Wertung, Aufschlag, Volley, erlaubte Wandkontakte, Verlängerung, Schiedsrichterrollen/-rufe und Junioren-Augenschutz. Keine Frauen-/Männerwertung oder Streckenmischung; keine kombinatorische Paarliste von fünf Objekten.

Die More/Less-Paare vergleichen dieselbe Kennzahl innerhalb derselben Sportart und Ausgabe. 1/2 bzw. 3/5 Minuten werden exakt mit 60 multipliziert. Bei Verletzungen ist die erste ausdrücklich gewährte Zeit gemeint: keine wiederkehrende Verletzung, keine bestehende offene Wunde, keine zusätzliche Satzpause nach Satzaufgabe. Die Blutregel dient Blutstillung/Abdeckung; sie ist keine Aussage über medizinische Heilungszeiten oder Behandlung. Bei normalen Pausen ist eine frühere Fortsetzung bei beiderseitiger Zustimmung zulässig. Best of Five ist das normale Format, Best of Three eine erlaubte Alternative. rule-observations.json enthält die acht kuratierten Zahlenbeobachtungen mit Regelstellen; alle 22 Beobachtungsschlüssel im gesamten Paket sind verschieden.

Quellenbelege sind Regelnummern, nicht vollständige Kopien des Regelwerks. Nicht erreichbare technische Ball-/Schläger-Spezifikationsseiten wurden nicht für erfundene zusätzliche Fragen genutzt. Wiederholung derselben Regel in einem anderen Spiel oder als umformulierte Aussage wird über Beobachtungsschlüssel ausgeschlossen. Mehrere Begriffe im Glossar sind voneinander unabhängige Regeln/Definitionen.

## Abgleich

Aktuelles Main: dced74bb1385014445e186969a09ccd92c20edb5. Alle 13 offenen PRs wurden samt ihren vollständigen Patches geprüft; es gab keine Squash-Treffer. Jeder vorherige Head-SHA wurde erneut bestätigt. Daher ist die vollständige deduplizierte Inhaltsvereinigung aus dem vorherigen Tagesentwurf wiederverwendbar; die zusätzlichen 100 Fragen aus #144 sind berücksichtigt. Insgesamt 860 unterschiedliche offene Entwurfsfragen. parallel-pr-check.json und duplicate-audit.json dokumentieren Quellen des Abgleichs. Normalisierte Identitäten zählen Paare richtungsunabhängig; die Themen-/Regelfallprüfung ergänzt die reine Zeichenkettenprüfung. Diese Methode ist keine allgemeine automatische Paraphrasengarantie.

Supabase Marc (rnwsbgzdrttqtivrwnxo) ausschließlich lesend: 7.187 Daily-Kandidaten, davon 4.228 More/Less, 1.507 Schätzen, 1.452 Fakt/Fake. Erneute katalogweite Suche nach Squash und Schiedsrichterbegriffen: 0 Treffer. daily-catalogue-check.json hält Query, Datum und Grenzen fest. Kein Jeopardy-Katalog, keine Spieler-/Antwortabfrage, keine Änderung von Daily-Runden oder Datenbanktabellen.

Die 941 Einträge aus content/review-schedule.json wurden gegen 11.10.2026 geprüft: 0 fällig. Dies ist eine Fristenprüfung, keine erneute Zertifizierung aller Altwerte. Neue Regeln bekommen einen getrennten 90-Tage-Prüftermin (09.01.2027) auf mögliche Folgeausgaben; eine Frist gibt keine Frage automatisch frei.

## Grafiken und Prüfung

Zwei originale CC0-SVGs, 720 × 540 (4:3) und 960 × 540 (16:9), mit 40 px Sicherheitsrand. Antwortneutrales Schlägersportmotiv ohne Courtplan, abzählbare Zeitabschnitte, Maßzahlen, Lösungstexte, Brille oder Amtssymbole. Für alle More/Less-Gegenstände und Schätz-/Fakt-Fragen sind Bildschlüssel vorhanden. Jeopardy hat ausdrücklich keine Bilder. SVG-XML, Varianten und Bildabdeckung geprüft; beide Formate gerendert und visuell auf Beschnitt und lesbare Beschriftungen geprüft. Die Illustration ist ein thematisches Symbolbild, kein Gegenstandsfoto. Keine bestehenden Live-Bilder repariert oder geändert.

```sh
python3 scripts/build-squash-draft-20261011.py
node scripts/inventory-squash-draft-20261011.mjs
node scripts/check-squash-draft-20261011.mjs
npm run pwa:build
npm test
```

Alle Prüfungen bestanden: deterministischer Offline-Build mit bytegenauem --check, Quellen/Datums-/Ausgabenprüfung, kuratierte Zahlenbeobachtungen, Duplikate/spiegelverkehrte Paare, Beobachtungsschlüssel, Fakt/Fake-Balance je Schwierigkeitsstufe, echter Import in vorhandenen Spielcode, Bildprüfung und vollständige bestehende Spielregression einschließlich Online/Daily/Jeopardy, PWA, Verbindungen, Slot und Casino. CI führt die neue Entwurfsprüfung und die gesamte vorhandene Suite aus. Keine echte iPad-/Zwei-Geräteprüfung behauptet. Der öffentliche Offline-Build bleibt bei 1.938 indexierten geprüften Fragen; Forschungsdaten sind nicht Teil des Veröffentlichungsbundles.

Redaktionelle Schwierigkeitseinstufung und spätere bewusste Katalogregistrierung samt Bildpfad-Anpassung bleiben erforderlich. Pfade im Review-Pack sind relativ zum Forschungsordner. Die Vergleichskriterien sind im Entwurf implementiert, nicht bereits auf der Live-Seite auswählbar. Quellen-/PR-/Daily-Snapshots sind Prüfinputs, ein Build aktualisiert sie nicht unbemerkt per Netzwerk.
