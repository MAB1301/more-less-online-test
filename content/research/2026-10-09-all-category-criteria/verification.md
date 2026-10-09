# Verification — 2026-10-09

Historical initial 20-row stage. Superseded by `../2026-10-09-twenty-per-category/README.md`: 200 package rows, 20 per category, and 208 full PR extension rows; latest Main merged and all checks rerun. Counts below describe the earlier stage only.

- Main inspected: e29818b965841ab046b2ba0efdfdbda9eead82e5. Open PRs through #137 inspected; no conflicting new question rows found. Menu work in #137 is preserved and not incorporated without its review.
- Daily catalogue: read-only targeted metric/unit scan in Marc returned zero matching More/Less rows. No SQL mutation.
- `node scripts/build-playable-criteria.mjs --check`: passed, 28 rows total including earlier eight; 20 new, exactly two for each of ten categories. All source dates and card/detail paths valid.
- `node scripts/playable-criteria-check.mjs`: passed, runtime insertion, unique selection without refill, theme catalogue insertion, specific prompts and online exclusion.
- `npm run pwa:build`: passed; editor index now 1966 rows including 28 explicitly frontend-only draft comparisons. Offline bundle produced, not deployed.
- `npm test`: complete repository regression and PWA checks passed. `git diff --check`: passed.
- 18 new SVGs rendered with Sharp and visually inspected in both aspect ratios: readable labels, safe borders, no cropped subject or numerical answer. Nine original neutral motifs plus existing weather motif, CC0 with provenance.
- No claim of live integration, server catalogue update, 20-per-category completion, or GitHub CI completion before CI actually finishes.

Main-only unique More/Less row counts (unordered name pair + metric + unit; unmerged PRs excluded). This new package adds two per row. Existing eight in #134 add another two Tierwelt, one Bauwerke, three Allgemeinwissen and two Rekorde & Extreme; other content drafts remain separate and are not counted as accepted inventory.

| Category | Main | This package only | Total #134 draft projected |
|---|---:|---:|---:|
| Tierwelt | 14 | 16 | 18 |
| Bauwerke | 14 | 16 | 17 |
| Städte | 14 | 16 | 16 |
| Länder | 23 | 25 | 25 |
| Natur | 65 | 67 | 67 |
| Sport | 25 | 27 | 27 |
| Autos | 26 | 28 | 28 |
| Weltkultur | 47 | 49 | 49 |
| Allgemeinwissen | 12 | 14 | 17 |
| Rekorde & Extreme | 14 | 16 | 18 |

Source limits: Skytree direct English detail page blocked with 403; operator TOBU page read and official search excerpt corroborated height. Disney values describe only its named US-catalogue versions. Historic WMO/Škoda/rule editions remain fixed and clearly labelled, not current 2026 claims. Undated pages have null measurement years. Lake depth/year mismatch and conflicting Swiss summit figures were excluded.
