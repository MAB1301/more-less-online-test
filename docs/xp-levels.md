# Personal XP and levels

XP is personal progression, separate from ranked scores, achievements and coins.
An eligible saved run has at least five answers and earns
`10 + min(answered, 30) + 2 * min(correct, 30)` XP (maximum 100).
A completed Daily with at least one answer earns
`30 + 2 * min(answered, 30)` XP (maximum 90). Archive attempts also count
for personal XP. Each stored run/attempt counts once; reading a profile never
awards or changes anything. Existing account history counts retroactively.

Level 1 starts at zero XP. First advance needs 100 XP, then each advance needs
25 more: cumulative thresholds 0, 100, 225, 375, 550, and so on.

Accounts derive XP from existing private run and Daily records; no new reward
or wallet tables. Solo run records are personal play logs, not ranked evidence.
Guests keep Solo XP in a compact persistent browser ledger with up to 200
receipt IDs and a total that survives history truncation. Daily XP is read from
the authenticated guest's server profile. Guest and account XP stay separate.

Display: Account menu > Fortschritt & Abzeichen. Progress bar, current level,
total XP, remaining XP and scoring rules. No animated assets or additional
network calls beyond the existing profile request.

Validation: client tests cover thresholds, award caps, duplicate receipts,
guest/account isolation and totals beyond 200 runs. Transactional SQL fixture
checks saved round + Daily XP, repeat recording/profile reads, thresholds and
private getter permissions. Full regression suite passed. Security advisors
returned existing unrelated notices; the new private helpers have no public,
anonymous or authenticated execution privileges.
