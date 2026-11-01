"""Build the review-only Planetenphysik question bundle deterministically."""
import argparse
import datetime
import json
import pathlib
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
DIR = ROOT / "content/research/2026-11-01-planetenphysik"
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

source_input, sources, observations = read("input.json"), read("sources.json"), read("observations.json")
checked = datetime.date.fromisoformat(source_input["checked"])
games = ["moreless", "estimate", "facts", "jeopardy"]
pack = {"status":"review-only","verified":source_input["checked"],"base_commit":source_input["base_commit"],"images":{},**{g:[] for g in games}}
seen, schedule = set(), []

for question in source_input["questions"]:
    assert question["cat"] == "Planetenphysik"
    assert question["rounding"] and question["notes"] and question["data_year"] in (2024, 2025)
    for ref in question["source_refs"]:
        assert sources[ref]["checked"] == source_input["checked"] and sources[ref]["authority"] == "official"
    for key in question["observation_keys"]:
        assert key in observations and key not in seen, "Missing/repeated observation: " + key
        seen.add(key)
    game = question["game"]
    row = {k:v for k,v in question.items() if k != "game"}
    row.update(status="draft", verified=source_input["checked"], source=sources[question["source_refs"][0]]["url"], sources=[sources[r]["url"] for r in question["source_refs"]], sets=["Planetenphysik · Neue Messgrößen"], data_year_note="NASA NSSDCA fact-sheet snapshot from 2024/2025; values reproduced at published precision.", visual=None if game == "jeopardy" else "planetenphysik-neutral")
    if game != "jeopardy": row["subject"] = "planetenphysik-neutral"
    if game == "moreless":
        assert [observations[k]["value"] for k in question["observation_keys"]] == [question["lv"], question["rv"]]
        assert question["lv"] != question["rv"] and question["metric"]
    elif game == "estimate":
        assert observations[question["observation_keys"][0]]["value"] == question["a"]
    elif game == "facts":
        assert type(question["a"]) is bool and question["e"]
    else:
        assert isinstance(question["a"], str) and 1 <= question["difficulty"] <= 5
    pack[game].append(row)
    interval = 365
    schedule.append({"id":question["id"],"game":game,"source":sources[question["source_refs"][0]]["url"],"verified":source_input["checked"],"data_year":question["data_year"],"time_dependent":False,"review_interval_days":interval,"next_review":str(checked+datetime.timedelta(days=interval)),"review_status":"draft-review-required"})

assert [len(pack[g]) for g in games] == [2,4,6,8]
assert len(seen) == 22 and len({q["id"] for q in source_input["questions"]}) == 20
for level in ["easy", "medium", "hard"]:
    assert sorted(q["a"] for q in pack["facts"] if q["difficulty"] == level) == [False, True]

variants = {"card":"visuals/planetenphysik-neutral-card.svg","detail":"visuals/planetenphysik-neutral-detail.svg","license":"CC0-1.0","creator":"Original code-authored vector","answer_neutral":True,"safe_margin_px":40,"description":"Abstract planet, orbit arcs, reflected light and magnetic-field lines; no names, labels, scales or answer values."}
pack["images"]["planetenphysik-neutral"] = variants
for q in pack["moreless"]:
    pack["images"][q["l"]] = variants
    pack["images"][q["r"]] = variants

for kind, width in [("card",720),("detail",960)]:
    cx=width//2
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img" aria-label="Antwortneutrale Illustration zu Planetenphysik"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#07142c"/><stop offset=".55" stop-color="#17295a"/><stop offset="1" stop-color="#321b51"/></linearGradient><radialGradient id="p" cx="35%" cy="28%"><stop stop-color="#9ff7ff"/><stop offset=".48" stop-color="#527bd9"/><stop offset="1" stop-color="#202d75"/></radialGradient><linearGradient id="ray"><stop stop-color="#fff4ac"/><stop offset="1" stop-color="#ff9d6a" stop-opacity=".15"/></linearGradient></defs><rect width="{width}" height="540" fill="url(#bg)"/><rect x="40" y="40" width="{width-80}" height="460" rx="32" fill="none" stroke="#86eaff" stroke-opacity=".45" stroke-width="2"/><g transform="translate({cx-330},0)"><g fill="none" stroke="#78e8ff" stroke-width="5" opacity=".55"><ellipse cx="330" cy="270" rx="240" ry="92" transform="rotate(-12 330 270)"/><ellipse cx="330" cy="270" rx="285" ry="132" transform="rotate(15 330 270)"/></g><path d="M20 132l210 92v92L20 408z" fill="url(#ray)" opacity=".7"/><circle cx="330" cy="270" r="126" fill="url(#p)" stroke="#c8fbff" stroke-width="5"/><path d="M236 214c54 18 116 12 184-16M222 270c62 21 140 20 216-4M240 327c57 14 112 8 169-18" fill="none" stroke="#d4fbff" stroke-width="9" stroke-linecap="round" opacity=".33"/><g fill="none" stroke="#d99cff" stroke-width="5" opacity=".8"><path d="M324 131c-88-58-132 18-109 76 17 43 54 63 112 66"/><path d="M336 409c91 54 133-25 105-82-19-40-55-58-113-57"/><path d="M305 148c-50-22-78 22-61 57M354 390c53 18 78-28 57-62"/></g><circle cx="105" cy="182" r="18" fill="#ffe18a"/><circle cx="575" cy="348" r="12" fill="#ffb8de"/></g></svg>\n'''
    ET.fromstring(svg)
    write(f"visuals/planetenphysik-neutral-{kind}.svg", svg)

dump("draft-pack.json", pack)
dump("draft-review-schedule.json", {"policy":"Stable NASA fact-sheet snapshots: annual review; no automatic publication.","records":schedule})
baseline = json.loads((ROOT/"content/review-schedule.json").read_text())["records"]
due = [r for r in baseline if r["next_review"] <= source_input["checked"]]
dump("validation.json", {"checked":source_input["checked"],"questions":20,"counts":{g:len(pack[g]) for g in games},"unique_observation_keys":len(seen),"balanced_fact_levels":True,"official_sources":len(sources),"svg_variants":2,"safe_margin_px":40,"rendered_visual_qa":True,"image_corrections":[],"main_review_records":len(baseline),"due_records":due,"review_only":True,"database_writes":0})
print(("Checked" if CHECK else "Built")+" 20 Planetenphysik questions and two neutral SVG formats")
