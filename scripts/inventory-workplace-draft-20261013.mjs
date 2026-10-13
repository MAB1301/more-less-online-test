import fs from 'node:fs';
import vm from 'node:vm';

const folder='content/research/2026-10-13-arbeitswelt';
const html=fs.readFileSync('index.html','utf8');
const ctx=vm.createContext({window:{},VISUAL_IMG:{},VISUAL_DETAIL:{},GENERATED_SUBJECTS:new Set()});
vm.runInContext(fs.readFileSync('content/approved.js','utf8'),ctx);
for(const name of ['knowledgeEstimateQuestions','knowledgeJeopardyQuestions','estimateCategory']){
  const line=html.split('\n').find(row=>row.startsWith('function '+name+'('));
  vm.runInContext(line,ctx);
}
for(const name of ['SHARED_CATS','KNOWLEDGE_POOL','ESTIMATE_Q','SOLO_Q','JEOP_CATS','FACT_Q','FACT_EXTRA','FACT_CURATED','SOLO_SUBCATS']){
  const marker='const '+name+'=',start=html.indexOf(marker);
  if(start<0)throw Error(name);
  let quote=null,escaped=false,end=start+marker.length;
  for(;end<html.length;end++){
    const c=html[end];
    if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;}
    else if(c==='\x27'||c==='\x22'||c==='`')quote=c;
    else if(c===';')break;
  }
  vm.runInContext(html.slice(start,end+1),ctx);
}
vm.runInContext('FACT_Q.push(...FACT_EXTRA,...FACT_CURATED)',ctx);
const mergeStart=html.indexOf('(function mergeReviewedContent(){'),mergeEnd=html.indexOf('})();',mergeStart)+5;
vm.runInContext(html.slice(mergeStart,mergeEnd),ctx);
const subStart=html.indexOf('function soloSubcat('),subEnd=html.indexOf('function soloQuestionKey(',subStart);
vm.runInContext(html.slice(subStart,subEnd),ctx);

