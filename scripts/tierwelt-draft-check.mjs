import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const folder='content/research/2026-10-08-tierwelt-pack/';
const draft=JSON.parse(fs.readFileSync(folder+'draft-pack.json','utf8'));
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('content/approved.js','utf8'),ctx);
const merged=structuredClone(ctx.window.GAME_CONTENT_PACK);
const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const identity=(g,q)=>g==='moreless'?JSON.stringify([norm(q.u),...[q.l,q.r].map(norm).sort()]):norm(q[g==='facts'?'s':'q']);
for(const g of ['moreless','estimate','facts','jeopardy']){
 const existing=new Set(merged[g].map(q=>identity(g,q)));for(const q of draft[g]){assert(!existing.has(identity(g,q)),q.id);existing.add(identity(g,q));merged[g].push(q);}
}
for(const level of ['easy','medium','hard']){const rows=draft.facts.filter(q=>q.difficulty===level);assert.equal(rows.length,2);assert.equal(rows.filter(q=>q.a).length,1);assert.equal(rows.filter(q=>!q.a).length,1);}
assert.equal(draft.jeopardy.length,8);assert(draft.jeopardy.every(q=>q.visual===null&&!q.subject));
const html=fs.readFileSync('index.html','utf8'),start=html.indexOf('(function mergeReviewedContent(){'),end=html.indexOf('})();',start)+5;
const context=vm.createContext({window:{GAME_CONTENT_PACK:draft},VISUAL_IMG:{},VISUAL_DETAIL:{},GENERATED_SUBJECTS:new Set(),SOLO_Q:[],ESTIMATE_Q:[],FACT_Q:[],JEOP_CATS:[]});
vm.runInContext(html.slice(start,end),context);
assert.equal(context.SOLO_Q.length,2);assert.equal(context.ESTIMATE_Q.length,4);assert.equal(context.FACT_Q.length,6);assert.equal(context.JEOP_CATS[0][0],'Tierwelt');assert.equal(context.JEOP_CATS[0][1].length,8);
for(const q of draft.moreless){assert(q.lv!==q.rv);assert(q.metric);assert(q.notes);}
for(const [variant,ratio] of [['card',4/3],['detail',16/9]]){const svg=fs.readFileSync(folder+draft.images.forest[variant],'utf8');const width=Number(svg.match(/width="(\d+)"/)[1]),height=Number(svg.match(/height="(\d+)"/)[1]);assert.equal(width/height,ratio);assert(!/<image|foreignObject|<script/.test(svg));assert.equal((svg.match(/<text /g)||[]).length,1);assert(svg.includes('>Tierwelt</text>'));}
const validation=JSON.parse(fs.readFileSync(folder+'validation.json'));assert.equal(validation.due_baseline_records,0);assert.equal(validation.database_writes,false);
console.log('PASS: isolated package import, eight playable Jeopardy clues, balanced facts at each level, baseline/mirror duplicate checks, neutral graphics and stable boundaries');
