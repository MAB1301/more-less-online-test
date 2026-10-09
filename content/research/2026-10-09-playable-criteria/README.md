# Spielbare Vergleichskriterien, 9. Oktober 2026

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
