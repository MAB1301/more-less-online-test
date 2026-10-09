# Twenty comparisons per category — checked draft, 2026-10-09

This update adds **180 new More/Less comparisons: 18 in each of ten categories**. Together with the prior two per category in `2026-10-09-all-category-criteria`, the package contains **200** (20/category). Eight earlier comparisons in PR #134 are separate, giving 208 extension rows. These counts do not mean 200 new underlying measurements: selected independent unordered pairs reuse documented observations across meaningful criteria. At least eight different subjects per category; no exhaustive pairing of five objects.

| Category | Existing package | Added here | Package total | Main unique rows | Main + full #134 |
|---|---:|---:|---:|---:|---:|
| Tierwelt | 2 | 18 | 20 | 14 | 36 |
| Bauwerke | 2 | 18 | 20 | 14 | 35 |
| Städte | 2 | 18 | 20 | 14 | 34 |
| Länder | 2 | 18 | 20 | 23 | 43 |
| Natur | 2 | 18 | 20 | 65 | 85 |
| Sport | 2 | 18 | 20 | 25 | 45 |
| Autos | 2 | 18 | 20 | 26 | 46 |
| Weltkultur | 2 | 18 | 20 | 47 | 67 |
| Allgemeinwissen | 2 | 18 | 20 | 12 | 35 |
| Rekorde & Extreme | 2 | 18 | 20 | 13 | 35 |

Main inventory uses unordered displayed subject names + metric + unit across legacy and approved More/Less rows. Main snapshot: `071d6dc`. Other unmerged PRs are checked for overlap but are not counted as accepted/live inventory. The earlier report's Rekorde count of 14 was corrected to 13 using this explicit identity. No change in planets/space; no additions to Schätzen, Fakt/Fake or Jeopardy in this follow-up.

## Sources and reconstruction

`datasets.json` records observed source values, field indices, curated pairs, event years where applicable, rounding, definitions and derivation. `sources.json` contains 40 primary-source pages/API endpoints checked on **2026-10-09**. Publisher pages without measurement years remain null. Historical years/editions are named in units and prompts; the WMO archive is the fixed edition dated 31 July 2025, not a claim about current 2026 records. Country APIs are saved in full, including lastupdated 2026-10-08, for 2023 values.

Run `node scripts/build-playable-criteria.mjs` to deterministically build these observations into research input and the playable extension; use `--check` for exact reproducibility. It imports `build-twenty-category-criteria.mjs`, verifies non-ties after rounding, canonical reversed-pair uniqueness, sources/dates and category counts. Review scheduling includes all 208 rows. Fixed historical/snapshot rows use 365 days; unchanged baseline has no due records as of 2026-10-09.

New criteria include bird incubation/clutch range bounds, architecture height, airport passengers/movements, forest share/life expectancy, national park visits/annual change, Bundesliga goals/conceded/wins, model production/customer deliveries, official film runtime/release year and publisher board-game duration/players/age recommendations. Same dimensions, units, editions and periods are compared. Negative temperature records compare signed numbers, not magnitude. Sports compare one completed league season with 34 matches per club.

The NPS 2024 ranking is the NPS-authored primary PDF read via NPSHistory's archive mirror; the official IRMA original was not reliably accessible. No secondary article values substituted. Škoda header aggregates and Wingspan duration conflict, so those fields were excluded. See `source-checks.json`.

## Visuals and release boundary

All comparisons have mapped card/detail graphics. Six additional neutral original motifs (12 SVG files) cover airport, forest, life expectancy, architecture, national parks and football; reuse the relevant original bird/car/film/board/weather motifs elsewhere. Cards 720×540 (4:3), detail 960×540 (16:9), generic fully readable labels and safe padding. Both variants rendered and visually inspected: no clipped text, numerical solution, official team/movie/logo artwork or scaled answer clue. CC0 original artwork; no third-party image rights needed.

Frontend-only extension: local solo and offline build, excluded from server-owned online pools. Draft PR remains unmerged; no deployment or live Supabase mutation. Main's parallel menu/avatar/Jeopardy layout fixes are preserved by merging the latest Main.
