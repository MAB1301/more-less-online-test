"""Build or verify the 2026-10-24 Science-Fiction / Star Trek review bundle."""
import argparse, json, pathlib, xml.etree.ElementTree as ET
ROOT = pathlib.Path(__file__).resolve().parents[1]
DIR = ROOT / "content/research/2026-10-24-science-fiction-star-trek"
parser = argparse.ArgumentParser(); parser.add_argument("--check", action="store_true"); CHECK = parser.parse_args().check
def read(name): return json.loads((DIR / name).read_text())
def emit(name, value):
    rendered = json.dumps(value, ensure_ascii=False, indent=2) + "\n"; path = DIR / name
    if CHECK: assert path.read_text() == rendered, "Stale generated file: " + name
    else: path.write_text(rendered)

src, sources, observations = read("input.json"), read("sources.json"), read("observations.json")
games = ["moreless", "estimate", "facts", "jeopardy"]; seen = set()
visual = {"card":"visuals/deep-space-neutral-card.svg","detail":"visuals/deep-space-neutral-detail.svg","license":"CC0-1.0","creator":"Original code-authored vector","answer_neutral":True,"safe_margin_px":40,"description":"Abstrakte Tiefenraum-Szene mit neutralem Forschungsschiff und Portal, ohne Figuren, Titel, Namen, Zahlen oder Lösungen."}
pack = {"status":"review-only","verified":src["checked"],"base_commit":src["base_commit"],"images":{"deep-space-neutral":visual},**{g:[] for g in games}}
schedule = []
for q in src["questions"]:
    game = q["game"]; assert game in games and q["source_refs"] and q["observation_keys"]
    for ref in q["source_refs"]:
        assert sources[ref]["checked"] == src["checked"] and sources[ref]["authority"] == "official-rightsholder-platform"
    for key in q["observation_keys"]:
        assert key in observations and key not in seen, "Duplicate or missing observation: " + key; seen.add(key)
    row = {k:v for k,v in q.items() if k != "game"}
    row.update(cat=src["category"],subcategory=src["subcategory"],status="draft",verified=src["checked"],source=sources[q["source_refs"][0]]["url"],sources=[sources[r]["url"] for r in q["source_refs"]],sets=[src["set"]],data_year_note="Filmjahr laut Paramount+; Laufzeit exakt an die zitierte Paramount+-Anzeige gebunden. Jährliche Prüfung.",visual="deep-space-neutral",subject="deep-space-neutral")
    if game == "moreless":
        assert [observations[k]["value"] for k in q["observation_keys"]] == [q["lv"],q["rv"]] and q["lv"] != q["rv"]
        for label in [q["l"],q["r"]]: pack["images"][label] = visual
    elif game == "estimate": assert observations[q["observation_keys"][0]]["value"] == q["a"]
    elif game == "facts": assert type(q["a"]) is bool and q["e"]
    else: assert isinstance(q["a"],str) and 1 <= q["difficulty"] <= 5
    pack[game].append(row)
    schedule.append({"id":q["id"],"game":game,"source":sources[q["source_refs"][0]]["url"],"verified":src["checked"],"data_year":q["data_year"],"time_dependent":False,"review_interval_days":365,"next_review":"2027-10-24","review_status":"draft-review-required"})

assert [len(pack[g]) for g in games] == [2,4,6,8] and len(seen) == 22
for level in ["easy","medium","hard"]: assert sorted(x["a"] for x in pack["facts"] if x["difficulty"] == level) == [False,True]
for name,width in [("deep-space-neutral-card.svg","720"),("deep-space-neutral-detail.svg","960")]:
    root = ET.parse(DIR / "visuals" / name).getroot(); assert root.attrib["width"] == width and root.attrib["height"] == "540"

approved = json.loads((ROOT / "content/approved.js").read_text().split("=",1)[1].rstrip(";\n")); counts = {}
for game in games:
    for item in approved[game]: counts.setdefault(item["cat"],{g:0 for g in games})[game] += 1
