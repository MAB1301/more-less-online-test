# Fakten zuordnen – Quellenprüfung vom 9. Oktober 2026

Eigenständiger Modus: je Runde vier Namen plus je drei Zahlenfakten.
`build-connections.py` kombiniert freigegebene Katalogfakten mit den geprüften Ergänzungen in `connections-additions.json`; das Ergebnis liegt offlinefähig in `assets/fact-connections-data.js`.

Das Paket enthält 13 Kategorien, 82 Gegenstände, 87 Kriterien und 333 Fakten. Pro Fakt werden Originaldefinition, Einheit, Quelle und gegebenenfalls Bezugszeitraum oder Schätzbereich gespeichert. Der Quellenlink erscheint nach der Auflösung, damit er vorher keine Zuordnung verrät. Werte mit identischem sichtbarem Inhalt sind austauschbar; die Auswertung verwendet keine unsichtbare Herkunft einer Karte.

Bestand bedeutet bei Tieren eine WWF-Schätzung in freier Wildbahn (Seitenstand 09.10.2026, kein behauptetes Zähljahr), bei Autos den zugelassenen deutschen Pkw-Bestand einer ausdrücklich benannten **gesamten Marke** zum 01.01.2025. Diese Zahlen werden nicht einem einzelnen Sportwagenmodell zugeschrieben. Weltbankzahlen haben das jeweils angegebene Datenjahr und verwenden die Gebietsdefinition des Indikators; Fläche und Bevölkerungsdichte können unterschiedliche Flächendefinitionen verwenden.

Die FIFA-Werte beziehen sich ausschließlich auf die Männer-WM 2022 und schließen Elfmeterschießen aus. Nintendo-Verkäufe sind kumulierte weltweite Switch-Verkäufe einschließlich Downloads und Bundles zum 30.06.2026. Physikalische Werte stammen aus NASA-Factsheets und der Royal Society of Chemistry; Gebäude aus CVU/CTBUH, Kunstmaße aus MoMA, Welterbe aus UNESCO, Sportmaße aus den jeweiligen Verbandsregeln. Umgerechnete Tierwerte wurden mit 0,45359237 kg/lb und 0,3048 m/ft gerundet.

Kriterienauswahl ist ein Pool: drei verfügbare Fakten je Name. Nicht spielbare eingeschränkte Kombinationen sperren den Start mit einer Erklärung. Bunter Mix wählt eine spielbare Kategorie je Runde, damit die Kategorien selbst keine triviale Lösung bilden.

Prüfung: `npm run test:connections` erzeugt und löst 520 Runden über sämtliche Kategorien und prüft Fehlerlimit, Wiederholungen, unvollständige Auswahl und austauschbare Karten. `npm test` prüft zusätzlich die bestehenden Spiele und Offline-Veröffentlichung.
