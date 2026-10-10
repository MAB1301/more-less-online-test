import fs from 'node:fs';import vm from 'node:vm';
const html=fs.readFileSync('index.html','utf8'),ctx=vm.createContext({window:{},VISUAL_IMG:{},VISUAL_DETAIL:{},GENERATED_SUBJECTS:new Set()});
vm.runInContext(fs.readFileSync('content/approved.js','utf8'),ctx);
for(const name of ['knowledgeEstimateQuestions','knowledgeJeopardyQuestions','estimateCategory']){const line=html.split('\n').find(x=>x.startsWith('function '+name+'('));vm.runInContext(line,ctx)}
for(const name of ['SHARED_CATS','KNOWLEDGE_POOL','ESTIMATE_Q','SOLO_Q','JEOP_CATS','FACT_Q','SOLO_SUBCATS']){
 const marker='const '+name+'=',start=html.indexOf(marker);if(start<0)throw Error(name);let quote=null,escaped=false,end=start+marker.length;
 for(;end<html.length;end++){const c=html[end];if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null}else if(c==='\x27'||c==='\x22'||c==='`')quote=c;else if(c===';')break}vm.runInContext(html.slice(start,end+1),ctx)
}
const mergeStart=html.indexOf('(function mergeReviewedContent(){'),mergeEnd=html.indexOf('})();',mergeStart)+5;vm.runInContext(html.slice(mergeStart,mergeEnd),ctx);
const subStart=html.indexOf('function soloSubcat('),subEnd=html.indexOf('function soloQuestionKey(',subStart);vm.runInContext(html.slice(subStart,subEnd),ctx);
const pools=vm.runInContext('({moreless:SOLO_Q,estimate:ESTIMATE_Q.map(q=>({...q,cat:estimateCategory(q)})),facts:FACT_Q.filter(q=>q.e&&q.source),jeopardy:JEOP_CATS.flatMap(([cat,rows])=>rows.map(([q,a,difficulty])=>({cat,q,a,difficulty})))})',ctx);
const norm=s=>String(s||'').normalize('NFKC').toLocaleLowerCase('de').replace(/\s+/g,' ').trim(),key=(game,q)=>game==='moreless'?JSON.stringify([norm(q.u),...[q.l,q.r].map(norm).sort()]):norm(q[game==='facts'?'s':'q']);
const output={checked:'2026-10-09',base_commit:'0ca6f66d0f1efea5709b7de9f3256413e0a2f5b1',definition:'Runtime banks after reviewed-content merge. Distinct normalized prompts or unordered More/Less pairs with unit. Fact/Fake includes sourced playable entries. Jeopardy categories remain their actual board categories; no inferred cross-game remapping.',games:{},theme_picker:{}};
for(const [game,rows] of Object.entries(pools)){
 const unique=[...new Map(rows.map(q=>[key(game,q),q])).values()],groups=Object.groupBy(unique,q=>q.cat);output.games[game]={raw:rows.length,unique:unique.length,categories:{}};
 for(const [cat,qs] of Object.entries(groups)){const subs=Object.groupBy(qs,q=>game==='moreless'?vm.runInContext('soloSubcat('+JSON.stringify(q)+')',ctx):q.subcategory||'(ohne Angabe)');output.games[game].categories[cat]={count:qs.length,subcategories:Object.fromEntries(Object.entries(subs).map(([s,x])=>[s,{count:x.length,theme_picker_available:x.length>=5}]))}}
}
for(const game of ['moreless','estimate','jeopardy']){const rows=ctx.window.GAME_CONTENT_PACK[game],groups=Object.groupBy(rows,q=>q.cat);output.theme_picker[game]=Object.fromEntries(Object.entries(groups).filter(([,x])=>x.length>=5).map(([cat,x])=>[cat,{count:x.length,subcategories:Object.fromEntries(Object.entries(Object.groupBy(x,q=>q.subcategory||'(ohne Angabe)')).filter(([s,qs])=>s!=='(ohne Angabe)'&&qs.length>=5).map(([s,qs])=>[s,qs.length]))}]))}
const draft=JSON.parse(fs.readFileSync('content/research/2026-10-09-weather-extremes/input.json'));for(const [game,rows] of Object.entries(pools)){const seen=new Set(rows.map(q=>key(game,q)));for(const q of draft[game]){if(seen.has(key(game,q)))throw Error('Main duplicate: '+q.id);seen.add(key(game,q))}}
fs.writeFileSync('content/research/2026-10-09-weather-extremes/main-inventory.json',JSON.stringify(output,null,2)+'\n');
console.log(Object.fromEntries(Object.entries(output.games).map(([g,x])=>[g,{total:x.unique,records:x.categories['Rekorde & Extreme']?.count||0}])));
