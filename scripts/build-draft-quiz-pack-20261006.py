#!/usr/bin/env python3
"""Build an isolated, review-only quiz pack; never edits approved content or Supabase."""
import argparse, datetime as dt, hashlib, json, math, unicodedata
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DEFAULT = ROOT / 'content/research/2026-10-06-small-pack'
GAMES = ('moreless', 'estimate', 'facts', 'jeopardy')

def norm(value):
    return ' '.join(unicodedata.normalize('NFKC', value or '').casefold().split())

def identity(game, row):
    if game == 'moreless':
        key = ['pair', *sorted([norm(row['l']), norm(row['r'])]), norm(row['u'])]
    else:
        key = [game, norm(row['s'] if game == 'facts' else row['q'])]
    return json.dumps(key, ensure_ascii=False, separators=(',', ':'))

def fingerprint(game, row):
    return hashlib.sha256(identity(game, row).encode()).hexdigest()

def encoded(value):
    return json.dumps(value, ensure_ascii=False, indent=2) + '\n'

def build(folder):
    sources = json.loads((folder / 'sources.json').read_text())
    data = json.loads((folder / 'input.json').read_text())
    daily = json.loads((folder / 'daily-catalogue-check.json').read_text())
    parallel = json.loads((folder / 'parallel-pr-check.json').read_text())
    checked = dt.date.fromisoformat(data['verified'])
    assert data['status'] == 'draft' and daily['checked'] == data['verified']
    assert daily['counts'] == {'total': 7187, 'moreless': 4228, 'estimate': 1507, 'facts': 1452, 'jeopardy': 0}
    assert all(not item['match'] for item in daily['proposed'])
    assert {item['id'] for item in daily['proposed']} == {row['id'] for game in GAMES for row in data[game]}
    assert {item['pr'] for item in parallel['open_content_prs']} == {122, 126}

    baseline = json.loads((ROOT / 'content/approved.js').read_text().split('=', 1)[1].rstrip(';\n'))
    forbidden = {fingerprint(game, row) for game in GAMES for row in baseline[game]}
    schedule = json.loads((ROOT / 'content/review-schedule.json').read_text())
    due = [r for r in schedule['records'] if not r.get('next_review') or r['next_review'] <= data['verified']]
    assert not due, 'Due baseline records require review before export'

    motifs = {
        'rivers': ('Flüsse', '<path d="M120 120c150 70 40 180 220 250s180-40 260 30" fill="none" stroke="#62d7ee" stroke-width="30" stroke-linecap="round"/><path d="M160 120l90 70m190 115 100-45" stroke="#8fe0bd" stroke-width="12"/>'),
        'dams': ('Talsperren', '<path d="M170 390h270l-45-245H215z" fill="#7c87b8"/><path d="M440 390h95M435 170h100" stroke="#62d7ee" stroke-width="16"/><path d="M225 225h160" stroke="#b9a3ff" stroke-width="12"/>'),
        'telescopes': ('Weltraumteleskope', '<circle cx="300" cy="245" r="105" fill="#c89b4b"/><path d="M195 245h210M248 154l104 182M352 154 248 336" stroke="#312644" stroke-width="8"/><path d="M300 350v65" stroke="#62d7ee" stroke-width="14"/>'),
        'museums': ('Museen', '<path d="M155 210l145-85 145 85zM175 225h250v165H175z" fill="#8871d9"/><path d="M220 235v140m80-140v140m80-140v140M150 400h300" stroke="#d8cff7" stroke-width="16"/>'),
        'aircraft': ('Flugzeuge', '<path d="M95 280l185-35 95-120 36 8-43 112 135 25 45 45-230-18-82 95-37-8 42-95-150 30z" fill="#62d7ee"/>')
    }
    products = {}
    output = {'status': 'review-only', 'verified': data['verified'], 'base_commit': data['base_commit'], 'images': {}}
    for theme, (label, motif) in motifs.items():
        image = {'license': 'CC0-1.0', 'generated': False, 'answer_neutral': True,
                 'description': 'Original thematic SVG; not to scale and without answer values.'}
        for kind, width in (('card', 720), ('detail', 960)):
            file = f'visuals/{theme}-{kind}.svg'
            image[kind] = file
            offset = (width - 600) / 2
            products[file] = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" '
                f'viewBox="0 0 {width} 540" role="img"><title>{label} – neutrale Themenillustration</title>'
                f'<rect width="{width}" height="540" rx="28" fill="#101a30"/>'
                f'<g transform="translate({offset:g} 0)">{motif}</g>'
                f'<text x="{width/2:g}" y="475" text-anchor="middle" font-family="sans-serif" font-size="32" fill="#eff4ff">{label}</text></svg>\n')
        output['images'][theme] = image

    expected = {'moreless': 10, 'estimate': 5, 'facts': 5, 'jeopardy': 5}
    ids, seen, reviews = set(), set(), []
    daily_by_id = {item['id']: item for item in daily['proposed']}
    for game in GAMES:
        assert len(data[game]) == expected[game]
        output[game] = []
        for row in data[game]:
            assert row['status'] == 'draft' and row['id'] not in ids
            ids.add(row['id'])
            assert daily_by_id[row['id']]['identity'] == identity(game, row)
            assert row['visual'] in motifs and row['data_years']
            assert row['source_refs'] and all(ref in sources for ref in row['source_refs'])
            for ref in row['source_refs']:
                source = sources[ref]
                assert source['url'].startswith('https://') and source['evidence']
                assert source['verified'] == data['verified']
            available_years = {year for ref in row['source_refs'] for year in sources[ref]['data_years']}
            assert set(row['data_years']) <= available_years
            key = fingerprint(game, row)
            assert key not in forbidden and key not in seen, f'Duplicate: {row["id"]}'
            seen.add(key)
            if game == 'moreless':
                assert row['lv'] != row['rv'] and row['metric'] and row['prompt']
                assert all(type(row[k]) in (int, float) and math.isfinite(row[k]) for k in ('lv', 'rv'))
            elif game == 'estimate':
                assert type(row['a']) in (int, float) and math.isfinite(row['a']) and row['u']
            elif game == 'facts':
                assert type(row['a']) is bool and row['e'] and row['difficulty'] in ('easy', 'medium', 'hard')
            else:
                assert row['a'].strip() and type(row['difficulty']) is int and 1 <= row['difficulty'] <= 5
            cooked = {**row, 'source': sources[row['source_refs'][0]]['url'],
                      'sources': [sources[ref]['url'] for ref in row['source_refs']], 'verified': data['verified']}
            if game == 'moreless':
                cooked['correct'] = 'left' if row['lv'] > row['rv'] else 'right'
            output[game].append(cooked)
            interval = 90 if row['time_dependent'] else 365
            reviews.append({'id': row['id'], 'verified': data['verified'], 'data_years': row['data_years'],
                            'sources': cooked['sources'], 'time_dependent': row['time_dependent'],
                            'review_interval_days': interval,
                            'next_review': (checked + dt.timedelta(days=interval)).isoformat(),
                            'review_status': 'draft_not_approved'})

    assert sum(row['a'] for row in output['facts']) == 3
    assert len({row['cat'] for row in output['moreless']}) == 5
    products['draft-pack.json'] = encoded(output)
    products['draft-review-schedule.json'] = encoded({'policy': schedule['policy'], 'records': reviews})
    products['validation.json'] = encoded({
        'verified': data['verified'], 'counts': expected, 'unique_primary_sources': len(sources),
        'daily_counts': daily['counts'], 'daily_duplicates': 0, 'open_content_prs_checked': [122, 126],
        'due_baseline_records': len(due),
        'baseline_review_sha256': hashlib.sha256((ROOT / 'content/review-schedule.json').read_bytes()).hexdigest(),
        'baseline_pack_sha256': hashlib.sha256((ROOT / 'content/approved.js').read_bytes()).hexdigest(),
        'release_blockers': ['Editorial acceptance of difficulty and wording',
                             'Resolve rounded A380 length wording before promotion',
                             'Promote via the approved catalogue pipeline; this draft is intentionally not loaded by the app'],
        'database_writes': False
    })
    return products

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--folder', type=Path, default=DEFAULT)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    products = build(args.folder)
    for file, text in products.items():
        path = args.folder / file
        if args.check:
            assert path.read_text() == text, f'Stale generated file: {file}'
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text)
        if file.endswith('.svg'):
            root = ET.fromstring(text)
            assert (int(root.attrib['width']), int(root.attrib['height'])) in ((720, 540), (960, 540))
    print('OK: 10 More/Less, 5 estimates, 5 Fact/Fake, 5 Jeopardy; sources, duplicate checks, deterministic output and 4:3/16:9 SVGs; review-only')
