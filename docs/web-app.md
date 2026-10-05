# Game Night als Web-App

## Auf dem iPhone / iPad installieren

1. Die veröffentlichte Spielseite in **Safari** öffnen.
2. **Offline herunterladen** anklicken und auf **Offline bereit** warten.
   Das erste Paket ist ungefähr **33 MB** groß. Es enthält Startseite, Spielcode,
   Fragen, Bilder, Animationen, Länderflaggen, Sounds und Musik.
3. **Teilen → Zum Home-Bildschirm** wählen und, falls angezeigt, **Als Web-App öffnen**
   aktivieren. Das violette Game-Night-Icon erscheint auf dem Home-Bildschirm.
4. Einmal aus diesem Icon starten und den Offline-Status prüfen. Danach kann ein
   Test im Flugmodus folgen. Noch nicht heruntergeladene Spiele funktionieren offline nicht.

Auf Android oder einem Computer die Installationsoption des Browsers verwenden.
Die App erfordert HTTPS. Ein ZIP oder eine einzelne HTML-Datei direkt über `file://`
zu öffnen installiert keine offlinefähige Web-App.

Solo und vorhandene lokale Spielmodi auf **einem Gerät** funktionieren offline.
Online-Lobbys, Daily-Wertungen, Freunde, Shop, Münzkäufe und Account-Synchronisierung
brauchen Internet. Mehrspieler über mehrere Geräte ohne Internet ist noch nicht umgesetzt.
Die App enthält keine kostenpflichtige Apple-Mitgliedschaft. Hosting und Supabase
sind separate Dienste mit eigenen Nutzungsgrenzen und Preisen.

## Speicher und Account

Beim bewussten Offline-Download fordert die App dauerhaften Browser-Speicher an.
Sie zeigt an, ob dieser Schutz bewilligt wurde. Der Browser entscheidet darüber;
bewusstes Löschen von Website-Daten ist weiterhin möglich. Bei Speicherverlust
kann das vollständige Paket erneut heruntergeladen werden. Der angezeigte Status
prüft die tatsächlichen gespeicherten Dateien, nicht nur einen gespeicherten Haken.

Abgeschlossene Runden eines festen Accounts werden über die vorhandene Supabase-
Funktion gesichert. Nicht bestätigte Uploads liegen in einer persistenten lokalen
Warteschlange und werden bei Internetverbindung bzw. beim erneuten Öffnen versucht.
Ein Accountwechsel darf keine Runden des vorherigen Accounts übernehmen. Bei
Löschen lokaler Daten gehen **noch nicht synchronisierte** Ergebnisse verloren.
Aktive Partien werden nicht als fortsetzbare Cloud-Spielstände gesichert.

## Updates für Spieler

Sobald eine vollständig vorbereitete neue Web-App-Version verfügbar ist, erscheint
im Hauptmenü **Eine neue Version des Spiels ist vorhanden**. Laufende Spiele werden
nicht durch den Dialog unterbrochen. **Später** lässt die aktuelle Version geöffnet.
Mit **Update laden & neu starten** wird das neue Paket überprüft und aktiviert.
Unveränderte Dateien werden aus dem alten Gerätespeicher übernommen; ausschließlich
neue oder geänderte Dateien benötigen einen erneuten Download.

Der Browser kann ein Update im Hintergrund vorbereiten. Es wird erst installiert,
wenn das vollständige Paket gespeichert und anhand seiner SHA-256-Prüfsummen geprüft
ist. Schlägt die Vorbereitung fehl, bleibt die bisherige Offline-Version verfügbar.
Auch beim Schließen sämtlicher Tabs kann daher keine teilweise gespeicherte Version
aktiviert werden. Nach Aktivierung wird höchstens eine vorherige Version behalten.
Die Meldung erscheint in der geöffneten App; eine Push-Nachricht bei geschlossener
App ist nicht eingerichtet. Updates sind bei Internetverbindung über **Spiel & Ton →
Updates prüfen** auch manuell prüfbar.

## Neue Inhalte veröffentlichen

Spielcode, Fragen, Bilder und Sounds wie bisher im Repository bearbeiten, dann:

```sh
npm ci
npm run pwa:build
npm test
```

Der Builder erstellt `dist-web/` mit ausschließlich öffentlichen Spieldateien.
Er erzeugt automatisch eine neue Inhaltsversion; eine manuelle Versionsnummer
ist nicht nötig. Den **gesamten Inhalt** von `dist-web/` auf demselben HTTPS-Pfad
veröffentlichen. Keine SQL-Dateien, Forschungspakete oder Auth-Schlüssel hinzufügen.
Nach einer Veröffentlichung **Updates prüfen** verwenden und in einem zweiten
Browserprofil den ersten Download testen. Der GitHub-Workflow `Build offline Web App`
erstellt ein Download-Artefakt, veröffentlicht jedoch keine Website.

Wichtig: einzelne Dateien aus einer neuen Version unvollständig zu veröffentlichen
kann nicht als vollständiges Update installiert werden. Der Worker prüft jede Datei
gegen den erzeugten Snapshot und lässt die alte Version bei Abweichungen bestehen.
API-Antworten, Auth-Daten, Online-Räume und RPC-Aufrufe landen nie im Offline-Paket.

## Verifikation

Automatisierte Tests prüfen den Kaltstart aus dem Cache ohne Netzwerk, alle Dateien
und Icons, Offline-Audio inklusive Range-Requests, Hash-Prüfungen, Speicherfehler,
inkrementelle Downloads, gescheiterte Updates, explizite Aktivierung, Speicherstatus
sowie die Account-Warteschlange über Neustarts und Accountwechsel.
Ein echter Safari-/iPad-Flugmodus-Test ist vor Veröffentlichung noch auszuführen.
