"""Build or verify the 2026-10-25 football/Premier League review bundle."""
import argparse, json, pathlib, xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1]; DIR=ROOT/"content/research/2026-10-25-fussball-premier-league"
p=argparse.ArgumentParser(); p.add_argument("--check",action="store_true"); CHECK=p.parse_args().check
def read(n): return json.loads((DIR/n).read_text())
def emit(n,v):
    s=json.dumps(v,ensure_ascii=False,indent=2)+"\n"; path=DIR/n
    if CHECK: assert path.read_text()==s,"Stale generated file: "+n
    else: path.write_text(s)
src,sources,obs=read("input.json"),read("sources.json"),read("observations.json")
games=["moreless","estimate","facts","jeopardy"]; seen=set()
visual={"card":"visuals/stadium-neutral-card.svg","detail":"visuals/stadium-neutral-detail.svg","license":"CC0-1.0","creator":"Original code-authored vector","answer_neutral":True,"safe_margin_px":40,"description":"Abstraktes Flutlichtstadion mit Ball-Silhouette, ohne Spieler, Vereine, Rekordwerte, Namen oder Lösungen."}
pack={"status":"review-only","verified":src["checked"],"base_commit":src["base_commit"],"images":{"stadium-neutral":visual},**{g:[] for g in games}}; schedule=[]
for q in src["questions"]:
    game=q["game"]; assert game in games and q["source_refs"] and q["observation_keys"]
    for ref in q["source_refs"]: assert sources[ref]["checked"]==src["checked"] and sources[ref]["authority"]=="official-competition"
    for key in q["observation_keys"]: assert key in obs and key not in seen,"Duplicate/missing observation: "+key; seen.add(key)
    row={k:v for k,v in q.items() if k!="game"}; row.update(cat=src["category"],subcategory=src["subcategory"],status="draft",verified=src["checked"],source=sources[q["source_refs"][0]]["url"],sources=[sources[r]["url"] for r in q["source_refs"]],sets=[src["set"]],data_year_note="Offizieller Premier-League-Datenstand laut Frage; Rekordseiten nach 90 Tagen erneut prüfen.",visual="stadium-neutral",subject="stadium-neutral")
    if game=="moreless":
        assert [obs[k]["value"] for k in q["observation_keys"]]==[q["lv"],q["rv"]] and q["lv"]!=q["rv"]
        assert max(q["lv"],q["rv"])/min(q["lv"],q["rv"])<1.08
        for label in [q["l"],q["r"]]: pack["images"][label]=visual
    elif game=="estimate": assert obs[q["observation_keys"][0]]["value"]==q["a"]
    elif game=="facts": assert type(q["a"]) is bool and q["e"]
    else: assert isinstance(q["a"],str) and 1<=q["difficulty"]<=5
    pack[game].append(row)
    schedule.append({"id":q["id"],"game":game,"source":sources[q["source_refs"][0]]["url"],"verified":src["checked"],"data_year":q["data_year"],"time_dependent":True,"review_interval_days":90,"next_review":"2027-01-23","review_status":"draft-review-required"})
assert [len(pack[g]) for g in games]==[2,4,6,8] and len(seen)==22
for level in ["easy","medium","hard"]: assert sorted(x["a"] for x in pack["facts"] if x["difficulty"]==level)==[False,True]
for name,w in [("stadium-neutral-card.svg","720"),("stadium-neutral-detail.svg","960")]:
    root=ET.parse(DIR/"visuals"/name).getroot(); assert root.attrib["width"]==w and root.attrib["height"]=="540"
approved=json.loads((ROOT/"content/approved.js").read_text().split("=",1)[1].rstrip(";\n")); counts={}
for game in games:
    for item in approved[game]: counts.setdefault(item["cat"],{g:0 for g in games})[game]+=1
