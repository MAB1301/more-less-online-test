import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const dir = 'content/research/2026-10-21-bauwerke-architektur';
const read = name => JSON.parse(fs.readFileSync(`${dir}/${name}`, 'utf8'));
execFileSync('python3', ['scripts/build-bauwerke-architektur-draft-20261021.py', '--check']);

const pack = read('draft-pack.json');
const audit = read('duplicate-audit.json');
const daily = read('daily-catalogue-check.json');
const parallel = read('parallel-pr-check.json');
const summary = read('category-summary.json');
const sources = read('sources.json');
const validation = read('validation.json');

assert.deepEqual([pack.moreless.length, pack.estimate.length, pack.facts.length, pack.jeopardy.length], [2, 4, 6, 8]);
assert.equal(new Set([...pack.moreless, ...pack.estimate, ...pack.facts, ...pack.jeopardy].map(q => q.id)).size, 20);
assert.equal(new Set([...pack.moreless, ...pack.estimate, ...pack.facts, ...pack.jeopardy].flatMap(q => q.observation_keys)).size, 22);
assert.equal(audit.exact_prompt_conflicts.length + audit.reversed_moreless_conflicts.length + audit.same_observation_conflicts.length + audit.near_semantic_conflicts.length, 0);
assert.equal(daily.rows_total, 7187);
assert.equal(daily.observation_conflicts, 0);
assert.equal(parallel.open_pr_count, 23);
assert.equal(parallel.pending_questions_considered, 1060);
assert.equal(parallel.bauwerke_pending_unique, 50);
assert.deepEqual(summary.target.main_before, { moreless: 14, estimate: 18, facts: 15, jeopardy: 0, total: 47 });
assert.deepEqual(summary.target.after_including_open_drafts, { moreless: 43, estimate: 28, facts: 29, jeopardy: 17, total: 117 });
assert.deepEqual(validation.counts, { moreless: 2, estimate: 4, facts: 6, jeopardy: 8 });
for (const source of Object.values(sources)) {
  assert.equal(source.checked, '2026-10-21');
  assert.match(source.url, /^https:\/\//);
}
for (const question of pack.moreless) {
  assert.notEqual(question.lv, question.rv);
  assert(Math.max(question.lv, question.rv) / Math.min(question.lv, question.rv) < 1.2);
  assert.match(question.metric, /Geschosse|Aussichtsebene/);
}
for (const level of ['easy', 'medium', 'hard']) {
  assert.deepEqual(pack.facts.filter(q => q.difficulty === level).map(q => q.a).sort(), [false, true]);
}

const html = fs.readFileSync('index.html', 'utf8');
const context = vm.createContext({ window: { GAME_CONTENT_PACK: pack }, VISUAL_IMG: {}, VISUAL_DETAIL: {}, GENERATED_SUBJECTS: new Set() });
vm.runInContext('const SOLO_Q=[],ESTIMATE_Q=[],FACT_Q=[],JEOP_CATS=[];', context);
const start = html.indexOf('(function mergeReviewedContent(){');
assert(start >= 0);
vm.runInContext(html.slice(start, html.indexOf('})();', start) + 5), context);
assert.deepEqual(Array.from(vm.runInContext('[SOLO_Q.length,ESTIMATE_Q.length,FACT_Q.length,JEOP_CATS.flatMap(x=>x[1]).length]', context)), [2, 4, 6, 8]);

for (const [variant, width] of [['card', 720], ['detail', 960]]) {
  const svg = fs.readFileSync(`${dir}/visuals/architecture-neutral-${variant}.svg`, 'utf8');
  const text = [...svg.matchAll(/<text[^>]*>(.*?)<\/text>/g)].map(match => match[1]).join(' ');
  assert(svg.includes(`width="${width}" height="540" viewBox="0 0 ${width} 540"`));
  assert(svg.includes('x="40" y="40"'));
  assert(!/<image|<script|<foreignObject/.test(svg));
  assert(!/PETRONAS|Willis|Shanghai|Atomium|Sagrada|Taj|Sydney|Fallingwater|Guggenheim|Louvre|88|101|100|103|1648|1938/.test(text));
}

console.log('PASS: 20 sourced Bauwerke questions, two same-frame criteria, balanced facts, game merge and neutral SVG structure.');
