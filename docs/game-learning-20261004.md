# Game information and style studio

The title ⓘ opens the existing mode information dialog with a principle and mode overview. Mode cards retain their individual rules/examples. No introduction opens automatically. Reveal comparisons and rematch controls are retained.

Style-Shop includes four frames and four name colors, with one free design per type. Purchases equip an item, and owned items can be switched without paying again. Styles appear on the profile, Daily podium/list and day/week/friends rankings. Public rankings retain initials; private uploaded profile photos are not exposed.

Coins: 10 per timely Daily completion, plus 100/60/40 for ranks 1/2/3 after the Berlin day ends, from 2026-10-04 onward. Tied scores share ranks, placement requires positive score. Late archive completions and client-recorded solo runs do not grant coins. Open/refresh shop to claim. Private RLS tables are inaccessible to clients; authenticated RPCs verify owner, inventory and funds, serialize wallet access and deduplicate rewards. Guest inventory belongs to the retained Daily identity; registered players use their account ID.

Music: original deterministic synthesized instrumental loops Game Night, Midnight Lounge (84 BPM), Cloud Drift (72 BPM), Arcade Pulse (110 BPM). No third-party samples. Device-local track preference; disabled by default, mute/visibility and interaction requirements preserved. Reproduce new tracks with scripts/build-background-tracks.py.

Tablet fixes: Jeopardy uses visualViewport size/offset; one scroll area, shorter buzzers and responsive illustration/question sizes. Global account dock is hidden while a modal is open to prevent overlap.

Validation: regression-check.mjs; transactional cosmetics-server-check.sql tests claims, ties, archive exclusion, duplicate purchase, insufficient funds, unowned equip, direct-table access denial and leaderboard decorations. All database test fixtures roll back.

Additional design changes (2026-10-05): Jeopardy uses the category photo as a full background, without foreground object/icon cards. Answer entry has a labelled field; compact local buzzers and one own-team online buzzer. Server question-token-checked submit/pass RPCs deliver the answer to the host; host alone decides the result. Geo now groups existing geography questions into six relevant themes, excluding science/history/sport; geographic image aliases are separate from the original category catalogue. Start actions are two large cards with optional round summary. Daily carries the selected game's identity, removes repeated mode tabs and moves the calendar behind its date button.
