import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const nodes=new Map();
const node=()=>{const classes=new Set();const item={children:[],value:'',textContent:'',disabled:false,replaceChildren(){this.children=[]},append(...children){this.children.push(...children)},setAttribute(key,value){this[key]=value},focus(){},scrollIntoView(){}};Object.defineProperty(item,'className',{get:()=>[...classes].join(' '),set:value=>{classes.clear();value.split(' ').filter(Boolean).forEach(c=>classes.add(c))}});item.classList={add:(...names)=>names.forEach(n=>classes.add(n)),remove:(...names)=>names.forEach(n=>classes.delete(n)),toggle(name,on){on=on??!classes.has(name);if(on)classes.add(name);else classes.delete(name);return on},contains:name=>classes.has(name)};return item};
const el=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)};
const storage=new Map(),calls=[],attempts={};let game='moreless',day='2026-09-30',expired=false;
const question=no=>({no,left_name:'A',right_name:'B',left_value:10,unit:'m',category:'Test',prompt:'Daily question'});
const max=g=>g==='estimate'?500:g==='facts'?5:null;
const response=()=>{const a=attempts[day+game],finished=!!a?.complete,score=a?.score||0;return {game,max_score:max(game),question_total:game==='moreless'?null:5,day,today:'2026-09-30',game_attempts:Object.fromEntries(['moreless','estimate','facts'].filter(g=>attempts[day+g]).map(g=>[g,attempts[day+g]])),offset:0,total:finished?1:0,my_rank:finished?1:null,my_score:score,leaderboard:finished?[{name:'<script>test</script>',score,rank:1,mine:true}]:[],attempt:a?{name:'<script>test</script>',answered:a.answered,score,complete:finished,rank:1}:null,question:a&&!finished?question(a.answered+1):null}};

let finishCallback=null;
const ctx=vm.createContext({setTimeout:callback=>{finishCallback=callback;return 1},clearTimeout:()=>{finishCallback=null},el,Intl,Date,Error,JSON,Math,document:{createElement:node,querySelectorAll:()=>[]},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},SUPABASE_URL:'https://example.invalid',KEY:'test-key',moreLessPrompt:()=> 'Question',setObjectVisual(){},setQuestionVisual(){},fetch:async(url,options)=>{
 const body=JSON.parse(options.body);calls.push({url,body,headers:options.headers});
 if(url.includes('/auth/'))return {ok:true,json:async()=>({access_token:'test-access',refresh_token:'test-refresh',user:{id:'test-user'}})};
 if(body.p_action==='answer'&&!expired){expired=true;return {ok:false,status:401,json:async()=>({message:'expired'})}};
 game=body.p_game||'moreless';day=body.p_day||'2026-09-30';
 if(body.p_action==='start')attempts[day+game]??={answered:0,score:0,complete:false};
 let data=response();
 if(body.p_action==='answer'){const a=attempts[day+game];a.answered++;const good=game!=='moreless'||body.p_choice==='a';a.score+=good?(game==='estimate'?100:1):0;a.complete=game==='moreless'?!good:a.answered===5;data=response();data.reveal={no:body.p_question,choice:body.p_choice,correct:good,points:good?(game==='estimate'?100:1):0,right_value:5,unit:'m',correct_name:'A',answer:game==='facts'?true:42,explanation:'Fact explanation'}};
 return {ok:true,json:async()=>data};
}});
vm.runInContext(fs.readFileSync('assets/daily.js','utf8'),ctx);
await vm.runInContext('openDaily()',ctx);
assert(el('dailyPager').classList.contains('hide'),'empty board has no pagination');
assert.equal(el('dailyBoard').children[1].textContent,'Daily starten');
assert(storage.has('ml_daily_auth_v1'),'daily identity persists across page reloads');
await vm.runInContext("selectDailyGame('moreless')",ctx);el('dailyName').value='<script>test</script>';
await vm.runInContext('startDaily()',ctx);
assert.equal(el('dailyProgress').textContent,'Frage 1 · Test');
for(let i=1;i<=12;i++){
 await vm.runInContext("answerDaily('a')",ctx);
 assert.equal(el('dailyA').disabled,true,'answers lock after successful save');
 vm.runInContext('nextDaily()',ctx);
}
await vm.runInContext("answerDaily('b')",ctx);assert(finishCallback,'finished daily schedules automatic leaderboard');finishCallback();assert.equal(vm.runInContext('DAILY.scores',ctx),true,'leaderboard opens automatically');
assert.equal(el('dailyMine').textContent,'Dein Ergebnis: 12 Punkte · Rang 1');
assert.equal(el('dailyBoard').children[0].children[1].textContent,'<script>test</script> · Du','names are rendered as text');
assert.equal(calls.filter(c=>c.url.includes('refresh_token')).length,1,'expired access token is refreshed once');
assert(calls.filter(c=>c.url.includes('/rpc/')).every(c=>c.headers.Authorization==='Bearer test-access'));
assert(!calls.some(c=>Object.hasOwn(c.body,'score')),'client never sends its own score');
const count=calls.length;await vm.runInContext("answerDaily('a')",ctx);assert.equal(calls.length,count,'completed run cannot submit more answers');
for(const selected of ['estimate','facts']){
 ctx.selected=selected;await vm.runInContext('selectDailyGame(selected)',ctx);await vm.runInContext('startDaily()',ctx);
 for(let i=1;i<=5;i++){
  if(selected==='estimate'){el('dailyEstimateValue').value='42';ctx.event={preventDefault(){}};await vm.runInContext('submitDailyEstimate(event)',ctx);await new Promise(resolve=>setTimeout(resolve,0));assert.equal(el('dailyEstimateSubmit').disabled,true)}else await vm.runInContext("answerDaily('true')",ctx);
  vm.runInContext('nextDaily()',ctx);if(i<5&&selected==='estimate')assert.equal(el('dailyEstimateSubmit').disabled,false,'next estimate unlocks submit');
 }
 assert.equal(el('dailyMine').textContent,'Dein Ergebnis: '+max(selected)+' / '+max(selected)+' Punkte · Rang 1');
}
vm.runInContext('showDailyScores(true)',ctx);assert.equal(el('dailyBoardMine').textContent,'Dein Highscore: 5 / 5 Punkte · Rang 1');
console.log('OK: endless Daily ends at first error, five-question 500/5 maxima, auth refresh, safe names and per-game leaderboard');

