"""Offline deterministic review-pack builder. Never modifies approved.js or Daily."""
import argparse, datetime, json, pathlib

ROOT=pathlib.Path(__file__).resolve().parents[1]
DIR=ROOT/'content/research/2026-10-10-growth'
CHECK=argparse.ArgumentParser()
CHECK.add_argument('--check',action='store_true')
checking=CHECK.parse_args().check
def read(name):return json.loads((DIR/name).read_text())
def write(name,text):
 p=DIR/name
 if checking:
  assert p.exists() and p.read_text()==text, 'Stale artifact: '+name
 else:
  p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
def dump(name,value):write(name,json.dumps(value,ensure_ascii=False,indent=2)+'\n')
data=read('input.json');sources=read('sources.json');date=datetime.date.fromisoformat(data['checked'])
pack={'status':'review-only','verified':data['checked'],'base_commit':data['base_commit'],'images':{},**{g:[] for g in ['moreless','estimate','facts','jeopardy']}}
counts={};ids=set();semantics=set();observations=set();schedule=[]
motifs={'Tierwelt':('forest','WALD & VERHALTEN','#46caae'),'Bauwerke':('engineering','BAU & TECHNIK','#e8b56e'),'Allgemeinwissen':('design','FORM & GESTALTUNG','#aa8bf2'),'Städte':('city','STADT & GEOGRAFIE','#70baf0'),'Länder':('globe','LAND & GESELLSCHAFT','#de91b4')}
city=read('census-observations.json')
wb={m:{r['countryiso3code']:r['value'] for r in read('wb-'+m+'.json')[1]} for m in ['age','arable','urban']}
for q in data['questions']:
 assert q['id'] not in ids and q['semantic_key'] not in semantics
 ids.add(q['id']);semantics.add(q['semantic_key'])
 assert q['evidence'] and q['source_refs'] and q['rounding']
 assert all(sources[s]['checked']==data['checked'] and sources[s]['primary'] for s in q['source_refs'])
 for observation in q.get('observation_ids',[]):
  assert observation not in observations, 'Repeated observation across games: '+observation
  observations.add(observation)
 count=counts.setdefault(q['cat'],{g:0 for g in ['moreless','estimate','facts','jeopardy']});count[q['game']]+=1
 urls=list(dict.fromkeys(sources[s]['url'] for s in q['source_refs']))
 row={k:v for k,v in q.items() if k!='game'}
 row.update(status='draft',verified=data['checked'],source=urls[0],sources=urls,sets=[q['cat']+' · geprüfter Entwurf 10.10.2026'],time_dependent=q.get('time_dependent',False))
 row['data_year_note']='Undatierte Sachübersicht; kein erfundenes Erhebungsjahr.' if q['data_year'] is None else 'Explizit benanntes Daten-/Quellenjahr; kein aktueller Live-Wert.'
 motif=motifs[q['cat']][0]
 row['visual']=None if q['game']=='jeopardy' else motif
 if q['game'] in ['estimate','facts']:row['subject']=motif
 if q['game']=='moreless':
  assert isinstance(q['lv'],(int,float)) and isinstance(q['rv'],(int,float)) and q['lv']!=q['rv'] and q['u'] and q['metric']
 if q['game']=='estimate':assert isinstance(q['a'],(int,float)) and q['u']
 if q['game']=='facts':assert type(q['a'])==bool and q['e'] and q['difficulty'] in ['easy','medium','hard']
 if q['game']=='jeopardy':assert q['a'] and 1<=q['difficulty']<=5
 pack[q['game']].append(row)
 interval=90 if row['time_dependent'] else 365
 schedule.append({'id':q['id'],'game':q['game'],'subject':q.get('q',q.get('s',q.get('l'))),'verified':data['checked'],'source':urls[0],'data_year':q['data_year'],'time_dependent':row['time_dependent'],'review_interval_days':interval,'next_review':str(date+datetime.timedelta(days=interval)),'review_status':'draft-review-required'})
assert len(ids)==100
assert all(sum(c.values())==20 for c in counts.values())
for cat in counts:
 for level in ['easy','medium','hard']:
  truths=[q['a'] for q in pack['facts'] if q['cat']==cat and q['difficulty']==level]
  assert sum(truths)==len(truths)/2, (cat,level)
for cat in ['Tierwelt','Allgemeinwissen','Bauwerke']:
 assert len([q for q in pack['jeopardy'] if q['cat']==cat])>=5
# Validate every external numeric observation against archived raw values.
for q in data['questions']:
 obs=q.get('observation_ids',[])
 if not obs:continue
 values=[]
 for o in obs:
  parts=o.split(':')
  if parts[0] in wb:values.append(round(wb[parts[0]][parts[1]],2))
  else:
   r=next(x for x in city.values() if x['GEOID']==parts[0]);field=parts[1]
   values.append(round(r['land_m2']/1e6,2) if field=='ALAND' else round(r['internal_latitude_deg'],4) if field=='INTPTLAT' else round(100*r['water_m2']/(r['land_m2']+r['water_m2']),2))
 if q['game']=='moreless':assert values==[q['lv'],q['rv']]
 elif q['game']=='estimate':assert values==[q['a']]
 else:
  threshold=float(q['s'].split('mehr als ')[1].split(' %')[0]) if q['cat']=='Städte' else float(q['s'].split('über ')[1].split(' %')[0])
  assert (values[0]>threshold)==q['a'] and f'{values[0]:.2f}' in q['e']
