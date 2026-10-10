/* Pure rules shared by the browser and regression checks. */
(function(root){
  'use strict';
  const shuffle=(items,rng=Math.random)=>{const out=items.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;};
  const signature=card=>JSON.stringify([card.kind,card.label,card.value,card.unit,card.scope||'']);
  const eligible=(pack,category,criteria)=>pack.subjects.filter(s=>(!category||s.category===category)&&s.facts.filter(f=>criteria.includes(f.criterion)).length>=(s.category==='Autos'?2:3));
  function createRound(pack,category,criteria,rng=Math.random){
    const pool=eligible(pack,category,criteria);
    if(pool.length<4)throw new Error('Wähle weitere Kriterien: Für eine Runde brauchen vier Gegenstände je zwei (Autos) bzw. drei passende Fakten.');
    const groups=shuffle(pool,rng).slice(0,4).map((s,i)=>({id:i,name:s.name,category:s.category,cards:[...(s.category==='Autos'?[{kind:'image',label:'Bild',value:s.name,unit:''}]:[]),{kind:'name',label:'Name',value:s.name,unit:''},...shuffle(s.facts.filter(f=>criteria.includes(f.criterion)),rng).slice(0,s.category==='Autos'?2:3).map(f=>({kind:'fact',...f}))]}));
    const cards=shuffle(groups.flatMap(g=>g.cards.map((c,i)=>({...c,id:g.id*4+i}))),rng);
    return {groups,cards,selected:[],solved:[],mistakes:0,attempts:[],maxMistakes:3,finished:false};
  }
  function submit(round){
    if(round.finished||round.selected.length!==4)return {status:'incomplete'};
    const picked=round.cards.filter(c=>round.selected.includes(c.id));
    if(picked.length!==4)return {status:'incomplete'};
    const key=picked.map(signature).sort().join('|');
    if(round.attempts.includes(key))return {status:'repeat'};
    const group=round.groups.find(g=>!round.solved.includes(g.id)&&g.cards.map(signature).sort().join('|')===key);
    if(group){round.solved.push(group.id);round.cards=round.cards.filter(c=>!round.selected.includes(c.id));round.selected=[];round.finished=round.solved.length===4;return {status:round.finished?'won':'correct',group};}
    const counts=new Map();for(const card of picked){const s=signature(card);counts.set(s,(counts.get(s)||0)+1)}
    const matched=Math.max(0,...round.groups.filter(g=>!round.solved.includes(g.id)).map(g=>{const expected=new Map();for(const card of g.cards){const s=signature(card);expected.set(s,(expected.get(s)||0)+1)}return [...expected].reduce((n,[s,count])=>n+Math.min(count,counts.get(s)||0),0)}));
    round.attempts.push(key);round.mistakes++;round.finished=round.mistakes>=(round.maxMistakes||3);return {status:round.finished?'lost':'wrong',near:matched===3,matched};
  }
  root.FactConnectionsEngine={shuffle,signature,eligible,createRound,submit};
})(typeof window==='undefined'?globalThis:window);
