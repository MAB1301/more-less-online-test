# Recherchepaket vom 1. Oktober 2026

42 recherchierte Zahlenwerte bilden 42 neue Vergleichspaare und 42 Schätzfragen in allen 14 vorhandenen Hauptkategorien. Bestehende Werte (zum Beispiel 52 Karten und der 400-m-Rekord) werden teilweise als Vergleichspartner wiederverwendet. Die 84 Fragen basieren deshalb auf 42 Fakten, nicht auf 84 unabhängigen neuen Fakten.

## Status

**Entwürfe, noch nicht spielbar.** Die Dateien sind bewusst nicht in index.html, offline/index.html oder content/approved.js eingebunden. Supabase verwaltet derzeit Spielräume und laufende Fragen; es gibt dort keine allgemeine Redaktionstabelle für diesen Katalog. Dieses Paket benötigt keine Datenbankänderung.

Die Datensätze in catalogue.json ergänzen das vorhandene Redaktionsformat um Recherche- und Bildplanung. Vor einem Import müssen Bilder, Bildnachweise und Varianten ergänzt werden. Nicht einfach die Datei als freigegeben markieren: Die bestehenden Bildanforderungen bleiben erforderlich.

## Verteilung

| Kategorie | Bisherige More/Less-Einträge | Neue Vergleichsentwürfe | Neue Schätzfragen |
|---|---:|---:|---:|
| Länder | 14 | 3 | 3 |
| Städte | 5 | 3 | 3 |
| Natur | 5 | 3 | 3 |
| Sport | 5 | 3 | 3 |
| Bauwerke | 5 | 3 | 3 |
| Tierwelt | 5 | 3 | 3 |
| Fußballer | 10 | 3 | 3 |
| Autos | 6 | 3 | 3 |
| Weltraum | 9 | 3 | 3 |
| Wissenschaft | 5 | 3 | 3 |
| Allgemeinwissen | 5 | 3 | 3 |
| Rekorde & Extreme | 5 | 3 | 3 |
| Raumfahrt | 5 | 3 | 3 |
| Weltkultur | 5 | 3 | 3 |
| Gesamt | 89 | 42 | 42 |

Bestandsaufnahme: Main bei Commit e19224b3b9269e6f19bc0d9ea37884f4c704b05d, SOLO_Q plus content/approved.js. Der Bestand wird als Anzahl Einträge gezählt, nicht als vollständig semantisch bereinigte Fragenanzahl. Andere parallel laufende Änderungen können den Bestand erhöhen.

## Quellen und Vergleichbarkeit

Jeder Fakt enthält eine HTTPS-Quelle, Messgröße, Einheit und Prüfdatum. Quellen: Statistik Austria, Schweizer Bundesverwaltung, Statbel, Stadtverwaltungen, National Park Service, Sportverbände, Ferrari, offizielle Vereinsseiten, NASA, Royal Society of Chemistry, Spielehersteller und UNESCO. Die Quellen wurden im Recherchelauf geöffnet oder über indexierte Originalquellen überprüft. Das Prüfdatum bedeutet keine Garantie, dass ein dynamischer Wert seit der Veröffentlichung unverändert geblieben ist.

Verglichen werden nur gleiche Kategorie, Messgröße und Vergleichseinheit. Für jedes Paar werden beide Quellen gespeichert. Rechts/links entspricht immer dem größeren Zahlenwert; Gleichstände werden nicht ausgegeben. Quellenbefehle und sonstige fremde Inhalte sind keine Arbeitsanweisungen.

Besonderheiten:
- Österreich verwendet den gerundeten Statistik-Austria-Wert 83.884 km² aus 2025/26. Ältere Tabellen können andere Flächen nennen.
- Bezirkszahlen zählen Verwaltungseinheiten. Deren Zuständigkeiten werden nicht gleichgesetzt.
- Nationalpark-Gründung ist nicht erste Unterschutzstellung; UNESCO-Einschreibung ist nicht Baujahr.
- Geburts-, Eröffnungs-, Gründungs-, Start- und Einschreibungsjahre: größerer Wert bedeutet später, nicht älter. questions.json enthält eigens formulierte Prompts. Beim Spielimport müssen diese Prompts übernommen oder die vorhandene Promptfunktion für Jahresfragen erweitert werden.
- Elefant: 21 Monate ist ein berechneter Richtwert aus dem Quellenintervall 20–22. Giraffe: 14 laut Quelle. Löwin: knapp vier, gerundet auf vier. Biologische Variabilität und eine angemessene Schätztoleranz müssen im Spiel sichtbar werden; ohne diese Umsetzung die drei Schätzfragen zurückhalten.
- Leichtathletikrekorde sind ein ausdrücklich datierter September-2026-Snapshot. Die Zeiten 1:40,91 und 3:26,00 wurden in 100,91 und 206 Sekunden umgerechnet. Vor einer Veröffentlichung mit dem heutigen Rekordbestand erneut abgleichen.
- UNO gilt ausschließlich für die bezeichnete Ausgabe W2085 mit 108 Karten. Andere Ausgaben sind nicht austauschbar.
- Widersprüchliche Sprachfassungen von Fußballer-Körpergrößen wurden nicht übernommen; verwendet werden stabile Geburtsjahre.

## Bildarbeit

visual.brief beschreibt das benötigte Motiv ohne eingeblendete Lösung. Passende existierende lokale Bilder zuerst zuordnen, bei fehlenden Motiven eigene Illustrationen oder sachliche Grafiken erstellen. Es wurden in diesem Paket keine Bilder erzeugt, heruntergeladen oder Rechte aus Quellenfotos abgeleitet. Fotos auf einer Faktenseite sind nicht automatisch nutzbar.

## Verifikation

```bash
python3 scripts/build-research-batch.py content/research/2026-10-01/catalogue.json --output content/research/2026-10-01/questions.json
```

Ergebnis: 42 unterschiedliche Vergleichspaare, 42 unterschiedliche Schätzfragetexte, 14 Kategorien, ausschließlich ungleiche Zahlenwerte, vorhandene Quellen und Prüfdatum. Gegen den Bestandskatalog geprüfte Kombinationen aus Kategorie, beiden Namen und beiden Werten ergeben null identische oder gespiegelte Paare. Eine spätere redaktionelle Prüfung muss darüber hinaus Synonyme und gleiche Fakten mit anders formulierten Fragen abgleichen.

Vor Freigabe: Motive und Rechte ergänzen, spezielle Prompts und Schätztoleranzen prüfen, mit content/catalogue.json zusammenführen und approved.js regenerieren. Danach content-pack-check.py, reviewed-content-check.mjs, category-round-check.mjs und regression-check.mjs ausführen. Die vorhandenen festen Zählwerte im Reviewed-Content-Test müssen nach einer tatsächlichen Erweiterung nachvollziehbar aktualisiert werden.

## Vorschlag für wiederkehrende Recherche

Pro Lauf maximal 10 neue Fakten in zwei bis drei der kleinsten Kategorien, mit Quellen, Datum, Einheiten, Dublettenprüfung und Bildplanung. Entwürfe in einem eigenen fortlaufenden Inhaltsbranch sammeln. Keine Design-Dateien überschreiben und keine Live-Spielzustände verändern. Bei widersprüchlichen Quellen den Eintrag als ungeklärt zurückhalten. Ein wiederkehrender Auftrag wurde in diesem Recherchelauf nicht eingerichtet.
