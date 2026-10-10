import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const folder='content/research/2026-10-10-growth',read=f=>JSON.parse(fs.readFileSync(`${folder}/${f}`,'utf8'));
execFileSync('python3',['scripts/build-growth-draft-20261010.py','--check']);
execFileSync('node',['scripts/inventory-growth-20261010.mjs','--check']);
const pack=read('draft-pack.json'),input=read('input.json'),audit=read('duplicate-audit.json');
const normalize=s=>String(s||'').normalize('NFKC').trim().toLocaleLowerCase('de').replace(/\s+/g,' ');
const key=(g,q)=>g==='moreless'?JSON.stringify([normalize(q.u),...[q.l,q.r].map(normalize).sort()]):normalize(g==='facts'?q.s:q.q);
const used=new Set(audit.existing_keys);
for(const g of ['moreless','estimate','facts','jeopardy'])for(const q of pack[g]){const k=g+':'+key(g,q);assert(!used.has(k),`Duplicate ${q.id}`);used.add(k)}
assert.equal(read('daily-catalogue-check.json').matching_rows,0);
for(const q of input.questions)assert(audit.semantic_review.some(r=>r.category===q.cat&&r.status==='checked'));
const html=fs.readFileSync('index.html','utf8');
const context=vm.createContext({window:{GAME_CONTENT_PACK:pack},VISUAL_IMG:{},VISUAL_DETAIL:{},GENERATED_SUBJECTS:new Set()});
vm.runInContext('const SOLO_Q=[],ESTIMATE_Q=[],FACT_Q=[],JEOP_CATS=[];',context);
const start=html.indexOf('(function mergeReviewedContent(){');vm.runInContext(html.slice(start,html.indexOf('})();',start)+5),context);
const actual=vm.runInContext('({moreless:SOLO_Q.length,estimate:ESTIMATE_Q.length,facts:FACT_Q.length,jeopardy:JEOP_CATS.reduce((n,c)=>n+c[1].length,0),columns:JEOP_CATS.map(c=>[c[0],c[1].length])})',context);
assert.deepEqual(JSON.parse(JSON.stringify(actual)),{moreless:14,estimate:24,facts:38,jeopardy:24,columns:[['Tierwelt',8],['Allgemeinwissen',8],['Bauwerke',8]]});
for(const q of pack.moreless)for(const subject of [q.l,q.r])assert(context.VISUAL_IMG[subject]);
for(const q of [...pack.estimate,...pack.facts])assert(context.VISUAL_IMG[q.subject]);
for(const q of pack.jeopardy)assert.equal(q.visual,null);
for(const file of fs.readdirSync(`${folder}/visuals`)){
 const svg=fs.readFileSync(`${folder}/visuals/${file}`,'utf8');
 const width=file.includes('-card')?720:960;
 assert(svg.includes(`width="${width}" height="540" viewBox="0 0 ${width} 540"`));
 assert(!svg.match(/<image|<foreignObject|<script|https?:/g)?.some(x=>x!=='http:'));
 assert(svg.includes('x="36" y="36"'));
}
console.log('Growth draft: 100 questions; raw values, duplicates, image coverage, aspect ratios, balance and real game import passed.');
