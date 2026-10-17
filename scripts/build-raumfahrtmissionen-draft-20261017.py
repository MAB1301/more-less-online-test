"""Build the 2026-10-17 space-missions review bundle offline."""
import argparse, datetime, json, pathlib, xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1];DIR=ROOT/'content/research/2026-10-17-raumfahrtmissionen'
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
 assert question['cat']=='Raumfahrtmissionen' and question['subcategory']=='Sonden · Ziele und Missionsdaten' and question['rounding'] and question['section'] and question['data_year']
 assert all(ref in sources and sources[ref]['checked']==source_input['checked'] and sources[ref]['authority']=='official' for ref in question['source_refs'])
 for key in question['observation_keys']:assert key in observations and key not in seen,'Missing/repeated '+key;seen.add(key)
 row={k:v for k,v in question.items() if k!='game'};row.update(status='draft',verified=source_input['checked'],source=sources[question['source_refs'][0]]['url'],sources=[sources[x]['url'] for x in question['source_refs']],sets=['Raumfahrtmissionen · Sonden · Ziele und Missionsdaten'],data_year_note='Historische Werte bleiben an die benannte Missionsphase gebunden; aktive Missionspläne und Rekorde vor Freigabe erneut prüfen.',visual=None if question['game']=='jeopardy' else 'space-missions-neutral')
 if question['game']!='jeopardy':row['subject']='space-missions-neutral'
 if question['game']=='moreless':assert [observations[k]['value'] for k in question['observation_keys']]==[question['lv'],question['rv']] and question['lv']!=question['rv'] and question['metric']
 elif question['game']=='estimate':assert observations[question['observation_keys'][0]]['value']==question['a']
 elif question['game']=='facts':assert type(question['a']) is bool and question['e']
 else:assert isinstance(question['a'],str) and 1<=question['difficulty']<=5
 pack[question['game']].append(row);interval=90 if question['time_dependent'] else 365;schedule.append({'id':question['id'],'game':question['game'],'source':sources[question['source_refs'][0]]['url'],'verified':source_input['checked'],'data_year':question['data_year'],'time_dependent':question['time_dependent'],'review_interval_days':interval,'next_review':str(checked+datetime.timedelta(days=interval)),'review_status':'draft-review-required'})
assert [len(pack[g]) for g in games]==[2,4,6,8] and len(seen)==22 and len({q['id'] for q in source_input['questions']})==20
for level in ['easy','medium','hard']:assert sorted(q['a'] for q in pack['facts'] if q['difficulty']==level)==[False,True]
variants={'card':'visuals/space-missions-neutral-card.svg','detail':'visuals/space-missions-neutral-detail.svg','license':'CC0-1.0','creator':'Original code-authored vector','answer_neutral':True,'safe_margin_px':40,'description':'Abstrakte Sonde, Sternfeld, Bahnbögen und Planetenformen ohne Missionsnamen, Zielkörper, Daten oder Zahlen; Jeopardy ohne eigenen Bildschlüssel.'};pack['images']['space-missions-neutral']=variants
for q in pack['moreless']:
 for label in [q['l'],q['r']]:pack['images'][label]=variants
for kind,width in [('card',720),('detail',960)]:
 offset=(width-720)//2
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img" aria-label="Abstrakte Raumsonde im All"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#07142d"/><stop offset=".55" stop-color="#1b2354"/><stop offset="1" stop-color="#4a1d61"/></linearGradient><radialGradient id="orb"><stop stop-color="#f6d26d"/><stop offset="1" stop-color="#d76386"/></radialGradient></defs><rect width="{width}" height="540" fill="url(#bg)"/><rect x="40" y="40" width="{width-80}" height="460" rx="30" fill="none" stroke="#82e8ff" stroke-opacity=".45" stroke-width="2"/><g transform="translate({offset},0)"><g fill="#d9f8ff"><circle cx="95" cy="115" r="3"/><circle cx="170" cy="80" r="4"/><circle cx="590" cy="110" r="3"/><circle cx="640" cy="205" r="4"/><circle cx="110" cy="310" r="4"/><circle cx="520" cy="330" r="3"/></g><ellipse cx="360" cy="270" rx="245" ry="140" fill="none" stroke="#7896ff" stroke-width="4" stroke-dasharray="10 12" opacity=".7"/><circle cx="570" cy="250" r="62" fill="url(#orb)"/><circle cx="570" cy="250" r="78" fill="none" stroke="#ffb6d1" stroke-width="5" opacity=".45"/><g transform="translate(286 186) rotate(-12 74 60)"><rect x="42" y="25" width="82" height="76" rx="14" fill="#d9e7f2" stroke="#77e6ff" stroke-width="6"/><rect x="0" y="36" width="42" height="54" fill="#285e94" stroke="#79caff" stroke-width="5"/><rect x="124" y="36" width="42" height="54" fill="#285e94" stroke="#79caff" stroke-width="5"/><circle cx="83" cy="62" r="19" fill="#241a46" stroke="#f2c96b" stroke-width="6"/><path d="M83 25V2m0 0l-13-17m13 17l16-15" stroke="#d9f8ff" stroke-width="5" stroke-linecap="round"/><path d="M42 101l-18 30m100-30l18 30" stroke="#77e6ff" stroke-width="6"/></g><path d="M135 420q105-95 220-15t230 0" fill="none" stroke="#55d5c6" stroke-width="8" stroke-linecap="round"/><text x="360" y="474" text-anchor="middle" font-family="sans-serif" font-size="21" font-weight="700" letter-spacing="3" fill="#d7fbff">MISSION IM ALL</text></g></svg>\n''';ET.fromstring(svg);write(f'visuals/space-missions-neutral-{kind}.svg',svg)
dump('draft-pack.json',pack);dump('draft-review-schedule.json',{'policy':'Aktive Missionspläne und aktuelle Rekorde: 90 Tage; abgeschlossene historische Missionsdaten: 365 Tage. Keine automatische Freigabe.','records':schedule})
baseline=json.loads((ROOT/'content/review-schedule.json').read_text())['records'];due=[r for r in baseline if r['next_review']<=source_input['checked']]
dump('validation.json',{'checked':source_input['checked'],'questions':20,'counts':{g:len(pack[g]) for g in games},'numeric_observations_checked':8,'unique_observation_keys':len(seen),'balanced_fact_levels':True,'official_sources':len(sources),'svg_variants':2,'main_review_records':len(baseline),'due_records':due,'review_only':True,'database_writes':0});print(('Checked' if CHECK else 'Built')+' 20 space-mission questions and two SVG formats')
