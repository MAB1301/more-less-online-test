# Coin Lounge and random-category connections

Casino uses the existing cosmetic wallet, never client scores, money payments or cash-out. Slots, dealing, hit, stand and wheel claims are serialized under the same wallet lock as shop purchases. A server receipt keyed by user/request UUID makes retries immutable. Client mutations are stored before sending and scoped to the owner; an unknown response can only be retried with the same payload. Blackjack stays resumable; hidden dealer cards and the deck are never returned while playing.

Slots: 6 equally likely symbols; triples return 12× stake, exactly one pair returns the stake. Otherwise no payout. Each payout includes the original stake. Blackjack uses one shuffled deck, stands on all 17s, natural pays 2.5×, win 2×, tie returns stake; no double/split/insurance. Bets: 10/20/50/100 earned coins. No starter money is added. Rewards are claimed through the existing shop.

The wheel gives one free reward per Europe/Berlin day: 10/20/30/50/75/100 XP, equally likely. It adds an auditable server reward to existing derived XP. Guests retain local solo XP plus server Daily and wheel XP. It costs no coins.

Tables are private, RLS enabled with no policies intentionally denying direct access, and all table grants revoked. The public RPC uses security invoker; only its private implementation is a definer with an empty search path and mandatory auth.uid()/owner validation. The helper/base functions aren't client callable. Advisors retain existing legacy warnings; no new public definer is added.

Connections has one mode: all eligible categories, all available criteria, 16 cards, 4 groups and 3 mistakes. Category is chosen once before the animation; skip/reduced motion reveal the same chosen result. Close/cancel invalidates timers. This game stays playable offline; casino coin/XP operations require a connection.

Validation: npm test includes UI lifecycle tests; scripts/casino-server-check.sql tests synthetic identities, wallet changes, card masking, duplicate requests, ace scoring, payouts and daily XP uniqueness and rolls everything back. No physical iPad visual test was performed.
