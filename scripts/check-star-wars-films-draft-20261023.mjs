import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const dir = 'content/research/2026-10-23-star-wars-films';
const read = name => JSON.parse(fs.readFileSync(`${dir}/${name}`, 'utf8'));
execFileSync('python3', ['scripts/build-star-wars-films-draft-20261023.py', '--check']);

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
assert.equal(parallel.open_pr_count, 25);
assert.equal(parallel.pending_questions_considered, 1100);
assert.equal(parallel.star_wars_pending_unique, 0);
assert.equal(inventory.selectable_category_labels, 34);
assert.deepEqual(inventory.categories['Star Wars'], { moreless: 0, estimate: 0, facts: 0, jeopardy: 15, total: 15 });
assert.deepEqual(summary.target.after_including_open_drafts, { moreless: 2, estimate: 4, facts: 6, jeopardy: 23, total: 35 });
assert.deepEqual(validation.counts, { moreless: 2, estimate: 4, facts: 6, jeopardy: 8 });
for (const source of Object.values(sources)) {
  assert.equal(source.checked, '2026-10-23');
  assert.match(source.url, /^https:\/\/www\.disneyplus\.com\//);
}
for (const question of pack.moreless) {
  assert.notEqual(question.lv, question.rv);
  assert(Math.max(question.lv, question.rv) / Math.min(question.lv, question.rv) < 1.04);
  assert.equal(question.metric, 'Angezeigte Filmlaufzeit auf Disney+');
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
  const svg = fs.readFileSync(`${dir}/visuals/galactic-cinema-neutral-${variant}.svg`, 'utf8');
  const text = [...svg.matchAll(/<text[^>]*>(.*?)<\/text>/g)].map(match => match[1]).join(' ');
  assert(svg.includes(`width="${width}" height="540" viewBox="0 0 ${width} 540"`));
  assert(svg.includes('x="40" y="40"'));
  assert(!/<image|<script|<foreignObject/.test(svg));
  assert(!/Star Wars|Skywalker|Lucas|Abrams|Johnson|Edwards|Howard|Kershner|Marquand|125|129|136|137|141|143|154|1977|1980|1983|1999|2002|2005|2015|2017|2019/.test(text));
}

console.log('PASS: 20 sourced Star Wars film questions, locale-bound runtime criteria, balanced facts, game merge and neutral SVG structure.');
