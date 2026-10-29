import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const dir='content/research/2026-10-29-vereinsstationen-real-madrid';
const read=name=>JSON.parse(fs.readFileSync(dir+'/'+name,'utf8'));
execFileSync('python3',['scripts/build-vereinsstationen-real-madrid-draft-20261029.py','--check']);
execFileSync('node',['scripts/inventory-vereinsstationen-real-madrid-draft-20261029.mjs','--check']);
const pack=read('draft-pack.json');
const audit=read('duplicate-audit.json');
const daily=read('daily-catalogue-check.json');
const prs=read('parallel-pr-check.json');
const summary=read('category-summary.json');
const validation=read('validation.json');
const sources=read('sources.json');
const observations=read('observations.json');

assert.equal(audit.exact_or_reversed_conflicts.length,0);
assert.equal(daily.matches,0);
assert.equal(daily.rows_total,7187);
assert.equal(daily.database_writes,0);
assert.equal(prs.open_pr_count,31);
assert.equal(prs.pending_questions_considered,1220);
assert.equal(prs.category_additions_before_this_draft,0);
assert.deepEqual(validation.counts,{moreless:2,estimate:4,facts:6,jeopardy:8});
assert.equal(validation.unique_observation_keys,22);
assert.equal(validation.unique_subjects,22);
assert.equal(summary.target.main_before.total,18);
assert.equal(summary.target.after_including_this_draft.total,38);
assert.equal(summary.run_target.existing_category_labels,35);
assert.equal(summary.run_target.missing_questions_against_20_per_category_run_target,680);
assert.equal(Object.keys(sources).length,22);
assert.equal(Object.keys(observations).length,22);
for(const source of Object.values(sources)){
  assert.equal(source.checked,'2026-10-29');
  assert.match(source.url,/^https:\/\/(www\.)?realmadrid\.com\//);
  assert.match(source.authority,/^official-club/);
}
for(const q of pack.moreless){
  assert.notEqual(q.lv,q.rv);
  assert(Math.max(q.lv,q.rv)/Math.min(q.lv,q.rv)<1.02);
  assert.match(q.metric,/pflichtspiele/i);
  assert.equal(q.u,'Pflichtspiele · Real Madrid');
}
for(const level of ['easy','medium','hard'])assert.deepEqual(pack.facts.filter(q=>q.difficulty===level).map(q=>q.a).sort(),[false,true]);
assert(pack.jeopardy.every(q=>q.visual===null));

const html=fs.readFileSync('index.html','utf8');
const context=vm.createContext({window:{GAME_CONTENT_PACK:pack},VISUAL_IMG:{},VISUAL_DETAIL:{},GENERATED_SUBJECTS:new Set()});
vm.runInContext('const SOLO_Q=[],ESTIMATE_Q=[],FACT_Q=[],JEOP_CATS=[];',context);
let start=html.indexOf('(function mergeReviewedContent(){');
assert(start>=0);
vm.runInContext(html.slice(start,html.indexOf('})();',start)+5),context);
assert.deepEqual(Array.from(vm.runInContext('[SOLO_Q.length,ESTIMATE_Q.length,FACT_Q.length,JEOP_CATS.flatMap(x=>x[1]).length]',context)),[2,4,6,8]);

for(const [format,width] of [['card',720],['detail',960]]){
  const svg=fs.readFileSync(`${dir}/visuals/club-paths-neutral-${format}.svg`,'utf8');
  const visible=[...svg.matchAll(/<text[^>]*>(.*?)<\/text>/g)].map(match=>match[1]).join(' ');
  assert(svg.includes(`width="${width}" height="540" viewBox="0 0 ${width} 540"`));
  assert(svg.includes('x="40" y="40"'));
  assert(!/<image|<script|<foreignObject/.test(svg));
  assert(!/Guti|Marcelo|Khedira|Özil|542|546|161|159|Liverpool|Chelsea|Inter|Barcelona/i.test(visible));
}
console.log('PASS: 20 unique official-source Vereinsstationen questions, close match-count comparisons, balanced facts, game import and neutral SVGs.');
