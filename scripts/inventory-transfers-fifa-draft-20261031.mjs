import fs from 'node:fs';
import vm from 'node:vm';

const folder='content/research/2026-10-31-transfers-fifa',html=fs.readFileSync('index.html','utf8');
const ctx=vm.createContext({window:{},VISUAL_IMG:{},VISUAL_DETAIL:{},GENERATED_SUBJECTS:new Set()});
vm.runInContext(fs.readFileSync('content/approved.js','utf8'),ctx);
for(const name of ['knowledgeEstimateQuestions','knowledgeJeopardyQuestions','estimateCategory'])vm.runInContext(html.split('\n').find(x=>x.startsWith('function '+name+'(')),ctx);
for(const name of ['SHARED_CATS','KNOWLEDGE_POOL','ESTIMATE_Q','SOLO_Q','JEOP_CATS','FACT_Q','FACT_EXTRA','FACT_CURATED','SOLO_SUBCATS']){
  const marker='const '+name+'=',start=html.indexOf(marker);let quote=null,escaped=false,end=start+marker.length;
  for(;end<html.length;end++){const c=html[end];if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null}else if(c==='\x27'||c==='\x22'||c==='`')quote=c;else if(c===';')break}vm.runInContext(html.slice(start,end+1),ctx);
}
vm.runInContext('FACT_Q.push(...FACT_EXTRA,...FACT_CURATED)',ctx);let s=html.indexOf('(function mergeReviewedContent(){');vm.runInContext(html.slice(s,html.indexOf('})();',s)+5),ctx);s=html.indexOf('function soloSubcat(');vm.runInContext(html.slice(s,html.indexOf('function soloQuestionKey(',s)),ctx);
const pools=vm.runInContext(`({moreless:SOLO_Q,estimate:ESTIMATE_Q.map(q=>({...q,cat:estimateCategory(q)})),facts:FACT_Q.filter(q=>q.e&&q.source),jeopardy:JEOP_CATS.flatMap(([cat,rows])=>rows.map(([q,a,difficulty])=>({cat,q,a,difficulty})))})`,ctx);
const norm=v=>String(v||'').normalize('NFKC').trim().toLocaleLowerCase('de').replace(/\s+/g,' '),key=(g,q)=>g==='moreless'?JSON.stringify([norm(q.u),...[q.l,q.r].map(norm).sort()]):norm(g==='facts'?q.s:q.q);
const inventory={checked:'2026-10-31',base_commit:'dced74bb1385014445e186969a09ccd92c20edb5',definition:'Distinct normalized prompts / unordered More-Less pairs with unit; semantic identity reviewed separately.',games:{}};
for(const [game,rows] of Object.entries(pools)){const unique=[...new Map(rows.map(q=>[key(game,q),q])).values()],categories={};for(const q of unique)(categories[q.cat]??=[]).push(q);inventory.games[game]={raw:rows.length,unique:unique.length,categories:Object.fromEntries(Object.entries(categories).map(([cat,qs])=>[cat,{count:qs.length,subcategories:[...new Set(qs.map(q=>q.subcategory).filter(Boolean))].sort()}]))}}
const pack=JSON.parse(fs.readFileSync(folder+'/draft-pack.json','utf8')),mainKeys=new Set(),draftKeys=new Set(),conflicts=[];
for(const [g,rows] of Object.entries(pools))for(const q of rows)mainKeys.add(g+':'+key(g,q));
for(const g of ['moreless','estimate','facts','jeopardy'])for(const q of pack[g]){const k=g+':'+key(g,q);if(mainKeys.has(k))conflicts.push({id:q.id,type:'main'});if(draftKeys.has(k))conflicts.push({id:q.id,type:'internal'});draftKeys.add(k)}
const category='Transfers',before=Object.fromEntries(Object.entries(inventory.games).map(([g,d])=>[g,d.categories[category]?.count||0]));before.total=Object.values(before).reduce((a,b)=>a+b,0);
const additions={moreless:2,estimate:4,facts:6,jeopardy:8,total:20},after=Object.fromEntries(['moreless','estimate','facts','jeopardy'].map(g=>[g,before[g]+additions[g]]));after.total=before.total+20;
const cats=new Set();for(const d of Object.values(inventory.games))for(const c of Object.keys(d.categories))cats.add(c);
const summary={checked:'2026-10-31',target:{category,main_before:before,open_drafts_before:{total:0,note:'32 open PRs / about 1,240 pending questions checked; no FIFA 2025 market-statistics package or matching observation found.'},after_including_this_draft:after},run_target:{existing_category_labels:cats.size,completed_category_labels:1,missing_questions_against_20_per_category_run_target:(cats.size-1)*20,note:'This reviewed draft completes 20 only for Transfers.'}};
const audit={checked:'2026-10-31',main_unique_keys:mainKeys.size,draft_unique_keys:draftKeys.size,exact_or_reversed_conflicts:conflicts,semantic_review:'Existing Transfers questions focus on named player moves and transfer source/destination. This draft instead uses 22 FIFA TMS market observations for calendar year 2025. Targeted open-PR and Daily searches found no Global Transfer Report 2025, sell-on, 24,558 or equivalent observations.',comparison_review:'Only identical metrics and frames: Portugal 774 vs England 769 incoming transfers; Germany USD 1.28bn vs Italy USD 1.20bn spending. No gender, event, league or distance mixing.',limits:'Normalization plus observation keys and targeted Main/PR/Daily searches.'};
for(const [f,v] of Object.entries({'main-inventory.json':inventory,'duplicate-audit.json':audit,'category-summary.json':summary})){const out=JSON.stringify(v,null,2)+'\n',p=folder+'/'+f;if(process.argv.includes('--check')){if(fs.readFileSync(p,'utf8')!==out)throw Error('Stale '+f)}else fs.writeFileSync(p,out)}
console.log('Inventoried Main Transfers content and duplicate keys');
