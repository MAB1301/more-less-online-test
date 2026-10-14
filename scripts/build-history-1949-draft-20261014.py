"""Build the 2026-10-14 German democracy-history review bundle offline."""
import argparse, datetime, json, pathlib, xml.etree.ElementTree as ET

ROOT=pathlib.Path(__file__).resolve().parents[1]
DIR=ROOT/'content/research/2026-10-14-geschichte-1949'
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
 assert question['cat']=='Geschichte' and question['subcategory']=='Bundesrepublik · Gründungsjahre 1948–1953'
 assert question['rounding'] and question['section'] and question['data_year']
 assert all(sources[ref]['checked']==source_input['checked'] and sources[ref]['authority']=='official' for ref in question['source_refs'])
 assert any(sources[ref]['primary'] for ref in question['source_refs']) or question['game'] in ('facts','jeopardy')
 for key in question['observation_keys']:
  assert key not in seen,'Repeated observation '+key;seen.add(key)
 row={key:value for key,value in question.items() if key!='game'}
 row.update(status='draft',verified=source_input['checked'],source=sources[question['source_refs'][0]]['url'],sources=[sources[ref]['url'] for ref in question['source_refs']],sets=['Geschichte · Bundesrepublik · Gründungsjahre'],time_dependent=False,data_year_note='Historischer Stand 1948–1953; am 14.10.2026 gegen amtliche Wahlstatistik und Bundestagsquellen geprüft.',visual=None if question['game']=='jeopardy' else 'democracy-history-neutral')
 if question['game']!='jeopardy':row['subject']='democracy-history-neutral'
 if question['game']=='moreless':
  assert [observations[key]['value'] for key in question['observation_keys']]==[question['lv'],question['rv']] and question['lv']!=question['rv'] and question['metric']
 elif question['game']=='estimate':assert observations[question['observation_keys'][0]]['value']==question['a']
 elif question['game']=='facts':assert type(question['a']) is bool and question['e']
 else:assert isinstance(question['a'],str) and 1<=question['difficulty']<=5
 pack[question['game']].append(row)
 schedule.append({'id':question['id'],'game':question['game'],'source':sources[question['source_refs'][0]]['url'],'verified':source_input['checked'],'data_year':question['data_year'],'time_dependent':False,'review_interval_days':365,'next_review':str(checked+datetime.timedelta(days=365)),'review_status':'draft-review-required'})
assert [len(pack[g]) for g in games]==[2,4,6,8]
assert len(seen)==22 and len({q['id'] for q in source_input['questions']})==20
for level in ['easy','medium','hard']:assert sorted(q['a'] for q in pack['facts'] if q['difficulty']==level)==[False,True]

variants={'card':'visuals/democracy-history-neutral-card.svg','detail':'visuals/democracy-history-neutral-detail.svg','license':'CC0-1.0','creator':'Original code-authored vector','answer_neutral':True,'safe_margin_px':40,'description':'Abstrakte Wahlurne, Stimmzettel und Parlamentsbogen ohne Daten, Namen, Zahlen, Parteisymbole oder Lösungshinweise; Jeopardy ohne eigenen Bildschlüssel.'}
pack['images']['democracy-history-neutral']=variants
for q in pack['moreless']:
 for label in [q['l'],q['r']]:pack['images'][label]=variants
for kind,width in [('card',720),('detail',960)]:
 offset=(width-720)//2
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img" aria-label="Abstraktes Motiv zur Demokratiegeschichte"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#081d36"/><stop offset="1" stop-color="#26113f"/></linearGradient><radialGradient id="g"><stop stop-color="#62e5ff" stop-opacity=".24"/><stop offset="1" stop-color="#62e5ff" stop-opacity="0"/></radialGradient></defs><rect width="{width}" height="540" fill="url(#bg)"/><rect x="40" y="40" width="{width-80}" height="460" rx="30" fill="none" stroke="#78dff4" stroke-opacity=".38" stroke-width="2"/><g transform="translate({offset},0)"><circle cx="360" cy="240" r="205" fill="url(#g)"/><path d="M160 350h400v92H160z" fill="#173e67" stroke="#7ee6f7" stroke-width="6"/><path d="M205 350v-95h310v95" fill="#172d54" stroke="#baa9ff" stroke-width="7"/><path d="M185 255l175-95 175 95z" fill="#6d55cf" stroke="#c8bbff" stroke-width="7"/><path d="M250 255v95M315 255v95M405 255v95M470 255v95" stroke="#8be9f6" stroke-width="12"/><rect x="273" y="176" width="174" height="112" rx="12" fill="#f7fbff" stroke="#ffb850" stroke-width="6" transform="rotate(-8 360 232)"/><path d="M314 218l30 28 61-72" fill="none" stroke="#e44890" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M135 442h450" stroke="#9beefd" stroke-width="12" stroke-linecap="round"/><text x="360" y="486" text-anchor="middle" font-family="sans-serif" font-size="21" font-weight="700" letter-spacing="2" fill="#c7f4ff">DEMOKRATIEGESCHICHTE</text></g></svg>\n'''
 ET.fromstring(svg);write(f'visuals/democracy-history-neutral-{kind}.svg',svg)
dump('draft-pack.json',pack)
dump('draft-review-schedule.json',{'policy':'Stabile historische Quellen: 365-Tage-Review auf redaktionelle Präzisierung oder Quellenänderung. Keine automatische Freigabe.','records':schedule})
baseline=json.loads((ROOT/'content/review-schedule.json').read_text())['records'];due=[r for r in baseline if r['next_review']<=source_input['checked']]
dump('validation.json',{'checked':source_input['checked'],'questions':20,'counts':{g:len(pack[g]) for g in games},'numeric_observations_checked':8,'unique_observation_keys':len(seen),'balanced_fact_levels':True,'official_sources':len(sources),'primary_record_sources':sum(1 for s in sources.values() if s['primary']),'svg_variants':2,'main_review_records':len(baseline),'due_records':due,'review_only':True,'database_writes':0})
print(('Checked' if CHECK else 'Built')+' 20 history questions and two SVG formats')
