import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const nodes=new Map();
const node=()=>{const classes=new Set();const item={dataset:{},children:[],value:'',textContent:'',disabled:false,replaceChildren(){this.children=[]},append(...children){this.children.push(...children)},setAttribute(key,value){this[key]=value},focus(){},scrollIntoView(){}};Object.defineProperty(item,'className',{get:()=>[...classes].join(' '),set:value=>{classes.clear();value.split(' ').filter(Boolean).forEach(c=>classes.add(c))}});item.classList={add:(...names)=>names.forEach(n=>classes.add(n)),remove:(...names)=>names.forEach(n=>classes.delete(n)),toggle(name,on){on=on??!classes.has(name);if(on)classes.add(name);else classes.delete(name);return on},contains:name=>classes.has(name)};return item};
const el=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)};
const storage=new Map(),calls=[],attempts={},savedAnswers={};let game='moreless',day='2026-09-30',expired=false;
const question=no=>({no,left_name:'A',right_name:'B',left_value:10,unit:'m',category:'Test',prompt:'Daily question'});
const max=g=>g==='estimate'?500:g==='facts'?5:null;
const response=()=>{const a=attempts[day+game],finished=!!a?.complete,score=a?.score||0;return {game,max_score:max(game),question_total:game==='moreless'?null:5,day,today:'2026-09-30',game_attempts:Object.fromEntries(['moreless','estimate','facts'].filter(g=>attempts[day+g]).map(g=>[g,attempts[day+g]])),offset:0,total:finished?1:0,my_rank:finished?1:null,my_score:score,leaderboard:finished?[{name:'<script>test</script>',score,rank:1,mine:true}]:[],attempt:a?{name:'<script>test</script>',answered:a.answered,score,complete:finished,rank:1}:null,question:a&&!finished?question(a.answered+1):null}};

