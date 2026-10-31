# Transfers · FIFA-Transfermarkt 2025

Review-only package checked on 2026-10-31. It adds 20 questions to the small `Transfers` category: 2 More/Less, 4 estimates, 6 balanced Fact/Fake statements and 8 Jeopardy clues. Main has 48 unique Transfers clues, all Jeopardy; this draft raises the review total to 68 and introduces three previously absent game types.

The 22 independent observations come from FIFA's official Global Transfer Report 2025, its publication notice and the accompanying methodology. Every value is tied to calendar year 2025, FIFA TMS, the stated population and FIFA's published precision. Fee values are USD aggregates using FIFA's definition of fixed, conditional and release fees. The two comparisons use the same metric, unit, level and reporting year: Portugal 774 versus England 769 incoming transfers, and Germany USD 1.28bn versus Italy USD 1.20bn spending.

Main, 32 open PRs and 7,187 Supabase Daily rows were checked. No exact, reversed, observation-equivalent or targeted semantic conflict was retained. Existing player-specific transfer questions were not rephrased. There are no mixed-gender, event-distance or competition comparisons.

Two original CC0 SVGs provide a 720×540 card and 960×540 detail image. Both use a 40 px safe frame, generic unbranded shields, arrows and a contract sheet. They contain no player, country, club, number or answer clue; Jeopardy rows deliberately have no image key.

Rebuild and validate:

```sh
python3 scripts/build-transfers-fifa-draft-20261031.py --check
node scripts/inventory-transfers-fifa-draft-20261031.mjs --check
node scripts/check-transfers-fifa-draft-20261031.mjs
npm run pwa:build
npm test
```

Nothing in this directory publishes content, modifies `content/approved.js`, deploys the site or writes to Supabase. Historical 2025 figures receive an annual review date. This package fulfils 20 questions only for Transfers; it does not claim the full per-category run quota.
