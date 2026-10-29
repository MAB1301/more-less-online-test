import fs from 'node:fs';
import vm from 'node:vm';

const folder='content/research/2026-10-29-vereinsstationen-real-madrid';
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync('content/approved.js','utf8'),ctx);
const pack=ctx.window.GAME_CONTENT_PACK;
const norm=value=>String(value??'').normalize('NFKC').trim().toLocaleLowerCase('de').replace(/\s+/g,' ');
const key=(game,q)=>game==='moreless'
  ? JSON.stringify([norm(q.u),norm(q.metric),...[q.l,q.r].map(norm).sort()])
  : norm(game==='facts'?q.s:q.q);
const games=['moreless','estimate','facts','jeopardy'];
const inventory={
  checked:'2026-10-29',
  base_commit:'dced74bb1385014445e186969a09ccd92c20edb5',
  definition:'Distinct normalized prompts; More/Less uses unordered subject pairs plus unit and metric. Semantic observation identity is reviewed separately.',
  games:{},
};
const mainKeys=new Set();
const categories=new Set();
for(const game of games){
  const rows=pack[game]||[];
  const unique=[...new Map(rows.map(q=>[key(game,q),q])).values()];
  const byCategory={};
  for(const q of unique){
    categories.add(q.cat);
    (byCategory[q.cat]??=[]).push(q);
    mainKeys.add(game+':'+key(game,q));
  }
  inventory.games[game]={
    raw:rows.length,
    unique:unique.length,
    categories:Object.fromEntries(Object.entries(byCategory).sort().map(([cat,qs])=>[cat,{count:qs.length,subcategories:[...new Set(qs.map(q=>q.subcategory||q.sub||'(ohne Unterkategorie)'))].sort()}])),
  };
}
// Four sourced Arbeitswelt facts live in the inline curated bank rather than
// content/approved.js. They are selectable in Main and therefore belong in the
// category inventory even though this draft cannot collide with them.
const html=fs.readFileSync('index.html','utf8');
const inlineWorkCount=(html.match(/cat:'Arbeitswelt'/g)||[]).length;
if(inlineWorkCount){
  inventory.games.facts.raw+=inlineWorkCount;
  inventory.games.facts.unique+=inlineWorkCount;
  inventory.games.facts.categories.Arbeitswelt={count:inlineWorkCount,subcategories:['(Inline-Katalog)']};
  categories.add('Arbeitswelt');
}

const draft=JSON.parse(fs.readFileSync(folder+'/draft-pack.json','utf8'));
const draftKeys=new Set();
const conflicts=[];
for(const game of games)for(const q of draft[game]){
  const value=game+':'+key(game,q);
  if(mainKeys.has(value))conflicts.push({id:q.id,type:'main'});
  if(draftKeys.has(value))conflicts.push({id:q.id,type:'internal'});
  draftKeys.add(value);
}
const category='Vereinsstationen';
const before=Object.fromEntries(games.map(game=>[game,inventory.games[game].categories[category]?.count||0]));
before.total=games.reduce((sum,game)=>sum+before[game],0);
const additions={moreless:2,estimate:4,facts:6,jeopardy:8,total:20};
const after=Object.fromEntries(games.map(game=>[game,before[game]+additions[game]]));
after.total=before.total+20;
const summary={
  checked:'2026-10-29',
  target:{category,main_before:before,open_drafts_before:{total:0,note:'31 open PRs / about 1,220 pending questions checked; no new Vereinsstationen identity beyond Main.'},after_including_this_draft:after},
  run_target:{existing_category_labels:categories.size,completed_category_labels:1,missing_questions_against_20_per_category_run_target:(categories.size-1)*20,note:'This reviewed draft completes 20 only for Vereinsstationen.'},
};
const audit={
  checked:'2026-10-29',
  main_unique_keys:mainKeys.size,
  draft_unique_keys:draftKeys.size,
  exact_or_reversed_conflicts:conflicts,
  semantic_review:'Existing Salah, Suárez, Lewandowski, Ronaldo, Zidane, Pepe, Marcelo and Özil prompts were excluded. The draft uses 22 different players and 22 distinct observations. Transfer facts that already occur in the Transfers category were excluded.',
  comparison_review:'Both pairs use the same official Real Madrid match-count definition, unit and completed-club-career frame. Guti/Marcelo differ by 0.74%; Khedira/Özil by 1.26%.',
  limits:'Normalized prompt/pair checks plus targeted Main, open-PR and Daily observation searches.',
};
for(const [name,value] of Object.entries({'main-inventory.json':inventory,'duplicate-audit.json':audit,'category-summary.json':summary})){
  const output=JSON.stringify(value,null,2)+'\n';
  const path=folder+'/'+name;
  if(process.argv.includes('--check')){
    if(fs.readFileSync(path,'utf8')!==output)throw Error('Stale '+name);
  }else fs.writeFileSync(path,output);
}
console.log('Inventoried Main Vereinsstationen content and duplicate keys');
