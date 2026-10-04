import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const nodes=new Map();let now=1000,tick,focused=0,starts=0;
function el(id){if(!nodes.has(id)){const classes=new Set(),children=[];nodes.set(id,{dataset:{},textContent:'',disabled:false,open:false,children,classList:{add:(...x)=>x.forEach(y=>classes.add(y)),remove:(...x)=>x.forEach(y=>classes.delete(y)),contains:x=>classes.has(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)},querySelector:s=>el(id+s),replaceChildren(...c){this.children=c},appendChild(c){this.children.push(c)},showModal(){this.open=true},close(){this.open=false},focus(){focused++}})}return nodes.get(id)}
const S={room:'room',uid:'me',q:1,questionId:'q1',roomConfig:{game_mode:'CHAOS'},modePlayers:[],usedJokers:[],revealHistory:{},questionData:{}};
const q={question_id:'q1',question_no:1,rule:'reverse',category:'Länder',status:'open',starts_at:new Date(6000).toISOString()};S.questionData[1]=q;
const ctx=vm.createContext({el,S,EST:{onlineId:'e1'},SOLO:{on:false},LOBBY_MODE:'CHAOS',GAME_WORLD:'moreless',CHAOS_RULES:[{id:'reverse',name:'Umgekehrt',text:'Wähle den kleineren Wert!'}],Date:{parse:Date.parse,now:()=>now},document:{activeElement:el('focus'),createElement:()=>({textContent:''}),querySelectorAll:()=>[]},setInterval:fn=>{tick=fn;return 1},clearInterval(){},renderEstimateOnline(){},openWorldMenu(){},Math});
vm.runInContext(fs.readFileSync('assets/home/game-ux.js','utf8'),ctx);
ctx.q=q;vm.runInContext("showOnlineRulePreview('moreless',q)",ctx);
assert.equal(el('gameRulePreview').open,true);assert.equal(el('gameRuleTitle').textContent,'Umgekehrt');assert.match(el('gameRuleList').children[0].textContent,/kleineren/);assert.equal(el('a').disabled,true);
now=5999;tick();assert.equal(el('a').disabled,true,'early clicks remain locked');now=6000;tick();assert.equal(el('gameRulePreview').open,false);assert.equal(el('a').disabled,false,'answers unlock exactly at start');assert.match(el('reveal').textContent,/kleineren/);
vm.runInContext("showOnlineRulePreview('moreless',q)",ctx);assert.equal(el('gameRulePreview').open,false,'polling does not repeat preview');
S.answeredQ=1;vm.runInContext('refreshOnlineReadiness(q)',ctx);assert.equal(el('a').disabled,true,'saved answer cannot unlock after preview');
S.room=null;ctx.run=()=>{starts++};
assert.equal(vm.runInContext("needsRulePreview('estimate','risk',run)",ctx),false);assert.equal(starts,0);assert.equal(el('gameRulePreview').open,false,'local start does not open another rules dialog');
const waiting={active:true,question_id:'q2',players:[{user_id:'a',name:'Anna',answered:true,connected:true},{user_id:'me',name:'Du',answered:false,connected:true},{user_id:'c',name:'<img src=x>',answered:false,connected:false}]};ctx.waiting=waiting;
vm.runInContext("renderWaiting('waiting',waiting,'q2',true)",ctx);assert.equal(el('waiting[data-wait-count]').textContent,'1 von 3 Antworten gespeichert');assert.equal(el('waiting[data-wait-names]').textContent,'Noch offen: Du, <img src=x> (Verbindung unterbrochen)');assert.equal(el('waitingprogress').value,1);
vm.runInContext("renderWaiting('waiting',waiting,'old',true)",ctx);assert(el('waiting').classList.contains('hide'),'stale question snapshot stays hidden');vm.runInContext("renderWaiting('waiting',waiting,'q2',false)",ctx);assert(el('waiting').classList.contains('hide'),'no wait panel after reveal');
console.log('OK: rules before solo start, timed reverse preview, exact unlock, saved-answer locks, no repeated preview, focus return, safe waiting names and stale/revealed status cleanup');

// Preview settings must affect both the live timer control and match metadata.
S.room=null;ctx.blitzSeconds=()=>Number(el('blitzSeconds').value)||8;el('blitzSeconds').value=8;
vm.runInContext("configureRuleSettings(gameRules('moreless','blitz'),true)",ctx);
el('gameRuleRounds').value=2;el('gameRuleSeconds').value=12;vm.runInContext('updateRuleSettings()',ctx);
assert.equal(vm.runInContext('selectedSoloRounds()',ctx),2);assert.equal(el('blitzSeconds').value,12);
assert(el('gameRuleMeta').children.some(x=>x.textContent==='2 Runden'));assert(el('gameRuleMeta').children.some(x=>/12 Sekunden/.test(x.textContent)));
assert(el('gameRuleList').children.some(x=>/12 Sekunden/.test(x.textContent)));
el('gameRuleSeconds').value=999;vm.runInContext('updateRuleSettings()',ctx);assert.equal(el('blitzSeconds').value,15);
S.room='room';el('gameRuleRounds').value=1;vm.runInContext('updateRuleSettings()',ctx);assert.equal(vm.runInContext('selectedSoloRounds()',ctx),2,'guest cannot change online match settings');
console.log('OK: editable rounds and Blitz seconds, metadata refresh, input limits and online settings protection');
