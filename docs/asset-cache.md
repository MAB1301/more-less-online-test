# Bildspeicher und Ladezeit

Vier aktive PNG-Sammelbilder waren zusammen 9.586.815 Bytes groß. Die WebP-Versionen bei unveränderten Abmessungen benötigen 1.085.254 Bytes: rund 89 % weniger. Die Originale bleiben als bearbeitbare Quellen erhalten. Die CSS-Verweise nutzen die WebP-Dateien.

Das zuvor beim Parsen von einem externen CDN geladene Supabase-Browser-SDK liegt nun als identischer UMD-Bundle der aufgelösten Version 2.117.2 lokal vor, einschließlich MIT-Lizenz. Authentifizierung und Online-RPCs bleiben unverändert.

## Auf dem Gerät

Nach dem ersten Laden registriert die Seite ihren Service Worker. Öffentliche lokale Bilder, CSS, JavaScript und das geprüfte Fragenpack werden beim Gebrauch im Browser-Cache gespeichert. Wiederholte Abrufe kommen direkt aus diesem Speicher. Der Worker wird erst nach dem Seitenladen installiert; es gibt keinen vollständigen Download vor dem Spielstart.

Direkt im **Hauptmenü → Download-Symbol „Bilder laden“** (alternativ unter **Spiel & Ton → Spielbilder vorab speichern**) lassen sich alle 283 lokalen WebP-/SVG-Grafiken vorher speichern (11,2 MB). Beide Schaltflächen teilen einen Auftrag und zeigen denselben Fortschritt; während des Speicherns sind sie gesperrt. Zwei Downloads laufen parallel; Fortschritt und fehlgeschlagene Dateien werden angezeigt. Wiederholtes Starten ergänzt fehlende Dateien. Bereits geladene Dateien werden im Hintergrund vorbereitet; dies entfällt in der datensparenden Ansicht und bei aktiviertem Browser-Datensparen.

Jede Datei besitzt eine Inhaltsrevision. HTML-Verweise auf lokale Dateien erhalten diese Revision automatisch als URL-Parameter; neue Skripte können dadurch schon beim ersten Besuch nach einem Update geladen werden, während der bisherige Worker noch aktiv ist. Bei einem Update werden geänderte Dateien erneuert; unveränderte Bilder bleiben erhalten. Registrierung und Pfade funktionieren auch unter einem GitHub-Pages-Unterverzeichnis und von `offline/index.html` aus. Die HTML-Seite und Supabase-/Auth-/Room-/Daily-API-Anfragen werden nicht zwischengespeichert. Gespeicherte Grafiken allein machen Online-Spiele nicht offline spielbar.

## Änderungen veröffentlichen

Nach jeder Änderung an Bildern, CSS, JavaScript oder `content/approved.js`:

```sh
python3 scripts/build-asset-manifest.py
node scripts/regression-check.mjs
```

Die Regression prüft die Inhaltsrevisionen und verweigert ein veraltetes Manifest. Cache-Prüfungen decken Wiederholungsabrufe ohne Netzverkehr, Offline-Bildabrufe, parallele Abrufe, unabhängige Response-Bodies, Updates, Speicherfehler, Herkunft/Pfad, POST/Range-Ausschluss und den Vorab-Download ab. Eine echte Browser-Laufzeitmessung steht noch aus; die Byte-Ersparnis ist direkt an den Dateien gemessen.
