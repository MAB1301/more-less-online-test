# Music, login rewards and solo challenges

## Player behavior

- Shop & Erfolge contains avatar frames, name colors, original background loops, victory cues and existing titles. Track previews are free; paid items use the server wallet. Music remains opt-in under Spiel & Ton.
- A daily visit grants 20 coins once per authenticated player and Berlin calendar date. Every seventh consecutive visit adds 50 coins. Guest identity uses the existing browser session, not IP tracking. Account/guest reset creates a different identity.
- Daily gameplay and ranked attempts retain their existing rules. Timely Daily completion and placements, plus verified Daily achievements, continue to award their existing server rewards.
- More / Less, Schätzduell and Fakt/Fake offer normal solo rounds, 30 or 50 questions, and Endlos with three lives. Schätzduell/Fakt-Fake challenges use a topic mix. Endlos orders available difficulty bands and doesn't repeat questions. It ends when lives or the approved pool run out; this is intentionally a finite supply until more reviewed questions are added.
- Solo practice achievements are browser-local, clearly labeled and award no coins. Milestones require correct answers in a single run. A rescue blocks subsequent unassisted achievements for that run. Verified Daily achievements and online Blitz milestones are separately stored on the server.
- One rescue costs 40 coins and grants one life. Solo survival/Endlos can resume while questions remain. Online More/Less and Schätzduell survival allow a rescue only after a revealed question, while the match is still active and before its final question. Blitz has a timer, so it does not offer purchased lives.

## Server migration order

Requires the existing cosmetic wallet, Daily achievements/title migration and game schemas. Apply music-progression.sql, music-estimate-start.sql, then music-online-mode-state.sql. The migration preserves the concurrent branch's existing music/title columns, catalogs and verified Daily achievement rewards. Its three music files and frame SVG assets are included without merging its older frontend.

Private tables deny direct client writes. Wallet locks serialize purchases and rewards; unique claim/match keys prevent duplicate claims. Solo tickets are player-owned and expire after six hours. Online rescues require membership, a dead player, the current revealed question token and remaining match questions. Returning rescue markers prevents the UI from offering repeat purchases.

## Validation

Run node scripts/regression-check.mjs. This includes comfort audio ownership/mute tests and progression deck/life/unassisted achievement checks. Run scripts/music-progression-server-check.sql through an authorized database connection; all fixtures and claims roll back. The server check verifies login idempotency/seventh-day bonus, purchase ownership/retries, rescue price/retry, stale question and foreign-token rejection, and denied direct wallet/anonymous writes.
