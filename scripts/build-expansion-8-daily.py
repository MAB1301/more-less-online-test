"""Idempotent additive import of this reviewed release into the shared catalogue."""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
pack=json.loads((ROOT/'content/approved.js').read_text().split('=',1)[1].rstrip(';\n'))
rows=[]
for game in ('moreless','estimate','facts'):
    for q in pack[game]:
        if q.get('expansion')!=8:continue
        identity=[q['l'],q['r'],q['lv'],q['rv'],q['u']] if game=='moreless' else q['q'] if game=='estimate' else q['s']
        digest=hashlib.sha256(json.dumps([game,identity],ensure_ascii=False,sort_keys=True).encode()).hexdigest()[:24]
        rows.append(dict(id='approved-20261005-'+digest,game=game,payload=q))
assert len(rows)==len({r['id'] for r in rows})==306
queries=[]
for i in range(0,len(rows),50):
    payload=json.dumps(rows[i:i+50],ensure_ascii=False,separators=(',',':'));assert '$expansion8$' not in payload
    queries.append("with incoming as (select * from jsonb_to_recordset($expansion8$"+payload+"$expansion8$::jsonb) as x(id text,game text,payload jsonb)), inserted as (insert into ml_private.daily_catalogue(id,game,payload,available_from) select id,game,payload,date '2026-10-05' from incoming on conflict(id) do nothing returning game) select game,count(*) as inserted from inserted group by game;")
(ROOT/'docs/database/import-expansion-8.sql').write_text('-- Additive release; frozen Daily sets and existing matches are preserved.\nbegin;\n'+'\n'.join(queries)+'\ncommit;\n')
print(f'{len(rows)} candidates; {len(queries)} batches')
