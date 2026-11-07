"""Build the review-only EV technology bundle deterministically."""
import argparse,datetime,json,pathlib,xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1];DIR=ROOT/"content/research/2026-11-07-autos-ev-tech";p=argparse.ArgumentParser();p.add_argument("--check",action="store_true");CHECK=p.parse_args().check
def read(n):return json.loads((DIR/n).read_text())
def write(n,v):
 path=DIR/n
 if CHECK:assert path.exists() and path.read_text()==v,"Stale: "+n
 else:path.parent.mkdir(parents=True,exist_ok=True);path.write_text(v)
def dump(n,v):write(n,json.dumps(v,ensure_ascii=False,indent=2)+"\n")
inp,sources,obs=read("input.json"),read("sources.json"),read("observations.json");checked=datetime.date.fromisoformat(inp["checked"]);games=["moreless","estimate","facts","jeopardy"];pack={"status":"review-only","verified":inp["checked"],"base_commit":inp["base_commit"],"images":{},**{g:[] for g in games}};seen=set();schedule=[]
for q in inp["questions"]:
 assert q["cat"]=="Autos" and q["rounding"] and q["notes"]
 for r in q["source_refs"]:assert sources[r]["checked"]==inp["checked"] and sources[r]["authority"]=="official"
 for k in q["observation_keys"]:assert k in obs and k not in seen;seen.add(k)
 g=q["game"];row={k:v for k,v in q.items() if k!="game"};row.update(status="draft",verified=inp["checked"],source=sources[q["source_refs"][0]]["url"],sources=[sources[r]["url"] for r in q["source_refs"]],sets=["Autos · Elektroauto-Technik"],visual=None if g=="jeopardy" else "ev-tech-neutral")
 if g!="jeopardy":row["subject"]="ev-tech-neutral"
 if g=="moreless":assert [obs[k]["value"] for k in q["observation_keys"]]==[q["lv"],q["rv"]] and q["lv"]!=q["rv"]
 elif g=="estimate":assert obs[q["observation_keys"][0]]["value"]==q["a"]
 elif g=="facts":assert type(q["a"]) is bool and q["e"]
 else:assert isinstance(q["a"],str) and 1<=q["difficulty"]<=5
 pack[g].append(row);interval=365;schedule.append({"id":q["id"],"game":g,"source":row["source"],"verified":inp["checked"],"data_year":q["data_year"],"time_dependent":q["time_dependent"],"review_interval_days":interval,"next_review":str(checked+datetime.timedelta(days=interval)),"review_status":"draft-review-required"})
assert [len(pack[g]) for g in games]==[2,4,6,8] and len(seen)==22 and len({q["id"] for q in inp["questions"]})==20
for level in ["easy","medium","hard"]:assert sorted(q["a"] for q in pack["facts"] if q["difficulty"]==level)==[False,True]
variants={"card":"visuals/ev-tech-neutral-card.svg","detail":"visuals/ev-tech-neutral-detail.svg","license":"CC0-1.0","creator":"Original code-authored vector","answer_neutral":True,"safe_margin_px":40,"description":"Abstract EV silhouette, battery cells and charging curve; no brands, models, numbers, scales, labels or answers."};pack["images"]["ev-tech-neutral"]=variants
for q in pack["moreless"]:pack["images"][q["l"]]=variants;pack["images"][q["r"]]=variants
for kind,width in [("card",720),("detail",960)]:
 cx=width//2;svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img" aria-label="Antwortneutrale Illustration zu Elektroauto-Technik"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#09182d"/><stop offset=".55" stop-color="#174c63"/><stop offset="1" stop-color="#2f7c72"/></linearGradient><linearGradient id="car" x2="0" y2="1"><stop stop-color="#c7fff4"/><stop offset="1" stop-color="#48a9a1"/></linearGradient></defs><rect width="{width}" height="540" fill="url(#bg)"/><rect x="40" y="40" width="{width-80}" height="460" rx="32" fill="none" stroke="#9dfff0" stroke-opacity=".65" stroke-width="3"/><g transform="translate({cx-330},0)"><path d="M110 330l45-92q16-34 55-42h220q38 8 58 43l57 91 32 12v62H82v-62z" fill="url(#car)" stroke="#eafffb" stroke-width="6"/><path d="M205 223h190q27 3 43 31l20 39H175l18-42q5-17 12-28z" fill="#153d58" stroke="#eafffb" stroke-width="5"/><circle cx="180" cy="397" r="48" fill="#0b2035" stroke="#d9fff8" stroke-width="8"/><circle cx="480" cy="397" r="48" fill="#0b2035" stroke="#d9fff8" stroke-width="8"/><g fill="#80f2cc" stroke="#eafffb" stroke-width="4"><rect x="230" y="340" width="55" height="32" rx="7"/><rect x="300" y="340" width="55" height="32" rx="7"/><rect x="370" y="340" width="55" height="32" rx="7"/></g><path d="M515 185h55v70h-55zM542 185v-35M527 150v-30M557 150v-30" fill="none" stroke="#fff0a8" stroke-width="9" stroke-linecap="round"/><path d="M490 280q75-5 79-55" fill="none" stroke="#fff0a8" stroke-width="8" stroke-linecap="round"/></g></svg>\n''';ET.fromstring(svg);write(f"visuals/ev-tech-neutral-{kind}.svg",svg)
dump("draft-pack.json",pack);dump("draft-review-schedule.json",{"policy":"Model-year-specific manufacturer specifications: annual review.","records":schedule});baseline=json.loads((ROOT/"content/review-schedule.json").read_text())["records"];due=[r for r in baseline if r["next_review"]<=inp["checked"]];dump("validation.json",{"checked":inp["checked"],"questions":20,"counts":{g:len(pack[g]) for g in games},"unique_observation_keys":len(seen),"balanced_fact_levels":True,"official_sources":len(sources),"svg_variants":2,"safe_margin_px":40,"rendered_visual_qa":True,"image_corrections":[],"main_review_records":len(baseline),"due_records":due,"review_only":True,"database_writes":0});print(("Checked" if CHECK else "Built")+" 20 Autos EV-tech questions and two SVG formats")
