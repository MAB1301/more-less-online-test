"""Build the 2026-10-16 US national-park landscapes review bundle offline."""
import argparse, datetime, json, pathlib, xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1];DIR=ROOT/'content/research/2026-10-16-nationalparks-landscapes'
parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');CHECK=parser.parse_args().check
def read(name):return json.loads((DIR/name).read_text())
def write(name,value):
 path=DIR/name
 if CHECK:assert path.exists() and path.read_text()==value,'Stale: '+name
 else:path.parent.mkdir(parents=True,exist_ok=True);path.write_text(value)
def dump(name,value):write(name,json.dumps(value,ensure_ascii=False,indent=2)+'\n')
source_input=read('input.json');sources=read('sources.json');observations=read('observations.json');checked=datetime.date.fromisoformat(source_input['checked']);games=['moreless','estimate','facts','jeopardy']
main_ref=ROOT/'.git/refs/heads/Main'
if main_ref.exists():assert source_input['base_commit']==main_ref.read_text().strip()
pack={'status':'review-only','verified':source_input['checked'],'base_commit':source_input['base_commit'],'images':{},**{g:[] for g in games}};seen=set();schedule=[]
for question in source_input['questions']:
 assert question['cat']=='Nationalparks' and question['subcategory']=='USA · Landschaften und Geologie' and question['rounding'] and question['section'] and question['data_year']
 assert all(ref in sources and sources[ref]['checked']==source_input['checked'] and sources[ref]['authority']=='official' for ref in question['source_refs'])
 for key in question['observation_keys']:assert key in observations and key not in seen,'Missing/repeated '+key;seen.add(key)
 row={k:v for k,v in question.items() if k!='game'};row.update(status='draft',verified=source_input['checked'],source=sources[question['source_refs'][0]]['url'],sources=[sources[x]['url'] for x in question['source_refs']],sets=['Nationalparks · USA · Landschaften und Geologie'],time_dependent=True,data_year_note='NPS-Quellenstand laut Einzelfrage; Grenz-, Mess- und Naturwerte vor Freigabe erneut prüfen.',visual=None if question['game']=='jeopardy' else 'national-park-landscape-neutral')
 if question['game']!='jeopardy':row['subject']='national-park-landscape-neutral'
 if question['game']=='moreless':assert [observations[k]['value'] for k in question['observation_keys']]==[question['lv'],question['rv']] and question['lv']!=question['rv'] and question['metric']
 elif question['game']=='estimate':assert observations[question['observation_keys'][0]]['value']==question['a']
 elif question['game']=='facts':assert type(question['a']) is bool and question['e']
 else:assert isinstance(question['a'],str) and 1<=question['difficulty']<=5
 pack[question['game']].append(row);schedule.append({'id':question['id'],'game':question['game'],'source':sources[question['source_refs'][0]]['url'],'verified':source_input['checked'],'data_year':question['data_year'],'time_dependent':True,'review_interval_days':365,'next_review':str(checked+datetime.timedelta(days=365)),'review_status':'draft-review-required'})
assert [len(pack[g]) for g in games]==[2,4,6,8] and len(seen)==22 and len({q['id'] for q in source_input['questions']})==20
for level in ['easy','medium','hard']:assert sorted(q['a'] for q in pack['facts'] if q['difficulty']==level)==[False,True]
variants={'card':'visuals/national-park-landscape-neutral-card.svg','detail':'visuals/national-park-landscape-neutral-detail.svg','license':'CC0-1.0','creator':'Original code-authored vector','answer_neutral':True,'safe_margin_px':40,'description':'Abstrakte Vulkan-, Dünen-, See- und Höhlenlandschaft ohne Parknamen, Kartenumrisse, Messzahlen oder Lösungshinweise; Jeopardy ohne eigenen Bildschlüssel.'};pack['images']['national-park-landscape-neutral']=variants
for q in pack['moreless']:
 for label in [q['l'],q['r']]:pack['images'][label]=variants
for kind,width in [('card',720),('detail',960)]:
 offset=(width-720)//2
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img" aria-label="Abstrakte Nationalparklandschaft"><defs><linearGradient id="sky" x2="1" y2="1"><stop stop-color="#071b35"/><stop offset=".55" stop-color="#15445b"/><stop offset="1" stop-color="#39245d"/></linearGradient><linearGradient id="sand"><stop stop-color="#f0b65f"/><stop offset="1" stop-color="#9d5e43"/></linearGradient></defs><rect width="{width}" height="540" fill="url(#sky)"/><rect x="40" y="40" width="{width-80}" height="460" rx="30" fill="none" stroke="#9debd8" stroke-opacity=".45" stroke-width="2"/><g transform="translate({offset},0)"><circle cx="520" cy="142" r="45" fill="#ffd878" opacity=".9"/><path d="M85 365l155-190 75 94 77-128 213 224z" fill="#173f50" stroke="#8ce1cf" stroke-width="7"/><path d="M240 175l-38 47 39-8 30 34 44 21zM392 141l-32 54 38-14 42 48 42 9z" fill="#e9f8ef" opacity=".9"/><ellipse cx="362" cy="365" rx="170" ry="48" fill="#54b8c2" stroke="#a7f5e7" stroke-width="6"/><path d="M70 420q120-70 240 0t340 0v54H70z" fill="url(#sand)"/><path d="M492 416q42-82 92 0M525 417q28-52 60 0" fill="none" stroke="#ffe6a0" stroke-width="8"/><path d="M116 416v-92m0 0l-27 38m27-38l29 38m-29-18l-34 43m34-43l36 43" stroke="#17382d" stroke-width="13" stroke-linecap="round"/><path d="M610 420c-34-38-30-91 5-111 34 23 36 72-5 111z" fill="#161d31" stroke="#8c77c8" stroke-width="6"/><text x="360" y="486" text-anchor="middle" font-family="sans-serif" font-size="21" font-weight="700" letter-spacing="3" fill="#d4fff1">WILDE LANDSCHAFTEN</text></g></svg>\n''';ET.fromstring(svg);write(f'visuals/national-park-landscape-neutral-{kind}.svg',svg)
dump('draft-pack.json',pack);dump('draft-review-schedule.json',{'policy':'NPS-Grenz-, Mess- und Naturwerte: jährliche Prüfung, bei offizieller Neumessung oder Grenzänderung früher. Keine automatische Freigabe.','records':schedule})
baseline=json.loads((ROOT/'content/review-schedule.json').read_text())['records'];due=[r for r in baseline if r['next_review']<=source_input['checked']]
dump('validation.json',{'checked':source_input['checked'],'questions':20,'counts':{g:len(pack[g]) for g in games},'numeric_observations_checked':8,'unique_observation_keys':len(seen),'balanced_fact_levels':True,'official_sources':len(sources),'svg_variants':2,'main_review_records':len(baseline),'due_records':due,'review_only':True,'database_writes':0});print(('Checked' if CHECK else 'Built')+' 20 national-park questions and two SVG formats')