# Original vectors, deliberately no subject portraits, scales, numbers or solutions.
for cat,(name,label,color) in motifs.items():
 pack['images'][name]={'card':'visuals/'+name+'-card.svg','detail':'visuals/'+name+'-detail.svg','license':'CC0-1.0','creator':'Original code-authored vector','answer_neutral':True,'safe_margin_px':36,'description':'Thematisches Symbolbild, kein exaktes Gegenstands- oder Zahlenbild. Bei Jeopardy deaktiviert.'}
 shapes={
 'forest':'<path d="M50 325 Q160 250 270 315 T670 280 V440 H50Z" fill="#173e41"/><path d="M70 390 Q220 320 360 360 T650 335" fill="none" stroke="#46caae" stroke-width="10"/><path d="M150 305V175M450 270V140M565 310V205" stroke="#254f50" stroke-width="18"/><path d="M102 185L150 95L198 185Z M388 155L450 64L512 155Z M517 210L565 122L613 210Z" fill="#27836c"/>',
 'engineering':'<path d="M85 345H635 M130 345V245H580V345 M130 245L240 345L350 245L465 345L580 245" stroke="#e8b56e" stroke-width="9" fill="none"/><path d="M165 140H550 M165 118V180 M550 118V180" stroke="#967446" stroke-width="6"/><circle cx="355" cy="140" r="21" fill="#e8b56e"/>',
 'design':'<rect x="145" y="145" width="380" height="205" rx="20" fill="#392d61" stroke="#aa8bf2" stroke-width="6"/><path d="M215 100V395 M185 100H245 M185 395H245 M585 145V350 M555 145H615 M555 350H615" stroke="#776594" stroke-width="6"/><path d="M215 230H460 M215 270H395" stroke="#8d7ab4" stroke-width="8"/><circle cx="450" cy="195" r="18" fill="#aa8bf2"/>',
 'city':'<path d="M75 360H650V415H75Z" fill="#184561"/><path d="M120 355V215H200V355 M250 355V135H355V355 M405 355V245H510V355 M560 355V185H625V355" fill="#24475f" stroke="#70baf0" stroke-width="5"/><path d="M95 390Q220 355 345 390T635 385" stroke="#70baf0" stroke-width="6" fill="none"/>',
 'globe':'<circle cx="360" cy="235" r="145" fill="#34223f" stroke="#de91b4" stroke-width="6"/><ellipse cx="360" cy="235" rx="70" ry="145" stroke="#795073" stroke-width="5" fill="none"/><path d="M225 185H495 M215 235H505 M225 285H495" stroke="#795073" stroke-width="5"/><path d="M80 400H640" stroke="#664159" stroke-width="6"/>'}[name]
 for variant,width in [('card',720),('detail',960)]:
  offset=(width-720)//2
  svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img" aria-label="{label.replace("&","&amp;")}"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#17223d"/><stop offset="1" stop-color="#0c1124"/></linearGradient></defs><rect width="{width}" height="540" fill="url(#bg)"/><rect x="36" y="36" width="{width-72}" height="468" rx="28" fill="none" stroke="{color}" stroke-opacity=".25"/><g transform="translate({offset},0)">{shapes}<text x="360" y="470" text-anchor="middle" font-family="sans-serif" font-size="22" letter-spacing="2" fill="{color}">{label.replace("&","&amp;")}</text></g></svg>\n'
  write('visuals/'+name+'-'+variant+'.svg',svg)
  import xml.etree.ElementTree as ET
  ET.fromstring(svg)
for q in pack['moreless']:
 for subject in [q['l'],q['r']]:pack['images'][subject]=pack['images'][q['visual']]
dump('draft-pack.json',pack)
dump('draft-review-schedule.json',{'policy':'90 Tage veränderlich; 365 Tage stabile/historische Daten. Entwurf nicht freigegeben.','records':schedule})
baseline=json.loads((ROOT/'content/review-schedule.json').read_text())['records']
due=[r for r in baseline if r['next_review']<=data['checked']]
dump('validation.json',{'checked':data['checked'],'questions':len(ids),'counts':counts,'sources':len(sources),'original_svg_variants':10,'main_review_schedule_records':len(baseline),'due_records':due,'numeric_raw_data_validation':'passed','balanced_facts_per_category_and_difficulty':'passed','repeated_observations_across_games':0,'review_only':True,'live_database_writes':0})
print(('Checked' if checking else 'Built')+' 100 review questions and 10 SVG variants')
