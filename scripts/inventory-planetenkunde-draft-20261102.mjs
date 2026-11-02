import fs from 'node:fs'; import vm from 'node:vm'; import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),dir=new URL('content/research/2026-11-02-planetenkunde/',root),check=process.argv.includes('--check'),c={window:{}}; vm.createContext(c); vm.runInContext(fs.readFileSync(new URL('content/approved.js',root),'utf8'),c);
const pack=JSON.parse(fs.readFileSync(new URL('draft-pack.json',dir))),games=['moreless','estimate','facts','jeopardy'];
const norm=v=>String(v??'').toLocaleLowerCase('de').normalize('NFKD').replace(/\p{M}/gu,'').replace(/[^a-z0-9]+/g,' ').trim();
const key=(g,q)=>g==='moreless'?[norm(q.metric||q.u),...([norm(q.l),norm(q.r)].sort())].join('|'):norm(g==='facts'?q.s:q.q);
const main=c.window.GAME_CONTENT_PACK, categoryNames=[...new Set(games.flatMap(g=>main[g].map(q=>q.cat)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'de'));
const categories=categoryNames.map(category=>{
  const byGame=Object.fromEntries(games.map(g=>[g,new Set(main[g].filter(q=>q.cat===category).map(q=>key(g,q))).size]));
  const subcategories=[...new Set(games.flatMap(g=>main[g].filter(q=>q.cat===category).map(q=>q.subcategory||q.sub).filter(Boolean)))].sort((a,b)=>a.localeCompare(b,'de'));
  return {category,unique_by_game:byGame,total:Object.values(byGame).reduce((a,b)=>a+b,0),selectable_subcategories:subcategories};
});
const before=Object.fromEntries(games.map(g=>[g,categories.find(x=>x.category==='Planetenkunde')?.unique_by_game[g]||0])),added=Object.fromEntries(games.map(g=>[g,pack[g].length])),after=Object.fromEntries(games.map(g=>[g,before[g]+added[g]]));
const report={base_commit:pack.base_commit,inventory_method:'Normalized question text per game; More/Less uses an undirected object pair plus metric.',selectable_category_count:categories.length,categories,target:{category:'Planetenkunde',before_main:before,known_open_drafts:{moreless:0,estimate:0,facts:0,jeopardy:0},added,after_including_this_draft:after,totals:{before_main:Object.values(before).reduce((a,b)=>a+b,0),known_open_drafts:0,added:20,after_including_this_draft:Object.values(after).reduce((a,b)=>a+b,0)}}};
const text=JSON.stringify(report,null,2)+'\n',out=new URL('category-summary.json',dir); if(check) assert.equal(fs.readFileSync(out,'utf8'),text); else fs.writeFileSync(out,text); console.log(`${check?'Checked':'Wrote'} ${categories.length}-category inventory; Planetenkunde 23 + 20 = 43`);
