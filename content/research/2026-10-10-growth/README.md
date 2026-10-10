# Geprüfter Teilentwurf vom 10. Oktober 2026

100 neue Fragen in fünf kleinen Themenbereichen: 14 More/Less, 24 Schätzen, 38 Fakt/Fake und 24 Jeopardy. **Review-only:** Das Paket wird nicht von approved.js geladen, nicht veröffentlicht und nicht in die Live-Datenbank geschrieben. Kriterien und Bildzuordnungen sind im Entwurf implementiert und über den echten Spielimport geprüft.

## Umfang und Bestände

| Kategorie | More/Less | Schätzen | Fakt/Fake | Jeopardy | Main | Offene Entwürfe | Danach inkl. Entwürfen |
|---|---:|---:|---:|---:|---:|---:|---:|
| Allgemeinwissen | 2 | 4 | 6 | 8 | 61 | 138 | 219 |
| Bauwerke | 2 | 4 | 6 | 8 | 47 | 30 | 97 |
| Länder | 4 | 6 | 10 | 0 | 51 | 50 | 121 |
| Städte | 4 | 6 | 10 | 0 | 34 | 47 | 101 |
| Tierwelt | 2 | 4 | 6 | 8 | 44 | 48 | 112 |

Zählung nach eigenständigen Spielidentitäten; über Spiele summierte ältere Bestände sind keine Behauptung semantisch unabhängiger Fakten. Fakt/Fake hat einen Schwierigkeitsfilter, keine eigenen Themenmenüs. Main-Inventar berücksichtigt FACT_EXTRA/FACT_CURATED und alle echten Inhaltszusammenführungen; unsourced Legacy-Fakten zählen nicht als geprüft. Jeopardy führt eigene Kategorien: die acht neuen Hinweise in Tierwelt und Bauwerke bilden jeweils eine spielbare neue Spalte.

`main-inventory.json` dokumentiert die tatsächlich auswählbaren Themen/Unterthemen und alle Spielbestände. `category-totals.json` listet sämtliche 37 vorgefundenen Kategoriebezeichnungen aus Main und offenen Entwürfen: je Spiel vorher, offene Entwürfe, Ergänzungen und danach. Die 760 einmaligen offenen Einträge sind eine vorläufige Vereinigung aus zwölf gesichteten PRs, mit gemeinsamer Frage nur einmal zugeordnet. Alle Head-SHAs stehen im Parallelprüfbericht.

**Nicht erfüllte Zielmenge:** In folgenden 32 Kategoriebezeichnungen gibt es in diesem Lauf 0 neue geprüfte Fragen, jeweils 20 fehlen zur Laufquote: Arbeitswelt, Autos, Autotechnik, Champions League, Chemie, Deutschland, FIFA-Ratings, Fußball, Fußballer, Fußballlegenden, Geografie, Geschichte, Kultur, Mix, Nationalparks, Natur, Planetenkunde, Planetenphysik, Raumfahrt, Raumfahrtmissionen, Rekorde & Extreme, Science-Fiction, Sport, Sportregeln, Star Wars, Technik, Transfers, Vereinsstationen, Videospiele, Weltkultur, Weltraum, Wissenschaft. Kein Anspruch auf die vollständige Quote und keine erfundene Auffüllung. Wachstum nach Erreichen von 100 bleibt möglich.

## Neue Kriterien und Quellen

- Tierwelt: Kopf-Rumpf-/Schwanzlängen als Bereichsobergrenzen, Gelenkdrehung, Bautunnel, Tagesstreifweg, Entwicklung, Ernährung und Verwandtschaft. Vier neue Arten. Widersprüchliche Umrechnungen und veraltete Populationszahlen der Zoo-Seiten ausgeschlossen.
- Bauwerke: Baubeginn und Eröffnung getrennt, Bogenspannweite, metrische Stahlmenge, Entwässerungsstationen, Türme und Baugeschichte. Historische britische tons nicht als metrische Tonnen übernommen.
- Allgemeinwissen: Breite, Höhe und abgeleitete Rechteckfläche der eindeutig benannten Europa-Banknotenserie; Material und Gestaltung. Münzmaße aus #128 werden nicht wiederholt. Maße erscheinen bei der Flächenschätzung erst in der Lösung.
- Städte: Census 2020, eindeutige GEOIDs, administrative Landfläche, Wasserflächenanteil und Breitengrad des internen statistischen Bezugspunkts. Stadtgrenzen statt Ballungsraum; kein behauptetes Rathauszentrum.
- Länder: WDI-Snapshot 2023: urbaner Anteil, Ackerland und Bevölkerung ab 65 Jahren. Nationale Urbanisierungsdefinitionen unterscheiden sich; deshalb wird dieser Indikator nur in ausdrücklich definierten Schätzfragen und nicht für Länderpaare verwendet. Die zwei zusätzlichen Altersstruktur-Paare verwenden dieselbe UN/WDI-Altersgrenze. Ackerland ist enger als sämtliche Landwirtschaftsflächen.

