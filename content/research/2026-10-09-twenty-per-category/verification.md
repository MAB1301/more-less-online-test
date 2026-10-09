# Final verification — 2026-10-09

- Deterministic dataset rebuild and exact `--check`: passed. 180 additional rows, 18/category, ≥8 distinct subjects/category; no equal rounded answers or reversed same-criterion pairs. Combined package 200, 20/category; full extension 208 including eight earlier separate rows.
- Source-backed raw observations, rounding, source links and actual check dates retained for all 180. Country API responses saved; derived park growth uses both annual NPS values.
- Runtime regression: passed. Actual solo-bank insertion, correct prompts, graphics mappings, preferred criterion selection, no exhausted criterion refill, online exclusion and catalogue counts verified.
- Existing full `npm test`: passed, all four games, shared online flows, category/menu, leaderboard/account, editorial controls and PWA regressions.
- `npm run pwa:build`: passed. 2146 editor rows (1938 approved +208 explicitly frontend-only extension rows); 623 offline public files. Output not deployed.
- All 12 new SVG variants rendered using Sharp and visually inspected in 4:3/16:9. Labels and safe borders fully visible; no numeric answers or borrowed artwork. Additional relevant original graphics reused for bird/car/film/board/weather comparisons.
- Latest Main `071d6dc` menu, avatar/banner and Jeopardy card-grid/raster-label fixes merged and preserved. Generated manifests regenerated to resolve merge conflicts; complete checks rerun after merge.
- Marc Daily catalogue read-only metric comparison: existing sports regular-duration metric is unrelated to new publisher board-game duration; no matching new metric found. Existing NPS founding-year questions are a different measure from annual visits.
- All eleven open PRs inspected. #126 declares forest/life-expectancy criteria templates, but has no corresponding new question values/pairs; no question-row collision found. Older draft comparisons and their source files remain separate.
- `content/review-schedule.json`: no baseline records overdue on 2026-10-09. All 208 draft rows have next-review records. No live DB, Daily insertion, merge or deployment performed.
- Known source limits and exclusions: NPS 2024 original PDF read via archive mirror; Wingspan time ranges conflict and are excluded; inconsistent Škoda global totals excluded; uncertain overlapping Asian/European maximum-temperature pair excluded. Historical fixed snapshots are named, not presented as current 2026 records.
