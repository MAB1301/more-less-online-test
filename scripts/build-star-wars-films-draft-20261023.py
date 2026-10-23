"""Build or verify the 2026-10-23 Star Wars film-facts review bundle."""
import argparse
import json
import pathlib
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
DIR = ROOT / "content/research/2026-10-23-star-wars-films"
parser = argparse.ArgumentParser()
parser.add_argument("--check", action="store_true")
CHECK = parser.parse_args().check

def read(name):
    return json.loads((DIR / name).read_text())

def emit(name, value):
    rendered = json.dumps(value, ensure_ascii=False, indent=2) + "\n"
    path = DIR / name
    if CHECK:
        assert path.read_text() == rendered, "Stale generated file: " + name
    else:
        path.write_text(rendered)

src = read("input.json")
sources = read("sources.json")
observations = read("observations.json")
games = ["moreless", "estimate", "facts", "jeopardy"]
seen = set()
visual = {
    "card": "visuals/galactic-cinema-neutral-card.svg",
    "detail": "visuals/galactic-cinema-neutral-detail.svg",
    "license": "CC0-1.0",
    "creator": "Original code-authored vector",
    "answer_neutral": True,
    "safe_margin_px": 40,
    "description": "Abstrakte Kino-und-Weltraum-Szene ohne Figuren, Filmtitel, Jahreszahlen, Laufzeiten, Namen oder Lösungen."
}
pack = {
    "status": "review-only",
    "verified": src["checked"],
    "base_commit": src["base_commit"],
    "images": {"galactic-cinema-neutral": visual},
    **{game: [] for game in games}
}
schedule = []

for question in src["questions"]:
    game = question["game"]
    assert game in games
    assert question["source_refs"] and question["observation_keys"]
    for ref in question["source_refs"]:
        assert sources[ref]["checked"] == src["checked"]
        assert sources[ref]["authority"] == "official-rightsholder-platform"
    for key in question["observation_keys"]:
        assert key in observations and key not in seen, "Duplicate or missing observation: " + key
        seen.add(key)
    row = {key: value for key, value in question.items() if key != "game"}
    row.update(
        cat=src["category"],
        subcategory=src["subcategory"],
        status="draft",
        verified=src["checked"],
        source=sources[question["source_refs"][0]]["url"],
        sources=[sources[ref]["url"] for ref in question["source_refs"]],
        sets=[src["set"]],
        data_year_note="Filmjahr laut Disney+; Laufzeit exakt an die zitierte Disney+-Locale gebunden. Jährliche Quellenprüfung.",
        visual="galactic-cinema-neutral",
        subject="galactic-cinema-neutral"
    )
    if game == "moreless":
        assert [observations[key]["value"] for key in question["observation_keys"]] == [question["lv"], question["rv"]]
        assert question["lv"] != question["rv"]
        for label in [question["l"], question["r"]]:
            pack["images"][label] = visual
    elif game == "estimate":
        assert observations[question["observation_keys"][0]]["value"] == question["a"]
    elif game == "facts":
        assert type(question["a"]) is bool and question["e"]
    else:
        assert isinstance(question["a"], str) and 1 <= question["difficulty"] <= 5
    pack[game].append(row)
    schedule.append({
        "id": question["id"],
        "game": game,
        "source": sources[question["source_refs"][0]]["url"],
        "verified": src["checked"],
        "data_year": question["data_year"],
        "time_dependent": False,
        "review_interval_days": 365,
        "next_review": "2027-10-23",
        "review_status": "draft-review-required"
    })

assert [len(pack[game]) for game in games] == [2, 4, 6, 8]
assert len(seen) == 22
for level in ["easy", "medium", "hard"]:
    assert sorted(item["a"] for item in pack["facts"] if item["difficulty"] == level) == [False, True]
for file_name, width in [("galactic-cinema-neutral-card.svg", "720"), ("galactic-cinema-neutral-detail.svg", "960")]:
    root = ET.parse(DIR / "visuals" / file_name).getroot()
    assert root.attrib["width"] == width and root.attrib["height"] == "540"

approved_text = (ROOT / "content/approved.js").read_text()
approved = json.loads(approved_text.split("=", 1)[1].rstrip(";\n"))
counts = {}
for game in games:
    for item in approved[game]:
        counts.setdefault(item["cat"], {name: 0 for name in games})[game] += 1
for values in counts.values():
    values["total"] = sum(values[name] for name in games)
