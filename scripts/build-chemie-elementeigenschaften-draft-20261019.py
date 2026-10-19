"""Build the 2026-10-19 chemistry element-properties review bundle offline."""
import argparse
import datetime
import json
import pathlib
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
DIR = ROOT / "content/research/2026-10-19-chemie-elementeigenschaften"
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

source_input = read("input.json")
sources = read("sources.json")
observations = read("observations.json")
checked = datetime.date.fromisoformat(source_input["checked"])
games = ["moreless", "estimate", "facts", "jeopardy"]
main_ref = ROOT / ".git/refs/heads/Main"
if main_ref.exists():
    assert source_input["base_commit"] == main_ref.read_text().strip()

pack = {
    "status": "review-only",
    "verified": source_input["checked"],
    "base_commit": source_input["base_commit"],
    "images": {},
    **{game: [] for game in games},
}
seen = set()
schedule = []

for question in source_input["questions"]:
    assert question["cat"] == "Chemie"
    assert question["subcategory"] == "Elementeigenschaften · Dichte, Phasen & Herkunft"
    assert question["rounding"] and question["section"] and question["data_year"]
    for ref in question["source_refs"]:
        assert ref in sources and sources[ref]["checked"] == source_input["checked"]
        assert sources[ref]["authority"] in {"official", "authoritative-scientific-society"}
    for key in question["observation_keys"]:
        assert key in observations and key not in seen, "Missing/repeated " + key
        seen.add(key)
    row = {key: value for key, value in question.items() if key != "game"}
    row.update(
        status="draft",
        verified=source_input["checked"],
        source=sources[question["source_refs"][0]]["url"],
        sources=[sources[ref]["url"] for ref in question["source_refs"]],
        sets=["Chemie · Elementeigenschaften"],
        data_year_note="Stable element-property data; verify again before publication if the source dataset changes.",
        visual=None if question["game"] == "jeopardy" else "chemistry-properties-neutral",
    )
    if question["game"] != "jeopardy":
        row["subject"] = "chemistry-properties-neutral"
    if question["game"] == "moreless":
        assert [observations[key]["value"] for key in question["observation_keys"]] == [question["lv"], question["rv"]]
        assert question["lv"] != question["rv"] and question["metric"]
    elif question["game"] == "estimate":
        assert observations[question["observation_keys"][0]]["value"] == question["a"]
    elif question["game"] == "facts":
        assert type(question["a"]) is bool and question["e"]
    else:
        assert isinstance(question["a"], str) and 1 <= question["difficulty"] <= 5
    pack[question["game"]].append(row)
    interval = 365
    schedule.append({
        "id": question["id"],
        "game": question["game"],
        "source": sources[question["source_refs"][0]]["url"],
        "verified": source_input["checked"],
        "data_year": question["data_year"],
        "time_dependent": question["time_dependent"],
        "review_interval_days": interval,
        "next_review": str(checked + datetime.timedelta(days=interval)),
        "review_status": "draft-review-required",
    })

assert [len(pack[game]) for game in games] == [2, 4, 6, 8]
assert len(seen) == 22 and len({q["id"] for q in source_input["questions"]}) == 20
for level in ["easy", "medium", "hard"]:
    assert sorted(q["a"] for q in pack["facts"] if q["difficulty"] == level) == [False, True]

variants = {
    "card": "visuals/chemistry-properties-neutral-card.svg",
    "detail": "visuals/chemistry-properties-neutral-detail.svg",
    "license": "CC0-1.0",
    "creator": "Original code-authored vector",
    "answer_neutral": True,
    "safe_margin_px": 40,
    "description": "Abstract atom, laboratory glassware and crystal without element names, values or solution clues; Jeopardy has no image key.",
}
pack["images"]["chemistry-properties-neutral"] = variants
for question in pack["moreless"]:
    for label in [question["l"], question["r"]]:
        pack["images"][label] = variants

