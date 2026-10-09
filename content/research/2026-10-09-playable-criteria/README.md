# Spielbare Vergleichskriterien, 9. Oktober 2026

## Ergänzung: vier weitere spielbare Vergleiche

Flugzeug-Spannweite (787-8 / 777-200ER), maximales Startgewicht (787-9 / 777-200ER), bis-zu-Herstellerreichweite (787-10 / 777-200LR) und Brücken-Hauptspannweite (Golden Gate / Forth Road) sind jetzt Teil derselben Solo-Integration. Acht Vergleiche insgesamt; vier davon neue Fragen, vier aus #131/#132 übernommen. Das Brücken-Kriterium existiert bereits als Forschungsentwurf in #122 mit einem anderen Paar und ist nicht als völlig neue Kennzahl gezählt.

Vier zusätzliche CC0-Themen-SVGs in 4:3 und 16:9 zeigen ein generisches Flugzeug bzw. eine generische Brücke. Identisches Motiv für beide Seiten, keine Skalierung oder eingeblendeten Lösungszahlen. Unterkategorien Verkehrsflugzeuge / Brücken; Kategorien Allgemeinwissen / Bauwerke.

Vier Primärseiten am 2026-10-09 gelesen. Boeing-Seiten undatiert, Datenjahr null; Brücken-Bezugsjahre 1937 / 1964. Drei Boeing-Wertevergleiche mit 90-Tage-Review; Herstellerkonfiguration und bis-zu-Reichweite ausdrücklich begrenzt. Reichweite ist kein Vergleich unter kontrolliert identischen Flugbedingungen. Offene Inhalts-PRs #57, #109, #122, #126–#132 sowie #134 geprüft; #127 enthält andere Flugzeugvarianten und Gesamtlänge, #122 anderes Brückenpaar. Daily-Katalog lesend auf Boeing/Forth Road/Golden Gate geprüft: keine Treffer. Main-Änderungen #133/#135 aufgenommen, ohne deren Features zu überschreiben. Keine Live-Datenbankänderung oder Veröffentlichung.

Diese Ergänzung erfüllt weiterhin nicht den Gesamtauftrag von 20 Fragen in jeder kleinen Kategorie.

Dies ist die Frontend-Integration von vier bereits belegten Vergleichsfragen aus den getrennten Entwürfen #131 und #132. Sie sind **nicht vier weitere eigenständige Fragen** zusätzlich zu diesen Entwürfen. Kein Merge, keine Veröffentlichung und keine Live-Datenbankänderung.

| Kategorie | Neues spielbares Kriterium | Vergleichsrahmen |
|---|---|---|
| Tierwelt | Zehenzahl | Pro Vorderfuß, nicht Hinterfuß |
| Tierwelt | Schwanzlänge | Oberes Ende des veröffentlichten Bereichs, kein Individualrekord |
| Rekorde & Extreme | Windstoß | WMO-Rekordklasse je Hemisphäre in m/s, keine anhaltende Windgeschwindigkeit |
| Rekorde & Extreme | Niederschlag | Identisches 24-Stunden-Fenster je Hemisphäre in mm |

Die beiden Tierwelt-Quellenprüfungen stammen vom 8. Oktober, die WMO-Prüfungen vom 9. Oktober 2026. Originale Quellenmetadaten, Limits, Rundung und Bezugsjahre bleiben in input.json / sources.json erhalten. Biologische Übersichten sind undatiert; das Abrufdatum ist kein Messjahr.

`assets/comparison-extension-data.js` wird deterministisch aus den Forschungsdaten gebaut. Die Erweiterung wird nach dem vorhandenen Katalog geladen, prüft ungeordnete Paaridentitäten, ergänzt die tatsächliche SOLO_Q-Spielbank und registriert funktionierende Karten-/Detailbildpfade für jedes neue Objekt. Originale CC0-SVGs mit 720×540 und 960×540 werden lokal mitgeliefert, ohne Lösungswerte. Bilder sind Themenillustrationen und keine maßstäblichen Darstellungen der Tiere/Orte.

Unter „Themen & Sets“ kann ein Vergleichskriterium für Solo bevorzugt werden. Ein noch verfügbarer Vergleich davon wird zuerst ausgewählt; die übrige Runde wird mit anderen frischen Vergleichen ergänzt. Die Auswahl ist nicht ausschließlich: ein einzelner neuer Vergleich wird nicht fünfmal wiederholt, um eine Runde aufzufüllen. Die Präferenz bleibt lokal gespeichert. Das Kriterium ist durch die vollständige Einheit samt Bezugsrahmen definiert, sodass verschiedene Jahre, Messgrößen und Zeitfenster nicht gemeinsam gefiltert werden.

Online bleibt absichtlich unverändert: die vier Fragen werden aus dem servergesteuerten verfügbaren Pool ausgeschlossen und die Präferenz ist in bestehenden Online-Räumen deaktiviert. Eine spätere lesend geprüfte Import-Migration ist Voraussetzung für Online-Nutzung, nicht Bestandteil dieses PR. Der Entwurf enthält keine Supabase-Schreiboperation.

Nachbauen: `node scripts/build-playable-criteria.mjs`; prüfen mit `--check`, `node scripts/playable-criteria-check.mjs`, `node scripts/regression-check.mjs`, `npm run pwa:build` und `npm run test:pwa`. Assets und Offline-HTML werden durch die bestehende Manifestpipeline versioniert.

Umfang: vier neue Kriterien sind in diesem Branch tatsächlich solo spielbar; **nicht** alle Kategorien um 20 Fragen erweitert. Der Gesamtauftrag für alle nicht planetenbezogenen Kategorien unter 100 bleibt offen. Die Integration überschneidet sich bewusst mit #131/#132; diese Daten dürfen beim späteren Zusammenführen nicht doppelt importiert werden. Der optionale Kriterien-Picker überschneidet sich mit der Themenfilterdatei in #126; diese Änderung ist bei der Integration gesondert zu prüfen.