let finishCallback=null;
const ctx=vm.createContext({setTimeout:callback=>{finishCallback=callback;return 1},clearTimeout:()=>{finishCallback=null},el,Intl,Date,Error,JSON,Math,document:{createElement:node,querySelectorAll:()=>[]},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},SUPABASE_URL:'https://example.invalid',KEY:'test-key',moreLessPrompt:()=> 'Question',setObjectVisual(){},setQuestionVisual(){},fetch:async(url,options)=>{
 const body=JSON.parse(options.body);calls.push({url,body,headers:options.headers});
 if(url.includes('/auth/'))return {ok:true,json:async()=>({access_token:'test-access',refresh_token:'test-refresh',user:{id:'test-user'}})};
 if(body.p_action==='answer'&&!expired){expired=true;return {ok:false,status:401,json:async()=>({message:'expired'})}};
 game=body.p_game||'moreless';day=body.p_day||'2026-09-30';if(body.p_action==='home'&&ctx.failHome)throw new Error('Offline');
 if(body.p_action==='start')attempts[day+game]??={answered:0,score:0,complete:false};
 let data=response();
 if(body.p_action==='answer'&&savedAnswers[day+game+body.p_question]){data.reveal=savedAnswers[day+game+body.p_question]}else if(body.p_action==='answer'){const a=attempts[day+game];a.answered++;const good=game!=='moreless'||body.p_choice==='a';a.score+=good?(game==='estimate'?100:1):0;a.complete=game==='moreless'?!good:a.answered===5;data=response();data.reveal={no:body.p_question,choice:body.p_choice,correct:good,points:good?(game==='estimate'?100:1):0,right_value:5,unit:'m',correct_name:'A',answer:game==='facts'?true:42,explanation:'Fact explanation'};savedAnswers[day+game+body.p_question]=data.reveal;if(ctx.loseAnswerResponse){ctx.loseAnswerResponse=false;throw new Error('Connection lost after save')}};
 if(body.p_action==='home'&&ctx.remoteResult){data.leaderboard.push(ctx.remoteResult);data.total++}
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
 await vm.runInContext('nextDaily()',ctx);
}
await vm.runInContext("answerDaily('b')",ctx);assert(finishCallback,'finished daily schedules automatic leaderboard');await finishCallback();assert.equal(vm.runInContext('DAILY.scores',ctx),true,'leaderboard opens automatically');
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
  await vm.runInContext('nextDaily()',ctx);if(i<5&&selected==='estimate')assert.equal(el('dailyEstimateSubmit').disabled,false,'next estimate unlocks submit');
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
for(let i=1;i<=5;i++){await vm.runInContext("answerDaily('true')",ctx);await vm.runInContext('nextDaily()',ctx)}
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


// Opening paths must fetch a fresh global board, including after the final answer.
const homeCount=()=>calls.filter(c=>c.body.p_action==='home').length;
await vm.runInContext("selectDailyGame('facts',true)",ctx);
const beforeClose=homeCount();await vm.runInContext('toggleDailyScores()',ctx);assert.equal(homeCount(),beforeClose,'closing rankings must not request data');
const beforeOpen=homeCount();await vm.runInContext('toggleDailyScores()',ctx);assert.equal(homeCount(),beforeOpen+1,'opening rankings requests one fresh snapshot');
const beforeFinishOpen=homeCount();await vm.runInContext('nextDaily()',ctx);assert.equal(homeCount(),beforeFinishOpen+1,'result-to-board path refreshes too');
const beforeTab=homeCount();await vm.runInContext("selectDailyGame('estimate',true)",ctx);assert.equal(homeCount(),beforeTab+1,'ranked game tab fetches exactly once');
assert.equal(calls.at(-1).body.p_day,'2026-09-30');assert.equal(calls.at(-1).body.p_game,'estimate');
console.log('OK: fresh global leaderboard on toggle, result navigation, automatic finish and game tab; no duplicate opening request');

await vm.runInContext('toggleDailyScores()',ctx);
ctx.remoteResult={name:'Neuer Mitspieler',score:400,rank:2,mine:false};
await vm.runInContext('toggleDailyScores()',ctx);
assert(el('dailyBoard').children.some(row=>row.children?.[1]?.textContent==='Neuer Mitspieler'),'another device result appears when the board is reopened');
console.log('OK: newly saved peer result appears on reopening without a manual refresh');

// Podium groups actual ranks, handles empty/single boards and stays off later pages.
vm.runInContext("DAILY.data.leaderboard=[{rank:1,name:'<img onerror=alert(1)>',score:5},{rank:1,name:'B',score:5,mine:true},{rank:2,name:'C',score:4},{rank:3,name:'D',score:3}];DAILY.data.offset=0;renderDailyHome()",ctx);
assert.equal(el('dailyPodium').children.length,3);
assert.equal(el('dailyPodium').children[0].children[2].textContent,'C');
assert.equal(el('dailyPodium').children[1].children[2].textContent,'<img onerror=alert(1)>');
assert.equal(el('dailyPodium').children[1].children[4].textContent,'+1 punktgleich auf dieser Seite');
vm.runInContext('DAILY.data.offset=50;renderDailyHome()',ctx);assert(el('dailyPodium').classList.contains('hide'));
vm.runInContext("DAILY.data.offset=0;DAILY.data.leaderboard=[{rank:1,name:'Solo',score:5}];renderDailyHome()",ctx);assert.equal(el('dailyPodium')['data-count'],'1');
vm.runInContext('DAILY.data.leaderboard=[];renderDailyHome()',ctx);assert(el('dailyPodium').classList.contains('hide'));
assert.equal(el('dailyIdentity')['data-access'],'guest');
ctx.gameAccount={current:async()=>({guest:false,token:'account-token',refresh:'account-refresh',uid:'account-user'})};
await vm.runInContext('refreshDaily()',ctx);assert.equal(el('dailyIdentity')['data-access'],'account');
assert(el('dailyBoardUpdated').textContent.startsWith('Online aktualisiert'));
const oldBoard=el('dailyBoard').children,oldTime=vm.runInContext('DAILY.lastUpdated',ctx);
ctx.failHome=true;await vm.runInContext('refreshDaily()',ctx);ctx.failHome=false;
assert.equal(el('dailyBoard').children,oldBoard,'failed refresh retains previously fetched rows');
assert(el('dailyBoardUpdated').textContent.includes('Aktualisierung fehlgeschlagen'));
assert.equal(vm.runInContext('DAILY.lastUpdated',ctx),oldTime);
delete ctx.gameAccount;
await vm.runInContext("chooseDailyDay('2026-09-28')",ctx);await vm.runInContext("selectDailyGame('facts')",ctx);await vm.runInContext("startDaily()",ctx);
ctx.loseAnswerResponse=true;await vm.runInContext("answerDaily('true')",ctx);
assert.equal(attempts['2026-09-28facts'].answered,1,'server saved before connection dropped');
assert.equal(el('dailySaveState')['data-state'],'uncertain');assert(!el('dailyRetry').classList.contains('hide'));
assert(el('dailyFactTrue').disabled&&el('dailyFactFalse').disabled);
const pendingCalls=calls.length;await vm.runInContext("answerDaily('false')",ctx);assert.equal(calls.length,pendingCalls,'uncertain answer cannot be changed');
await vm.runInContext('retryDailyAnswer()',ctx);
assert.equal(attempts['2026-09-28facts'].answered,1,'idempotent retry does not score twice');
assert.equal(el('dailySaveState')['data-state'],'saved');assert(el('dailyRetry').classList.contains('hide'));
await vm.runInContext('nextDaily()',ctx);assert.equal(el('dailySaveState')['data-state'],'ready');
for(const file of ['index.html','offline/index.html']){const html=fs.readFileSync(file,'utf8');for(const id of ['dailyIdentity','dailyPodium','dailyBoardUpdated','dailySaveState','dailyRetry'])assert.equal(html.split('id="'+id+'"').length-1,1);assert(html.includes('assets/game-polish.css?v=mode-first-20261004'))}
console.log('OK: safe tied podium, single/empty/page handling, account/guest badge, stale refresh feedback and lost-response retry without duplicate points');
