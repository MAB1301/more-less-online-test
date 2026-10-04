# Game explanations and reveal clarity

Each game menu opens a three-step introduction with Next/Back and an optional per-game “Nicht mehr automatisch anzeigen” checkbox. Opt-out is stored under versioned browser-local keys, including for guests. No IP collection or database change is needed. “Spiel erklären” reopens the introduction and allows opt-in again. Storage failures display a notice and do not prevent continuing. Introductions do not interrupt an active online lobby or match.

Estimate reveals show the guess and solution on one dynamically scaled track, plus percentage deviation and too-high/too-low text. Zero solutions use absolute deviation; timeout and neutral participation have no guessed marker. Online solutions remain gated by the existing reveal phase.

More/Less reveals add both values with units and a derived factual difference. Fact/Fake keeps existing sourced explanations and labels true explanations or false-statement corrections. Jeopardy highlights the engine's active buzzer team and marks played fields visibly while retaining their review action. Existing rematch logic retains selected settings; labels distinguish local rematches, host rematches in the same lobby and guests returning to the host's lobby.

Validation: complete `node scripts/regression-check.mjs`, including the new `game-learning-check.mjs` covering tutorial navigation, per-game suppression/restoration/reopening, blocked storage, deviation/zero/timeout, online reveal gating, stale Fact/Fake response rejection, comparisons and host-aware result labels. `git diff --check` passes. Automated DOM stubs do not certify physical-device layout or multi-device networking.