await vm.runInContext("chooseDailyDay('2026-09-29')",ctx);
assert.equal(vm.runInContext('DAILY.day',ctx),'2026-09-29');
assert.equal(vm.runInContext('DAILY.data.attempt',ctx),null,'past day has independent attempt');
assert.equal(el('dailyCardStatus-facts').textContent,'Im Archiv verfügbar');
await vm.runInContext('startDaily()',ctx);
for(let i=1;i<=5;i++){await vm.runInContext("answerDaily('true')",ctx);vm.runInContext('nextDaily()',ctx)}
assert.equal(attempts['2026-09-29facts'].score,5);
await vm.runInContext("chooseDailyDay('2026-09-30')",ctx);
assert.equal(vm.runInContext('DAILY.data.attempt.complete',ctx),true,'returning to today restores its completed result');
const beforeFuture=calls.length;await vm.runInContext("chooseDailyDay('2026-10-01')",ctx);assert.equal(calls.length,beforeFuture,'future cannot be selected');
vm.runInContext('showDailyMenu();moveDailyMonth(-1)',ctx);
assert.equal(vm.runInContext('DAILY.menu',ctx),true);
assert.equal(el('dailyCalendarMonth').textContent,'August 2026');
assert(calls.filter(c=>c.body.p_action==='answer').every(c=>c.body.p_day),'every answer explicitly targets its calendar date');
console.log('OK: archive day selection, independent attempts, calendar navigation, future disabled, completed result restored');

// Tied ranks share the podium colour; current-player outline preserves the rank colour.
vm.runInContext("DAILY.data.leaderboard=[{rank:1,name:'A',score:5},{rank:1,name:'B',score:5,mine:true},{rank:2,name:'C',score:4},{rank:3,name:'D',score:3},{rank:4,name:'E',score:2}];DAILY.data.total=5;renderDailyHome();showDailyScores(true)",ctx);
const rows=el('dailyBoard').children;
assert(rows[0].classList.contains('dailyGold')&&rows[1].classList.contains('dailyGold'));
assert(rows[1].classList.contains('dailyMineRow'));
assert(rows[2].classList.contains('dailySilver'));assert(rows[3].classList.contains('dailyBronze'));
assert(!rows[4].classList.contains('dailyBronze'));
assert(el('dailyOverlay').classList.contains('dailyShowingScores'));
vm.runInContext('DAILY.data.total=51;renderDailyHome()',ctx);assert(!el('dailyPager').classList.contains('hide'));
vm.runInContext('showDailyScores(false)',ctx);assert(!el('dailyOverlay').classList.contains('dailyShowingScores'));
const markup=fs.readFileSync('index.html','utf8');
assert.equal((markup.match(/id="dailyScoresToggle"/g)||[]).length,1);
assert.equal((markup.match(/selectDailyGame\('[a-z]+',DAILY.scores\)/g)||[]).length,3,'game tabs preserve rankings view');
console.log('OK: tied gold ranks, silver/bronze, current-player highlight, empty CTA, conditional pagination and ranking navigation');
