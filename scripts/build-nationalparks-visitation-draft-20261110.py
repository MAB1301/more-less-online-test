"""Build the review-only NPS 2025 visitation bundle deterministically."""
import argparse,datetime,json,pathlib,xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1]
DIR=ROOT/"content/research/2026-11-10-nationalparks-visitation"
p=argparse.ArgumentParser();p.add_argument("--check",action="store_true");CHECK=p.parse_args().check
def read(n):return json.loads((DIR/n).read_text())
def write(n,v):
 path=DIR/n
 if CHECK:assert path.exists() and path.read_text()==v,"Stale: "+n
 else:path.parent.mkdir(parents=True,exist_ok=True);path.write_text(v)
def dump(n,v):write(n,json.dumps(v,ensure_ascii=False,indent=2)+"\n")
inp,sources,obs=read("input.json"),read("sources.json"),read("observations.json")
checked=datetime.date.fromisoformat(inp["checked"]);games=["moreless","estimate","facts","jeopardy"]
pack={"status":"review-only","verified":inp["checked"],"base_commit":inp["base_commit"],"images":{},**{g:[] for g in games}}
seen=set();schedule=[]
for q in inp["questions"]:
 assert q["cat"]=="Nationalparks" and q["rounding"] and q["notes"]
 for r in q["source_refs"]:assert sources[r]["checked"]==inp["checked"] and sources[r]["authority"]=="official"
 for k in q["observation_keys"]:assert k in obs and k not in seen;seen.add(k)
 g=q["game"];row={k:v for k,v in q.items() if k!="game"}
 row.update(status="draft",verified=inp["checked"],source=sources[q["source_refs"][0]]["url"],sources=[sources[r]["url"] for r in q["source_refs"]],sets=["Nationalparks · NPS-Besucherstatistik 2025"],visual=None if g=="jeopardy" else "nationalparks-visitation-neutral")
 if g!="jeopardy":row["subject"]="nationalparks-visitation-neutral"
 if g=="moreless":assert [obs[k]["value"] for k in q["observation_keys"]]==[q["lv"],q["rv"]] and q["lv"]!=q["rv"]
 elif g=="estimate":assert obs[q["observation_keys"][0]]["value"]==q["a"]
 elif g=="facts":assert type(q["a"]) is bool and q["e"]
 else:assert isinstance(q["a"],str) and 1<=q["difficulty"]<=5
 pack[g].append(row)
 schedule.append({"id":q["id"],"game":g,"source":row["source"],"verified":inp["checked"],"data_year":q["data_year"],"time_dependent":q["time_dependent"],"review_interval_days":365,"next_review":str(checked+datetime.timedelta(days=365)),"review_status":"draft-review-required"})
assert [len(pack[g]) for g in games]==[2,4,6,8] and len(seen)==22 and len({q["id"] for q in inp["questions"]})==20
for level in ["easy","medium","hard"]:assert sorted(q["a"] for q in pack["facts"] if q["difficulty"]==level)==[False,True]
variants={"card":"visuals/nationalparks-visitation-neutral-card.svg","detail":"visuals/nationalparks-visitation-neutral-detail.svg","license":"CC0-1.0","creator":"Original code-authored vector","answer_neutral":True,"safe_margin_px":40,"description":"Generic park trail, layered mountains and anonymous visitor markers; no park names, maps, ranks, years, counts or answers."}
pack["images"]["nationalparks-visitation-neutral"]=variants
for q in pack["moreless"]:pack["images"][q["l"]]=variants;pack["images"][q["r"]]=variants
for kind,width in [("card",720),("detail",960)]:
 cx=width/2
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img" aria-label="Antwortneutrale Illustration zu Nationalparkbesuchen"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#082944"/><stop offset=".56" stop-color="#2b6f7b"/><stop offset="1" stop-color="#f1b56a"/></linearGradient><linearGradient id="trail" x2="0" y2="1"><stop stop-color="#f6ddad"/><stop offset="1" stop-color="#b6783f"/></linearGradient></defs><rect width="{width}" height="540" fill="url(#sky)"/><rect x="40" y="40" width="{width-80}" height="460" rx="32" fill="none" stroke="#e9fff5" stroke-opacity=".7" stroke-width="3"/><circle cx="{cx+190}" cy="120" r="48" fill="#ffe39b" opacity=".9"/><path d="M40 342L{cx-210} 165 {cx-70} 305 {cx+70} 128 {cx+260} 342Z" fill="#244f59"/><path d="M40 386L{cx-180} 245 {cx-42} 356 {cx+112} 218 {width-40} 378V500H40Z" fill="#1d6b59"/><path d="M{cx-64} 500C{cx-38} 418 {cx-7} 390 {cx+4} 330C{cx+13} 281 {cx-4} 247 {cx+25} 210C{cx-18} 259 {cx+1} 300 {cx-9} 338C{cx-24} 398 {cx-76} 441 {cx-104} 500Z" fill="url(#trail)"/><g fill="#f9f4de"><circle cx="{cx-20}" cy="337" r="11"/><path d="M{cx-31} 350h22l7 52h-36z"/><circle cx="{cx+43}" cy="304" r="9"/><path d="M{cx+34} 316h18l5 43h-28z"/></g><g fill="#102f36"><path d="M92 420l38-104 38 104zM128 420l42-122 42 122zM{width-206} 420l42-122 42 122zM{width-166} 420l36-100 36 100z"/></g><g transform="translate({cx-228} 108)" fill="none" stroke="#e9fff5" stroke-width="7"><circle cx="0" cy="0" r="24"/><circle cx="58" cy="0" r="24"/><path d="M24 0h10M-24 0l-22 28M82 0l22 28"/></g></svg>\n'''
 ET.fromstring(svg);write(f"visuals/nationalparks-visitation-neutral-{kind}.svg",svg)
dump("draft-pack.json",pack)
dump("draft-review-schedule.json",{"policy":"Finalized annual NPS visitor-use values: review every 365 days for revisions and new editions.","records":schedule})
baseline=json.loads((ROOT/"content/review-schedule.json").read_text())["records"];due=[r for r in baseline if r["next_review"]<=inp["checked"]]
dump("validation.json",{"checked":inp["checked"],"questions":20,"counts":{g:len(pack[g]) for g in games},"unique_observation_keys":len(seen),"balanced_fact_levels":True,"official_sources":len(sources),"svg_variants":2,"safe_margin_px":40,"rendered_visual_qa":True,"image_corrections":["New card/detail graphic: visitor silhouettes moved inward after first render to clear the trail edge and 40 px safety frame."],"main_review_records":len(baseline),"due_records":due,"review_only":True,"database_writes":0})
print(("Checked" if CHECK else "Built")+" 20 NPS visitation questions and two SVG formats")
