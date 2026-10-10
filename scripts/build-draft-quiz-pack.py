#!/usr/bin/env python3
"""Reproduce an isolated research export; never edit approved.js or the database."""
import argparse, datetime as dt, hashlib, json, math, unicodedata
from pathlib import Path
from xml.etree import ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
DEFAULT=ROOT/'content/research/2026-10-05-small-pack'
def norm(s): return ' '.join(unicodedata.normalize('NFKC',s or '').casefold().split())
def fingerprint(game,row):
    key=['pair',*sorted([norm(row['l']),norm(row['r'])]),norm(row['u'])] if game=='moreless' else [game,norm(row['s'] if game=='facts' else row['q'])]
    return hashlib.sha256(json.dumps(key,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
def encoded(obj): return json.dumps(obj,ensure_ascii=False,indent=2)+'\n'
def build(folder):
    source=json.loads((folder/'sources.json').read_text()); data=json.loads((folder/'input.json').read_text())
    checked=dt.date.fromisoformat(data['verified']); assert data['status']=='draft'
    baseline=json.loads((ROOT/'content/approved.js').read_text().split('=',1)[1].rstrip(';\n'))
    daily=json.loads((folder/'daily-identities.json').read_text())
    assert daily['checked']==data['verified']
    forbidden=set(daily['fingerprints']) | {fingerprint(g,q) for g in ['moreless','estimate','facts','jeopardy'] for q in baseline[g]}
    ids=set();seen=set();reviews=[];out={'status':'review-only','verified':data['verified'],'base_commit':data['base_commit'],'images':{}}
    # Intentionally generic silhouettes, identical dimensions across subjects: no quantitative clues.
    motifs={
      'bridges':('Brücken','<path d="M100 330H500M170 330V160M430 330V160M170 175Q300 310 430 175" fill="none" stroke="#7de4ed" stroke-width="14"/>'),
      'metro':('Stadtverkehr','<rect x="210" y="150" width="180" height="200" rx="45" fill="#9275fa"/><rect x="240" y="185" width="120" height="65" rx="12" fill="#152039"/><path d="M235 370L270 325M365 370L330 325" stroke="#7de4ed" stroke-width="14"/>'),
      'heritage':('Welterbe','<circle cx="300" cy="245" r="110" fill="none" stroke="#7de4ed" stroke-width="14"/><path d="M215 260L270 185L330 290L385 225" fill="none" stroke="#bca5ff" stroke-width="14"/>'),
      'space':('Raumfahrt','<circle cx="300" cy="245" r="85" fill="#9275fa"/><ellipse cx="300" cy="245" rx="155" ry="60" transform="rotate(-25 300 245)" fill="none" stroke="#7de4ed" stroke-width="12"/>'),
      'nature':('Schutzgebiete','<path d="M190 325L270 175L340 325ZM280 325L355 205L430 325Z" fill="#73d5b3"/><path d="M265 320V365M355 320V365" stroke="#bca5ff" stroke-width="16"/>')}
    products={}
    for theme,(label,motif) in motifs.items():
        image={'license':'CC0-1.0','generated':False,'answer_neutral':True,'description':'Original thematic SVG, not to scale; no answer text, years or quantitative encoding.'}
        for kind,w in [('card',720),('detail',960)]:
            file=f'visuals/{theme}-{kind}.svg'; image[kind]=file
            x=(w-600)/2
            products[file]=f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="540" viewBox="0 0 {w} 540" role="img"><title>{label} – Themenillustration</title><rect width="{w}" height="540" rx="28" fill="#101a30"/><g transform="translate({x:g} 0)">{motif}</g><text x="{w/2:g}" y="460" text-anchor="middle" font-family="sans-serif" font-size="32" fill="#eff4ff">{label}</text></svg>\n'
        out['images'][theme]=image
    for game,expected in [('moreless',10),('estimate',5),('facts',5),('jeopardy',5)]:
        assert len(data[game])==expected
        out[game]=[]
        for row in data[game]:
            assert row['status']=='draft' and row['id'] not in ids; ids.add(row['id'])
            refs=row['source_refs']; assert refs and all(r in source for r in refs)
            assert row['visual'] in motifs and row['data_years'] and all(type(y)==int for y in row['data_years'])
            for ref in refs:
                s=source[ref];assert s['url'].startswith('https://') and s['evidence'] and s['verified']==data['verified']
                assert set(row['data_years']) <= set(y for r in refs for y in source[r]['data_years'])
            key=fingerprint(game,row);assert key not in forbidden and key not in seen,f'Duplicate {row["id"]}'; seen.add(key)
            if game=='moreless':
                assert row['lv']!=row['rv'] and all(type(row[k]) in (int,float) and math.isfinite(row[k]) for k in ['lv','rv'])
                assert row['u'] and row['metric'] and row['prompt']
            elif game=='estimate':assert type(row['a']) in (int,float) and math.isfinite(row['a']) and row['u']
            elif game=='facts':assert type(row['a'])==bool and row['e'] and row['difficulty'] in ['easy','medium','hard']
            else:assert row['a'].strip() and type(row['difficulty'])==int and 1<=row['difficulty']<=5
            cooked={**row,'source':source[refs[0]]['url'],'sources':[source[r]['url'] for r in refs],'verified':data['verified']}
            if game=='moreless':cooked['correct']='left' if row['lv']>row['rv'] else 'right'
            out[game].append(cooked)
            interval=90 if row['time_dependent'] else 365
            reviews.append({'id':row['id'],'verified':data['verified'],'data_years':row['data_years'],'sources':cooked['sources'],'time_dependent':row['time_dependent'],'review_interval_days':interval,'next_review':(checked+dt.timedelta(days=interval)).isoformat(),'review_status':'draft_not_approved'})
    assert sum(q['a'] for q in out['facts'])==3
    assert len({q['cat'] for q in out['moreless']})==5
    schedule=json.loads((ROOT/'content/review-schedule.json').read_text())
    due=[r for r in schedule['records'] if not r.get('next_review') or r['next_review']<=data['verified']]
    assert not due,'Due baseline records need a documented source review before export'
    products['draft-pack.json']=encoded(out)
    products['draft-review-schedule.json']=encoded({'policy':schedule['policy'],'records':reviews})
    products['validation.json']=encoded({'verified':data['verified'],'counts':{g:len(out[g]) for g in ['moreless','estimate','facts','jeopardy']},'unique_primary_sources':len(source),'daily_counts':daily['counts'],'duplicates':0,'due_baseline_records':len(due),'baseline_review_sha256':hashlib.sha256((ROOT/'content/review-schedule.json').read_bytes()).hexdigest(),'baseline_pack_sha256':hashlib.sha256((ROOT/'content/approved.js').read_bytes()).hexdigest(),'release_blockers':['Editorial acceptance of difficulty levels and wording','Promote through approved catalogue pipeline after review; current export is intentionally not loaded by the app'],'database_writes':False})
    return products
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--folder',type=Path,default=DEFAULT);p.add_argument('--check',action='store_true');a=p.parse_args()
    products=build(a.folder)
    for file,text in products.items():
        path=a.folder/file
        if a.check:assert path.read_text()==text,f'Stale generated file: {file}'
        else:path.parent.mkdir(parents=True,exist_ok=True);path.write_text(text)
        if file.endswith('.svg'):
            root=ET.fromstring(text);w=int(root.attrib['width']);h=int(root.attrib['height']);assert (w,h) in [(720,540),(960,540)]
    print('OK: 10 More/Less, 5 estimates, 5 Fact/Fake, 5 Jeopardy; source metadata, baseline/Daily duplicate checks, deterministic output, 4:3/16:9 SVGs; review-only')
