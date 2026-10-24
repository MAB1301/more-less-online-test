# Science-Fiction / Star-Trek-Filme — geprüfter Entwurf

Review-only-Paket mit 20 neuen Fragen für die exakte Kategorie `Science-Fiction`: 2 More/Less, 4 Schätzfragen, 6 ausgewogene Fakt/Fake-Aussagen und 8 Jeopardy-Fragen. Es ändert weder `content/approved.js` noch Supabase.

Die Kriterien sind Paramount+-Laufzeit, Erscheinungsjahr, Editionsmerkmal und offizielle Handlungsangabe. Die More/Less-Paare unterscheiden sich bewusst nur um 3 beziehungsweise 1 Minute und verwenden dasselbe Plattformfeld, dieselbe Einheit und denselben Prüfzeitpunkt. Stunden/Minuten wurden ohne Rundung umgerechnet.

Alle 13 Quellen sind offizielle Paramount+-Filmseiten, geprüft am 2026-10-24. Main enthält 15 Science-Fiction-Fragen, ausschließlich Jeopardy; die bestehenden Doctor-Who- und Original-Series-Basisfragen wurden ausgeschlossen. Main, 26 offene PRs und 7.187 Daily-Katalogzeilen liefern keinen Konflikt mit den 22 neuen Beobachtungen.

Die zwei originalen CC0-SVGs liefern 720×540 (4:3) und 960×540 (16:9), jeweils mit 40 px Sicherheitsrand und ohne Text, Titel, Figuren oder Lösungen. Die Pipeline erzeugt Paket, Inventar, Reviewplan und Prüfberichte deterministisch.

```sh
python3 scripts/build-science-fiction-star-trek-draft-20261024.py --check
node scripts/check-science-fiction-star-trek-draft-20261024.mjs
```

Die übrigen 33 auswählbaren Kategorien erhalten in diesem Lauf keine künstliche Auffüllung; gegenüber der formalen Laufquote bleiben 660 Fragen offen.
