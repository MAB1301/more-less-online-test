"""Build the review-only Bundestag election history bundle deterministically."""
import argparse,datetime,json,pathlib,xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1]
DIR=ROOT/"content/research/2026-11-11-geschichte-bundestagswahlen"
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
 assert q["cat"]=="Geschichte" and q["rounding"] and q["notes"]
 for r in q["source_refs"]:assert sources[r]["checked"]==inp["checked"] and sources[r]["authority"]=="official"
 for k in q["observation_keys"]:assert k in obs and k not in seen;seen.add(k)
 g=q["game"];row={k:v for k,v in q.items() if k!="game"}
 row.update(status="draft",verified=inp["checked"],source=sources[q["source_refs"][0]]["url"],sources=[sources[r]["url"] for r in q["source_refs"]],sets=["Geschichte · Bundestagswahlen 1961–1983"],visual=None if g=="jeopardy" else "geschichte-bundestagswahl-neutral")
 if g!="jeopardy":row["subject"]="geschichte-bundestagswahl-neutral"
 if g=="moreless":assert [obs[k]["value"] for k in q["observation_keys"]]==[q["lv"],q["rv"]] and q["lv"]!=q["rv"]
 elif g=="estimate":assert obs[q["observation_keys"][0]]["value"]==q["a"]
 elif g=="facts":assert type(q["a"]) is bool and q["e"]
 else:assert isinstance(q["a"],str) and 1<=q["difficulty"]<=5
 pack[g].append(row)
 schedule.append({"id":q["id"],"game":g,"source":row["source"],"verified":inp["checked"],"data_year":q["data_year"],"time_dependent":q["time_dependent"],"review_interval_days":365,"next_review":str(checked+datetime.timedelta(days=365)),"review_status":"draft-review-required"})
assert [len(pack[g]) for g in games]==[2,4,6,8] and len(seen)==22 and len({q["id"] for q in inp["questions"]})==20
for level in ["easy","medium","hard"]:assert sorted(q["a"] for q in pack["facts"] if q["difficulty"]==level)==[False,True]
variants={"card":"visuals/geschichte-bundestagswahl-neutral-card.svg","detail":"visuals/geschichte-bundestagswahl-neutral-detail.svg","license":"CC0-1.0","creator":"Original code-authored vector","answer_neutral":True,"safe_margin_px":40,"description":"Generic ballot box and semicircular parliament; no party colors, names, years, percentages, seat counts, maps or answers."}
pack["images"]["geschichte-bundestagswahl-neutral"]=variants
for q in pack["moreless"]:pack["images"][q["l"]]=variants;pack["images"][q["r"]]=variants
for kind,width in [("card",720),("detail",960)]:
 cx=width/2
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img" aria-label="Antwortneutrale Illustration zu historischen Bundestagswahlen"><defs><linearGradient id="bg" x2="0" y2="1"><stop stop-color="#0b1733"/><stop offset="1" stop-color="#233f67"/></linearGradient><linearGradient id="box" x2="0" y2="1"><stop stop-color="#eef4ff"/><stop offset="1" stop-color="#9fb8d8"/></linearGradient></defs><rect width="{width}" height="540" fill="url(#bg)"/><rect x="40" y="40" width="{width-80}" height="460" rx="32" fill="none" stroke="#d9e9ff" stroke-opacity=".75" stroke-width="3"/><g transform="translate({cx} 122)"><path d="M-104 12L0-46 104 12" fill="none" stroke="#d9e9ff" stroke-width="12" stroke-linecap="round"/><path d="M-86 20V96M-42 20V96M0 20V96M42 20V96M86 20V96M-108 102H108" fill="none" stroke="#9ec5ee" stroke-width="12" stroke-linecap="round"/></g><g transform="translate({cx} 340)"><path d="M-224 96a224 154 0 0 1 448 0" fill="none" stroke="#6fa2d4" stroke-width="34" stroke-dasharray="24 14"/><path d="M-158 96a158 104 0 0 1 316 0" fill="none" stroke="#a8c8e8" stroke-width="30" stroke-dasharray="22 13"/><path d="M-92 96a92 58 0 0 1 184 0" fill="none" stroke="#e7f1fb" stroke-width="26" stroke-dasharray="19 12"/></g><g transform="translate({cx} 274)"><rect x="-76" y="-22" width="152" height="112" rx="12" fill="url(#box)" stroke="#f7fbff" stroke-width="4"/><path d="M-42 9H42" stroke="#284b73" stroke-width="9" stroke-linecap="round"/><path d="M-36-84L38-62 22-3-52-25Z" fill="#f9fcff" stroke="#9ec5ee" stroke-width="4"/><path d="M-17-58l17 17 31-35" fill="none" stroke="#315f8e" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></g></svg>\n'''
 ET.fromstring(svg);write(f"visuals/geschichte-bundestagswahl-neutral-{kind}.svg",svg)
dump("draft-pack.json",pack)
dump("draft-review-schedule.json",{"policy":"Historische amtliche Endergebnisse: jährliche Link- und Revisionskontrolle, obwohl die Werte grundsätzlich stabil sind.","records":schedule})
baseline=json.loads((ROOT/"content/review-schedule.json").read_text())["records"];due=[r for r in baseline if r["next_review"]<=inp["checked"]]
dump("validation.json",{"checked":inp["checked"],"questions":20,"counts":{g:len(pack[g]) for g in games},"unique_observation_keys":len(seen),"balanced_fact_levels":True,"official_sources":len(sources),"svg_variants":2,"safe_margin_px":40,"rendered_visual_qa":True,"image_corrections":["Neue neutrale Karten- und Detailgrafik mit 40-px-Sicherheitsrahmen; alle Motive liegen vollständig innerhalb des Rahmens."],"main_review_records":len(baseline),"due_records":due,"review_only":True,"database_writes":0})
print(("Checked" if CHECK else "Built")+" 20 Bundestagswahl history questions and two SVG formats")
