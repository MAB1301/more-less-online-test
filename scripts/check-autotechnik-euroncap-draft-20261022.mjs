import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const dir = 'content/research/2026-10-22-autotechnik-euroncap';
const read = name => JSON.parse(fs.readFileSync(`${dir}/${name}`, 'utf8'));
execFileSync('python3', ['scripts/build-autotechnik-euroncap-draft-20261022.py', '--check']);

const pack = read('draft-pack.json');
const audit = read('duplicate-audit.json');
const daily = read('daily-catalogue-check.json');
const parallel = read('parallel-pr-check.json');
const summary = read('category-summary.json');
const sources = read('sources.json');
const inventory = read('main-inventory.json');
const validation = read('validation.json');

assert.deepEqual([pack.moreless.length, pack.estimate.length, pack.facts.length, pack.jeopardy.length], [2, 4, 6, 8]);
const questions = [...pack.moreless, ...pack.estimate, ...pack.facts, ...pack.jeopardy];
assert.equal(new Set(questions.map(q => q.id)).size, 20);
assert.equal(new Set(questions.flatMap(q => q.observation_keys)).size, 22);
assert.equal(audit.exact_prompt_conflicts.length + audit.reversed_moreless_conflicts.length + audit.same_observation_conflicts.length + audit.near_semantic_conflicts.length, 0);
assert.equal(daily.rows_total, 7187);
assert.equal(daily.observation_conflicts, 0);
assert.equal(parallel.open_pr_count, 24);
assert.equal(parallel.pending_questions_considered, 1080);
assert.equal(parallel.autotechnik_pending_unique, 0);
assert.equal(inventory.selectable_category_labels, 34);
assert.deepEqual(inventory.categories.Autotechnik, { moreless: 0, estimate: 0, facts: 0, jeopardy: 26, total: 26 });
assert.deepEqual(summary.target.after_including_open_drafts, { moreless: 2, estimate: 4, facts: 6, jeopardy: 34, total: 46 });
assert.deepEqual(validation.counts, { moreless: 2, estimate: 4, facts: 6, jeopardy: 8 });
for (const source of Object.values(sources)) {
  assert.equal(source.checked, '2026-10-22');
  assert.match(source.url, /^https:\/\//);
}
for (const question of pack.moreless) {
  assert.notEqual(question.lv, question.rv);
  assert(Math.max(question.lv, question.rv) / Math.min(question.lv, question.rv) < 1.08);
  assert.match(question.metric, /Euro-NCAP-2025-Wertung/);
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
  const svg = fs.readFileSync(`${dir}/visuals/vehicle-safety-neutral-${variant}.svg`, 'utf8');
  const text = [...svg.matchAll(/<text[^>]*>(.*?)<\/text>/g)].map(match => match[1]).join(' ');
  assert(svg.includes(`width="${width}" height="540" viewBox="0 0 ${width} 540"`));
  assert(svg.includes('x="40" y="40"'));
  assert(!/<image|<script|<foreignObject/.test(svg));
  assert(!/Leapmotor|Volvo|Tesla|Nissan|Caddy|CUPRA|Qashqai|ISOFIX|eCall|GVT|Attention|93|92|91|86|80|65/.test(text));
}

console.log('PASS: 20 sourced Autotechnik questions, same-year Euro NCAP criteria, balanced facts, game merge and neutral SVG structure.');
