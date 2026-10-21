"""Build or verify the 2026-10-21 Bauwerke architecture review bundle."""
import argparse
import json
import pathlib
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
DIR = ROOT / "content/research/2026-10-21-bauwerke-architektur"
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
    "card": "visuals/architecture-neutral-card.svg",
    "detail": "visuals/architecture-neutral-detail.svg",
    "license": "CC0-1.0",
    "creator": "Original code-authored vector",
    "answer_neutral": True,
    "safe_margin_px": 40,
    "description": "Abstrakte Architektursilhouette ohne reale Wahrzeichen, Namen, Etagenzahlen oder Lösungen."
}
pack = {
    "status": "review-only",
    "verified": src["checked"],
    "base_commit": src["base_commit"],
    "images": {"architecture-neutral": visual},
    **{game: [] for game in games}
}
schedule = []

for question in src["questions"]:
    game = question["game"]
    assert game in games
    assert question["source_refs"] and question["observation_keys"]
    for ref in question["source_refs"]:
        assert sources[ref]["checked"] == src["checked"]
        assert sources[ref]["authority"] in {"official-operator", "official-heritage-register", "government-primary"}
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
        data_year_note="Historische Bauwerksdaten: 365 Tage; aktuell benannte Besucherebenen: 90 Tage.",
        visual=None if game == "jeopardy" else "architecture-neutral"
    )
    if game != "jeopardy":
        row["subject"] = "architecture-neutral"
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
    changing = question["id"] == "buildings-20261021-observation-floor"
    schedule.append({
        "id": question["id"],
        "game": game,
        "source": sources[question["source_refs"][0]]["url"],
        "verified": src["checked"],
        "data_year": question["data_year"],
        "time_dependent": changing,
        "review_interval_days": 90 if changing else 365,
        "next_review": "2027-01-19" if changing else "2027-10-21",
        "review_status": "draft-review-required"
    })

assert [len(pack[game]) for game in games] == [2, 4, 6, 8]
assert len(seen) == 22
for level in ["easy", "medium", "hard"]:
    assert sorted(item["a"] for item in pack["facts"] if item["difficulty"] == level) == [False, True]
for file_name, width in [("architecture-neutral-card.svg", "720"), ("architecture-neutral-detail.svg", "960")]:
    root = ET.parse(DIR / "visuals" / file_name).getroot()
    assert root.attrib["width"] == width and root.attrib["height"] == "540"

emit("draft-pack.json", pack)
emit("draft-review-schedule.json", {
    "policy": "Historische Daten: 365 Tage; aktuell benannte Besucherebenen: 90 Tage; keine automatische Veröffentlichung.",
    "records": schedule
})
baseline = json.loads((ROOT / "content/review-schedule.json").read_text())["records"]
assert not [record for record in baseline if record["next_review"] <= src["checked"]]
print(("Checked" if CHECK else "Built") + " 20 Bauwerke questions and two neutral SVG structures")