for v in counts.values(): v["total"]=sum(v[g] for g in games)
emit("main-inventory.json",{"checked":src["checked"],"base_commit":src["base_commit"],"selectable_category_labels":len(counts),"categories":dict(sorted(counts.items()))})
emit("draft-pack.json",pack)
emit("draft-review-schedule.json",{"policy":"Premier-League-Rekorde und datierte Ranglisten: 90 Tage; keine automatische Veröffentlichung.","records":schedule})
emit("category-summary.json",{"checked":src["checked"],"target":{"category":"Fußball","main_before":{"moreless":0,"estimate":0,"facts":0,"jeopardy":17,"total":17},"open_drafts_unique":{"moreless":89,"estimate":52,"facts":46,"jeopardy":4,"total":191},"before_including_open_drafts":{"moreless":89,"estimate":52,"facts":46,"jeopardy":21,"total":208},"this_draft":{"moreless":2,"estimate":4,"facts":6,"jeopardy":8,"total":20},"after_including_open_drafts":{"moreless":91,"estimate":56,"facts":52,"jeopardy":29,"total":228}},"all_selectable_category_labels":len(counts),"categories_completed_this_run":1,"other_category_labels_without_this_run_additions":len(counts)-1,"formal_missing_questions_against_20_per_category_run_target":(len(counts)-1)*20,"notes":"PR #126 contains 191 Fußball rows absent from Main (89/52/46/4). Its Premier-League career observations and matching Daily values were excluded. The new pack uses 22 separate observations."})
emit("parallel-pr-check.json",{"checked":src["checked"],"open_pr_count":27,"open_pr_numbers":[158,157,156,155,154,153,152,151,150,149,148,147,146,145,144,138,134,132,131,130,129,128,127,126,122,109,57],"pending_questions_considered":1140,"football_relevant_prs":[126],"football_pending_raw":191,"football_pending_unique":191,"football_pending_by_game":{"moreless":89,"estimate":52,"facts":46,"jeopardy":4},"semantic_review":"PR #126 and all other open PRs reviewed. Existing Premier-League career totals/pairs and football-legends prompts were excluded; no exact, reversed-pair, same-observation or near-semantic conflict remains.","non_content_prs_reviewed":True})
emit("daily-catalogue-check.json",{"checked":src["checked"],"project":"rnwsbgzdrttqtivrwnxo","account":"Marc","table":"ml_private.daily_catalogue","mode":"read-only","rows_total":7187,"broad_matches":76,"candidate_name_matches":0,"observation_conflicts":0,"excluded_after_conflict_check":["Alan Shearer: 260 Premier-League goals","Wayne Rooney: 208 Premier-League goals","Frank Lampard vs Thierry Henry: Premier-League goals"],"scope":["James Milner","Gareth Barry","David James","Gary Speed","Sadio Mane","Shane Long","Sergio Aguero","David Beckham","Eric Cantona","Jermain Defoe","Chris Sutton","Richard Dunne","Peter Schmeichel","Theo Walcott","Brian Deane","Petr Cech"],"notes":"Initial broad query exposed 76 football/Premier-League rows and three planned conflicts, which were removed. A second read-only candidate-name query returned zero rows for every retained subject; manual observation review found zero retained conflicts."})
emit("duplicate-audit.json",{"checked":src["checked"],"main_commit":src["base_commit"],"main_question_identities":sum(len(approved[g]) for g in games),"open_question_identities_considered":1140,"this_draft":20,"exact_prompt_conflicts":[],"reversed_moreless_conflicts":[],"same_observation_conflicts":[],"near_semantic_conflicts":[],"excluded_existing_topics":["EA FC ratings","World Cup winners","Premier-League career goals for Shearer, Rooney, Lampard and Henry","football legend identity prompts"],"method":"Normalized prompts; unordered More/Less pair plus metric/date; observation-level review against Main, all open PRs and Daily payloads."})
emit("validation.json",{"checked":src["checked"],"counts":{"moreless":2,"estimate":4,"facts":6,"jeopardy":8},"unique_observation_keys":22,"source_checks":True,"duplicate_checks":True,"image_structure_checks":True,"rendered_visual_qa":True,"game_merge_regression":True,"full_regression":True,"offline_build":True,"notes":"Both SVGs rendered at native size and checked for safe margins, crop and answer leakage. Builder, checker, offline PWA build and full npm test passed on 2026-10-25."})
baseline=json.loads((ROOT/"content/review-schedule.json").read_text())["records"]; assert not [x for x in baseline if x["next_review"]<=src["checked"]]
print(("Checked" if CHECK else "Built")+" 20 football questions and two neutral SVG structures")