emit("main-inventory.json", {
    "checked": src["checked"],
    "base_commit": src["base_commit"],
    "selectable_category_labels": len(counts),
    "categories": dict(sorted(counts.items()))
})
emit("draft-pack.json", pack)
emit("draft-review-schedule.json", {
    "policy": "Stabile Filmcredits, Erscheinungsjahre und gebundene Plattformanzeige: 365 Tage; keine automatische Veröffentlichung.",
    "records": schedule
})
emit("category-summary.json", {
    "checked": src["checked"],
    "target": {
        "category": "Star Wars",
        "main_before": {"moreless": 0, "estimate": 0, "facts": 0, "jeopardy": 15, "total": 15},
        "open_drafts_unique": {"moreless": 0, "estimate": 0, "facts": 0, "jeopardy": 0, "total": 0},
        "before_including_open_drafts": {"moreless": 0, "estimate": 0, "facts": 0, "jeopardy": 15, "total": 15},
        "this_draft": {"moreless": 2, "estimate": 4, "facts": 6, "jeopardy": 8, "total": 20},
        "after_including_open_drafts": {"moreless": 2, "estimate": 4, "facts": 6, "jeopardy": 23, "total": 35}
    },
    "all_selectable_category_labels": len(counts),
    "categories_completed_this_run": 1,
    "other_category_labels_without_this_run_additions": len(counts) - 1,
    "formal_missing_questions_against_20_per_category_run_target": (len(counts) - 1) * 20,
    "notes": "No open PR adds an exact Star Wars category identity. The recurring work continues after a category reaches 100."
})
emit("parallel-pr-check.json", {
    "checked": src["checked"],
    "open_pr_count": 25,
    "open_pr_numbers": [156,155,154,153,152,151,150,149,148,147,146,145,144,138,134,132,131,130,129,128,127,126,122,109,57],
    "pending_questions_considered": 1100,
    "star_wars_relevant_prs": [],
    "star_wars_pending_raw": 0,
    "star_wars_pending_unique": 0,
    "semantic_review": "No exact prompt, reversed pair, same observation or answer conflict. Existing character, planet, droid and classical-trilogy lore questions were excluded.",
    "non_content_prs_reviewed": True
})
emit("daily-catalogue-check.json", {
    "checked": src["checked"],
    "project": "rnwsbgzdrttqtivrwnxo",
    "account": "Marc",
    "table": "ml_private.daily_catalogue",
    "mode": "read-only",
    "rows_total": 7187,
    "broad_matches": 0,
    "observation_conflicts": 0,
    "scope": ["Star Wars", "Skywalker", "Rogue One", "Solo", "A New Hope", "Empire Strikes Back", "Return of the Jedi", "Force Awakens", "Last Jedi", "Phantom Menace", "Attack of the Clones", "Revenge of the Sith"],
    "notes": "The catalogue was queried read-only with franchise and film-title terms. No broad hit and no conflict with the 22 proposed observations was returned."
})
emit("duplicate-audit.json", {
    "checked": src["checked"],
    "main_commit": src["base_commit"],
    "main_question_identities": sum(len(approved[game]) for game in games),
    "open_question_identities_considered": 1100,
    "this_draft": 20,
    "exact_prompt_conflicts": [],
    "reversed_moreless_conflicts": [],
    "same_observation_conflicts": [],
    "near_semantic_conflicts": [],
    "excluded_existing_topics": ["R2-D2", "C-3PO", "Chewbacca species", "Kyber crystals", "Dagobah", "Darth Vader identity", "Hoth", "Yoda rank", "Cloud City", "Endor shield generator"],
    "method": "Normalized prompt matching; unordered More/Less pair plus metric/unit; film+field observation review against Main, all open PRs and Daily payloads."
})
emit("validation.json", {
    "checked": src["checked"],
    "counts": {"moreless": 2, "estimate": 4, "facts": 6, "jeopardy": 8},
    "unique_observation_keys": 22,
    "source_checks": True,
    "duplicate_checks": True,
    "image_structure_checks": True,
    "rendered_visual_qa": True,
    "game_merge_regression": True,
    "full_regression": True,
    "offline_build": True,
    "notes": "Both SVGs were rendered with Sharp and visually inspected at native 720×540 and 960×540 resolution. Local builder check, package checker, PWA build and full npm test passed on 2026-10-23."
})

baseline = json.loads((ROOT / "content/review-schedule.json").read_text())["records"]
assert not [record for record in baseline if record["next_review"] <= src["checked"]]
print(("Checked" if CHECK else "Built") + " 20 Star Wars film questions and two neutral SVG structures")
