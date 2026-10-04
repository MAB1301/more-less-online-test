"""Add only this release's candidates; leave existing matches/Dailys untouched."""
import hashlib
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
pack = json.loads((ROOT/'content/approved.js').read_text().split('=', 1)[1].rstrip(';\n'))
rows = []
for game in ('moreless', 'estimate', 'facts'):
    for q in pack[game]:
        if q.get('verified') != '2026-10-04': continue
        identity = [q['l'], q['r'], q['lv'], q['rv'], q['u']] if game == 'moreless' else q['q'] if game == 'estimate' else q['s']
        digest = hashlib.sha256(json.dumps([game, identity], ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:24]
        rows.append(dict(id='approved-20261004-'+digest, game=game, payload=q))
queries = []
for start in range(0, len(rows), 50):
    payload = json.dumps(rows[start:start+50], ensure_ascii=False, separators=(',', ':'))
    assert '$expansion5$' not in payload
    queries.append("with incoming as (select * from jsonb_to_recordset($expansion5$"+payload+"$expansion5$::jsonb) as x(id text,game text,payload jsonb)), inserted as (insert into ml_private.daily_catalogue(id,game,payload,available_from) select id,game,payload,date '2026-10-04' from incoming on conflict(id) do nothing returning game) select game,count(*) as inserted from inserted group by game;")
(ROOT/'docs/database/import-expansion-5.sql').write_text('-- Additive expansion; existing matches and generated Daily sets remain immutable.\nbegin;\n'+'\n'.join(queries)+'\ncommit;\n')
print(f'{len(rows)} new shared-online/Daily candidates, {len(queries)} batches')
