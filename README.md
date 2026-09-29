# MORE / LESS – Online Test

Separate Testumgebung für den Online-Multiplayer. Die produktive App im Repository `more-less` bleibt davon getrennt.

Backend: Supabase Anonymous Auth + RLS/RPC. Diese Testversion dient zunächst dem Zwei-Geräte-Test für Raum erstellen/beitreten, Synchronisierung, Teams und MORE/LESS-Fragen.

Vergleichsbilder liegen unter `assets/visuals/` und funktionieren damit auch aus `offline/index.html` ohne Bild-Host. Die Bildnachweise mit Urhebern und Lizenzen stehen in `assets/visuals/credits.html` und sind im Startmenü verlinkt. `scripts/download-visuals.py` dokumentiert die Wikimedia-Quelldateien und die Verkleinerung; für abstrakte Größen bleibt die grafische Symbol-Darstellung erhalten.

`node scripts/regression-check.mjs` prüft die Gleichheit beider HTML-Dateien und das Vorhandensein aller lokalen Bilddateien. `node scripts/category-round-check.mjs` prüft, dass fünf Fragen pro Block zur gezogenen Kategorie gehören.
