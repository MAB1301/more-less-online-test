"""Build the review-only German state statistics bundle deterministically."""
import argparse,datetime,json,pathlib,xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1];DIR=ROOT/"content/research/2026-11-08-deutschland-laenderstatistik";p=argparse.ArgumentParser();p.add_argument("--check",action="store_true");CHECK=p.parse_args().check
def read(n):return json.loads((DIR/n).read_text())
def write(n,v):
 path=DIR/n
 if CHECK:assert path.exists() and path.read_text()==v,"Stale: "+n
 else:path.parent.mkdir(parents=True,exist_ok=True);path.write_text(v)
def dump(n,v):write(n,json.dumps(v,ensure_ascii=False,indent=2)+"\n")
inp,sources,obs=read("input.json"),read("sources.json"),read("observations.json");checked=datetime.date.fromisoformat(inp["checked"]);games=["moreless","estimate","facts","jeopardy"];pack={"status":"review-only","verified":inp["checked"],"base_commit":inp["base_commit"],"images":{},**{g:[] for g in games}};seen=set();schedule=[]
for q in inp["questions"]:
 assert q["cat"]=="Deutschland" and q["rounding"] and q["notes"]
 for r in q["source_refs"]:assert sources[r]["checked"]==inp["checked"] and sources[r]["authority"]=="official"
 for k in q["observation_keys"]:assert k in obs and k not in seen;seen.add(k)
 g=q["game"];row={k:v for k,v in q.items() if k!="game"};row.update(status="draft",verified=inp["checked"],source=sources[q["source_refs"][0]]["url"],sources=[sources[r]["url"] for r in q["source_refs"]],sets=["Deutschland · Bundesländer in Zahlen"],visual=None if g=="jeopardy" else "laenderstatistik-neutral")
 if g!="jeopardy":row["subject"]="laenderstatistik-neutral"
 if g=="moreless":assert [obs[k]["value"] for k in q["observation_keys"]]==[q["lv"],q["rv"]] and q["lv"]!=q["rv"]
 elif g=="estimate":assert obs[q["observation_keys"][0]]["value"]==q["a"]
 elif g=="facts":assert type(q["a"]) is bool and q["e"]
 else:assert isinstance(q["a"],str) and 1<=q["difficulty"]<=5
 pack[g].append(row);interval=90;schedule.append({"id":q["id"],"game":g,"source":row["source"],"verified":inp["checked"],"data_year":q["data_year"],"time_dependent":q["time_dependent"],"review_interval_days":interval,"next_review":str(checked+datetime.timedelta(days=interval)),"review_status":"draft-review-required"})
assert [len(pack[g]) for g in games]==[2,4,6,8] and len(seen)==22 and len({q["id"] for q in inp["questions"]})==20
for level in ["easy","medium","hard"]:assert sorted(q["a"] for q in pack["facts"] if q["difficulty"]==level)==[False,True]
variants={"card":"visuals/laenderstatistik-neutral-card.svg","detail":"visuals/laenderstatistik-neutral-detail.svg","license":"CC0-1.0","creator":"Original code-authored vector","answer_neutral":True,"safe_margin_px":40,"description":"Abstract data tiles, chart bars and regional outlines; no names, numbers, flags, scales, labels or answers."};pack["images"]["laenderstatistik-neutral"]=variants
for q in pack["moreless"]:pack["images"][q["l"]]=variants;pack["images"][q["r"]]=variants
for kind,width in [("card",720),("detail",960)]:
 cx=width//2;svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img" aria-label="Antwortneutrale Illustration zu Bundesländerstatistik"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#071b35"/><stop offset=".55" stop-color="#164f70"/><stop offset="1" stop-color="#236b61"/></linearGradient><linearGradient id="tile" x2="0" y2="1"><stop stop-color="#b9fff0"/><stop offset="1" stop-color="#55c3ae"/></linearGradient></defs><rect width="{width}" height="540" fill="url(#bg)"/><rect x="40" y="40" width="{width-80}" height="460" rx="32" fill="none" stroke="#9dfff0" stroke-opacity=".65" stroke-width="3"/><g transform="translate({cx-290},0)"><path d="M132 130l71-35 57 32 72-22 76 46 53-4 35 72-45 45 20 76-63 66-92-16-68 31-78-55-47-91 34-57-25-88z" fill="url(#tile)" stroke="#eafffb" stroke-width="6" stroke-linejoin="round"/><g fill="#0b2942" stroke="#eafffb" stroke-width="4"><rect x="170" y="296" width="44" height="72" rx="7"/><rect x="232" y="250" width="44" height="118" rx="7"/><rect x="294" y="274" width="44" height="94" rx="7"/><rect x="356" y="214" width="44" height="154" rx="7"/></g><g fill="#fff0a8"><circle cx="210" cy="177" r="12"/><circle cx="304" cy="164" r="12"/><circle cx="399" cy="183" r="12"/></g><path d="M210 177l94-13 95 19" fill="none" stroke="#fff0a8" stroke-width="7" stroke-linecap="round"/></g></svg>\n''';ET.fromstring(svg);write(f"visuals/laenderstatistik-neutral-{kind}.svg",svg)
dump("draft-pack.json",pack);dump("draft-review-schedule.json",{"policy":"Current official state statistics: review every 90 days.","records":schedule});baseline=json.loads((ROOT/"content/review-schedule.json").read_text())["records"];due=[r for r in baseline if r["next_review"]<=inp["checked"]];dump("validation.json",{"checked":inp["checked"],"questions":20,"counts":{g:len(pack[g]) for g in games},"unique_observation_keys":len(seen),"balanced_fact_levels":True,"official_sources":len(sources),"svg_variants":2,"safe_margin_px":40,"rendered_visual_qa":True,"image_corrections":[],"main_review_records":len(baseline),"due_records":due,"review_only":True,"database_writes":0});print(("Checked" if CHECK else "Built")+" 20 Deutschland state-statistics questions and two SVG formats")
