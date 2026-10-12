"""Deterministic offline review export; never changes approved content or a database."""
import argparse,datetime,json,pathlib,xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1]
DIR=ROOT/'content/research/2026-10-12-sportregeln-table-tennis'
parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');check=parser.parse_args().check
def read(name):return json.loads((DIR/name).read_text())
def write(name,text):
 p=DIR/name
 if check:assert p.exists() and p.read_text()==text,'Stale: '+name
 else:p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
def dump(name,value):write(name,json.dumps(value,ensure_ascii=False,indent=2)+'\n')
input=read('input.json');sources=read('sources.json');obs=read('rule-observations.json');day=datetime.date.fromisoformat(input['checked'])
assert input['base_commit']==(ROOT/'.git/refs/heads/Main').read_text().strip() if (ROOT/'.git/refs/heads/Main').exists() else input['base_commit']
pack={'status':'review-only','verified':input['checked'],'base_commit':input['base_commit'],'images':{},**{g:[] for g in ['moreless','estimate','facts','jeopardy']}}
seen=set();schedule=[]
for q in input['questions']:
 assert q['cat']=='Sportregeln' and q['subcategory']=='Tischtennis · ITTF-Regeln 2026'
 assert q['data_year']==2026 and q['rounding'] and q['section']
 assert all(sources[s]['checked']==input['checked'] and sources[s]['primary'] for s in q['source_refs'])
 for key in q['observation_keys']:
  assert key not in seen,'Repeated observation '+key;seen.add(key)
 row={k:v for k,v in q.items() if k!='game'}
 row.update(status='draft',verified=input['checked'],source=sources['rules']['url'],sources=[sources[s]['url'] for s in q['source_refs']],sets=['Sportregeln · Tischtennis · ITTF 2026'],time_dependent=True,data_year_note='2026 bezeichnet die ITTF-Regelausgabe, nicht ein Leistungs- oder Messjahr.',visual=None if q['game']=='jeopardy' else 'table-tennis-neutral')
 if q['game']!='jeopardy':row['subject']='table-tennis-neutral'
 if q['game']=='moreless':
  assert [obs[x]['value'] for x in q['observation_keys']]==[q['lv'],q['rv']] and q['lv']!=q['rv'] and q['metric']
 elif q['game']=='estimate':assert obs[q['observation_keys'][0]]['value']==q['a']
 elif q['game']=='facts':assert type(q['a']) is bool and q['e']
 else:assert isinstance(q['a'],str) and 1<=q['difficulty']<=5
 pack[q['game']].append(row)
 schedule.append({'id':q['id'],'game':q['game'],'source':sources['rules']['url'],'verified':input['checked'],'data_year':2026,'time_dependent':True,'review_interval_days':90,'next_review':str(day+datetime.timedelta(days=90)),'review_status':'draft-review-required'})
assert [len(pack[g]) for g in ['moreless','estimate','facts','jeopardy']]==[2,4,6,8]
assert len(seen)==22 and len({q['id'] for q in input['questions']})==20
for level in ['easy','medium','hard']:
 answers=[q['a'] for q in pack['facts'] if q['difficulty']==level];assert sorted(answers)==[False,True]
variants={'card':'visuals/table-tennis-neutral-card.svg','detail':'visuals/table-tennis-neutral-detail.svg','license':'CC0-1.0','creator':'Original code-authored vector','answer_neutral':True,'safe_margin_px':40,'description':'Abstraktes Tischtennismotiv ohne Maße, Punktzahlen, Regeltexte oder Lösungselemente; Jeopardy-Zeilen tragen keinen eigenen Bildschlüssel.'}
pack['images']['table-tennis-neutral']=variants
for q in pack['moreless']:
 for label in [q['l'],q['r']]:pack['images'][label]=variants
for kind,width in [('card',720),('detail',960)]:
 offset=(width-720)//2
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img" aria-label="Abstraktes Tischtennismotiv"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#0b1f3a"/><stop offset="1" stop-color="#120d2e"/></linearGradient><radialGradient id="g"><stop stop-color="#6ce8ff" stop-opacity=".24"/><stop offset="1" stop-color="#6ce8ff" stop-opacity="0"/></radialGradient></defs><rect width="{width}" height="540" fill="url(#bg)"/><rect x="40" y="40" width="{width-80}" height="460" rx="30" fill="none" stroke="#75ddf4" stroke-opacity=".35" stroke-width="2"/><g transform="translate({offset},0)"><circle cx="360" cy="240" r="200" fill="url(#g)"/><path d="M120 355L600 355 530 455 190 455Z" fill="#173c67" stroke="#70dbe8" stroke-width="5"/><path d="M360 350V455M145 395H575" stroke="#8adbe6" stroke-opacity=".55" stroke-width="3"/><path d="M165 330H555" stroke="#d8f8ff" stroke-width="8"/><path d="M360 325V365" stroke="#d8f8ff" stroke-width="6"/><g transform="rotate(-22 265 220)"><ellipse cx="265" cy="190" rx="70" ry="86" fill="#ff4d8b" stroke="#ffd2e2" stroke-width="7"/><path d="M252 270V350Q265 370 278 350V270" fill="#7e5ce4" stroke="#cbbfff" stroke-width="6"/></g><circle cx="455" cy="218" r="21" fill="#f7fbff" stroke="#8ee7fa" stroke-width="5"/><path d="M412 236Q445 185 500 178" fill="none" stroke="#8ee7fa" stroke-opacity=".55" stroke-width="5"/><text x="360" y="486" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="700" letter-spacing="2" fill="#b7eff8">TISCHTENNIS · REGELN</text></g></svg>\n'''
 ET.fromstring(svg);write('visuals/table-tennis-neutral-'+kind+'.svg',svg)
dump('draft-pack.json',pack)
dump('draft-review-schedule.json',{'policy':'Regelausgabe explizit; 90-Tage-Prüfung auf Folgeausgabe/Übergangsänderung. Keine automatische Freigabe.','records':schedule})
baseline=json.loads((ROOT/'content/review-schedule.json').read_text())['records'];due=[q for q in baseline if q['next_review']<=input['checked']]
dump('validation.json',{'checked':input['checked'],'questions':20,'counts':{g:len(pack[g]) for g in ['moreless','estimate','facts','jeopardy']},'numeric_observations_checked':8,'unique_observation_keys':len(seen),'balanced_fact_levels':True,'svg_variants':2,'main_review_records':len(baseline),'due_records':due,'review_only':True,'database_writes':0})
print(('Checked' if check else 'Built')+' 20 questions and two SVG formats')
