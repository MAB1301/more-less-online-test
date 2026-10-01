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


### Online mechanics (October 2026)

More/Less server scoring supports Classic (+1), King (correct streak up to +5), Survival (three lives, eliminated players spectate), Blitz (+1, plus 0.5 for a correct first-half answer), and eight five-question Chaos rules. Chaos draws a different rule per round and grants one bonus point for five correct answers. The 60-second Sprint remains available in singleplayer; it is not in the online rule deck. Party uses the normal comparison scoring and the shared online jokers; no additional Party mutation deck is implemented.

Online jokers are consumed once per match, at activation, with at most one per question: four possible values, automatic correct answer, neutral pass, double correct-answer points, or make another player skip the next question neutrally. The server checks membership, answer locks, deadlines, consumption, and match/question identity. Hints survive repeated requests without rerolling. Lives, scores, and consumed jokers survive a page reload. Only the host resets the match; reused question numbers receive new IDs.

Schätzduell shares a shuffled set of 10/15/20 questions across the lobby. Guesses and solutions stay private until everyone has answered, the Blitz deadline expires, or an inactive player is skipped. Classic, Risk, Survival, Blitz, and King are scored on the server. Only the host advances a revealed question. Eliminated players spectate; the final screen lists the shared standings. Untimed rounds wait for active participants; disconnected players become neutral after 60 seconds without a heartbeat.

For an existing installation with the baseline online engine, apply `supabase/online-estimate.sql` before `supabase/online-modes.sql` (the reset function clears both games). Both were applied to the connected project. Run `node scripts/regression-check.mjs` and `node scripts/mode-routing-check.mjs`. The rollback-only server suites are `scripts/blitz-server-check.sql`, `scripts/online-modes-server-check.sql`, `scripts/online-chaos-server-check.sql`, and `scripts/online-estimate-server-check.sql`.

Security review: new state/answer tables live in the private schema, with RLS enabled and client table privileges revoked. Public RPCs reject nonmembers, and host operations separately verify ownership. Anonymous API role execution is revoked. The [Supabase SECURITY DEFINER advisory](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) is intentional for authenticated, membership-checked game RPCs; [private-table policy notices](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) describe the deliberate deny-by-default policy.


### Game clarity update

New lobbies enable `rule_previews`: More/Less shows a five-second rules preview before the first question, and Chaos before each new five-question round. Schätzduell shows one before the match. The server stores `starts_at`, blocks early answers/jokers, and places timed deadlines after the preview. Existing clients/lobbies without the flag retain their previous timing. Singleplayer games show a short explanation before starting, with a cancel action and focus return. The Rules button lets players reread the current rule; timed games clearly say that their countdown continues.

A member-only waiting snapshot returns participant names, connectivity and submission flags; it contains no choices, guesses or solutions. Both More/Less and Schätzduell show answered/total and pending names. Snapshots are matched by question ID and hidden during previews, after reveal and on a question mismatch.

Phone layouts use shorter imagery and smaller spacing while retaining at least 44px control targets. Card labels wrap and expand rather than being clipped; landscape uses shorter images. No new main-menu section was added.

Apply `supabase/game-clarity.sql` after the online mechanics scripts. `scripts/game-clarity-server-check.sql` verifies waiting privacy, preview locks and full post-preview answer time with rolled-back fixtures. `scripts/game-clarity-client-check.mjs` is included in the regression suite and checks rules, focus return, timer release, locked answers and waiting-state cleanup.
