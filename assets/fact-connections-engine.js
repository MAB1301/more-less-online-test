/* Pure rules shared by the browser and regression checks. */
(function(root){
  'use strict';
  const shuffle=(items,rng=Math.random)=>{const out=items.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;};
  const signature=card=>JSON.stringify([card.kind,card.label,card.value,card.unit,card.scope||'']);
  const eligible=(pack,category,criteria)=>pack.subjects.filter(s=>(!category||s.category===category)&&s.facts.filter(f=>criteria.includes(f.criterion)).length>=3);
  function createRound(pack,category,criteria,rng=Math.random){
    const pool=eligible(pack,category,criteria);
    if(pool.length<4)throw new Error('Wähle weitere Kriterien: Für eine Runde brauchen vier Gegenstände jeweils drei passende Fakten.');
    const groups=shuffle(pool,rng).slice(0,4).map((s,i)=>({id:i,name:s.name,category:s.category,cards:[{kind:'name',label:'Name',value:s.name,unit:''},...shuffle(s.facts.filter(f=>criteria.includes(f.criterion)),rng).slice(0,3).map(f=>({kind:'fact',...f}))]}));
    const cards=shuffle(groups.flatMap(g=>g.cards.map((c,i)=>({...c,id:g.id*4+i}))),rng);
    return {groups,cards,selected:[],solved:[],mistakes:0,attempts:[],finished:false};
  }
  function submit(round){
    if(round.finished||round.selected.length!==4)return {status:'incomplete'};
    const picked=round.cards.filter(c=>round.selected.includes(c.id));
    if(picked.length!==4)return {status:'incomplete'};
    const key=picked.map(signature).sort().join('|');
    if(round.attempts.includes(key))return {status:'repeat'};
    const group=round.groups.find(g=>!round.solved.includes(g.id)&&g.cards.map(signature).sort().join('|')===key);
    if(group){round.solved.push(group.id);round.cards=round.cards.filter(c=>!round.selected.includes(c.id));round.selected=[];round.finished=round.solved.length===4;return {status:round.finished?'won':'correct',group};}
    round.attempts.push(key);round.mistakes++;round.finished=round.mistakes>=4;return {status:round.finished?'lost':'wrong'};
  }
  root.FactConnectionsEngine={shuffle,signature,eligible,createRound,submit};
})(typeof window==='undefined'?globalThis:window);
