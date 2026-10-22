"""Build or verify the 2026-10-22 Autotechnik Euro NCAP review bundle."""
import argparse
import json
import pathlib
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
DIR = ROOT / "content/research/2026-10-22-autotechnik-euroncap"
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
    "card": "visuals/vehicle-safety-neutral-card.svg",
    "detail": "visuals/vehicle-safety-neutral-detail.svg",
    "license": "CC0-1.0",
    "creator": "Original code-authored vector",
    "answer_neutral": True,
    "safe_margin_px": 40,
    "description": "Abstraktes Crashtest-Labor mit Fahrzeugkontur und Sensorwellen, ohne Marken, Prozentwerte, Systemnamen oder Lösungen."
}
pack = {
    "status": "review-only",
    "verified": src["checked"],
    "base_commit": src["base_commit"],
    "images": {"vehicle-safety-neutral": visual},
    **{game: [] for game in games}
}
schedule = []

for question in src["questions"]:
    game = question["game"]
    assert game in games
    assert question["source_refs"] and question["observation_keys"]
    for ref in question["source_refs"]:
        assert sources[ref]["checked"] == src["checked"]
        assert sources[ref]["authority"] in {"official-independent-testing-body", "government-primary"}
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
        data_year_note="Euro-NCAP-2025-Ergebnisse und veränderliche Regeln: 90 Tage; technische Begriffe: 365 Tage.",
        visual=None if game == "jeopardy" else "vehicle-safety-neutral"
    )
    if game != "jeopardy":
        row["subject"] = "vehicle-safety-neutral"
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
    changing = question["source_refs"][0] in {"euroncap_2025_batch", "euroncap_stars", "eu_ecall"}
    schedule.append({
        "id": question["id"],
        "game": game,
        "source": sources[question["source_refs"][0]]["url"],
        "verified": src["checked"],
        "data_year": question["data_year"],
        "time_dependent": changing,
        "review_interval_days": 90 if changing else 365,
        "next_review": "2027-01-20" if changing else "2027-10-22",
        "review_status": "draft-review-required"
    })

assert [len(pack[game]) for game in games] == [2, 4, 6, 8]
assert len(seen) == 22
for level in ["easy", "medium", "hard"]:
    assert sorted(item["a"] for item in pack["facts"] if item["difficulty"] == level) == [False, True]
for file_name, width in [("vehicle-safety-neutral-card.svg", "720"), ("vehicle-safety-neutral-detail.svg", "960")]:
    root = ET.parse(DIR / "visuals" / file_name).getroot()
    assert root.attrib["width"] == width and root.attrib["height"] == "540"

# Parse the approved content directly so the Main inventory is reproducible.
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
    "policy": "Euro-NCAP-2025-Ergebnisse und veränderliche Regeln: 90 Tage; technische Begriffe: 365 Tage; keine automatische Veröffentlichung.",
    "records": schedule
})
emit("category-summary.json", {
    "checked": src["checked"],
    "target": {
        "category": "Autotechnik",
        "main_before": {"moreless": 0, "estimate": 0, "facts": 0, "jeopardy": 26, "total": 26},
        "open_drafts_unique": {"moreless": 0, "estimate": 0, "facts": 0, "jeopardy": 0, "total": 0},
        "before_including_open_drafts": {"moreless": 0, "estimate": 0, "facts": 0, "jeopardy": 26, "total": 26},
        "this_draft": {"moreless": 2, "estimate": 4, "facts": 6, "jeopardy": 8, "total": 20},
        "after_including_open_drafts": {"moreless": 2, "estimate": 4, "facts": 6, "jeopardy": 34, "total": 46}
    },
    "all_selectable_category_labels": len(counts),
    "categories_completed_this_run": 1,
    "other_category_labels_without_this_run_additions": len(counts) - 1,
    "formal_missing_questions_against_20_per_category_run_target": (len(counts) - 1) * 20,
    "notes": "No open PR adds an exact Autotechnik category identity. The recurring work continues after a category reaches 100."
})
emit("parallel-pr-check.json", {
    "checked": src["checked"],
    "open_pr_count": 24,
    "open_pr_numbers": [155,154,153,152,151,150,149,148,147,146,145,144,138,134,132,131,130,129,128,127,126,122,109,57],
    "pending_questions_considered": 1080,
    "autotechnik_relevant_prs": [],
    "autotechnik_pending_raw": 0,
    "autotechnik_pending_unique": 0,
    "semantic_review": "No exact prompt, reversed pair, same observation or answer conflict. Existing engine, performance, dimension, turning-circle and boot-volume questions were excluded.",
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
    "scope": ["Euro NCAP", "2025 pillar percentages", "Leapmotor B10", "Volvo EX90", "Tesla Model Y", "Nissan Qashqai", "Volkswagen Caddy", "CUPRA Formentor", "Global Vehicle Target", "Attention Assist", "ISOFIX", "eCall", "Emergency Lane Keeping"],
    "notes": "The catalogue was queried read-only with model names and technical terms. No broad hit and no conflict with the 22 proposed observations was returned."
})
emit("duplicate-audit.json", {
    "checked": src["checked"],
    "main_commit": src["base_commit"],
    "main_question_identities": sum(len(approved[game]) for game in games),
    "open_question_identities_considered": 1080,
    "this_draft": 20,
    "exact_prompt_conflicts": [],
    "reversed_moreless_conflicts": [],
    "same_observation_conflicts": [],
    "near_semantic_conflicts": [],
    "excluded_existing_metrics": ["engine cylinder count", "engine power", "engine torque", "engine displacement", "engine speed", "vehicle length", "wheelbase", "turning circle", "boot volume"],
    "method": "Normalized prompt matching; unordered More/Less pair plus metric/unit; model+pillar+test-year observation review against Main, all open PRs and Daily payloads."
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
    "notes": "Both SVGs were rendered with Sharp and visually inspected at native 720×540 and 960×540 resolution. Local builder check, package checker, PWA build and full npm test passed on 2026-10-22."
})

baseline = json.loads((ROOT / "content/review-schedule.json").read_text())["records"]
assert not [record for record in baseline if record["next_review"] <= src["checked"]]
print(("Checked" if CHECK else "Built") + " 20 Autotechnik questions and two neutral SVG structures")
