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

function fixture(metric,host=false,category='standard'){
  const elements=new Map(),calls=[];
  const el=id=>{
    if(!elements.has(id)){
      const classes=new Set();
      elements.set(id,{classList:{add:(...names)=>names.forEach(x=>classes.add(x)),remove:(...names)=>names.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle:(x,force)=>{if(force===true||force===undefined&&!classes.has(x))classes.add(x);else classes.delete(x)}},style:{},value:'',textContent:'',classes});
    }
    return elements.get(id);
  };
  const S={room:'room',uid:'user',myName:'Player',host,enteredGame:false,newGameLobby:false,q:0,liveQ:0,questionData:{},questionHistory:{},revealHistory:{},reviewMode:false};
  const context=vm.createContext({clearGameTimer:()=>{},S,el,LOBBY_GAME:metric==='JEOPARDY_START'?'quiz':metric==='ESTIMATE_START'?'estimate':'moreless',JEOP:{mode:'standard'},EST:{mode:'classic'},ESTIMATE_Q:[{q:'Test',a:5,u:'m'}],
    req:async path=>path.includes('online_ml_questions')?[{question_no:901,metric,category,prompt:'start'}]:[],
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
const estimateGuest=fixture('ESTIMATE_START',false,'risk:15');
await vm.runInContext('sync()',estimateGuest.context);
assert.equal(estimateGuest.context.EST.mode,'risk');
assert.equal(estimateGuest.context.EST.roundLength,15);

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
vm.runInContext('let FACT_Q=[{s:"Test",a:true}],FACT={},FACT_DIFFICULTY="easy";function factRound(items){return items}function factShuffle(items){return items}',estimate.context);
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

// Facts must use the chosen difficulty and clear the previous answer's state.
const factData=html.slice(html.indexOf('const FACT_EXTRA=['),html.indexOf('(function mergeReviewedContent(){'));
const factButtons=[0,1].map(()=>({disabled:false,classes:new Set(),classList:{
  add(){},remove(...names){names.forEach(n=>this.owner.classes.delete(n))},
  toggle(name,on){if(on)this.owner.classes.add(name);else this.owner.classes.delete(name)}
}}));
factButtons.forEach(b=>b.classList.owner=b);
const factEls=new Map();
const factEl=id=>{
  if(!factEls.has(id)){
    const classes=new Set();
    factEls.set(id,{classes,classList:{add:n=>classes.add(n),remove:n=>classes.delete(n)},textContent:'',replaceChildren(...children){this.children=children},append(...children){this.children.push(...children)}});
  }
  return factEls.get(id);
};
const factContext=vm.createContext({
  document:{getElementById:factEl,querySelector:()=>({classList:factEl('choices').classList,querySelectorAll:()=>factButtons}),
    querySelectorAll:()=>factButtons,createElement:()=>({textContent:''})},
  el:factEl,closeForeignGames:()=>{},setQuestionVisual:()=>{},Math
});
vm.runInContext(factData+'\n'+html.slice(html.indexOf('const FACT_LEVEL_NAMES='),html.indexOf('function closeFactCheck()')),factContext);
assert.equal(vm.runInContext('FACT_CURATED.length',factContext),42,'42 sourced new statements');
assert.equal(vm.runInContext('FACT_CURATED.every(q=>q.source.startsWith("https://")&&q.e&&typeof q.a==="boolean")',factContext),true,'each statement has a source, explanation, and answer');
for(const level of ['easy','medium','hard']){
  vm.runInContext('FACT_DIFFICULTY='+JSON.stringify(level)+';startFactCheck()',factContext);
  assert.equal(vm.runInContext('FACT.q.length',factContext),10,`${level} provides ten questions`);
  assert.equal(vm.runInContext('FACT.q.every(q=>(q.difficulty||"easy")===FACT_DIFFICULTY)',factContext),true,`${level} is isolated`);
  assert.equal(vm.runInContext('FACT.q.filter(q=>q.a).length',factContext),5,`${level} has five facts`);
  assert.equal(factEl('factProgress').textContent.startsWith({easy:'LEICHT',medium:'MITTEL',hard:'SCHWER'}[level]),true);
  const correct=vm.runInContext('FACT.q[0].a',factContext);
  factContext.choice=correct;
  vm.runInContext('answerFact(choice)',factContext);
  assert.equal(factButtons[correct?0:1].classes.has('correct'),true,'correct answer is shown');
  vm.runInContext('nextFact()',factContext);
  assert.equal(factButtons.every(b=>!b.classes.has('correct')&&!b.disabled),true,'next question unlocks choices');
}
vm.runInContext('FACT={q:[FACT_CURATED[0]],i:0,score:0,locked:false};answerFact(true)',factContext);
assert.equal(factEl('factReveal').children[2].href,vm.runInContext('FACT_CURATED[0].source',factContext),'source is linked after reveal');

console.log('OK: game modes stay separate on launch and repeated lobby sync');

// An online Jeopardy board must be identical on both devices even when their
// local question history differs. Random-category choices travel in the start signal.
function onlineBoard(history, choices){
  const JEOP_CATS=Array.from({length:8},(_,i)=>['Kategorie '+i,Array.from({length:8},(_,j)=>['Frage '+i+'-'+j,'Antwort '+j])]);
  const context=vm.createContext({S:{room:'same-room'},JEOP_CATS,JEOP:{mode:'random',randomCats:choices,step:100,data:[]},
    jeopHistory:()=>history,saveJeopHistory:()=>{throw Error('Online board must not persist local history')},
    jeopDifficulty:(_,i)=>i%5+1,jeopQuestionKey:(cat,q)=>cat+'|'+q[0]});
  vm.runInContext('let JEOP_RANDOM=null;'+['jeopRoomRandom','jeopShuffle','jeopPick','jeopQuestionForLevel','buildJeopData'].map(source).join('\n'),context);
  vm.runInContext('buildJeopData()',context);
  return JSON.stringify(context.JEOP.data);
}
assert.equal(onlineBoard(['Kategorie 0|Frage 0-0'],[0,1,2,3,4,5]),onlineBoard([], [0,1,2,3,4,5]),'host and guest share the same Jeopardy board');
console.log('OK: online Jeopardy host and guest share one deterministic board');

const lobbyCalls=[];
const lobby=vm.createContext({blitzSeconds:()=>8,S:{room:null,code:null,host:false,myName:''},LOBBY_GAME:'quiz',LOBBY_MODE:'random',JEOP:{mode:'random',randomCats:[1,2,3,4,5,6]},EST:{mode:'risk',roundLength:15},
  el:id=>({value:id==='name'?'Anna':'ABCD1234'}),anon:async()=>{},row:x=>x,
  rpc:async(fn,payload)=>{lobbyCalls.push([fn,payload]);return fn==='ml_create_room'?{room_id:'room-1',room_code:'ABCD1234'}:{room_id:'room-1'}},ready:()=>{},msg:()=>{}});
vm.runInContext(source('createRoom')+'\n'+source('joinRoom')+'\n'+source('startQ'),lobby);
await vm.runInContext('createRoom()',lobby);
assert.equal(lobby.S.room,'room-1');assert.equal(lobby.S.host,true);
assert.equal(lobbyCalls[0][1].p_config.game,'quiz');
await vm.runInContext('joinRoom()',lobby);
assert.equal(lobby.S.host,false);assert.equal(lobbyCalls[1][1].p_code,'ABCD1234');
await vm.runInContext('startQ(901)',lobby);
assert.equal(lobbyCalls[2][1].p_category,'random:1,2,3,4,5,6');
await vm.runInContext('startQ(902)',lobby);
assert.equal(lobbyCalls[3][1].p_category,'risk:15','estimate mode and round length travel to the guest');
console.log('OK: create/join lobby and selected random board signal');
