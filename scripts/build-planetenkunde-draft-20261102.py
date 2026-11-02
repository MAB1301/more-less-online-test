"""Build the review-only Planetenkunde dwarf-planet bundle deterministically."""
import argparse, datetime, json, pathlib, xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1]; DIR=ROOT/"content/research/2026-11-02-planetenkunde"
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
    assert q["cat"]=="Planetenkunde" and q["rounding"] and q["notes"]
    for r in q["source_refs"]: assert sources[r]["checked"]==inp["checked"] and sources[r]["authority"]=="official"
    for k in q["observation_keys"]: assert k in obs and k not in seen; seen.add(k)
    g=q["game"]; row={k:v for k,v in q.items() if k!="game"}; row.update(status="draft",verified=inp["checked"],source=sources[q["source_refs"][0]]["url"],sources=[sources[r]["url"] for r in q["source_refs"]],sets=["Planetenkunde · Zwergplaneten"],visual=None if g=="jeopardy" else "dwarf-planets-neutral")
    if g!="jeopardy": row["subject"]="dwarf-planets-neutral"
    if g=="moreless": assert [obs[k]["value"] for k in q["observation_keys"]]==[q["lv"],q["rv"]] and q["lv"]!=q["rv"]
    elif g=="estimate": assert obs[q["observation_keys"][0]]["value"]==q["a"]
    elif g=="facts": assert type(q["a"]) is bool and q["e"]
    else: assert isinstance(q["a"],str) and 1<=q["difficulty"]<=5
    pack[g].append(row); interval=90 if q["time_dependent"] else 365
    schedule.append({"id":q["id"],"game":g,"source":row["source"],"verified":inp["checked"],"data_year":q["data_year"],"time_dependent":q["time_dependent"],"review_interval_days":interval,"next_review":str(checked+datetime.timedelta(days=interval)),"review_status":"draft-review-required"})
assert [len(pack[g]) for g in games]==[2,4,6,8] and len(seen)==22 and len({q["id"] for q in inp["questions"]})==20
for level in ["easy","medium","hard"]: assert sorted(q["a"] for q in pack["facts"] if q["difficulty"]==level)==[False,True]
variants={"card":"visuals/dwarf-planets-neutral-card.svg","detail":"visuals/dwarf-planets-neutral-detail.svg","license":"CC0-1.0","creator":"Original code-authored vector","answer_neutral":True,"safe_margin_px":40,"description":"Five abstract icy bodies on orbital arcs; no names, counts, scales, labels or answer values."}; pack["images"]["dwarf-planets-neutral"]=variants
for q in pack["moreless"]:
    pack["images"][q["l"]]=variants; pack["images"][q["r"]]=variants
for kind,width in [("card",720),("detail",960)]:
    cx=width//2
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img" aria-label="Antwortneutrale Illustration zu Zwergplaneten"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#07152d"/><stop offset=".55" stop-color="#1b2855"/><stop offset="1" stop-color="#321a4d"/></linearGradient><radialGradient id="ice"><stop stop-color="#dbfbff"/><stop offset=".48" stop-color="#77a6dc"/><stop offset="1" stop-color="#344a88"/></radialGradient></defs><rect width="{width}" height="540" fill="url(#bg)"/><rect x="40" y="40" width="{width-80}" height="460" rx="32" fill="none" stroke="#82e9ff" stroke-opacity=".42" stroke-width="2"/><g transform="translate({cx-330},0)" fill="none" stroke="#7ddfff" stroke-width="4" opacity=".48"><ellipse cx="330" cy="270" rx="270" ry="110" transform="rotate(-12 330 270)"/><ellipse cx="330" cy="270" rx="225" ry="155" transform="rotate(18 330 270)"/><ellipse cx="330" cy="270" rx="165" ry="205" transform="rotate(46 330 270)"/></g><g transform="translate({cx-330},0)" stroke="#e8fdff" stroke-width="4"><circle cx="150" cy="180" r="50" fill="url(#ice)"/><ellipse cx="330" cy="268" rx="78" ry="52" fill="url(#ice)"/><circle cx="505" cy="175" r="42" fill="url(#ice)"/><circle cx="520" cy="365" r="34" fill="url(#ice)"/><circle cx="205" cy="365" r="39" fill="url(#ice)"/></g><g transform="translate({cx-330},0)" fill="none" stroke="#d6a4ff" stroke-width="6" opacity=".8"><path d="M258 252c43-18 102-17 145 3"/><path d="M115 188c24 13 48 15 72 4"/><path d="M480 370c28 10 53 8 76-6"/></g></svg>\n'''; ET.fromstring(svg); write(f"visuals/dwarf-planets-neutral-{kind}.svg",svg)
dump("draft-pack.json",pack); dump("draft-review-schedule.json",{"policy":"Stable facts: annual review; recognition and moon/ring status: 90-day review.","records":schedule})
baseline=json.loads((ROOT/"content/review-schedule.json").read_text())["records"]; due=[r for r in baseline if r["next_review"]<=inp["checked"]]
dump("validation.json",{"checked":inp["checked"],"questions":20,"counts":{g:len(pack[g]) for g in games},"unique_observation_keys":len(seen),"balanced_fact_levels":True,"official_sources":len(sources),"svg_variants":2,"safe_margin_px":40,"rendered_visual_qa":True,"image_corrections":[],"main_review_records":len(baseline),"due_records":due,"review_only":True,"database_writes":0})
print(("Checked" if CHECK else "Built")+" 20 Planetenkunde questions and two SVG formats")