22 Primärquellen/Datenschnittstellen einschließlich Definitionen am **10.10.2026** geprüft: San Diego Zoo Wildlife Alliance, Bundesbank, EZB, US Census Bureau, Weltbank (UN/FAO Ursprungsdaten), English Heritage und offizielle Brücken-/Tunnelbetreiber. URL, tatsächliches Prüfdatum, Datenjahr oder ausdrücklich undatierte Sachübersicht, Rundung und Grenzen in sources.json und input.json. Ausgewählte Census-Rohzeilen sowie drei unveränderte API-Antworten sichern die Zahlenprüfung. Neue numerische Beobachtungen aus diesen Datensätzen werden nur einmal verwendet; verschiedene Messgrößen derselben Stadt sind gesonderte Beobachtungen.

## Abgleich und Grafiken

parallel-pr-check.json dokumentiert zwölf offene PRs. pending-questions.json enthält die deduplizierten Ergänzungen, duplicate-audit.json die Identitätsschlüssel und zusätzliche manuelle Themen-/Kennzahlenprüfung. More/Less-Paare werden richtungsunabhängig geprüft; reine Schlüsselprüfung beweist keine Freiheit von Paraphrasen.

Supabase Marc ausschließlich lesend: 7.187 Daily-Einträge (4.228 More/Less, 1.507 Schätzen, 1.452 Fakt/Fake). Archivierte Suche nach neuen Objekten/Kennzahlen lieferte 0 Treffer. Suchumfang/-grenzen und Query stehen in daily-catalogue-check.json. Kein Jeopardy-Katalog, keine Spielerabfrage, keine Datenbankänderung.

Zehn originale CC0-SVGs: fünf thematische Motive, jeweils 720 × 540 (4:3) und 960 × 540 (16:9), mindestens 36 px Sicherheitsrand. Jeder More/Less-Gegenstand und jeder Schätz-/Fakt-Eintrag hat eine passende Zuordnung. Jeopardy-Grafiken sind deaktiviert. Keine Zahlen, Antwortnamen, Flaggen, Tierporträts oder wiedererkennbaren realen Brücken; es sind thematische Symbolbilder, keine artspezifischen Fotos. Beide Formate gerendert und visuell auf Zuschnitt und vollständige Beschriftungen geprüft. Keine bestehenden Live-Bilder geändert, keine Reparatur an alten Zuordnungen erforderlich. Ein fehlerhaftes XML-Ampersand im neuen SVG wurde vor Abgabe behoben und XML-Parsing in die Prüfung aufgenommen.

## Reproduktion und Prüfungen

```sh
python3 scripts/build-growth-draft-20261010.py
node scripts/inventory-growth-20261010.mjs
node scripts/check-growth-draft-20261010.mjs
npm run pwa:build
npm test
```

Offline deterministischer Builder mit bytegenauem --check, Quellmetadaten, Rohzahlen, eindeutigen Beobachtungen, umgedrehten Paaren, Quellen-/Datumskontrollen, Fakt/Fake-Balance pro Kategorie und Schwierigkeitsgrad, echtem Spielimport und Bildabdeckung. Alle Prüfungen bestanden, einschließlich vollständiger bestehender Spielregression, Daily/Online/Jeopardy, Offline-Bundle, Verbindungen, Slot und Casino. CI führt die neue Entwurfsprüfung und die komplette Suite aus. Das Live-PWA-Bundle bleibt bei 1.938 indexierten geprüften Fragen; dieser Forschungsentwurf wird nicht öffentlich gepackt. Keine echte Geräte-/iPad-Spielprüfung behauptet.

Audit- und Quellen-Snapshots sind Prüfinputs; ein Build ersetzt sie nicht stillschweigend durch Netzwerkabfragen. Redaktionelle Annahme, spätere Katalogregistrierung und dann korrekt rebased Bildpfade bleiben nötig. Bildpfade im Review-Paket sind relativ zum Forschungsordner.

941 Main-Review-Termine gegen 10.10.2026 geprüft: **0 fällig**. Das ist eine Fristenprüfung, keine erneute Quellenprüfung aller Altwerte. Separater Entwurfs-Reviewplan: 90 Tage für veränderlichen Rechtsstatus, 365 Tage für historische/feste Daten; Termine bedeuten keine automatische Freigabe.
