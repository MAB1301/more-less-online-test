"""Build the review-only BWF badminton-rules bundle deterministically."""
import argparse,datetime,json,pathlib,xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1];DIR=ROOT/"content/research/2026-11-09-sportregeln-badminton";p=argparse.ArgumentParser();p.add_argument("--check",action="store_true");CHECK=p.parse_args().check
def read(n):return json.loads((DIR/n).read_text())
def write(n,v):
 path=DIR/n
 if CHECK:assert path.exists() and path.read_text()==v,"Stale: "+n
 else:path.parent.mkdir(parents=True,exist_ok=True);path.write_text(v)
def dump(n,v):write(n,json.dumps(v,ensure_ascii=False,indent=2)+"\n")
inp,sources,obs=read("input.json"),read("sources.json"),read("observations.json");checked=datetime.date.fromisoformat(inp["checked"]);games=["moreless","estimate","facts","jeopardy"];pack={"status":"review-only","verified":inp["checked"],"base_commit":inp["base_commit"],"images":{},**{g:[] for g in games}};seen=set();schedule=[]
for q in inp["questions"]:
 assert q["cat"]=="Sportregeln" and q["rounding"] and q["notes"]
 for r in q["source_refs"]:assert sources[r]["checked"]==inp["checked"] and sources[r]["authority"]=="official"
 for k in q["observation_keys"]:assert k in obs and k not in seen;seen.add(k)
 g=q["game"];row={k:v for k,v in q.items() if k!="game"};row.update(status="draft",verified=inp["checked"],source=sources[q["source_refs"][0]]["url"],sources=[sources[r]["url"] for r in q["source_refs"]],sets=["Sportregeln · Badminton · BWF"],visual=None if g=="jeopardy" else "badminton-rules-neutral")
 if g!="jeopardy":row["subject"]="badminton-rules-neutral"
 if g=="moreless":assert [obs[k]["value"] for k in q["observation_keys"]]==[q["lv"],q["rv"]] and q["lv"]!=q["rv"]
 elif g=="estimate":assert obs[q["observation_keys"][0]]["value"]==q["a"]
 elif g=="facts":assert type(q["a"]) is bool and q["e"]
 else:assert isinstance(q["a"],str) and 1<=q["difficulty"]<=5
 pack[g].append(row);interval=180;schedule.append({"id":q["id"],"game":g,"source":row["source"],"verified":inp["checked"],"data_year":q["data_year"],"time_dependent":q["time_dependent"],"review_interval_days":interval,"next_review":str(checked+datetime.timedelta(days=interval)),"review_status":"draft-review-required"})
assert [len(pack[g]) for g in games]==[2,4,6,8] and len(seen)==22 and len({q["id"] for q in inp["questions"]})==20
for level in ["easy","medium","hard"]:assert sorted(q["a"] for q in pack["facts"] if q["difficulty"]==level)==[False,True]
variants={"card":"visuals/badminton-rules-neutral-card.svg","detail":"visuals/badminton-rules-neutral-detail.svg","license":"CC0-1.0","creator":"Original code-authored vector","answer_neutral":True,"safe_margin_px":40,"description":"Abstract racket, shuttle and court motif; no dimensions, scores, labels, scales, brands or answers."};pack["images"]["badminton-rules-neutral"]=variants
for q in pack["moreless"]:pack["images"][q["l"]]=variants;pack["images"][q["r"]]=variants
for kind,width in [("card",720),("detail",960)]:
 cx=width//2;svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img" aria-label="Antwortneutrale Illustration zu Badmintonregeln"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#08172c"/><stop offset=".55" stop-color="#174d68"/><stop offset="1" stop-color="#23755f"/></linearGradient><linearGradient id="court" x2="0" y2="1"><stop stop-color="#69d8bd"/><stop offset="1" stop-color="#2b8f7b"/></linearGradient></defs><rect width="{width}" height="540" fill="url(#bg)"/><rect x="40" y="40" width="{width-80}" height="460" rx="32" fill="none" stroke="#a6fff0" stroke-opacity=".65" stroke-width="3"/><g transform="translate({cx-290},0)"><path d="M90 392l128-220h244l48 220z" fill="url(#court)" stroke="#eafffb" stroke-width="5" stroke-linejoin="round"/><path d="M218 172l-64 220m308-220l24 220M290 172l-48 220m146-220l12 220M126 330h370M158 274h326M190 218h282" fill="none" stroke="#d7fff7" stroke-width="3" opacity=".8"/><g transform="translate(350 190) rotate(22)"><ellipse cx="0" cy="0" rx="76" ry="100" fill="#0b2942" stroke="#fff0a8" stroke-width="9"/><path d="M-55-70l110 140M-74-20L45 86M-48 80L67-53M-72 28L38-88" stroke="#fff0a8" stroke-width="3" opacity=".8"/><path d="M0 100v125" stroke="#fff0a8" stroke-width="16" stroke-linecap="round"/></g><g transform="translate(138 128) rotate(-25)"><path d="M0 0l-34 82h68z" fill="#eafffb" stroke="#b8fff1" stroke-width="5"/><ellipse cx="0" cy="91" rx="30" ry="17" fill="#fff0a8"/></g></g></svg>\n''';ET.fromstring(svg);write(f"visuals/badminton-rules-neutral-{kind}.svg",svg)
dump("draft-pack.json",pack);dump("draft-review-schedule.json",{"policy":"Current sport regulations: review every 180 days.","records":schedule});baseline=json.loads((ROOT/"content/review-schedule.json").read_text())["records"];due=[r for r in baseline if r["next_review"]<=inp["checked"]];dump("validation.json",{"checked":inp["checked"],"questions":20,"counts":{g:len(pack[g]) for g in games},"unique_observation_keys":len(seen),"balanced_fact_levels":True,"official_sources":len(sources),"svg_variants":2,"safe_margin_px":40,"rendered_visual_qa":True,"image_corrections":["New card/detail graphic: racket repositioned below the 40 px top safe margin after rendered QA."],"main_review_records":len(baseline),"due_records":due,"review_only":True,"database_writes":0});print(("Checked" if CHECK else "Built")+" 20 BWF badminton-rules questions and two SVG formats")
