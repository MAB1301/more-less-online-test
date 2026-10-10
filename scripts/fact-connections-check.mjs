import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const ctx=vm.createContext({window:{}});
for(const path of ['assets/fact-connections-data.js','assets/fact-connections-engine.js','assets/fact-connections-visuals.js'])vm.runInContext(fs.readFileSync(path,'utf8'),ctx,{filename:path});
const p=ctx.window.FACT_CONNECTIONS_PACK,E=ctx.window.FactConnectionsEngine;
const cats=[...new Set(p.subjects.map(s=>s.category))],criteria=Object.keys(p.criteria);
assert(cats.length>=13);
assert(criteria.includes('animal_stock')&&criteria.includes('car_stock'));
for(const s of p.subjects){
 assert(s.facts.length>=3,s.name);assert.equal(new Set(s.facts.map(f=>f.criterion)).size,s.facts.length);
 for(const f of s.facts){assert(p.criteria[f.criterion]);assert.equal(new URL(f.source).protocol,'https:');assert(f.value!==null&&f.value!==undefined);assert(f.label&&typeof f.unit==='string');}
}
for(const cat of cats){
 assert(E.eligible(p,cat,criteria).length>=4,cat);
 for(let seed=1;seed<=40;seed++){
  let state=seed;const rng=()=>{state=(1664525*state+1013904223)>>>0;return state/2**32;};
  const r=E.createRound(p,cat,criteria,rng);assert.equal(r.cards.length,16);assert.equal(new Set(r.groups.map(g=>g.name)).size,4);
  for(const g of r.groups){
   assert.equal(g.cards.filter(c=>c.kind==='name').length,1);
   assert.equal(g.cards.filter(c=>c.kind==='image').length,cat==='Autos'?1:0);
   assert.equal(g.cards.filter(c=>c.kind==='fact').length,cat==='Autos'?2:3);
   const candidates=r.cards.slice();r.selected=g.cards.map(want=>{const i=candidates.findIndex(c=>E.signature(c)===E.signature(want));assert(i>=0);return candidates.splice(i,1)[0].id;});
   assert(['correct','won'].includes(E.submit(r).status),cat);
  }
  assert(r.finished);assert.equal(r.solved.length,4);assert.equal(r.mistakes,0);assert.equal(r.cards.length,0);
 }
}
const r=E.createRound(p,'Weltraum',criteria,()=>.4);
r.selected=[r.groups[0].id*4,r.groups[1].id*4,r.groups[2].id*4,r.groups[3].id*4];
assert.equal(E.submit(r).status,'wrong');assert.equal(r.mistakes,1);assert.equal(E.submit(r).status,'repeat');assert.equal(r.mistakes,1);
for(let i=0;i<2;i++){r.selected=[r.groups[0].id*4+i+1,r.groups[1].id*4,r.groups[2].id*4,r.groups[3].id*4];assert.equal(E.submit(r).status,i===1?'lost':'wrong');}
assert(r.finished);assert.equal(r.mistakes,3);assert.equal(E.submit(r).status,'incomplete');
assert.throws(()=>E.createRound(p,'Autos',['car_stock']));
const two=E.createRound(p,'Autos',['car_stock','stock_share'],()=>.4);assert.equal(two.cards.length,16);assert.equal(two.cards.filter(c=>c.kind==='image').length,4);
const one=two.groups[0],other=two.groups[1];two.selected=[other.id*4,one.id*4+1,one.id*4+2,one.id*4+3];assert.equal(E.submit(two).status,'wrong');
two.selected=one.cards.map(c=>two.cards.find(x=>E.signature(x)===E.signature(c)).id);assert.equal(E.submit(two).status,'correct');
// Shared fact cards are interchangeable: correctness depends on visible facts, not hidden ownership.
const shared={criteria:{a:'A',b:'B',c:'C'},subjects:[0,1,2,3].map(i=>({name:`N${i}`,category:'Test',facts:[{criterion:'a',label:'A',value:1,unit:''},{criterion:'b',label:'B',value:i+10,unit:''},{criterion:'c',label:'C',value:i+20,unit:''}]}))};
const t=E.createRound(shared,'Test',['a','b','c'],()=>.7),g=t.groups[0];
t.selected=g.cards.map(want=>t.cards.find(c=>E.signature(c)===E.signature(want)&&(want.label!=='A'||Math.floor(c.id/4)!==g.id)).id);
assert.equal(E.submit(t).status,'correct');
// Every name has local art; twelve distinct portrait cells cover the entire animal category.
const visuals=ctx.window.FACT_CONNECTIONS_VISUALS;
for(const subject of p.subjects){const art=visuals[subject.name];assert(art,subject.name);assert(fs.existsSync(art.src),art.src);}
const animals=p.subjects.filter(s=>s.category==='Tierwelt').map(s=>visuals[s.name]);
assert.equal(animals.length,12);assert(animals.every(a=>a.type==='portrait'));assert.equal(new Set(animals.map(a=>a.atlas)).size,12);
const brands=['VW – gesamte Marke','BMW – gesamte Marke','Mercedes – gesamte Marke','Porsche – gesamte Marke','Audi – gesamte Marke'].map(n=>visuals[n]);
assert(brands.every(a=>a.type==='motif'));assert.equal(new Set(brands.map(a=>a.atlas)).size,5);
console.log(`PASS: ${cats.length} categories, ${criteria.length} criteria, ${p.subjects.length} subjects; 520 solvable rounds, win/loss/repeat and shared-card equivalence`);

// Three matching visible cards give a near hint; successes do not consume attempts.
const near=E.createRound(p,'Weltraum',criteria,()=>.4);const target=near.groups[0],foreign=near.groups[1];near.selected=[target.id*4,target.id*4+1,target.id*4+2,foreign.id*4];let outcome=E.submit(near);assert.equal(outcome.status,'wrong');assert.equal(outcome.near,true);assert.equal(outcome.matched,3);assert.equal(near.mistakes,1);assert.equal(E.submit(near).status,'repeat');assert.equal(near.mistakes,1);near.selected=target.cards.map(w=>near.cards.find(c=>E.signature(c)===E.signature(w)).id);assert.equal(E.submit(near).status,'correct');assert.equal(near.mistakes,1);
// A matching duplicate signature counts at most as often as present in a group.
const dup=E.createRound(shared,'Test',['a','b','c'],()=>.7);const dg=dup.groups[0];const aCards=dup.cards.filter(c=>c.label==='A');dup.selected=[dg.id*4,aCards[0].id,aCards[1].id,aCards[2].id];if(new Set(dup.selected).size===4){outcome=E.submit(dup);assert.equal(outcome.near,false);assert.equal(outcome.matched,2)}
console.log('PASS: three-error limit, visible three-of-four near hint, repeated attempts and interchangeable fact multiplicity');
