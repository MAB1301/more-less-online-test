"""Generate an additive, repeatable Daily catalogue update; no frozen rounds change."""
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
pack=json.loads((ROOT/'content/approved.js').read_text().split('=',1)[1].rstrip(';\n'))
rows=[]
for game in ('moreless','estimate','facts'):
    for q in pack[game]:
        if q.get('expansion')!=9:continue
        identity=[q['l'],q['r'],q['lv'],q['rv'],q['u']] if game=='moreless' else q['q'] if game=='estimate' else q['s']
        digest=hashlib.sha256(json.dumps([game,identity],ensure_ascii=False,sort_keys=True).encode()).hexdigest()[:24]
        rows.append(dict(id='approved-20261005-'+digest,game=game,payload=q))
assert len(rows)==len({r['id'] for r in rows})
route="""update ml_private.daily_catalogue set payload=jsonb_set(payload,'{cat}',to_jsonb(case
 when payload->>'cat'='FIFA-Ratings' or payload::text ~* '(FIFA[[:space:]]*[0-9]{2}\\y|FC[[:space:]]*2[0-9]\\y|Basiskarte|ea\\.com/games/ea-sports-fc)' then 'Videospiele'::text
 else 'Fußball'::text end))
where payload->>'cat' in ('Fußballer','FIFA-Ratings')
 or (payload->>'cat' <> 'Videospiele' and payload::text ~* '(FIFA[[:space:]]*[0-9]{2}\\y|FC[[:space:]]*2[0-9]\\y|Basiskarte|ea\\.com/games/ea-sports-fc)');"""
queries=[route]
for i in range(0,len(rows),50):
    payload=json.dumps(rows[i:i+50],ensure_ascii=False,separators=(',',':'));assert '$expansion9$' not in payload
    queries.append("with incoming as (select * from jsonb_to_recordset($expansion9$"+payload+"$expansion9$::jsonb) as x(id text,game text,payload jsonb)), inserted as (insert into ml_private.daily_catalogue(id,game,payload,available_from) select id,game,payload,date '2026-10-05' from incoming on conflict(id) do nothing returning game) select game,count(*) as inserted from inserted group by game;")
(ROOT/'docs/database/import-expansion-9.sql').write_text('-- Reviewed content DML only. Jeopardy is served by the frontend pack, not Daily.\nbegin;\n'+'\n'.join(queries)+'\ncommit;\n')
print(f'{len(rows)} new Daily candidates; category correction; {len(queries)-1} batches')
