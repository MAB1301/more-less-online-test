# Fragen, Regeln und Sortierduell

## Umsetzung
- Jeopardy: Antworten liegen serverseitig privat. Mitglieder erhalten sie erst nach der Wertung, der Host darf sie vorher sehen. Der ausgelieferte lokale Fragenkatalog bleibt lesbar; private Spiele sind keine manipulationssichere Rangliste.
- Einheitliche Inhalts-IDs, Veröffentlichungsrevisionen, Quellen und Datenstände. Der Redaktionsindex enthält 1.938 kuratierte Fragen. Lokale Legacy-Fragen werden weiterhin unterstützt.
- Studio unter `studio/`: bestätigtes Konto, gesonderte Redaktionsrechte, Entwürfe und Veröffentlichung getrennt, Konflikterkennung und Meldungsbearbeitung. Bilder werden als WebP verkleinert, Quelle und Lizenz verlangt. Manuelle Prüfung auf Lösungshinweise bleibt erforderlich.
- Eigene Regeln für private More/Less- und Schätzduell-Runden: Vorlagen, Punkte und Abzüge (More/Less), Leben, Schätztoleranzen und Online-Joker. Änderungen nur vor Matchstart; Chaos und Tagesranglisten behalten ihre eigenen Regeln.
- Sortierduell: vier vergleichbare Objekte, fünf Fragen, ein Punkt je richtig geordnetem Paar, maximal sechs je Frage. Solo und private Lobby; Online-Antworten bleiben bis zur Auflösung verborgen.

## Installation
SQL in dieser Reihenfolge anwenden: `supabase/editorial-and-rules.sql`, `supabase/editorial.sql`, `supabase/sort-duel.sql`. Danach `npm run pwa:build` und das vollständige `dist-web` veröffentlichen.

Die ersten Redaktionsrechte werden über einen befristeten, einmaligen Aktivierungscode an ein bestätigtes Konto vergeben. Codes gehören nicht in das Repository. Weitere Rechte sind serverseitig über `auth.users.raw_app_meta_data.content_editor` zu vergeben, niemals über User-Metadaten.

Veröffentlichungen werden beim Öffnen der Spielseite geladen. Bereits laufende Fragen behalten ihren Stand. Neue hochgeladene Bilder sind nicht automatisch Teil des Offline-Pakets. Neue Jeopardy-Kategorien brauchen mindestens fünf nutzbare Fragen. Es wurde keine vollständige inhaltliche Neubewertung aller Fakten vorgenommen.

## Prüfung
`npm test` prüft bestehende Spiele, Gastzugänge, Fortschritt und PWA sowie Inhalts-IDs, Veröffentlichungen, Regelgrenzen und Sortierwertung. `scripts/improvements-server-check.sql` prüft in einer zurückgerollten Transaktion Antwortschutz, Editorrechte, Veröffentlichungskonflikte, Regeländerungen und Online-Sortierwertung. Die kombinierte Migration mit diesen Fixtures wurde erfolgreich in einer Rollback-Transaktion geprüft.

Die lokale Browser-Vorschau war in dieser Umgebung blockiert; visuelle Browser- und echte Safari-Gerätetests sind noch offen.
