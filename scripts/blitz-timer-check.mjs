import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const source=html.slice(html.indexOf('let GAME_TIMER=null;'),html.indexOf('function closeForeignGames('));
let now=10000,tick=null,timeouts=0;
const elements=new Map();
const el=id=>{
  if(!elements.has(id))elements.set(id,{value:8,textContent:'',disabled:false,classList:{add:()=>{},remove:()=>{}}});
  return elements.get(id);
};
const context=vm.createContext({renderSoloProgress(){},renderChaosRule(){},renderOnlineProgress(){},el,Date:{now:()=>now,parse:Date.parse},Math,Number,String,
  SOLO:{on:true,mode:'BLITZ',locked:false},
  S:{q:1,roomConfig:{game_mode:'BLITZ'},serverOffset:2000},
  setInterval:f=>{tick=f;return 1},clearInterval:()=>{tick=null},
  soloPick:choice=>{assert.equal(choice,null);timeouts++;context.SOLO.locked=true},
  tryReveal:q=>{assert.equal(q,1);timeouts++}
});
vm.runInContext(source,context);
el('blitzSeconds').value=3;
assert.equal(vm.runInContext('blitzSeconds()',context),5);
el('blitzSeconds').value=20;
assert.equal(vm.runInContext('blitzSeconds()',context),15);
el('blitzSeconds').value=8;
vm.runInContext('startSoloTimer()',context);
assert.match(el('gameTimer').textContent,/8 Sekunden/);
now+=8000;tick();assert.equal(timeouts,1,'solo timeout submits no choice');
tick();assert.equal(tick,null,'locked answer stops the timer');
context.SOLO.mode='CLASSIC';vm.runInContext('startSoloTimer()',context);
assert.equal(tick,null,'Classic has no countdown');
vm.runInContext("startOnlineTimer({question_no:1,status:'open',deadline:new DateFake()})".replace('new DateFake()',JSON.stringify(new Date(now+context.S.serverOffset+5000).toISOString())),context);
assert.match(el('gameTimer').textContent,/5 Sekunden/,'online countdown uses server offset');
now+=5000;tick();assert.equal(timeouts,2);assert.equal(el('a').disabled,true);
context.S.reviewMode=true;tick();assert.equal(tick,null,'review stops live timer');
console.log('OK: 5–15 second range, solo timeout, server clock countdown, and timer cleanup');

const pick=html.split('\n').find(line=>line.startsWith('function soloPick('));
context.SOLO={on:true,locked:false,mode:'BLITZ',deadline:now-1,i:0,total:0,score:0,history:[],questions:[{l:'A',r:'B',lv:100,rv:50,u:'m'}]};
context.S.joker=null;context.setTimeout=()=>{};
vm.runInContext(pick,context);
vm.runInContext("soloPick('a')",context);
assert.equal(context.SOLO.score,0,'a correct click after deadline earns no points');
assert.equal(context.SOLO.history.length,1);
assert.match(context.SOLO.history[0].detail,/Keine Antwort/);
vm.runInContext("soloPick('a')",context);
assert.equal(context.SOLO.history.length,1,'timeout cannot be scored twice');
console.log('OK: expired correct clicks score zero and lock exactly once');