for kind, width in [("card", 720), ("detail", 960)]:
    offset = (width - 720) // 2
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img" aria-label="Abstrakte Chemieillustration"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#07152c"/><stop offset=".55" stop-color="#162e55"/><stop offset="1" stop-color="#44235d"/></linearGradient><radialGradient id="nucleus"><stop stop-color="#fff3a0"/><stop offset="1" stop-color="#f16aa0"/></radialGradient><linearGradient id="liquid"><stop stop-color="#53e1d0"/><stop offset="1" stop-color="#5578ff"/></linearGradient></defs><rect width="{width}" height="540" fill="url(#bg)"/><rect x="40" y="40" width="{width-80}" height="460" rx="30" fill="none" stroke="#77e7ff" stroke-opacity=".48" stroke-width="2"/><g transform="translate({offset},0)"><g transform="translate(242 92)" fill="none" stroke="#86dfff" stroke-width="4"><ellipse cx="118" cy="104" rx="116" ry="40"/><ellipse cx="118" cy="104" rx="116" ry="40" transform="rotate(60 118 104)"/><ellipse cx="118" cy="104" rx="116" ry="40" transform="rotate(-60 118 104)"/><circle cx="118" cy="104" r="30" fill="url(#nucleus)" stroke="#ffeaa0"/><g fill="#b9f8ff" stroke="none"><circle cx="4" cy="104" r="9"/><circle cx="178" cy="23" r="9"/><circle cx="179" cy="185" r="9"/></g></g><g transform="translate(116 247)"><path d="M36 0h70v24l-13 22v95c0 25-16 40-42 40S9 166 9 141V46L-4 24V0h40" fill="#cfeeff" fill-opacity=".15" stroke="#b8efff" stroke-width="6" stroke-linejoin="round"/><path d="M14 103h74v38c0 18-12 29-37 29s-37-11-37-29Z" fill="url(#liquid)" opacity=".88"/></g><g transform="translate(287 278)"><path d="M35 0h74v21l-14 19v79c0 35-23 55-60 55S-25 154-25 119V40L-39 21V0h74" fill="#cfeeff" fill-opacity=".12" stroke="#b8efff" stroke-width="6" stroke-linejoin="round"/><path d="M-18 97H88v24c0 28-18 43-53 43s-53-15-53-43Z" fill="#8a66ff" opacity=".82"/><circle cx="9" cy="79" r="8" fill="#ffd56b"/><circle cx="51" cy="61" r="6" fill="#79f4dd"/><circle cx="73" cy="86" r="9" fill="#ff83bd"/></g><g transform="translate(515 281)"><path d="M55 0l52 42-20 90-78 25-48-66L-4 20Z" fill="#8f67ff" fill-opacity=".45" stroke="#ffb0e2" stroke-width="5"/><path d="M-4 20l59 57 52-35M55 77L9 157m46-80 32 55" fill="none" stroke="#8be9ff" stroke-width="4"/></g><text x="360" y="482" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="700" letter-spacing="3" fill="#d7fbff">STOFFE &amp; STRUKTUREN</text></g></svg>\n'''
    ET.fromstring(svg)
    write(f"visuals/chemistry-properties-neutral-{kind}.svg", svg)

dump("draft-pack.json", pack)
dump("draft-review-schedule.json", {
    "policy": "Stable element data: 365 days. No automatic publication.",
    "records": schedule,
})
baseline = json.loads((ROOT / "content/review-schedule.json").read_text())["records"]
due = [row for row in baseline if row["next_review"] <= source_input["checked"]]
dump("validation.json", {
    "checked": source_input["checked"],
    "questions": 20,
    "counts": {game: len(pack[game]) for game in games},
    "numeric_observations_checked": 8,
    "unique_observation_keys": len(seen),
    "balanced_fact_levels": True,
    "authoritative_sources": len(sources),
    "svg_variants": 2,
    "rendered_visual_qa": True,
    "image_corrections": ["After the first 720×540 render, the lower glassware and crystal were moved 25 px upward so they no longer overlap the caption; both final formats were rendered again."],
    "main_review_records": len(baseline),
    "due_records": due,
    "review_only": True,
    "database_writes": 0,
})
print(("Checked" if CHECK else "Built") + " 20 chemistry questions and two SVG formats")
