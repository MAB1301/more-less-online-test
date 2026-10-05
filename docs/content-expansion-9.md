## Reviewed question additions

| Mode | Football | Videogames | Culture / Star Wars | Total |
| --- | ---: | ---: | ---: | ---: |
| More/Less | 80 | 51 | 0 | 131 |
| Estimate | 42 | 25 | 0 | 67 |
| Fact/Fake | 0 | 10 | 0 | 10 |
| Jeopardy identity clues | 5 | 15 | 12 | 32 |

Football includes completed Premier League careers (goals, assists, appearances and championships), distinct professional clubs, Champions League goals/assists for 2023/24 and European Cup/Champions League club titles at the stated cutoff. These are separate comparison measures, not interchangeable career totals. EA SPORTS FC and numbered FIFA editions are Videogames across all modes; country FIFA rankings remain real-world geography data.

Videogames adds official Pokédex values, dated Nintendo Switch sales and first-release years for Portal 2, Stardew Valley, Elden Ring and Mario Kart 8 Deluxe. Identity clues cover Mario, Pokémon, Minecraft, Zelda, Call of Duty, Rainbow Six, Star Wars characters and cultural personalities. Identity clues omit subject pictures that would expose their answers. Existing themed art is illustrative, not a portrait or screenshot.

`content/criteria.json` defines 120 additional editorial criteria across existing categories. Content Studio offers them alongside existing populated metrics. Definitions without researched values are editorial templates; they do not create invented playable questions. Editions, patches, levels, competitions, seasons and cutoffs must be specified when researching those templates. The build keeps distinct `reference` values in separate comparison groups.

Rebuild: `python scripts/expand-content-9.py`, then `python scripts/build-content-pack.py content/catalogue.json`, `python scripts/build-expansion-9-daily.py`, and `python scripts/build-asset-manifest.py` in a complete checkout. The source expansion and SQL import are repeatable. Daily only supports More/Less, Estimate and Fact/Fake; Jeopardy remains in the frontend content pack. The SQL corrects catalogue categories and adds 208 candidates without changing frozen Daily rounds or existing matches.

Validation: expansion checks 4/5/6/8, reviewed content, trivia, Jeopardy boards, category selection and the new expansion check. Existing prepared image paths were checked against the repository tree; image existence checks used local placeholders where the unchanged binary assets were unavailable. SVG renderer checks used the actual repository SVG files. Full PWA/npm regression remains for CI in a complete checkout. The offline manifest retains the current Main asset inventory and includes the new content and copied football banner.

Suggested future categories (not enabled by this release): Films & Series (runtime, seasons, episodes, awards); Music (release years, album duration, awards); Technology (release year, memory, battery capacity under comparable conditions).
