# MORE / LESS – Online Test

Separate Testumgebung für den Online-Multiplayer. Die produktive App im Repository `more-less` bleibt davon getrennt.

Backend: Supabase Anonymous Auth + RLS/RPC. Diese Testversion dient zunächst dem Zwei-Geräte-Test für Raum erstellen/beitreten, Synchronisierung, Teams und MORE/LESS-Fragen.

Vergleichsbilder liegen unter `assets/visuals/` und funktionieren damit auch aus `offline/index.html` ohne Bild-Host. Die Bildnachweise mit Urhebern und Lizenzen stehen in `assets/visuals/credits.html` und sind im Startmenü verlinkt. `scripts/download-visuals.py` dokumentiert die Wikimedia-Quelldateien und die Verkleinerung; für abstrakte Größen bleibt die grafische Symbol-Darstellung erhalten.

Der Lobby-QR-Code wird lokal mit QRCode.js (`assets/vendor/qrcode.min.js`) erzeugt. Die MIT-Lizenz des Projekts liegt daneben in `assets/vendor/qrcode-LICENSE.txt`; das Bundle stammt aus [davidshimjs/qrcodejs](https://github.com/davidshimjs/qrcodejs). Der QR-Link öffnet das Beitrittsformular mit vorausgefülltem Raumcode.

`node scripts/regression-check.mjs` prüft die Gleichheit beider HTML-Dateien und das Vorhandensein aller lokalen Bilddateien. `node scripts/category-round-check.mjs` prüft, dass fünf Fragen pro Block zur gezogenen Kategorie gehören.

## Neue Fragen und Bilder

`studio/index.html` ist eine lokale Redaktionsseite: Bild auswählen, Urheber/Quelle/Lizenz und einen belegten Zahlenwert eingeben, Bildfokus in beiden Spielzuschnitten prüfen, optionale Fragen selbst formulieren und erst nach Prüfung freigeben. Mit **Katalog als JSON herunterladen** entsteht eine `catalogue.json`; diese Datei unter `content/catalogue.json` ablegen. Bei großen Bildsammlungen können alternativ relative Bildpfade im JSON stehen, wodurch die JSON-Datei klein bleibt.

```bash
python3 -m pip install Pillow
python3 scripts/build-content-pack.py content/catalogue.json
python3 scripts/content-pack-check.py
node scripts/regression-check.mjs
```

Der Builder erzeugt `content/approved.js` und pro freigegebenem Motiv zwei lokale WebP-Bilder unter `assets/visuals/ugc/` (4:3 Karte und 16:9 Frage). Die Spielseiten laden dasselbe Paket und funktionieren damit auch ohne Netz. Entwürfe kommen nicht ins Spiel. MORE / LESS vergleicht ausschließlich Fakten mit derselben Kategorie, Messwertkennung und Einheit. Schätzfragen übernehmen den eingegebenen Fragetext; Jeopardy sowie Fakt oder Fake verlangen zusätzlich ausdrücklich formulierte Frage und Antwort. Bildnachweise werden in `assets/visuals/credits.html` ergänzt. Generierte Dateien müssen zusammen mit dem Code veröffentlicht werden.

Das Studio speichert noch nicht in Supabase und veröffentlicht nicht selbst. Die bestehende Supabase-Verbindung bedient Spielräume; eine gesicherte Uploadoberfläche erfordert eine eigene Administratoranmeldung, Storage-Richtlinien und Freigabe-Tabellen. Externe KI-Bildsuche und automatische Überprüfung von Art, Fakten oder Bildrechten sind nicht Teil dieses ersten Imports.

## MORE / LESS Blitz

Vor dem Start sind 5–15 Sekunden pro Frage wählbar (Standard: 8). Solo beendet Zeitablauf die Frage mit 0 Punkten. Online verwendet der Countdown die Serverfrist; die bestehende RPC `ml_online_ml_timeout` schließt unbeantwortete Fragen ab. Richtige Antworten in der ersten Zeithälfte erhalten serverseitig 1,5 Punkte, danach 1 Punkt. Die Anzeige addiert `players.score` und `players.blitz_bonus`.

`node scripts/blitz-timer-check.mjs` prüft Countdown, Zeitgrenzen und späte Klicks. `scripts/blitz-server-check.sql` prüft die vorhandenen Supabase-Funktionen mit vollständig zurückgerollten Testdaten: Bonus, reguläre Punkte, Timeout, wiederholte Finalisierung und Mitgliedschaft. Der SQL-Test benötigt eine Administratorverbindung. Für bestehende Lobbys gilt weiterhin deren gespeicherte Konfiguration; die Zeitauswahl wird beim Erstellen einer neuen Lobby übernommen.
