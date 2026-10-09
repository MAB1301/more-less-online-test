import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='content/research/2026-10-09-twenty-per-category/';
const data=JSON.parse(fs.readFileSync(dir+'datasets.json'));
const sources=JSON.parse(fs.readFileSync(dir+'sources.json'));
const moreless=[],seen=new Set();
for(const g of data.groups) for(const [index,pair] of g.pairs.entries()) {
  const [left,right]=index%2?[...pair].reverse():pair;
  const l=g.observations[left],r=g.observations[right];
  assert(l&&r&&left!==right);
  const raw=[l.values[g.field],r.values[g.field]];
  assert(raw.every(v=>v!==null&&Number.isFinite(v)));
  const [lv,rv]=raw.map(v=>Number(v.toFixed(g.rounding)));
  assert(lv!==rv,'No tied comparisons after rounding');
  const semantic=JSON.stringify([g.id,...[l.id,r.id].sort()]);
  assert(!seen.has(semantic),'Reversed pair or same question repeated');seen.add(semantic);
  const source_refs=[...new Set([...l.source_refs,...r.source_refs])];
  assert(source_refs.every(ref=>sources[ref]?.verified===data.verified));
  moreless.push({id:'quota-'+g.id+'-'+String(index+1).padStart(2,'0'),fact_id:'quota-'+g.id+'-'+[l.id,r.id].sort().join('|'),cat:g.cat,l:l.name,r:r.name,lv,rv,u:g.u,metric:g.metric,subcategory:g.metric,source_refs,verified:data.verified,data_year:g.data_year,time_dependent:false,review_after_days:365,illustration:g.illustration,notes:g.notes,prompt:g.prompt,rounding:g.rounding,semantic_key:semantic,provenance:{group:g.id,field:g.field,left_entity:l.id,right_entity:r.id,raw_values:raw,event_years:[l.event_years?.[g.field]??null,r.event_years?.[g.field]??null]}});
}
assert.equal(moreless.length,180);
const counts={};for(const q of moreless)counts[q.cat]=(counts[q.cat]||0)+1;
assert.equal(Object.keys(counts).length,10);assert(Object.values(counts).every(v=>v===18));
for(const cat of Object.keys(counts)) {
  const subjects=new Set(moreless.filter(q=>q.cat===cat).flatMap(q=>[q.provenance.left_entity,q.provenance.right_entity]));
  assert(subjects.size>=8,'A category cannot be filled with pairings of five objects');
}
const path=dir+'input.json',output=JSON.stringify({status:data.status,verified:data.verified,moreless},null,2)+'\n';
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(path,'utf8'),output);else fs.writeFileSync(path,output);
console.log('PASS: 180 reproducible comparisons: 18/category, canonical unordered pairs, source-backed values, rounding and >=8 subjects/category');
