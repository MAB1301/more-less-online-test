"""Build the idempotent future Daily import from the approved browser pack."""
import hashlib
import json
from pathlib import Path

pack = json.loads(Path('content/approved.js').read_text().split('=', 1)[1].rstrip(';\n'))
items = []
for game in ('moreless', 'estimate', 'facts'):
    for question in pack[game]:
        if game == 'estimate' and question['a'] < 0:
            continue  # Current Daily estimates only accept nonnegative guesses.
        identity = ([question['l'], question['r'], question['lv'], question['rv'], question['u']]
                    if game == 'moreless' else question['q'] if game == 'estimate' else question['s'])
        digest = hashlib.sha256(json.dumps([game, identity], ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:24]
        items.append({'id': 'approved-20261003-' + digest, 'game': game, 'payload': question})
queries = []
for offset in range(0, len(items), 80):
    payload = json.dumps(items[offset:offset + 80], ensure_ascii=False, separators=(',', ':'))
    assert '$daily_batch$' not in payload
    queries.append("with incoming as (select * from jsonb_to_recordset($daily_batch$" + payload + "$daily_batch$::jsonb) as x(id text,game text,payload jsonb)), inserted as (insert into ml_private.daily_catalogue(id,game,payload,available_from) select i.id,i.game,i.payload,date '2026-10-04' from incoming i where not exists(select 1 from ml_private.daily_catalogue old where old.game=i.game and ((i.game='moreless' and old.payload->>'u'=i.payload->>'u' and ((old.payload->>'l'=i.payload->>'l' and old.payload->>'r'=i.payload->>'r' and old.payload->'lv'=i.payload->'lv' and old.payload->'rv'=i.payload->'rv') or (old.payload->>'r'=i.payload->>'l' and old.payload->>'l'=i.payload->>'r' and old.payload->'rv'=i.payload->'lv' and old.payload->'lv'=i.payload->'rv'))) or (i.game='estimate' and old.payload->>'q'=i.payload->>'q') or (i.game='facts' and old.payload->>'s'=i.payload->>'s'))) on conflict(id) do nothing returning game) select game,count(*) as inserted from inserted group by game;")
output = "-- New content starts on 2026-10-04 Berlin time. Re-running is idempotent.\nbegin;\n" + '\n'.join(queries) + '\ncommit;\n'
Path('docs/database/import-daily-expansion.sql').write_text(output)
print(f'Generated {len(items)} approved Daily candidates; starts 2026-10-04')
