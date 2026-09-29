import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const source=name=>{
  const start=html.search(new RegExp('(?:async )?function '+name+'\\('));
  assert(start>=0,`${name} exists`);
  const open=html.indexOf('{',start);
  let depth=0,quote='',escape=false;
  for(let i=open;i<html.length;i++){
    const c=html[i];
    if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote='';continue}
    if(c==='\''||c==='"'||c==='`'){quote=c;continue}
    if(c==='{')depth++;
    if(c==='}'&&!--depth)return html.slice(start,i+1);
  }
  throw new Error(`Unclosed ${name}`);
};

function fixture(metric,host=false){
  const elements=new Map(),calls=[];
  const el=id=>{
    if(!elements.has(id)){
      const classes=new Set();
      elements.set(id,{classList:{add:(...names)=>names.forEach(x=>classes.add(x)),remove:(...names)=>names.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle:(x,force)=>{if(force===true||force===undefined&&!classes.has(x))classes.add(x);else classes.delete(x)}},style:{},value:'',textContent:'',classes});
    }
    return elements.get(id);
  };
  const S={room:'room',uid:'user',myName:'Player',host,enteredGame:false,newGameLobby:false,q:0,liveQ:0,questionData:{},questionHistory:{},revealHistory:{},reviewMode:false};
  const context=vm.createContext({S,el,LOBBY_GAME:metric==='JEOPARDY_START'?'quiz':metric==='ESTIMATE_START'?'estimate':'moreless',JEOP:{mode:'standard'},EST:{mode:'classic'},
    req:async path=>path.includes('online_ml_questions')?[{question_no:901,metric,category:'standard',prompt:'start'}]:[],
    startJeopardy:()=>calls.push('jeopardy'),startEstimateSolo:()=>calls.push('estimate'),showQ:()=>calls.push('moreless'),
    startTransition:()=>{},endTransition:()=>{},showReveal:()=>{},msg:()=>{},
    document:{getElementById:el,querySelectorAll:()=>[]},clearInterval:()=>{},buildJeopData:()=>{},renderJeopBoard:()=>{},renderEstimate:()=>{},jeopInitOnline:()=>{},
  });
  vm.runInContext(source('sync'),context);
  return {context,S,el,calls};
}

for(const [signal,mode] of [['JEOPARDY_START','jeopardy'],['ESTIMATE_START','estimate']]){
  const guest=fixture(signal);
  await vm.runInContext('sync()',guest.context);
  await vm.runInContext('sync()',guest.context);
  assert.deepEqual(guest.calls,[mode],`${signal}: guest starts once, never opens More/Less`);
  const host=fixture(signal,true);
  await vm.runInContext('sync()',host.context);
  assert.deepEqual(host.calls,[],`${signal}: host already started its own mode`);
}

const f=fixture('JEOPARDY_START');
vm.runInContext('let GAME_WORLD="moreless",SOLO={on:true},JEOP_STATE=0;',f.context);
vm.runInContext(source('closeForeignGames')+'\n'+source('startJeopardy'),f.context);
let delayed,soloStart=0;
f.context.setTimeout=fn=>{delayed=fn};
f.context.startSoloCategory=()=>soloStart++;
vm.runInContext(source('revealSoloCard'),f.context);
const card={dataset:{cat:'Natur',sub:''},classList:{add:()=>{}},closest:()=>({classList:{contains:()=>false,add:()=>{}}})};
f.context.card=card;
vm.runInContext('revealSoloCard(card)',f.context);
f.el('soloCardDraw').classList.add('on');
f.el('catOverlay').classList.add('on');
f.el('estimateGame').classList.remove('hide');
vm.runInContext('startJeopardy()',f.context);
delayed();
assert.equal(soloStart,0,'delayed card animation cannot reopen More/Less');
assert.equal(vm.runInContext('GAME_WORLD',f.context),'quiz');
assert.equal(f.el('soloCardDraw').classList.contains('on'),false);
assert.equal(f.el('catOverlay').classList.contains('on'),false);
assert.equal(f.el('estimateGame').classList.contains('hide'),true);
assert.equal(f.el('jeopGame').classList.contains('hide'),false);

vm.runInContext(source('showCurrentGame'),f.context);
f.el('resultsPanel').classList.add('on');
vm.runInContext('showCurrentGame()',f.context);
assert.equal(f.el('jeopGame').classList.contains('hide'),false);
assert.equal(f.el('game').classList.contains('preLobbyHidden'),true);

const estimate=fixture('ESTIMATE_START');
vm.runInContext('let GAME_WORLD="moreless",SOLO={on:true};',estimate.context);
vm.runInContext(source('closeForeignGames')+'\n'+source('startEstimateSolo')+'\n'+source('showCurrentGame'),estimate.context);
estimate.el('soloCardDraw').classList.add('on');
vm.runInContext('startEstimateSolo();showCurrentGame()',estimate.context);
assert.equal(vm.runInContext('GAME_WORLD',estimate.context),'estimate');
assert.equal(estimate.el('soloCardDraw').classList.contains('on'),false);
assert.equal(estimate.el('game').classList.contains('preLobbyHidden'),true);
assert.equal(estimate.el('estimateGame').classList.contains('hide'),false);

estimate.context.renderFact=()=>{};
vm.runInContext('let FACT_Q=[{s:"Test",a:true}],FACT={};',estimate.context);
vm.runInContext(source('openWorldMenu')+'\n'+source('startFactCheck')+'\n'+source('closeFactCheck'),estimate.context);
for(const [world,panel] of [['moreless','morelessModes'],['estimate','playType'],['quiz','jeopardyIntro'],['facts','factIntro']]){
  vm.runInContext(`openWorldMenu('${world}')`,estimate.context);
  assert.equal(estimate.el(panel).classList.contains('hide'),false,`${world} shows its own menu`);
  if(world==='estimate')assert.equal(estimate.el(panel).classList.contains('on'),true,'estimate panel is displayed');
  for(const other of ['morelessModes','playType','jeopardyIntro','factIntro'].filter(x=>x!==panel))
    assert.equal(estimate.el(other).classList.contains('hide'),true,`${world} hides ${other}`);
}
vm.runInContext('startFactCheck();closeFactCheck()',estimate.context);
assert.equal(estimate.el('estimateGame').classList.contains('hide'),true);
assert.equal(estimate.el('factGame').classList.contains('hide'),true);
assert.equal(estimate.el('factIntro').classList.contains('hide'),false);

console.log('OK: game modes stay separate on launch and repeated lobby sync');
