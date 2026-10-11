import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
const dir='content/research/2026-10-11-sport-squash',read=n=>JSON.parse(fs.readFileSync(dir+'/'+n,'utf8'));
execFileSync('python3',['scripts/build-squash-draft-20261011.py','--check']);execFileSync('node',['scripts/inventory-squash-draft-20261011.mjs','--check']);
const pack=read('draft-pack.json'),audit=read('duplicate-audit.json');
const norm=s=>String(s||'').normalize('NFKC').trim().toLocaleLowerCase('de').replace(/\s+/g,' ');
const key=(g,q)=>g==='moreless'?JSON.stringify([norm(q.u),...[q.l,q.r].map(norm).sort()]):norm(g==='facts'?q.s:q.q);
const used=new Set(audit.existing_keys);
for(const g of ['moreless','estimate','facts','jeopardy'])for(const q of pack[g]){const k=g+':'+key(g,q);assert(!used.has(k),q.id);used.add(k)}
assert.equal(read('daily-catalogue-check.json').matches,0);assert.equal(read('parallel-pr-check.json').squash_hits,0);
const html=fs.readFileSync('index.html','utf8'),context=vm.createContext({window:{GAME_CONTENT_PACK:pack},VISUAL_IMG:{},VISUAL_DETAIL:{},GENERATED_SUBJECTS:new Set()});
vm.runInContext('const SOLO_Q=[],ESTIMATE_Q=[],FACT_Q=[],JEOP_CATS=[];',context);
const start=html.indexOf('(function mergeReviewedContent(){');vm.runInContext(html.slice(start,html.indexOf('})();',start)+5),context);
const counts=vm.runInContext('[SOLO_Q.length,ESTIMATE_Q.length,FACT_Q.length,JEOP_CATS[0][1].length]',context);assert.deepEqual(Array.from(counts),[2,4,6,8]);
for(const q of pack.moreless)for(const s of [q.l,q.r])assert(context.VISUAL_IMG[s]);
for(const q of [...pack.estimate,...pack.facts])assert(context.VISUAL_IMG[q.subject]);
for(const q of pack.jeopardy)assert.equal(q.visual,null);
for(const [format,width] of [['card',720],['detail',960]]){const svg=fs.readFileSync(`${dir}/visuals/squash-neutral-${format}.svg`,'utf8');assert(svg.includes(`width="${width}" height="540" viewBox="0 0 ${width} 540"`));assert(svg.includes('x="40" y="40"'));assert(!/<image|<script|<foreignObject/.test(svg));}
console.log('PASS: 20 unique sourced questions, same-edition comparisons, raw rule values, balanced facts, real game import, neutral images and formats.');
