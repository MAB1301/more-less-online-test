import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('index.html','utf8');
const ctx=vm.createContext({window:{},VISUAL_IMG:{},VISUAL_DETAIL:{},GENERATED_SUBJECTS:new Set()});
vm.runInContext(fs.readFileSync('content/approved.js','utf8'),ctx);
for(const name of ['knowledgeEstimateQuestions','knowledgeJeopardyQuestions','estimateCategory']) {
 const line=html.split('\n').find(x=>x.startsWith('function '+name+'('));vm.runInContext(line,ctx);
}
for(const name of ['SHARED_CATS','KNOWLEDGE_POOL','ESTIMATE_Q','SOLO_Q','JEOP_CATS','FACT_Q','SOLO_SUBCATS']) {
 const marker='const '+name+'=',start=html.indexOf(marker);if(start<0)throw Error(name);
 let quote=null,escaped=false,end=start+marker.length;
 for(;end<html.length;end++){const c=html[end];if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;}else if(c==='\x27'||c==='\x22'||c==='`')quote=c;else if(c===';')break;}
 vm.runInContext(html.slice(start,end+1),ctx);
}
const start=html.indexOf('(function mergeReviewedContent(){'),end=html.indexOf('})();',start)+5;
vm.runInContext(html.slice(start,end),ctx);
const substart=html.indexOf('function soloSubcat('),subend=html.indexOf('function soloQuestionKey(',substart);
vm.runInContext(html.slice(substart,subend),ctx);
const pools=vm.runInContext('({moreless:SOLO_Q,estimate:ESTIMATE_Q.map(q=>({...q,cat:estimateCategory(q)})),facts:FACT_Q.filter(q=>q.e&&q.source),jeopardy:JEOP_CATS.flatMap(([cat,rows])=>rows.map(([q,a,difficulty])=>({cat,q,a,difficulty})))})',ctx);
const normalize=s=>String(s||'').normalize('NFKC').trim().toLocaleLowerCase('de').replace(/\s+/g,' ');
const key=(game,q)=>game==='moreless'?JSON.stringify([normalize(q.u),...[q.l,q.r].map(normalize).sort()]):normalize(game==='facts'?q.s:q.q);
const inventory={checked:'2026-10-08',base_commit:'0ca6f66d0f1efea5709b7de9f3256413e0a2f5b1',definition:'Distinct normalized prompts / unordered pairs with unit; semantic identity is separately reviewed. Runtime banks after reviewed-content merge; Fact/Fake only sourced entries. Jeopardy uses its own actual categories; no inferred remapping.',games:{}};
for(const [game,rows] of Object.entries(pools)) {
 const unique=[...new Map(rows.map(q=>[key(game,q),q])).values()];
 const categories={};for(const q of unique)(categories[q.cat]??=[]).push(q);
 inventory.games[game]={raw:rows.length,unique:unique.length,categories:Object.fromEntries(Object.entries(categories).map(([cat,qs])=>[cat,{count:qs.length,subcategories:Object.fromEntries(Object.entries(Object.groupBy(qs,q=>game==='moreless'?vm.runInContext('soloSubcat('+JSON.stringify(q)+')',ctx):q.subcategory||'(ohne Angabe)')).map(([sub,x])=>[sub,{count:x.length,theme_picker_available:x.length>=5}]))}]))};
}
inventory.theme_picker={};for(const [game,rows] of Object.entries(ctx.window.GAME_CONTENT_PACK).filter(([game])=>['moreless','estimate','jeopardy'].includes(game)))inventory.theme_picker[game]=Object.fromEntries(Object.entries(Object.groupBy(rows,q=>q.cat)).filter(([,x])=>x.length>=5).map(([cat,x])=>[cat,{count:x.length,subcategories:Object.fromEntries(Object.entries(Object.groupBy(x,q=>q.subcategory||'(ohne Angabe)')).filter(([sub,qs])=>sub!=='(ohne Angabe)'&&qs.length>=5).map(([sub,qs])=>[sub,qs.length]))}]));
fs.writeFileSync('content/research/2026-10-08-tierwelt-pack/main-inventory.json',JSON.stringify(inventory,null,2)+'\n');
const draft=JSON.parse(fs.readFileSync('content/research/2026-10-08-tierwelt-pack/input.json','utf8'));
for(const [game,rows] of Object.entries(pools)){const seen=new Set(rows.map(q=>key(game,q)));for(const q of draft[game]){if(seen.has(key(game,q)))throw Error('Duplicate '+q.id);seen.add(key(game,q));}}
console.log(Object.fromEntries(Object.entries(inventory.games).map(([g,x])=>[g,{total:x.unique,tierwelt:x.categories.Tierwelt?.count||0}])));
