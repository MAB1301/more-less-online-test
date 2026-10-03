# Game rules and Daily expansion — 2026-10-03

## Implemented behavior

- More/Less: unranked Solo and host-selected Online blocks prefer previously unseen comparisons. Later blocks prefer closer numeric values; each selected block progresses from a wider to a narrower gap. This is a numeric difficulty heuristic, not an editorial familiarity rating. Browser history keeps up to 400 comparison identities. Canonical identities prevent mirrored pairs in a selected pool; an exhausted topic can reuse historical questions, but not a pair already used in that match. Daily ordering remains server-selected and identical for everyone.
- Estimate: topic and difficulty filters apply to Solo and host-created Online pools. Existing explicit difficulty labels take precedence; other labels are inferred from the question topic. A selection with fewer questions than the requested 10/15/20 is rejected with a visible message. Input accepts German decimals, millions/billions, scientific notation and compatible units (length, area, mass, time, volume, Celsius/Kelvin). Wrong unit dimensions are rejected. Daily inputs share parsing but retain the server's positive-value limit.
- Jeopardy: the host gets accepted answer variants and a clear similar-answer review hint. Optional Final round supports local two-team and shared Online play. Stakes are chosen before revealing the question and cannot exceed a team's nonnegative score. Both answers are committed before the host judges; duplicate submissions or verdicts do not change the first decision. Correct answers add the stake; wrong answers subtract it. The host can skip the Final and keep the current result. The unused Final clue is selected from the available question pool.
- Fact/Fake: playable Solo questions must carry an explanation and an HTTPS source. Unsourced legacy statements remain in the raw catalogue but are excluded from rounds. Optional confidence rules start at 20 points with stakes 1/3/5, capped by the remaining balance; an empty balance ends the round. Classic one-point scoring is retained. The Daily reveal also links the server-confirmed source.

## Server deployment

Applied to project `rnwsbgzdrttqtivrwnxo` on 2026-10-03:

1. `docs/database/daily-catalogue-versioning.sql`: catalogue `available_from` dates and all five catalogue reads in the existing private Daily implementation filter by the selected day.
2. `docs/database/import-daily-expansion.sql`: 739 sourced approved questions, with five negative estimate answers excluded because the current Daily API accepts only positive guesses. New records become available on **2026-10-04, Europe/Berlin**. Inserts are idempotent and exclude exact/reversed same-unit comparisons and existing estimate/fact prompts.
3. `docs/database/jeopardy-final.sql`: private Final state table with RLS and no browser table grants; a public SECURITY INVOKER wrapper calls a private SECURITY DEFINER action with member/host checks and row locks.

Catalogue totals from 2026-10-04: More/Less **630** (was 74), Estimate **168** (was 45), Facts **102** (was 42). Before/after hashes and counts of the 2026-10-03 eligible pool match exactly. Archived and in-progress Daily generation keeps its old eligible catalogue.

## Validation and limits

Full client regression suite and `scripts/game-features-check.mjs` pass. `scripts/jeopardy-final-check.sql` exercises wagers, negative balances, secrecy before commitments, guest/nonmember rejection, idempotent submissions/verdicts, persisted shared scores and cancellation, with all temporary users/rooms rolled back. SQL grants were inspected; the new private table intentionally has no RLS policies or direct grants. The security advisor reports no exposed SECURITY DEFINER warning for the new public wrapper; unrelated existing project warnings were not changed.

Physical-device visual validation remains open. New front-end rules require merging/deploying this PR. Server changes are already installed, with new Daily questions scheduled by their availability date. Weekly ranking/rewards and the separate overlay redesign were not part of this High/Extra game scope.
