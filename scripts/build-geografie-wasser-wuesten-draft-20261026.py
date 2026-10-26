"""Build or verify the 2026-10-26 geography review bundle."""
import argparse,json,pathlib,xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1];DIR=ROOT/"content/research/2026-10-26-geografie-wasser-wuesten"
p=argparse.ArgumentParser();p.add_argument("--check",action="store_true");CHECK=p.parse_args().check
def read(n):return json.loads((DIR/n).read_text())
def emit(n,v):
 s=json.dumps(v,ensure_ascii=False,indent=2)+"\n";path=DIR/n
 if CHECK:assert json.loads(path.read_text())==v,"Stale generated file: "+n
 else:path.write_text(s)
src,sources,obs=read("input.json"),read("sources.json"),read("observations.json");games=["moreless","estimate","facts","jeopardy"];seen=set()
visual={"card":"visuals/earth-layers-neutral-card.svg","detail":"visuals/earth-layers-neutral-detail.svg","license":"CC0-1.0","creator":"Original code-authored vector","answer_neutral":True,"safe_margin_px":40,"description":"Abstrakte Erd-, Wasser- und Dünenlandschaft ohne Kartenlabels, Eigennamen, Zahlen oder Lösungen."}
pack={"status":"review-only","verified":src["checked"],"base_commit":src["base_commit"],"images":{"earth-layers-neutral":visual},**{g:[] for g in games}};schedule=[]
for q in src["questions"]:
 game=q["game"];assert game in games and q["source_refs"] and q["observation_keys"]
 for ref in q["source_refs"]:assert sources[ref]["checked"]==src["checked"] and sources[ref]["authority"]=="official-agency"
 for key in q["observation_keys"]:assert key in obs and key not in seen;seen.add(key)
 row={k:v for k,v in q.items() if k!="game"};row.update(cat=src["category"],subcategory=src["subcategory"],status="draft",verified=src["checked"],source=sources[q["source_refs"][0]]["url"],sources=[sources[r]["url"] for r in q["source_refs"]],sets=[src["set"]],data_year_note="Wert und Bezugsrahmen laut zitierter Behördenquelle; Wiedervorlage nach 90 Tagen.",visual="earth-layers-neutral",subject="earth-layers-neutral")
 if game=="moreless":
  assert [obs[k]["value"] for k in q["observation_keys"]]==[q["lv"],q["rv"]] and q["lv"]!=q["rv"]
  for label in [q["l"],q["r"]]:pack["images"][label]=visual
 elif game=="estimate":assert obs[q["observation_keys"][0]]["value"]==q["a"]
 elif game=="facts":assert type(q["a"]) is bool and q["e"]
 else:assert isinstance(q["a"],str) and 1<=q["difficulty"]<=5
 pack[game].append(row);schedule.append({"id":q["id"],"game":game,"source":sources[q["source_refs"][0]]["url"],"verified":src["checked"],"data_year":q["data_year"],"time_dependent":True,"review_interval_days":90,"next_review":"2027-01-24","review_status":"draft-review-required"})
assert [len(pack[g]) for g in games]==[2,4,6,8] and len(seen)==22
for level in ["easy","medium","hard"]:assert sorted(x["a"] for x in pack["facts"] if x["difficulty"]==level)==[False,True]
for name,w in [("earth-layers-neutral-card.svg","720"),("earth-layers-neutral-detail.svg","960")]:
 root=ET.parse(DIR/"visuals"/name).getroot();assert root.attrib["width"]==w and root.attrib["height"]=="540"
emit("draft-pack.json",pack);emit("draft-review-schedule.json",{"policy":"Aktualisierte Behördenseiten und gerundete Naturmesswerte: 90 Tage; keine automatische Veröffentlichung.","records":schedule})
baseline=json.loads((ROOT/"content/review-schedule.json").read_text())["records"];assert not [x for x in baseline if x["next_review"]<=src["checked"]]
print(("Checked" if CHECK else "Built")+" 20 geography questions and two neutral SVG structures")
