"""Build the 2026-10-15 UEFA Champions League review bundle offline."""
import argparse, datetime, json, pathlib, xml.etree.ElementTree as ET

ROOT=pathlib.Path(__file__).resolve().parents[1]
DIR=ROOT/'content/research/2026-10-15-champions-league-records'
parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');CHECK=parser.parse_args().check
def read(name):return json.loads((DIR/name).read_text())
def write(name,value):
 path=DIR/name
 if CHECK:assert path.exists() and path.read_text()==value,'Stale: '+name
 else:path.parent.mkdir(parents=True,exist_ok=True);path.write_text(value)
def dump(name,value):write(name,json.dumps(value,ensure_ascii=False,indent=2)+'\n')

source_input=read('input.json');sources=read('sources.json');observations=read('observations.json');checked=datetime.date.fromisoformat(source_input['checked'])
main_ref=ROOT/'.git/refs/heads/Main'
if main_ref.exists():assert source_input['base_commit']==main_ref.read_text().strip()
games=['moreless','estimate','facts','jeopardy']
pack={'status':'review-only','verified':source_input['checked'],'base_commit':source_input['base_commit'],'images':{},**{game:[] for game in games}}
seen=set();schedule=[]
for question in source_input['questions']:
 assert question['cat']=='Champions League' and question['subcategory'].startswith('Rekorde ·')
 assert question['rounding'] and question['section'] and question['data_year']
 assert all(ref in sources and sources[ref]['checked']==source_input['checked'] and sources[ref]['authority']=='official' for ref in question['source_refs'])
 for key in question['observation_keys']:
  assert key in observations and key not in seen,'Missing/repeated observation '+key;seen.add(key)
 row={key:value for key,value in question.items() if key!='game'}
 row.update(status='draft',verified=source_input['checked'],source=sources[question['source_refs'][0]]['url'],sources=[sources[ref]['url'] for ref in question['source_refs']],sets=['Champions League · Rekorde'],time_dependent=True,data_year_note='UEFA-Quellenstand bis 12.10.2026; Rekordwerte vor Freigabe erneut prüfen.',visual=None if question['game']=='jeopardy' else 'champions-league-neutral')
 if question['game']!='jeopardy':row['subject']='champions-league-neutral'
 if question['game']=='moreless':
  assert [observations[key]['value'] for key in question['observation_keys']]==[question['lv'],question['rv']] and question['lv']!=question['rv'] and question['metric']
 elif question['game']=='estimate':assert observations[question['observation_keys'][0]]['value']==question['a']
 elif question['game']=='facts':assert type(question['a']) is bool and question['e']
 else:assert isinstance(question['a'],str) and 1<=question['difficulty']<=5
 pack[question['game']].append(row)
 schedule.append({'id':question['id'],'game':question['game'],'source':sources[question['source_refs'][0]]['url'],'verified':source_input['checked'],'data_year':question['data_year'],'time_dependent':True,'review_interval_days':90,'next_review':str(checked+datetime.timedelta(days=90)),'review_status':'draft-review-required'})
assert [len(pack[g]) for g in games]==[2,4,6,8]
assert len(seen)==22 and len({q['id'] for q in source_input['questions']})==20
for level in ['easy','medium','hard']:assert sorted(q['a'] for q in pack['facts'] if q['difficulty']==level)==[False,True]

variants={'card':'visuals/champions-league-neutral-card.svg','detail':'visuals/champions-league-neutral-detail.svg','license':'CC0-1.0','creator':'Original code-authored vector','answer_neutral':True,'safe_margin_px':40,'description':'Abstraktes Flutlichtstadion mit neutralem Ball und Sternen, ohne UEFA-Marke, Vereinszeichen, Namen, Rekordzahlen oder Lösungshinweise; Jeopardy ohne eigenen Bildschlüssel.'}
pack['images']['champions-league-neutral']=variants
for q in pack['moreless']:
 for label in [q['l'],q['r']]:pack['images'][label]=variants
for kind,width in [('card',720),('detail',960)]:
 offset=(width-720)//2
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img" aria-label="Abstraktes Motiv zur europäischen Königsklasse"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#07152f"/><stop offset=".55" stop-color="#17255c"/><stop offset="1" stop-color="#32165d"/></linearGradient><radialGradient id="glow"><stop stop-color="#7de7ff" stop-opacity=".42"/><stop offset="1" stop-color="#7de7ff" stop-opacity="0"/></radialGradient></defs><rect width="{width}" height="540" fill="url(#bg)"/><rect x="40" y="40" width="{width-80}" height="460" rx="30" fill="none" stroke="#8eeaff" stroke-opacity=".42" stroke-width="2"/><g transform="translate({offset},0)"><circle cx="360" cy="232" r="210" fill="url(#glow)"/><path d="M110 380Q360 270 610 380v72H110z" fill="#0a2749" stroke="#85e6ff" stroke-width="5"/><path d="M145 364Q360 285 575 364M175 393Q360 334 545 393" fill="none" stroke="#9b83ff" stroke-width="7" opacity=".8"/><g fill="#c8f8ff"><path d="M164 136l8 18 19 2-15 13 5 19-17-10-17 10 5-19-15-13 19-2z"/><path d="M556 136l8 18 19 2-15 13 5 19-17-10-17 10 5-19-15-13 19-2z"/><path d="M360 83l8 18 19 2-15 13 5 19-17-10-17 10 5-19-15-13 19-2z"/></g><circle cx="360" cy="260" r="83" fill="#f6fbff" stroke="#a98cff" stroke-width="8"/><path d="M360 204l35 25-13 41h-44l-13-41zM325 229l-35 12 8 42 40-13M395 229l35 12-8 42-40-13M338 270l-25 34 35 25 34-25-22-34M298 283l-13 34 31 22 32-10M422 283l13 34-31 22-32-10" fill="none" stroke="#20335e" stroke-width="8" stroke-linejoin="round"/><path d="M108 110l58 78M612 110l-58 78" stroke="#f8d56b" stroke-width="14" stroke-linecap="round" opacity=".8"/><text x="360" y="482" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="700" letter-spacing="3" fill="#d4f8ff">KÖNIGSKLASSE</text></g></svg>\n'''
 ET.fromstring(svg);write(f'visuals/champions-league-neutral-{kind}.svg',svg)
dump('draft-pack.json',pack)
dump('draft-review-schedule.json',{'policy':'Veränderliche UEFA-Rekordtabellen: 90-Tage-Review; bei neuem Spieltag oder Rekordereignis früher. Keine automatische Freigabe.','records':schedule})
baseline=json.loads((ROOT/'content/review-schedule.json').read_text())['records'];due=[r for r in baseline if r['next_review']<=source_input['checked']]
dump('validation.json',{'checked':source_input['checked'],'questions':20,'counts':{g:len(pack[g]) for g in games},'numeric_observations_checked':8,'unique_observation_keys':len(seen),'balanced_fact_levels':True,'official_sources':len(sources),'primary_authority_sources':sum(1 for s in sources.values() if s['primary']),'svg_variants':2,'main_review_records':len(baseline),'due_records':due,'review_only':True,'database_writes':0})
print(('Checked' if CHECK else 'Built')+' 20 Champions League questions and two SVG formats')
