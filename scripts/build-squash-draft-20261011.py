"""Deterministic offline review export; no approved catalogue or database writes."""
import argparse,datetime,json,pathlib,xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1];DIR=ROOT/'content/research/2026-10-11-sport-squash'
parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');check=parser.parse_args().check
def read(name):return json.loads((DIR/name).read_text())
def write(name,text):
 p=DIR/name
 if check:assert p.exists() and p.read_text()==text,'Stale: '+name
 else:p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
def dump(name,value):write(name,json.dumps(value,ensure_ascii=False,indent=2)+'\n')
input=read('input.json');sources=read('sources.json');date=datetime.date.fromisoformat(input['checked'])
pack={'status':'review-only','verified':input['checked'],'base_commit':input['base_commit'],'images':{},**{g:[] for g in ['moreless','estimate','facts','jeopardy']}}
observations=read('rule-observations.json');seen=set();schedule=[]
for q in input['questions']:
 for obs in q['observation_keys']:
  assert obs not in seen,'Repeated observation '+obs
  seen.add(obs)
 assert all(sources[s]['checked']==input['checked'] and sources[s]['primary'] for s in q['source_refs'])
 row={k:v for k,v in q.items() if k!='game'}
 row.update(status='draft',verified=input['checked'],source=sources['rules']['url'],sources=[sources[s]['url'] for s in q['source_refs']],sets=['Sport · Squash · Regeln 2025'],time_dependent=True,data_year_note='2025 bezeichnet die Regelausgabe, nicht ein Leistungs- oder Erhebungsjahr.',visual=None if q['game']=='jeopardy' else 'squash-neutral')
 if q['game']!='jeopardy':row['subject']='squash-neutral'
 if q['game']=='moreless':
  values=[observations[x]['value']*60 for x in q['observation_keys']]
  assert values==[q['lv'],q['rv']] and q['lv']!=q['rv'] and q['metric']
 elif q['game']=='estimate':assert observations[q['observation_keys'][0]]['value']==q['a']
 elif q['game']=='facts':assert type(q['a'])==bool and q['e']
 else:assert isinstance(q['a'],str) and 1<=q['difficulty']<=5
 pack[q['game']].append(row)
 schedule.append({'id':q['id'],'game':q['game'],'source':sources['rules']['url'],'verified':input['checked'],'data_year':2025,'time_dependent':True,'review_interval_days':90,'next_review':str(date+datetime.timedelta(days=90)),'review_status':'draft-review-required'})
assert [len(pack[g]) for g in ['moreless','estimate','facts','jeopardy']]==[2,4,6,8]
assert len(set(q['id'] for q in input['questions']))==20
for level in ['easy','medium','hard']:
 answers=[q['a'] for q in pack['facts'] if q['difficulty']==level];assert sorted(answers)==[False,True]
variants={'card':'visuals/squash-neutral-card.svg','detail':'visuals/squash-neutral-detail.svg','license':'CC0-1.0','creator':'Original code-authored vector','answer_neutral':True,'safe_margin_px':40,'description':'Abstraktes Schlägersportmotiv; kein Courtplan, keine abzählbaren Zeiten, keine Brille oder Amtssymbole. Bei Jeopardy deaktiviert.'}
pack['images']['squash-neutral']=variants
for q in pack['moreless']:
 for label in [q['l'],q['r']]:pack['images'][label]=variants
for kind,width in [('card',720),('detail',960)]:
 offset=(width-720)//2
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img" aria-label="Abstraktes Schlägersportmotiv"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#192846"/><stop offset="1" stop-color="#0b1127"/></linearGradient><radialGradient id="glow"><stop stop-color="#47d1ca" stop-opacity=".2"/><stop offset="1" stop-color="#47d1ca" stop-opacity="0"/></radialGradient></defs><rect width="{width}" height="540" fill="url(#bg)"/><rect x="40" y="40" width="{width-80}" height="460" rx="28" fill="none" stroke="#79d8d4" stroke-opacity=".3"/><g transform="translate({offset},0)"><circle cx="330" cy="235" r="190" fill="url(#glow)"/><path d="M130 380Q330 450 605 345 M115 170Q330 90 600 150" fill="none" stroke="#405976" stroke-width="5"/><g transform="rotate(-25 330 240)"><ellipse cx="330" cy="210" rx="84" ry="116" fill="#18394e" stroke="#77e0d7" stroke-width="9"/><path d="M285 120V300M330 95V325M375 120V300M252 170H408M248 210H412M252 250H408" stroke="#396579" stroke-width="3"/><path d="M320 326V408Q330 425 340 408V326" fill="#886dc0" stroke="#bba0ed" stroke-width="5"/></g><circle cx="505" cy="288" r="24" fill="#152d43" stroke="#78cfdf" stroke-width="5"/><path d="M460 265Q490 230 540 235" fill="none" stroke="#3e7895" stroke-width="5"/><text x="360" y="470" text-anchor="middle" font-family="sans-serif" font-size="22" letter-spacing="2" fill="#9ce1df">SPORT &amp; SPIELREGELN</text></g></svg>\n'''
 ET.fromstring(svg);write('visuals/squash-neutral-'+kind+'.svg',svg)
dump('draft-pack.json',pack);dump('draft-review-schedule.json',{'policy':'Regelausgabe explizit; 90-Tage-Review auf Folgeausgabe. Keine automatische Freigabe.','records':schedule})
baseline=json.loads((ROOT/'content/review-schedule.json').read_text())['records'];due=[q for q in baseline if q['next_review']<=input['checked']]
dump('validation.json',{'checked':input['checked'],'questions':20,'counts':{g:len(pack[g]) for g in ['moreless','estimate','facts','jeopardy']},'numeric_observations_checked':8,'unique_observation_keys':len(seen),'balanced_fact_levels':True,'svg_variants':2,'main_review_records':len(baseline),'due_records':due,'review_only':True,'database_writes':0})
print(('Checked' if check else 'Built')+' 20 questions and two SVG formats')
