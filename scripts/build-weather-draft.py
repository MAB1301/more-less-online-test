#!/usr/bin/env python3
"""Build the isolated WMO weather-extremes review draft."""
import argparse,datetime as dt,hashlib,json,math
from pathlib import Path
from xml.etree import ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];FOLDER=ROOT/'content/research/2026-10-09-weather-extremes'
def encoded(x):return json.dumps(x,ensure_ascii=False,indent=2)+'\n'
def build():
    authored=json.loads((FOLDER/'input.json').read_text());sources=json.loads((FOLDER/'sources.json').read_text());daily=json.loads((FOLDER/'daily-catalogue-check.json').read_text());parallel=json.loads((FOLDER/'parallel-pr-check.json').read_text());inventory=json.loads((FOLDER/'main-inventory.json').read_text());schedule=json.loads((ROOT/'content/review-schedule.json').read_text())
    day=authored['verified'];assert day=='2026-10-09' and authored['status']=='draft' and authored['category']=='Rekorde & Extreme';assert daily['read_only'] and daily['hit_count']==0 and daily['counts']=={'total':7187,'moreless':4228,'estimate':1507,'facts':1452,'jeopardy':0};assert {x['pr'] for x in parallel['open_prs']}=={57,109,122,126,127,128,129,130,131}
    due=[r for r in schedule['records'] if not r.get('next_review') or r['next_review']<=day];assert not due
    pack={'status':'review-only','verified':day,'base_commit':authored['base_commit'],'images':{}};ids=set();semantics=set();reviews=[]
    for game,count in [('moreless',2),('estimate',4),('facts',6),('jeopardy',8)]:
        rows=authored[game];assert len(rows)==count;pack[game]=[]
        for row in rows:
            assert row['id'] not in ids;ids.add(row['id']);sem=' '.join(str(row.get(x,'')) for x in ('l','r','u','q','s')).casefold();assert sem not in semantics;semantics.add(sem)
            assert row['source_refs'] and row['data_years'] and row['subcategory'];refs=[sources[x] for x in row['source_refs']];assert all(s['publisher']=='World Meteorological Organization' and s['verified']==day and s['url'].startswith('https://wmo.int/') and s['evidence'] and s['limits'] and s['rounding'] for s in refs)
            if game=='moreless':assert row['lv']!=row['rv'] and row['metric'] and row['notes'] and all(math.isfinite(row[x]) for x in ('lv','rv'))
            elif game=='estimate':assert math.isfinite(row['a']) and row['notes']
            elif game=='facts':assert type(row['a']) is bool and row['e'] and row['difficulty'] in ('easy','medium','hard')
            else:assert isinstance(row['a'],str) and row['a'].strip() and 1<=row['difficulty']<=5
            cooked={**row,'cat':'Rekorde & Extreme','source':refs[0]['url'],'sources':[s['url'] for s in refs],'verified':day,'status':'draft','time_dependent':True,'sets':['Wetterrekorde · geprüfter Entwurf']}
            if game=='moreless':cooked['correct']='left' if row['lv']>row['rv'] else 'right'
            if game!='jeopardy':cooked['visual']='weather-extremes'
            else:cooked['visual']=None
            pack[game].append(cooked);reviews.append({'id':row['id'],'verified':day,'data_years':row['data_years'],'next_review':(dt.date.fromisoformat(day)+dt.timedelta(days=90)).isoformat(),'review_interval_days':90,'time_dependent':True,'review_status':'draft_not_approved','sources':cooked['sources']})
    assert sum(x['a'] for x in authored['facts'])==3
    for level in ('easy','medium','hard'):
        rows=[x for x in authored['facts'] if x['difficulty']==level];assert len(rows)==2 and sum(x['a'] for x in rows)==1
    # Abstract weather map: no place label, number, record holder or measurable answer cue.
    motif='<g fill="none" stroke-linecap="round"><path d="M95 300 C160 215 245 365 328 267 C410 172 485 282 525 212" stroke="#61d8ff" stroke-width="18"/><path d="M100 360 C170 275 244 420 330 326 C405 245 477 355 528 290" stroke="#886cff" stroke-width="12" opacity=".9"/><path d="M168 126c30-53 111-38 119 20 48-17 90 15 87 56H123c-8-43 17-74 45-76Z" fill="#c7d5eb" stroke="#eff6ff" stroke-width="5"/><path d="M190 239l-24 51m82-51-24 51m82-51-24 51" stroke="#7edbff" stroke-width="9"/><path d="M407 118l-24 48h31l-29 61 67-78h-34l23-31Z" fill="#ffcf5a" stroke="#ffe6a2" stroke-width="4"/></g><g fill="#334d78" opacity=".7"><circle cx="83" cy="108" r="4"/><circle cx="510" cy="95" r="5"/><circle cx="475" cy="406" r="4"/></g>'
    products={}
    for kind,width in [('card',720),('detail',960)]:
        rel=f'visuals/weather-extremes-{kind}.svg';offset=(width-600)//2;svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img"><title>Wetterrekorde – antwortneutrale Themenillustration</title><defs><linearGradient id="bg" x2="0" y2="1"><stop stop-color="#13284b"/><stop offset="1" stop-color="#081426"/></linearGradient></defs><rect width="{width}" height="540" rx="28" fill="url(#bg)"/><g transform="translate({offset} 0)">{motif}</g><text x="{width//2}" y="492" text-anchor="middle" font-family="sans-serif" font-size="30" fill="#eef5ff">Wetterrekorde</text></svg>\n';root=ET.fromstring(svg);assert (int(root.attrib['width']),int(root.attrib['height'])) in ((720,540),(960,540));products[rel]=svg
    pack['images']['weather-extremes']={'card':'visuals/weather-extremes-card.svg','detail':'visuals/weather-extremes-detail.svg','license':'CC0-1.0','creator':'Original code-authored vector','generated':False,'answer_neutral':True,'safe_margin_px':28,'description':'Abstrakte Wolke, Regen, Windlinien und Blitz ohne Orte, Zahlen, Rekordhalter oder Antwortwerte; Jeopardy-Bilder deaktiviert.'}
    products['draft-pack.json']=encoded(pack);products['draft-review-schedule.json']=encoded({'policy':schedule['policy'],'records':reviews})
    before={g:inventory['games'][g]['categories'].get('Rekorde & Extreme',{}).get('count',0) for g in ('moreless','estimate','facts','jeopardy')};counts={g:len(pack[g]) for g in before}
    products['validation.json']=encoded({'checked':day,'counts':counts,'records_main_before':before,'records_main_plus_this_draft':{g:before[g]+counts[g] for g in before},'due_baseline_records':len(due),'sources_checked':len(sources),'daily_hits':daily['hit_count'],'open_prs_checked':[x['pr'] for x in parallel['open_prs']],'database_writes':False,'publication':False,'existing_image_repairs':0,'new_vector_variants':2,'limitations':['20 Fragen nur für Rekorde & Extreme; übrige Kategorien erhalten in diesem Entwurf 0.','WMO-Archiv ist lebend; neue Zertifizierungen können Rekorde ändern, daher 90-Tage-Review.','Historische Messverfahren unterscheiden sich; Vergleiche nutzen nur dieselbe von WMO geführte Rekordklasse.','Keine Freigabe oder Integration in spielbare Kataloge.'],'baseline_review_sha256':hashlib.sha256((ROOT/'content/review-schedule.json').read_bytes()).hexdigest()})
    return products
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');args=p.parse_args()
    for rel,text in build().items():
        path=FOLDER/rel
        if args.check:assert path.read_text()==text,f'Stale {rel}'
        else:path.parent.mkdir(parents=True,exist_ok=True);path.write_text(text)
    print('OK: 20 WMO weather-extremes draft questions; 2/4/6/8; balanced facts; deterministic sources/reviews/neutral SVGs')