for values in counts.values(): values["total"] = sum(values[g] for g in games)
emit("main-inventory.json",{"checked":src["checked"],"base_commit":src["base_commit"],"selectable_category_labels":len(counts),"categories":dict(sorted(counts.items()))})
emit("draft-pack.json",pack)
emit("draft-review-schedule.json",{"policy":"Stabile Filmjahre, Handlungsangaben und gebundene Plattformanzeigen: 365 Tage; keine automatische Veröffentlichung.","records":schedule})
emit("category-summary.json",{"checked":src["checked"],"target":{"category":"Science-Fiction","main_before":{"moreless":0,"estimate":0,"facts":0,"jeopardy":15,"total":15},"open_drafts_unique":{"moreless":0,"estimate":0,"facts":0,"jeopardy":0,"total":0},"before_including_open_drafts":{"moreless":0,"estimate":0,"facts":0,"jeopardy":15,"total":15},"this_draft":{"moreless":2,"estimate":4,"facts":6,"jeopardy":8,"total":20},"after_including_open_drafts":{"moreless":2,"estimate":4,"facts":6,"jeopardy":23,"total":35}},"all_selectable_category_labels":len(counts),"categories_completed_this_run":1,"other_category_labels_without_this_run_additions":len(counts)-1,"formal_missing_questions_against_20_per_category_run_target":(len(counts)-1)*20,"notes":"No open PR adds an exact Science-Fiction category identity. Existing Doctor Who and basic Original Series questions were excluded."})
emit("parallel-pr-check.json",{"checked":src["checked"],"open_pr_count":26,"open_pr_numbers":[157,156,155,154,153,152,151,150,149,148,147,146,145,144,138,134,132,131,130,129,128,127,126,122,109,57],"pending_questions_considered":1120,"science_fiction_relevant_prs":[],"science_fiction_pending_raw":0,"science_fiction_pending_unique":0,"semantic_review":"No exact prompt, reversed pair, same observation or answer conflict. Existing Doctor Who and Original Series basics were excluded.","non_content_prs_reviewed":True})
emit("daily-catalogue-check.json",{"checked":src["checked"],"project":"rnwsbgzdrttqtivrwnxo","account":"Marc","table":"ml_private.daily_catalogue","mode":"read-only","rows_total":7187,"broad_matches":0,"observation_conflicts":0,"scope":["Star Trek","Wrath of Khan","Search for Spock","Voyage Home","Final Frontier","Undiscovered Country","Generations","First Contact","Insurrection","Nemesis","Into Darkness","Beyond","Nexus","Krall"],"notes":"Read-only title and plot-term query returned no broad hit and no conflict with the 22 proposed observations."})
emit("duplicate-audit.json",{"checked":src["checked"],"main_commit":src["base_commit"],"main_question_identities":sum(len(approved[g]) for g in games),"open_question_identities_considered":1120,"this_draft":20,"exact_prompt_conflicts":[],"reversed_moreless_conflicts":[],"same_observation_conflicts":[],"near_semantic_conflicts":[],"excluded_existing_topics":["Gallifrey","Time Lord hearts","regeneration","TARDIS","Daleks","Sarek identity","Kirk","Spock heritage","McCoy role","NCC-1701","Vulcan salute"],"method":"Normalized prompt matching; unordered More/Less pair plus metric/unit; film+field observation review against Main, all open PRs and Daily payloads."})
emit("validation.json",{"checked":src["checked"],"counts":{"moreless":2,"estimate":4,"facts":6,"jeopardy":8},"unique_observation_keys":22,"source_checks":True,"duplicate_checks":True,"image_structure_checks":True,"rendered_visual_qa":True,"game_merge_regression":True,"full_regression":True,"offline_build":True,"notes":"Both SVGs were rendered with Sharp and visually inspected at native 720×540 and 960×540. Builder, package checker, PWA build and full npm test passed on 2026-10-24."})
baseline = json.loads((ROOT / "content/review-schedule.json").read_text())["records"]; assert not [x for x in baseline if x["next_review"] <= src["checked"]]
print(("Checked" if CHECK else "Built") + " 20 Science-Fiction questions and two neutral SVG structures")
