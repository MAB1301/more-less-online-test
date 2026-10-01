# Chaos rounds

The More/Less singleplayer match has four rounds. Each chosen category card is followed by a rule introduction with a manual start button. Four different rules are shuffled from this pool; each ends when its round ends:

- Double: correct +2, wrong 0.
- Risk: correct +1, wrong -1.
- Blitz: eight seconds per question, correct +1, timeout 0.
- Reverse: select the lower numerical value, correct +1.
- Streak: consecutive correct answers award +1, +2, then up to +3; wrong resets the streak.
- Final: correct +1; correct fifth answer +5.
- Blind: conceal the reference value until the answer is revealed, correct +1.
- Rescue: correct +1, wrong -1; the first wrong answer costs 0.
- Sprint: one continuous 60-second deadline, random unique questions across categories, correct +1. No card draw pauses or five-question cap while the clock runs. Exhausting the available unique question pool also ends the round.

Non-sprint rounds with five correct answers receive one additional point, once. Negative scores are allowed. Answer dots show correctness, not awarded points. Sprint shows remaining time and category rather than five dots.

Round introductions do not consume time. Exit/restart clears the round timer; callbacks verify match identity. Sprint answers at or after the deadline do not count.

These rules apply to singleplayer. Online Chaos still uses the existing server-side rules and requires a separate authoritative implementation before advertising the same behavior there. Party is currently a Classic variant with shorter feedback pauses in solo; the lobby has existing joker controls, not an independent party mutation system.

Pending visual content corrections: replace the football pitch with unlabelled artwork and replace the mismatched tennis illustration. Question images must not disclose sought values.
