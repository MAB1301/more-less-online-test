"""Build or verify the 2026-10-20 Kultur museum-art review bundle."""
import argparse,json,pathlib,xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1];DIR=ROOT/'content/research/2026-10-20-kultur-museumskunst'
p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');CHECK=p.parse_args().check
def read(n):return json.loads((DIR/n).read_text())
def emit(n,v):
 s=json.dumps(v,ensure_ascii=False,indent=2)+'\n';path=DIR/n
 if CHECK:assert path.read_text()==s,'Stale: '+n
 else:path.write_text(s)
src=read('input.json');sources=read('sources.json');obs=read('observations.json');games=['moreless','estimate','facts','jeopardy'];seen=set()
variants={'card':'visuals/museum-art-neutral-card.svg','detail':'visuals/museum-art-neutral-detail.svg','license':'CC0-1.0','creator':'Original code-authored vector','answer_neutral':True,'safe_margin_px':40,'description':'Abstrakte Galerie mit leeren Rahmen und Sockel; keine konkreten Werke, Namen, Maße oder Lösungen.'}
pack={'status':'review-only','verified':src['checked'],'base_commit':src['base_commit'],'images':{},**{g:[] for g in games}};schedule=[]
for q in src['questions']:
 assert q['cat']=='Kultur' and q['subcategory']=='Museumskunst · Werke, Maße & Details'
 for ref in q['source_refs']:assert sources[ref]['checked']==src['checked'] and sources[ref]['authority']=='official-museum'
 for k in q['observation_keys']:assert k in obs and k not in seen;seen.add(k)
 row={k:v for k,v in q.items() if k!='game'};row.update(status='draft',verified=src['checked'],source=sources[q['source_refs'][0]]['url'],sources=[sources[x]['url'] for x in q['source_refs']],sets=['Kultur · Museumskunst'],data_year_note='Historische Museumsobjektdaten; bei Katalogrevision erneut prüfen.',visual=None if q['game']=='jeopardy' else 'museum-art-neutral')
 if q['game']!='jeopardy':row['subject']='museum-art-neutral'
 if q['game']=='moreless':assert [obs[k]['value'] for k in q['observation_keys']]==[q['lv'],q['rv']] and q['lv']!=q['rv']
 elif q['game']=='estimate':assert obs[q['observation_keys'][0]]['value']==q['a']
 elif q['game']=='facts':assert type(q['a']) is bool and q['e']
 else:assert isinstance(q['a'],str) and 1<=q['difficulty']<=5
 pack[q['game']].append(row);schedule.append({'id':q['id'],'game':q['game'],'source':sources[q['source_refs'][0]]['url'],'verified':src['checked'],'data_year':q['data_year'],'time_dependent':False,'review_interval_days':365,'next_review':'2027-10-20','review_status':'draft-review-required'})
assert [len(pack[g]) for g in games]==[2,4,6,8] and len(seen)==22
for level in ['easy','medium','hard']:assert sorted(q['a'] for q in pack['facts'] if q['difficulty']==level)==[False,True]
pack['images']['museum-art-neutral']=variants
for q in pack['moreless']:
 for label in [q['l'],q['r']]:pack['images'][label]=variants
for f in ['visuals/museum-art-neutral-card.svg','visuals/museum-art-neutral-detail.svg']:ET.parse(DIR/f)
emit('draft-pack.json',pack);emit('draft-review-schedule.json',{'policy':'Historische Museumsobjektdaten: 365 Tage; keine automatische Veröffentlichung.','records':schedule})
baseline=json.loads((ROOT/'content/review-schedule.json').read_text())['records'];assert not [x for x in baseline if x['next_review']<=src['checked']]
print(('Checked' if CHECK else 'Built')+' 20 Kultur questions and two SVG structures')
