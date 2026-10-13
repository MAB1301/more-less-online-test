import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const dir='content/research/2026-10-13-arbeitswelt';
const read=name=>JSON.parse(fs.readFileSync(dir+'/'+name,'utf8'));
execFileSync('python3',['scripts/build-workplace-draft-20261013.py','--check']);
execFileSync('node',['scripts/inventory-workplace-draft-20261013.mjs','--check']);
const pack=read('draft-pack.json'),audit=read('duplicate-audit.json'),sources=read('sources.json'),daily=read('daily-catalogue-check.json'),prs=read('parallel-pr-check.json'),summary=read('category-summary.json'),validation=read('validation.json');
assert.equal(audit.exact_or_reversed_conflicts.length,0);
assert.equal(daily.matches,0);assert.equal(daily.rows_total,7187);
assert.equal(prs.open_pr_count,15);assert.equal(prs.subject_hits,0);assert.equal(prs.pending_questions_considered,900);
assert.deepEqual(validation.counts,{moreless:2,estimate:4,facts:6,jeopardy:8});
assert.equal(validation.unique_observation_keys,22);assert.equal(validation.due_records.length,0);
for(const source of Object.values(sources)){assert.equal(source.checked,'2026-10-13');assert.equal(source.data_year,2026);assert.equal(source.primary,true);assert.match(source.url,/^https:\/\/www\.gesetze-im-internet\.de\//);}
assert.equal(summary.target.main_before.total,4);assert.equal(summary.target.after_including_this_draft.total,24);assert(summary.run_target.missing_questions_against_20_per_category_run_target>0);
for(const game of ['moreless','estimate','facts','jeopardy'])for(const q of pack[game]){assert.equal(q.cat,'Arbeitswelt');assert.equal(q.data_year,2026);assert.equal(q.verified,'2026-10-13');assert.match(q.source,/gesetze-im-internet/);}
for(const q of pack.moreless){assert.notEqual(q.lv,q.rv);assert(q.metric);assert.equal(q.observation_keys.length,2);}
for(const level of ['easy','medium','hard'])assert.deepEqual(pack.facts.filter(q=>q.difficulty===level).map(q=>q.a).sort(),[false,true]);

const html=fs.readFileSync('index.html','utf8'),context=vm.createContext({window:{GAME_CONTENT_PACK:pack},VISUAL_IMG:{},VISUAL_DETAIL:{},GENERATED_SUBJECTS:new Set()});
vm.runInContext('const SOLO_Q=[],ESTIMATE_Q=[],FACT_Q=[],JEOP_CATS=[];',context);
const mergeStart=html.indexOf('(function mergeReviewedContent(){');
vm.runInContext(html.slice(mergeStart,html.indexOf('})();',mergeStart)+5),context);
const counts=vm.runInContext('[SOLO_Q.length,ESTIMATE_Q.length,FACT_Q.length,JEOP_CATS.flatMap(x=>x[1]).length]',context);
assert.deepEqual(Array.from(counts),[2,4,6,8]);
assert.equal(vm.runInContext('JEOP_CATS[0][0]',context),'Arbeitswelt');
for(const q of pack.moreless)for(const label of [q.l,q.r])assert(context.VISUAL_IMG[label]);
for(const q of [...pack.estimate,...pack.facts])assert(context.VISUAL_IMG[q.subject]);
for(const q of pack.jeopardy){assert.equal(q.visual,null);assert.equal(q.subject,undefined);}
for(const [format,width] of [['card',720],['detail',960]]){
  const svg=fs.readFileSync(`${dir}/visuals/workplace-neutral-${format}.svg`,'utf8');
  const visible=[...svg.matchAll(/<text[^>]*>(.*?)<\/text>/g)].map(x=>x[1]).join(' ');
  assert(svg.includes(`width="${width}" height="540" viewBox="0 0 ${width} 540"`));
  assert(svg.includes('x="40" y="40"'));assert(!/<image|<script|<foreignObject/.test(svg));
  assert(!/\b(4|5|6|8|10|11|15|16|24|30)\b/.test(visible));
}
console.log('PASS: 20 unique sourced workplace-law questions, comparable frames, balanced facts, game import, neutral SVG formats, Main/open-PR/Daily/review checks.');
