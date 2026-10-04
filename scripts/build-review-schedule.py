#!/usr/bin/env python3
"""Rebuild review dates without claiming that a source was checked again."""
import datetime as dt
import hashlib
import json
import re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def build():
    records=[]
    for r in json.loads((ROOT/'content/catalogue.json').read_text()):
        if r.get('status')!='approved': continue
        for f in r.get('facts',[]):
            records.append({'subject':r['name'],'prompt':f.get('estimate_question') or f.get('fact_statement') or f.get('metric'),'source':f['source'],'verified':f.get('verified'),'metric':f.get('metric',''),'notes':f.get('notes','')})
    trivia=json.loads((ROOT/'content/trivia.json').read_text())
    for game,key in [('facts','s'),('jeopardy','q')]:
        for f in trivia.get(game,[]): records.append({'subject':f.get('subject',f['cat']),'prompt':f[key],'source':f['source'],'verified':f.get('verified'),'metric':'','notes':'','game':game})
    out=[]
    for r in records:
        text=' '.join(str(r.get(k,'')) for k in ('prompt','metric','notes'))
        volatile=bool(re.search(r'weltrekord|einwohner|bevölkerung|gesamtwertung|tempo|ranking|preis|aktuell',text,re.I))
        interval=90 if volatile else 365
        verified=r['verified']
        next_review=(dt.date.fromisoformat(verified)+dt.timedelta(days=interval)).isoformat() if verified else None
        ident=hashlib.sha256((r['subject']+'|'+str(r['prompt'])+'|'+r['source']).encode()).hexdigest()[:20]
        out.append({**r,'id':ident,'time_dependent':volatile,'review_interval_days':interval,'next_review':next_review,'review_status':'scheduled' if verified else 'verification_missing'})
    return {'policy':'Changing values: 90 days; stable and historical facts: 365 days. Dates are review deadlines, not automatic approval. Fixed edition/year values retain their stated edition.','records':list({r['id']:r for r in out}.values())}

if __name__=='__main__':
    output=ROOT/'content/review-schedule.json'
    output.write_text(json.dumps(build(),ensure_ascii=False,indent=2)+'\n')
    print(f'{len(build()["records"])} review records')