const pools=vm.runInContext(`({
  moreless:SOLO_Q,
  estimate:ESTIMATE_Q.map(q=>({...q,cat:estimateCategory(q)})),
  facts:FACT_Q.filter(q=>q.e&&q.source),
  jeopardy:JEOP_CATS.flatMap(([cat,rows])=>rows.map(([q,a,difficulty])=>({cat,q,a,difficulty})))
})`,ctx);
const normalize=value=>String(value||'').normalize('NFKC').trim().toLocaleLowerCase('de').replace(/\s+/g,' ');
const key=(game,q)=>game==='moreless'?JSON.stringify([normalize(q.u),...[q.l,q.r].map(normalize).sort()]):normalize(game==='facts'?q.s:q.q);
const inventory={checked:'2026-10-13',base_commit:'dced74bb1385014445e186969a09ccd92c20edb5',definition:'Distinct normalized prompts / unordered More-Less pairs with unit; semantic identity is reviewed separately. Runtime banks after reviewed-content merge; Fact/Fake only sourced entries.',games:{}};
for(const [game,rows] of Object.entries(pools)){
  const unique=[...new Map(rows.map(q=>[key(game,q),q])).values()],categories={};
  for(const q of unique)(categories[q.cat]??=[]).push(q);
  inventory.games[game]={raw:rows.length,unique:unique.length,categories:Object.fromEntries(Object.entries(categories).map(([cat,questions])=>[cat,{count:questions.length,subcategories:Object.fromEntries(Object.entries(Object.groupBy(questions,q=>game==='moreless'?vm.runInContext('soloSubcat('+JSON.stringify(q)+')',ctx):q.subcategory||'(ohne Angabe)')).map(([sub,items])=>[sub,{count:items.length,theme_picker_available:game!=='facts'&&items.length>=5}]))}]))};
}
inventory.theme_picker={};
for(const [game,rows] of Object.entries(ctx.window.GAME_CONTENT_PACK).filter(([game])=>['moreless','estimate','jeopardy'].includes(game))){
  inventory.theme_picker[game]=Object.fromEntries(Object.entries(Object.groupBy(rows,q=>q.cat)).filter(([,items])=>items.length>=5).map(([cat,items])=>[cat,{count:items.length,subcategories:Object.fromEntries(Object.entries(Object.groupBy(items,q=>q.subcategory||'(ohne Angabe)')).filter(([sub,questions])=>sub!=='(ohne Angabe)'&&questions.length>=5).map(([sub,questions])=>[sub,questions.length]))}]));
}
const pack=JSON.parse(fs.readFileSync(folder+'/draft-pack.json','utf8'));
const mainKeys=new Set(),conflicts=[],draftKeys=new Set();
for(const [game,rows] of Object.entries(pools))for(const question of rows)mainKeys.add(game+':'+key(game,question));
for(const game of ['moreless','estimate','facts','jeopardy'])for(const question of pack[game]){
  const item=game+':'+key(game,question);
  if(mainKeys.has(item))conflicts.push({id:question.id,type:'main'});
  if(draftKeys.has(item))conflicts.push({id:question.id,type:'internal'});
  draftKeys.add(item);
}
const targetBefore=Object.fromEntries(Object.entries(inventory.games).map(([game,data])=>[game,data.categories.Arbeitswelt?.count||0]));
targetBefore.total=Object.values(targetBefore).reduce((sum,value)=>sum+value,0);
const additions=Object.fromEntries(['moreless','estimate','facts','jeopardy'].map(game=>[game,pack[game].length]));
additions.total=20;
const after=Object.fromEntries(['moreless','estimate','facts','jeopardy'].map(game=>[game,targetBefore[game]+additions[game]]));
after.total=targetBefore.total+20;
const allCategories=new Set();
for(const data of Object.values(inventory.games))for(const cat of Object.keys(data.categories))allCategories.add(cat);
const summary={checked:'2026-10-13',target:{category:'Arbeitswelt',main_before:targetBefore,open_drafts_before:{total:0,note:'15 offene PR-Diffs mit begrenzten Arbeitsrechtsbegriffen geprüft; keine Treffer.'},after_including_this_draft:after},run_target:{existing_category_labels:allCategories.size,completed_category_labels:1,missing_questions_against_20_per_category_run_target:Math.max(0,(allCategories.size-1)*20),note:'Dieser belastbare Entwurf erfüllt 20 nur für Arbeitswelt; keine erfundenen Auffüllwerte.'}};
const audit={checked:'2026-10-13',main_unique_keys:mainKeys.size,draft_unique_keys:draftKeys.size,exact_or_reversed_conflicts:conflicts,semantic_review:'Alle 20 Fälle besitzen getrennte Beobachtungsschlüssel. Die beiden More/Less-Paare vergleichen identische Kennzahl, Einheit und Rechtsrahmen; keine Geschlechter- oder Distanzvergleiche. Alle 15 offenen PR-Diffs haben null begrenzte Arbeitsrechts-Treffer.',limits:'Normalisierung findet identische Fragen und umgedrehte More/Less-Paare, nicht jede denkbare Paraphrase. Beobachtungsschlüssel, gezielte Begriffssuche und manuelle Fallprüfung ergänzen die Kontrolle.'};
const outputs={
  'main-inventory.json':inventory,
  'duplicate-audit.json':audit,
  'category-summary.json':summary,
};
for(const [file,value] of Object.entries(outputs)){
  const out=JSON.stringify(value,null,2)+'\n',path=folder+'/'+file;
  if(process.argv.includes('--check')){if(fs.readFileSync(path,'utf8')!==out)throw Error('Stale '+file);}
  else fs.writeFileSync(path,out);
}
console.log('Inventoried runtime banks, picker eligibility, category counts and duplicate keys');
