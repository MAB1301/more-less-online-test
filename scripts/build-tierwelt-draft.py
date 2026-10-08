#!/usr/bin/env python3
"""Deterministic review-only package; never alters approved content or database."""
import argparse, datetime as dt, hashlib, json, math
from pathlib import Path
from xml.etree import ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'content/research/2026-10-08-tierwelt-pack'
def encode(value): return json.dumps(value,ensure_ascii=False,indent=2)+'\n'
def build():
    authored=json.loads((FOLDER/'input.json').read_text())
    sources=json.loads((FOLDER/'sources.json').read_text())
    daily=json.loads((FOLDER/'daily-catalogue-check.json').read_text())
    parallel=json.loads((FOLDER/'parallel-pr-check.json').read_text())
    inventory=json.loads((FOLDER/'main-inventory.json').read_text())
    schedule=json.loads((ROOT/'content/review-schedule.json').read_text())
    day=authored['verified']; assert day=='2026-10-08' and authored['status']=='draft'
    assert daily['read_only'] and daily['checked']==day and len(daily['rows'])==39
    assert {x['pr'] for x in parallel['open_prs']}=={57,109,122,126,127,128,129,130}
    due=[r for r in schedule['records'] if not r.get('next_review') or r['next_review']<=day]
    assert not due, 'Review of baseline values is due'
    result={'status':'review-only','verified':day,'base_commit':authored['base_commit'],'images':{}}
    ids=set();semantic=set();reviews=[]
    for game,count in [('moreless',2),('estimate',4),('facts',6),('jeopardy',8)]:
        rows=authored[game];assert len(rows)==count;result[game]=[]
        for row in rows:
            assert row['id'] not in ids and row['semantic_key'] not in semantic
            ids.add(row['id']);semantic.add(row['semantic_key'])
            assert row['cat']=='Tierwelt' and row['source_refs'] and row['subcategory']
            refs=[sources[r] for r in row['source_refs']]
            assert all(s['verified']==day and s['publisher']=='San Diego Zoo Wildlife Alliance' and s['evidence'] and s['url'].startswith('https://animals.sandiegozoo.org/animals/') for s in refs)
            if game=='moreless':
                assert row['lv']!=row['rv'] and all(math.isfinite(row[x]) for x in ['lv','rv'])
                assert row['metric'] and row['notes']
            elif game=='estimate':assert math.isfinite(row['a']) and row['notes']
            elif game=='facts':assert type(row['a']) is bool and row['e'] and row['difficulty'] in ['easy','medium','hard']
            else:assert row['a'].strip() and 1<=row['difficulty']<=5 and row['visual'] is None
            cooked={**row,'source':refs[0]['url'],'sources':[s['url'] for s in refs],'verified':day,'data_year':row.get('data_year'),'data_year_note':'Undatierte biologische Artenübersicht; kein erfundenes Messjahr.' if not row.get('data_year') else 'Historisches Ereignisjahr','sets':['Tierwelt · geprüfter Entwurf']}
            result[game].append(cooked)
            reviews.append({'id':row['id'],'verified':day,'next_review':(dt.date.fromisoformat(day)+dt.timedelta(days=365)).isoformat(),'time_dependent':False,'review_status':'draft_not_approved','review_interval_days':365})
    assert sum(r['a'] for r in authored['facts'])==3
    assert all(sum(r['a'] for r in authored['facts'] if r['difficulty']==level)==1 for level in ['easy','medium','hard'])
    # No subject silhouette or countable anatomy: wetland / canopy habitat motif.
    motif='<path d="M45 335 Q160 250 280 322 T555 325 L555 470 L45 470Z" fill="#1b5b65"/><path d="M210 470 Q225 405 320 365 T395 300" fill="none" stroke="#6ac6d4" stroke-width="38"/><path d="M210 470 Q225 405 320 365 T395 300" fill="none" stroke="#bee8ee" stroke-width="3" opacity=".6"/><g fill="#2a7770"><ellipse cx="125" cy="202" rx="62" ry="87"/><ellipse cx="475" cy="184" rx="70" ry="105"/></g><g fill="#55a58b"><ellipse cx="160" cy="168" rx="42" ry="64"/><ellipse cx="430" cy="155" rx="47" ry="70"/></g><g stroke="#a6d3bd" stroke-width="8" fill="none"><path d="M125 400V240M475 390V230M71 397l-8-40m19 46 14-63M508 403l17-59"/></g><g fill="#92d2a1"><path d="M63 360q-31-45-26-66 34 10 26 66M96 341q12-50 37-61 3 35-37 61M525 347q29-44 46-44-1 40-46 44"/></g><g fill="#c9bf86" opacity=".85"><circle cx="248" cy="180" r="3"/><circle cx="341" cy="227" r="3"/><circle cx="285" cy="130" r="3"/></g>'
    products={}
    for kind,width in [('card',720),('detail',960)]:
        path=f'visuals/tierwelt-{kind}.svg'
        svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img"><title>Tierwelt – neutraler Wald- und Gewässerlebensraum</title><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#182841"/><stop offset="1" stop-color="#0b1629"/></linearGradient></defs><rect width="{width}" height="540" rx="26" fill="url(#sky)"/><g transform="translate({(width-600)//2} 0)">{motif}</g><text x="{width//2}" y="510" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#e9f3ed">Tierwelt</text></svg>\n'
        root=ET.fromstring(svg);assert int(root.attrib['width'])*3==int(root.attrib['height'])*4 if kind=='card' else int(root.attrib['width'])*9==int(root.attrib['height'])*16
        products[path]=svg
    result['images']['forest']={'card':'visuals/tierwelt-card.svg','detail':'visuals/tierwelt-detail.svg','license':'CC0-1.0','creator':'Original code-authored vector','answer_neutral':True,'safe_margin_px':24,'description':'Wald und Gewässer, ohne Tiere, Messzahlen, anatomische Merkmale oder Antwortbeschriftungen. Bei Jeopardy deaktiviert.'}
    products['draft-pack.json']=encode(result)
    products['draft-review-schedule.json']=encode({'policy':schedule['policy'],'records':reviews})
    before={g:inventory['games'][g]['categories'].get('Tierwelt',{}).get('count',0) for g in ['moreless','estimate','facts','jeopardy']}
    counts={g:len(result[g]) for g in before}
    products['validation.json']=encode({'checked':day,'counts':counts,'tierwelt_main_before':before,'tierwelt_main_plus_this_draft':{g:before[g]+counts[g] for g in before},'due_baseline_records':len(due),'baseline_review_sha256':hashlib.sha256((ROOT/'content/review-schedule.json').read_bytes()).hexdigest(),'sources_checked':len(sources),'database_writes':False,'publication':False,'existing_image_repairs':0,'new_vector_variants':2,'limitations':['20 Fragen nur für Tierwelt; übrige Kategorien erhalten in diesem Entwurf 0 neue Fragen.','Strukturelle Eindeutigkeit plus dokumentierte semantische Prüfung; keine automatische Garantie für sinngleiche Fragen.','Thematische Illustration ersetzt keine Tierfotografie.','Noch keine Freigabe oder Integration in spielbare Kataloge.']})
    return products
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
    for rel,content in build().items():
        path=FOLDER/rel
        if args.check:assert path.read_text()==content,f'Stale output {rel}'
        else:path.parent.mkdir(parents=True,exist_ok=True);path.write_text(content)
    print('OK: 20 independent Tierwelt draft questions; 2/4/6/8; sources, review dates, balanced facts, neutral 4:3/16:9 vectors, deterministic output')
