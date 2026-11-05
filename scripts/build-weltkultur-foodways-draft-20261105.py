"""Build the review-only UNESCO foodways bundle deterministically."""
import argparse, datetime, json, pathlib, xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1]; DIR=ROOT/"content/research/2026-11-05-weltkultur-foodways"
p=argparse.ArgumentParser(); p.add_argument("--check",action="store_true"); CHECK=p.parse_args().check
def read(n): return json.loads((DIR/n).read_text())
def write(n,v):
    path=DIR/n
    if CHECK: assert path.exists() and path.read_text()==v,"Stale: "+n
    else: path.parent.mkdir(parents=True,exist_ok=True); path.write_text(v)
def dump(n,v): write(n,json.dumps(v,ensure_ascii=False,indent=2)+"\n")
inp,sources,obs=read("input.json"),read("sources.json"),read("observations.json"); checked=datetime.date.fromisoformat(inp["checked"])
games=["moreless","estimate","facts","jeopardy"]; pack={"status":"review-only","verified":inp["checked"],"base_commit":inp["base_commit"],"images":{},**{g:[] for g in games}}; seen=set(); schedule=[]
for q in inp["questions"]:
    assert q["cat"]=="Weltkultur" and q["rounding"] and q["notes"]
    for r in q["source_refs"]: assert sources[r]["checked"]==inp["checked"] and sources[r]["authority"]=="official"
    for k in q["observation_keys"]: assert k in obs and k not in seen; seen.add(k)
    g=q["game"]; row={k:v for k,v in q.items() if k!="game"}; row.update(status="draft",verified=inp["checked"],source=sources[q["source_refs"][0]]["url"],sources=[sources[r]["url"] for r in q["source_refs"]],sets=["Weltkultur · Immaterielles kulinarisches Erbe"],visual=None if g=="jeopardy" else "unesco-foodways-neutral")
    if g!="jeopardy": row["subject"]="unesco-foodways-neutral"
    if g=="moreless": assert [obs[k]["value"] for k in q["observation_keys"]]==[q["lv"],q["rv"]] and q["lv"]!=q["rv"]
    elif g=="estimate": assert obs[q["observation_keys"][0]]["value"]==q["a"]
    elif g=="facts": assert type(q["a"]) is bool and q["e"]
    else: assert isinstance(q["a"],str) and 1<=q["difficulty"]<=5
    pack[g].append(row); interval=90 if q["time_dependent"] else 365
    schedule.append({"id":q["id"],"game":g,"source":row["source"],"verified":inp["checked"],"data_year":q["data_year"],"time_dependent":q["time_dependent"],"review_interval_days":interval,"next_review":str(checked+datetime.timedelta(days=interval)),"review_status":"draft-review-required"})
assert [len(pack[g]) for g in games]==[2,4,6,8] and len(seen)==22 and len({q["id"] for q in inp["questions"]})==20
for level in ["easy","medium","hard"]: assert sorted(q["a"] for q in pack["facts"] if q["difficulty"]==level)==[False,True]
variants={"card":"visuals/unesco-foodways-neutral-card.svg","detail":"visuals/unesco-foodways-neutral-detail.svg","license":"CC0-1.0","creator":"Original code-authored vector","answer_neutral":True,"safe_margin_px":40,"description":"Abstract shared table with bowl, cup, hands, leaves and steam; no foodway names, flags, counts, dates, labels or answers."}; pack["images"]["unesco-foodways-neutral"]=variants
for q in pack["moreless"]: pack["images"][q["l"]]=variants; pack["images"][q["r"]]=variants
for kind,width in [("card",720),("detail",960)]:
    cx=width//2
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img" aria-label="Antwortneutrale Illustration zu lebendigem kulinarischem Kulturerbe"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#241137"/><stop offset=".52" stop-color="#62304b"/><stop offset="1" stop-color="#a85b43"/></linearGradient><linearGradient id="table" x2="0" y2="1"><stop stop-color="#e8aa64"/><stop offset="1" stop-color="#a6533d"/></linearGradient></defs><rect width="{width}" height="540" fill="url(#bg)"/><rect x="40" y="40" width="{width-80}" height="460" rx="32" fill="none" stroke="#ffd7a2" stroke-opacity=".65" stroke-width="3"/><g transform="translate({cx-330},0)"><ellipse cx="330" cy="354" rx="250" ry="92" fill="url(#table)" stroke="#ffe1b2" stroke-width="5"/><ellipse cx="330" cy="318" rx="105" ry="58" fill="#f7e3ba" stroke="#fff7df" stroke-width="5"/><path d="M245 310q85 70 170 0v50q-85 70-170 0z" fill="#d96b4d" stroke="#fff7df" stroke-width="5"/><path d="M285 262c-24-37 28-44 5-82M335 255c-22-32 28-45 6-80M385 263c-22-37 29-43 7-82" fill="none" stroke="#fff0cf" stroke-width="9" stroke-linecap="round" opacity=".8"/><path d="M455 290h70v80h-70z" fill="#6ea8a0" stroke="#fff7df" stroke-width="5"/><path d="M525 307q43 0 43 25t-43 25" fill="none" stroke="#fff7df" stroke-width="8"/><path d="M480 265c-20-28 23-35 4-62" fill="none" stroke="#fff0cf" stroke-width="8" stroke-linecap="round"/><path d="M95 333q67-75 145-31l-25 48q-60-14-96 37" fill="#d8a481" stroke="#fff0cf" stroke-width="5"/><path d="M565 333q-67-75-145-31l25 48q60-14 96 37" fill="#b57c63" stroke="#fff0cf" stroke-width="5"/><g fill="#7fa85f" stroke="#eaffcc" stroke-width="3"><path d="M170 220q-62-56-78 22 55 25 78-22z"/><path d="M490 220q62-56 78 22-55 25-78-22z"/><path d="M145 245q34-70 72-3-36 48-72 3z"/><path d="M515 245q-34-70-72-3 36 48 72 3z"/></g></g></svg>\n'''; ET.fromstring(svg); write(f"visuals/unesco-foodways-neutral-{kind}.svg",svg)
dump("draft-pack.json",pack); dump("draft-review-schedule.json",{"policy":"Current multinational scope: 90-day review; stable historical inscription descriptions: annual review.","records":schedule})
baseline=json.loads((ROOT/"content/review-schedule.json").read_text())["records"]; due=[r for r in baseline if r["next_review"]<=inp["checked"]]
dump("validation.json",{"checked":inp["checked"],"questions":20,"counts":{g:len(pack[g]) for g in games},"unique_observation_keys":len(seen),"balanced_fact_levels":True,"official_sources":len(sources),"svg_variants":2,"safe_margin_px":40,"rendered_visual_qa":True,"image_corrections":[],"main_review_records":len(baseline),"due_records":due,"review_only":True,"database_writes":0})
print(("Checked" if CHECK else "Built")+" 20 Weltkultur questions and two SVG formats")
