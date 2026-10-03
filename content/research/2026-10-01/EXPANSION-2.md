# Second playable expansion

45 additional numeric facts checked against primary sources on 2026-10-01. Their authoring metadata and sources are preserved in `expansion-2.json` and merged into the approved `content/catalogue.json`.

The batch adds 208 comparison pairs to the previous pack of 58, for 266 built comparisons. Together with the 73 inline baseline comparisons, the playable More/Less pool contains 339 entries, up from 131 after the first batch. The 45 new sourced estimate rows include two replacements of old inline Earth/Neptune solar-distance questions: net growth is 43 estimates.

Coverage: 12 additional chemical elements; all eight planets for average solar distance, with five added orbital periods; four terrestrial surface temperatures and four giant-planet atmosphere temperatures at 1 bar, kept in separate groups; three team sports; three mission launch years; three national-park founding years; Cologne Cathedral inscription; Mohamed Salah birth; Porsche GT3 cylinders.

Quality decisions:
- NASA table values use the version last updated 2025-03-18, checked 2026-10-01. They are rounded reference values, not live observations. The units for solar distance are millions of kilometers throughout. Giant-planet atmospheric temperatures are not compared against terrestrial surface temperatures.
- The Earth/Venus orbital comparison is excluded from the generated group because the inline baseline already contains Venus-Jahr/Erdjahr.
- Equal-value pairs (football/field hockey, Porsche/Ferrari 296 cylinders, Zion/Grand Canyon founding year) are not emitted.
- Park years refer to designation as a national park, not earlier national-monument status. Mission years refer to Earth launch. Rugby is standard Rugby Union; handball is indoor and hockey is outdoor.
- 21 new locally shipped original SVG graphics contain no numerical answers. Existing credited local pictures are reused for the additional planets and Cologne Cathedral.

Build: `python scripts/build-content-pack.py content/catalogue.json`. Validation: content-pack tests and full client regression.

Read-only inspection of the live Marc Supabase project confirmed that estimate questions accept numeric answers and signed guesses, and that server accuracy uses an absolute-valued truth denominator. No database mutations were needed. Client parsing tests cover negative temperatures and magnitude conversion.
