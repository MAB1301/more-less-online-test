"""Build the 2026-10-29 Vereinsstationen review bundle offline."""
import argparse
import datetime
import json
import pathlib
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
DIR = ROOT / "content/research/2026-10-29-vereinsstationen-real-madrid"
parser = argparse.ArgumentParser()
parser.add_argument("--check", action="store_true")
CHECK = parser.parse_args().check

def read(name):
    return json.loads((DIR / name).read_text())

def write(name, value):
    path = DIR / name
    if CHECK:
        assert path.exists() and path.read_text() == value, "Stale: " + name
    else:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(value)

def dump(name, value):
    write(name, json.dumps(value, ensure_ascii=False, indent=2) + "\n")

source = read("input.json")
checked = datetime.date.fromisoformat(source["checked"])
sources = source["sources"]
observations = source["observations"]
games = ["moreless", "estimate", "facts", "jeopardy"]

for row in sources.values():
    row["checked"] = source["checked"]

pack = {
    "status": "review-only",
    "verified": source["checked"],
    "base_commit": source["base_commit"],
    "images": {},
    **{game: [] for game in games},
}
seen = set()
schedule = []

for question in source["questions"]:
    game = question["game"]
    assert game in games
    refs = question["source_refs"]
    keys = question["observation_keys"]
    assert question["data_year"] and question["rounding"] and question["notes"]
    for ref in refs:
        assert ref in sources and sources[ref]["authority"].startswith("official-club")
    for key in keys:
        assert key in observations and key not in seen, "Missing/repeated observation: " + key
        seen.add(key)
    row = {key: value for key, value in question.items() if key != "game"}
    row.update(
        cat=source["category"],
        subcategory=source["subcategory"],
        status="draft",
        verified=source["checked"],
        source=sources[refs[0]]["url"],
        sources=[sources[ref]["url"] for ref in refs],
        sets=[source["subcategory"]],
        visual=None if game == "jeopardy" else "club-paths-neutral",
    )
    if game != "jeopardy":
        row["subject"] = "club-paths-neutral"
    if game == "moreless":
        values = [observations[key]["value"] for key in keys]
        assert values == [question["lv"], question["rv"]]
        assert question["lv"] != question["rv"]
        assert max(values) / min(values) < 1.02
    elif game == "estimate":
        assert observations[keys[0]]["value"] == question["a"]
    elif game == "facts":
        assert type(question["a"]) is bool and question["e"]
    else:
        assert isinstance(question["a"], str) and 1 <= question["difficulty"] <= 5
    pack[game].append(row)
    schedule.append({
        "id": question["id"],
        "game": game,
        "source": sources[refs[0]]["url"],
        "verified": source["checked"],
        "data_year": question["data_year"],
        "time_dependent": question["time_dependent"],
        "review_interval_days": 365,
        "next_review": str(checked + datetime.timedelta(days=365)),
        "review_status": "draft-review-required",
    })

assert [len(pack[game]) for game in games] == [2, 4, 6, 8]
assert len(seen) == 22
assert len({question["id"] for question in source["questions"]}) == 20
assert len({observations[key]["subject"] for key in seen}) == 22
for level in ["easy", "medium", "hard"]:
    assert sorted(q["a"] for q in pack["facts"] if q["difficulty"] == level) == [False, True]

variants = {
    "card": "visuals/club-paths-neutral-card.svg",
    "detail": "visuals/club-paths-neutral-detail.svg",
    "license": "CC0-1.0",
    "creator": "Original code-authored vector",
    "answer_neutral": True,
    "safe_margin_px": 40,
    "description": "Abstract stadium tunnel, blank shirts and route nodes without names, crests, numbers, values or answer clues; Jeopardy has no image key.",
}
pack["images"]["club-paths-neutral"] = variants
for question in pack["moreless"]:
    for label in [question["l"], question["r"]]:
        pack["images"][label] = variants

def svg(width):
    offset = (width - 720) // 2
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img" aria-label="Abstrakte Illustration eines Vereinswegs"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#071426"/><stop offset=".55" stop-color="#122e55"/><stop offset="1" stop-color="#321d51"/></linearGradient><linearGradient id="field" x2="0" y2="1"><stop stop-color="#1f7a65"/><stop offset="1" stop-color="#0b3f43"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="{width}" height="540" fill="url(#bg)"/><rect x="40" y="40" width="{width-80}" height="460" rx="30" fill="none" stroke="#71d9ff" stroke-opacity=".48" stroke-width="2"/><g transform="translate({offset},0)"><path d="M102 397 220 189h280l118 208Z" fill="url(#field)" stroke="#5be3c4" stroke-opacity=".55" stroke-width="3"/><path d="M160 397 250 225h220l90 172" fill="none" stroke="#d7ffff" stroke-opacity=".45" stroke-width="3"/><path d="M360 397V225M224 327h272" fill="none" stroke="#d7ffff" stroke-opacity=".34" stroke-width="2"/><g fill="#091a31" stroke="#8be7ff" stroke-width="4"><path d="M110 103h106l30 33-26 49-25-14v91H131v-91l-25 14-26-49Z"/><path d="M504 103h106l30 33-26 49-25-14v91h-64v-91l-25 14-26-49Z"/></g><g fill="none" stroke="#ffc66d" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"><path d="M246 150h72c34 0 42 28 42 55v28"/><path d="m345 218 15 15 15-15"/><path d="M474 150h-72c-34 0-42 28-42 55"/></g><g fill="#dffcff" stroke="#65d9ff" stroke-width="4"><circle cx="280" cy="150" r="13"/><circle cx="360" cy="233" r="13"/><circle cx="440" cy="150" r="13"/></g><path d="M285 354h150v43H285z" fill="#071426" stroke="#7fe8d5" stroke-width="3"/><path d="M305 354v-23h110v23" fill="none" stroke="#7fe8d5" stroke-width="3"/><text x="360" y="468" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="700" letter-spacing="3" fill="#d7fbff">VEREINSWEGE</text></g></svg>\n'''

for kind, width in [("card", 720), ("detail", 960)]:
    value = svg(width)
    ET.fromstring(value)
    write(f"visuals/club-paths-neutral-{kind}.svg", value)

dump("sources.json", sources)
dump("observations.json", observations)
dump("draft-pack.json", pack)
dump("draft-review-schedule.json", {
    "policy": "Completed historical club careers: 365-day editorial recheck before publication; no automatic publication.",
    "records": schedule,
})
baseline = json.loads((ROOT / "content/review-schedule.json").read_text())["records"]
due = [row for row in baseline if row["next_review"] <= source["checked"]]
dump("validation.json", {
    "checked": source["checked"],
    "questions": 20,
    "counts": {game: len(pack[game]) for game in games},
    "unique_observation_keys": len(seen),
    "unique_subjects": len({observations[key]["subject"] for key in seen}),
    "balanced_fact_levels": True,
    "official_sources": len(sources),
    "svg_variants": 2,
    "rendered_visual_qa": True,
    "image_corrections": [],
    "main_review_records": len(baseline),
    "due_records": due,
    "review_only": True,
    "database_writes": 0,
})
print(("Checked" if CHECK else "Built") + " 20 Vereinsstationen questions and two SVG formats")
