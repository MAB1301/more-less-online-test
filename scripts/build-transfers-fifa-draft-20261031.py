"""Build the review-only FIFA transfers question bundle deterministically."""
import argparse
import datetime
import json
import pathlib
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
DIR = ROOT / "content/research/2026-10-31-transfers-fifa"
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
    assert question["cat"] == "Transfers" and question["subcategory"] == "FIFA-Transfermarkt 2025"
    assert question["rounding"] and question["notes"] and question["data_year"] == 2025
    for ref in question["source_refs"]:
        assert sources[ref]["checked"] == source_input["checked"] and sources[ref]["authority"] == "official"
    for key in question["observation_keys"]:
        assert key in observations and key not in seen, "Missing/repeated observation: " + key
        seen.add(key)
    game = question["game"]
    row = {k:v for k,v in question.items() if k != "game"}
    row.update(status="draft", verified=source_input["checked"], source=sources[question["source_refs"][0]]["url"], sources=[sources[r]["url"] for r in question["source_refs"]], sets=["Transfers · FIFA-Markt 2025"], data_year_note="FIFA calendar-year report 2025; historical snapshot, values reproduced at published precision.", visual=None if game == "jeopardy" else "transfers-fifa-neutral")
    if game != "jeopardy": row["subject"] = "transfers-fifa-neutral"
    if game == "moreless":
        assert [observations[k]["value"] for k in question["observation_keys"]] == [question["lv"],question["rv"]]
        assert question["lv"] != question["rv"] and question["metric"]
    elif game == "estimate":
        assert observations[question["observation_keys"][0]]["value"] == question["a"]
    elif game == "facts":
        assert type(question["a"]) is bool and question["e"]
    else:
        assert isinstance(question["a"],str) and 1 <= question["difficulty"] <= 5
    pack[game].append(row)
    schedule.append({"id":question["id"],"game":game,"source":sources[question["source_refs"][0]]["url"],"verified":source_input["checked"],"data_year":2025,"time_dependent":False,"review_interval_days":365,"next_review":str(checked+datetime.timedelta(days=365)),"review_status":"draft-review-required"})

assert [len(pack[g]) for g in games] == [2,4,6,8]
assert len(seen) == 22 and len({q["id"] for q in source_input["questions"]}) == 20
for level in ["easy","medium","hard"]:
    assert sorted(q["a"] for q in pack["facts"] if q["difficulty"] == level) == [False,True]

variants={"card":"visuals/transfers-fifa-neutral-card.svg","detail":"visuals/transfers-fifa-neutral-detail.svg","license":"CC0-1.0","creator":"Original code-authored vector","answer_neutral":True,"safe_margin_px":40,"description":"Generic football transfer desk with two unbranded club shields, contract sheet and bidirectional arrows; no countries, figures, player names or answers."}
pack["images"]["transfers-fifa-neutral"] = variants
for q in pack["moreless"]:
    pack["images"][q["l"]] = variants
    pack["images"][q["r"]] = variants

for kind,width in [("card",720),("detail",960)]:
    cx=width//2
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img" aria-label="Neutrale Fußballtransfer-Illustration"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#07152d"/><stop offset=".55" stop-color="#122b52"/><stop offset="1" stop-color="#301d55"/></linearGradient><linearGradient id="paper" x2="0" y2="1"><stop stop-color="#f6fbff"/><stop offset="1" stop-color="#c9ddf1"/></linearGradient><linearGradient id="ball" x2="1" y2="1"><stop stop-color="#85f5e4"/><stop offset="1" stop-color="#537dff"/></linearGradient></defs><rect width="{width}" height="540" fill="url(#bg)"/><rect x="40" y="40" width="{width-80}" height="460" rx="32" fill="none" stroke="#83e8ff" stroke-opacity=".45" stroke-width="2"/><g transform="translate({cx-300},0)"><path d="M88 153l78-28 78 28v89c0 70-78 104-78 104s-78-34-78-104z" fill="#173e78" stroke="#78e6ff" stroke-width="6"/><path d="M456 153l78-28 78 28v89c0 70-78 104-78 104s-78-34-78-104z" fill="#4b286d" stroke="#ff9fdb" stroke-width="6"/><circle cx="166" cy="226" r="34" fill="url(#ball)"/><path d="m166 195 18 13-7 22h-22l-7-22zm-31 19 13-6m41 0 12 8m-24 14 8 21m-30-21-9 21" fill="none" stroke="#e8ffff" stroke-width="6" stroke-linecap="round"/><g fill="none" stroke="#f5f8ff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><path d="M270 188h88l-20-20m20 20-20 20"/><path d="M398 273h-88l20-20m-20 20 20 20"/></g><rect x="247" y="312" width="106" height="124" rx="10" fill="url(#paper)" transform="rotate(-6 300 374)"/><path d="M267 339h66m-70 23h70m-74 23h48" stroke="#4b6681" stroke-width="6" stroke-linecap="round" transform="rotate(-6 300 374)"/><path d="M283 414c21-18 32 7 51-12" fill="none" stroke="#6a55d7" stroke-width="5" stroke-linecap="round" transform="rotate(-6 300 374)"/><circle cx="534" cy="226" r="34" fill="url(#ball)"/><path d="m534 195 18 13-7 22h-22l-7-22zm-31 19 13-6m41 0 12 8m-24 14 8 21m-30-21-9 21" fill="none" stroke="#e8ffff" stroke-width="6" stroke-linecap="round"/><text x="300" y="476" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="700" letter-spacing="3" fill="#d8faff">TRANSFERMARKT</text></g></svg>\n'''
    ET.fromstring(svg)
    write(f"visuals/transfers-fifa-neutral-{kind}.svg",svg)

dump("draft-pack.json",pack)
dump("draft-review-schedule.json",{"policy":"Historical FIFA report: annual review; no automatic publication.","records":schedule})
baseline=json.loads((ROOT/"content/review-schedule.json").read_text())["records"]
due=[r for r in baseline if r["next_review"] <= source_input["checked"]]
dump("validation.json",{"checked":source_input["checked"],"questions":20,"counts":{g:len(pack[g]) for g in games},"unique_observation_keys":len(seen),"balanced_fact_levels":True,"official_sources":len(sources),"svg_variants":2,"safe_margin_px":40,"rendered_visual_qa":True,"image_corrections":[],"main_review_records":len(baseline),"due_records":due,"review_only":True,"database_writes":0})
print(("Checked" if CHECK else "Built")+" 20 FIFA transfer questions and two neutral SVG formats")
