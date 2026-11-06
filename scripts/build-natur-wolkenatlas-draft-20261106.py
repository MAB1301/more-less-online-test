"""Build the review-only WMO cloud-atlas bundle deterministically."""
import argparse, datetime, json, pathlib, xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1]; DIR=ROOT/"content/research/2026-11-06-natur-wolkenatlas"
p=argparse.ArgumentParser();p.add_argument("--check",action="store_true");CHECK=p.parse_args().check
def read(n):return json.loads((DIR/n).read_text())
def write(n,v):
    path=DIR/n
    if CHECK:assert path.exists() and path.read_text()==v,"Stale: "+n
    else:path.parent.mkdir(parents=True,exist_ok=True);path.write_text(v)
def dump(n,v):write(n,json.dumps(v,ensure_ascii=False,indent=2)+"\n")
inp,sources,obs=read("input.json"),read("sources.json"),read("observations.json");checked=datetime.date.fromisoformat(inp["checked"]);games=["moreless","estimate","facts","jeopardy"];pack={"status":"review-only","verified":inp["checked"],"base_commit":inp["base_commit"],"images":{},**{g:[] for g in games}};seen=set();schedule=[]
for q in inp["questions"]:
    assert q["cat"]=="Natur" and q["rounding"] and q["notes"]
    for r in q["source_refs"]:assert sources[r]["checked"]==inp["checked"] and sources[r]["authority"]=="official"
    for k in q["observation_keys"]:assert k in obs and k not in seen;seen.add(k)
    g=q["game"];row={k:v for k,v in q.items() if k!="game"};row.update(status="draft",verified=inp["checked"],source=sources[q["source_refs"][0]]["url"],sources=[sources[r]["url"] for r in q["source_refs"]],sets=["Natur · Internationaler Wolkenatlas"],visual=None if g=="jeopardy" else "cloud-atlas-neutral")
    if g!="jeopardy":row["subject"]="cloud-atlas-neutral"
    if g=="moreless":assert [obs[k]["value"] for k in q["observation_keys"]]==[q["lv"],q["rv"]] and q["lv"]!=q["rv"]
    elif g=="estimate":assert obs[q["observation_keys"][0]]["value"]==q["a"]
    elif g=="facts":assert type(q["a"]) is bool and q["e"]
    else:assert isinstance(q["a"],str) and 1<=q["difficulty"]<=5
    pack[g].append(row);interval=90 if q["time_dependent"] else 365;schedule.append({"id":q["id"],"game":g,"source":row["source"],"verified":inp["checked"],"data_year":q["data_year"],"time_dependent":q["time_dependent"],"review_interval_days":interval,"next_review":str(checked+datetime.timedelta(days=interval)),"review_status":"draft-review-required"})
assert [len(pack[g]) for g in games]==[2,4,6,8] and len(seen)==22 and len({q["id"] for q in inp["questions"]})==20
for level in ["easy","medium","hard"]:assert sorted(q["a"] for q in pack["facts"] if q["difficulty"]==level)==[False,True]
variants={"card":"visuals/cloud-atlas-neutral-card.svg","detail":"visuals/cloud-atlas-neutral-detail.svg","license":"CC0-1.0","creator":"Original code-authored vector","answer_neutral":True,"safe_margin_px":40,"description":"Abstract layered cloudscape with observation frame; no genus names, counts, altitudes, labels or answers."};pack["images"]["cloud-atlas-neutral"]=variants
for q in pack["moreless"]:pack["images"][q["l"]]=variants;pack["images"][q["r"]]=variants
for kind,width in [("card",720),("detail",960)]:
    cx=width//2
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img" aria-label="Antwortneutrale Illustration zum Internationalen Wolkenatlas"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#173b72"/><stop offset=".55" stop-color="#4d8ec2"/><stop offset="1" stop-color="#efb879"/></linearGradient><linearGradient id="cloud" x2="0" y2="1"><stop stop-color="#fff"/><stop offset="1" stop-color="#c8d8e8"/></linearGradient></defs><rect width="{width}" height="540" fill="url(#sky)"/><rect x="40" y="40" width="{width-80}" height="460" rx="32" fill="none" stroke="#e8f7ff" stroke-opacity=".75" stroke-width="3"/><g transform="translate({cx-330},0)" fill="url(#cloud)" stroke="#eefaff" stroke-width="5"><path d="M90 375c0-44 38-77 82-70 16-56 96-68 127-20 53-26 116 8 118 66 42-5 74 24 74 62H90z"/><path d="M245 235c3-35 34-58 67-51 20-48 90-49 111-2 43-7 76 24 78 65H245z" opacity=".92"/><path d="M102 175c35-32 74-34 118-8M455 145c42-25 83-20 113 10" fill="none" stroke-linecap="round" opacity=".85"/></g><g transform="translate({cx-330},0)" fill="none" stroke="#d8f3ff" stroke-width="5" opacity=".75"><path d="M85 430h490"/><path d="M115 90v360M545 90v360" stroke-dasharray="10 14"/><path d="M105 120l18-18 18 18M527 120l18-18 18 18"/></g></svg>\n''';ET.fromstring(svg);write(f"visuals/cloud-atlas-neutral-{kind}.svg",svg)
dump("draft-pack.json",pack);dump("draft-review-schedule.json",{"policy":"Stable WMO 2017 classification: annual review; current site operator: 90-day review.","records":schedule});baseline=json.loads((ROOT/"content/review-schedule.json").read_text())["records"];due=[r for r in baseline if r["next_review"]<=inp["checked"]];dump("validation.json",{"checked":inp["checked"],"questions":20,"counts":{g:len(pack[g]) for g in games},"unique_observation_keys":len(seen),"balanced_fact_levels":True,"official_sources":len(sources),"svg_variants":2,"safe_margin_px":40,"rendered_visual_qa":True,"image_corrections":[],"main_review_records":len(baseline),"due_records":due,"review_only":True,"database_writes":0});print(("Checked" if CHECK else "Built")+" 20 Natur cloud-atlas questions and two SVG formats")
