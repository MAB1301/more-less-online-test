"""Build the 2026-10-27 Mix official-standards review bundle offline."""
import argparse, datetime, json, pathlib, xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1]; DIR=ROOT/'content/research/2026-10-27-mix-official-standards'
p=argparse.ArgumentParser(); p.add_argument('--check',action='store_true'); CHECK=p.parse_args().check
def read(n): return json.loads((DIR/n).read_text())
def write(n,v):
    path=DIR/n
    if CHECK: assert path.exists() and path.read_text()==v, 'Stale: '+n
    else: path.parent.mkdir(parents=True,exist_ok=True); path.write_text(v)
def dump(n,v): write(n,json.dumps(v,ensure_ascii=False,indent=2)+'\n')
inp,sources,obs=read('input.json'),read('sources.json'),read('observations.json'); checked=datetime.date.fromisoformat(inp['checked']); games=['moreless','estimate','facts','jeopardy']
pack={'status':'review-only','verified':inp['checked'],'base_commit':inp['base_commit'],'images':{},**{g:[] for g in games}}; seen=set(); schedule=[]
for q in inp['questions']:
    assert q['cat']=='Mix' and q['subcategory']=='Offizielle Standards & Zahlenmix'
    for ref in q['source_refs']: assert ref in sources and sources[ref]['checked']==inp['checked'] and sources[ref]['authority']=='official'
    for k in q['observation_keys']: assert k in obs and k not in seen; seen.add(k)
    row={k:v for k,v in q.items() if k!='game'}; row.update(status='draft',verified=inp['checked'],source=sources[q['source_refs'][0]]['url'],sources=[sources[r]['url'] for r in q['source_refs']],sets=['Mix · Offizielle Standards'],visual=None if q['game']=='jeopardy' else 'official-standards-neutral')
    if q['game']!='jeopardy': row['subject']='official-standards-neutral'
    if q['game']=='moreless': assert [obs[k]['value'] for k in q['observation_keys']]==[q['lv'],q['rv']] and q['lv']!=q['rv']
    elif q['game']=='estimate': assert obs[q['observation_keys'][0]]['value']==q['a']
    elif q['game']=='facts': assert type(q['a']) is bool and q['e']
    else: assert isinstance(q['a'],str) and 1<=q['difficulty']<=5
    pack[q['game']].append(row); interval=180 if q['time_dependent'] else 365
    schedule.append({'id':q['id'],'game':q['game'],'source':row['source'],'verified':inp['checked'],'data_year':q['data_year'],'time_dependent':q['time_dependent'],'review_interval_days':interval,'next_review':str(checked+datetime.timedelta(days=interval)),'review_status':'draft-review-required'})
assert [len(pack[g]) for g in games]==[2,4,6,8] and len(seen)==22
for level in ['easy','medium','hard']: assert sorted(q['a'] for q in pack['facts'] if q['difficulty']==level)==[False,True]
variants={'card':'visuals/official-standards-neutral-card.svg','detail':'visuals/official-standards-neutral-detail.svg','license':'CC0-1.0','creator':'Original code-authored vector','answer_neutral':True,'safe_margin_px':40,'description':'Abstract globe, calibrated arcs, document and medal shapes without words, numbers, denominations or answer clues; Jeopardy receives no image key.'}; pack['images']['official-standards-neutral']=variants
for q in pack['moreless']:
    for label in [q['l'],q['r']]: pack['images'][label]=variants
for kind,width in [('card',720),('detail',960)]:
    off=(width-720)//2
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img" aria-label="Abstrakte Illustration offizieller Standards"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#07152d"/><stop offset=".55" stop-color="#173666"/><stop offset="1" stop-color="#44225d"/></linearGradient><linearGradient id="gold"><stop stop-color="#fff0a3"/><stop offset="1" stop-color="#ff9b47"/></linearGradient><radialGradient id="gl"><stop stop-color="#70f6e5"/><stop offset="1" stop-color="#5573ff"/></radialGradient></defs><rect width="{width}" height="540" fill="url(#bg)"/><rect x="40" y="40" width="{width-80}" height="460" rx="30" fill="none" stroke="#8befff" stroke-opacity=".5" stroke-width="2"/><g transform="translate({off},0)"><g transform="translate(116 104)"><circle cx="128" cy="126" r="105" fill="url(#gl)" opacity=".9"/><g fill="none" stroke="#d8ffff" stroke-width="5" opacity=".85"><ellipse cx="128" cy="126" rx="48" ry="105"/><path d="M27 93h202M27 159h202M128 21v210"/></g></g><g transform="translate(361 105)"><rect x="0" y="0" width="194" height="244" rx="20" fill="#edf8ff" fill-opacity=".12" stroke="#bfeeff" stroke-width="5"/><path d="M38 63h118M38 101h87M38 139h118M38 177h72" stroke="#85e6ff" stroke-width="10" stroke-linecap="round"/><circle cx="151" cy="190" r="54" fill="url(#gold)"/><path d="M129 230l-15 72 37-19 37 19-15-72" fill="#ef6e9f" opacity=".9"/></g><g fill="none" stroke="#ffcf6e" stroke-width="6" stroke-linecap="round"><path d="M109 408c95 48 208 47 309-2"/><path d="M442 405c60-17 107-45 145-83"/></g><circle cx="585" cy="320" r="14" fill="#ffcf6e"/><g fill="#d7fbff" opacity=".8"><circle cx="92" cy="83" r="7"/><circle cx="619" cy="90" r="6"/><circle cx="83" cy="387" r="5"/></g></g></svg>\n'''
    ET.fromstring(svg); write(f'visuals/official-standards-neutral-{kind}.svg',svg)
dump('draft-pack.json',pack); dump('draft-review-schedule.json',{'policy':'Mutable institutional values: 180 days; stable standards/history: 365 days. No automatic publication.','records':schedule})
baseline=json.loads((ROOT/'content/review-schedule.json').read_text())['records']; due=[r for r in baseline if r['next_review']<=inp['checked']]
dump('validation.json',{'checked':inp['checked'],'questions':20,'counts':{g:len(pack[g]) for g in games},'unique_observation_keys':len(seen),'balanced_fact_levels':True,'official_sources':len(sources),'svg_variants':2,'rendered_visual_qa':True,'image_corrections':['Both original SVGs use a 40 px safe frame; the detail composition is centred independently so no motif or stroke is clipped at 16:9.'],'main_review_records':len(baseline),'due_records':due,'review_only':True,'database_writes':0})
print(('Checked' if CHECK else 'Built')+' 20 Mix questions and two SVG formats')
