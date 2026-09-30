import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const nodes=new Map();
const node=()=>({children:[],value:'',textContent:'',disabled:false,classList:{add(){},remove(){},toggle(){}},replaceChildren(){this.children=[]},append(...children){this.children.push(...children)},focus(){},scrollIntoView(){}});
const el=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)};
const storage=new Map(),calls=[],attempts={};let game='moreless',expired=false;
const question=no=>({no,left_name:'A',right_name:'B',left_value:10,unit:'m',category:'Test',prompt:'Daily question'});
const max=g=>g==='estimate'?1000:g==='overall'?300:10;
const response=()=>{const a=attempts[game],totalScore=Object.entries(attempts).reduce((n,[g,a])=>n+(a.answered===10?Math.round(a.score/max(g)*100):0),0),finished=game==='overall'?totalScore>0:a?.answered===10,score=game==='overall'?totalScore:(a?.score||0);return {game,max_score:max(game),day:'2026-09-30',offset:0,total:finished?1:0,my_rank:finished?1:null,my_score:score,leaderboard:finished?[{name:'<script>test</script>',score,rank:1,mine:true}]:[],attempt:game!=='overall'&&a?{name:'<script>test</script>',answered:a.answered,score:a.score,complete:a.answered===10,rank:1}:null,question:game!=='overall'&&a&&a.answered<10?question(a.answered+1):null}};
const ctx=vm.createContext({el,Intl,Date,Error,JSON,Math,document:{createElement:node,querySelectorAll:()=>[]},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},SUPABASE_URL:'https://example.invalid',KEY:'test-key',moreLessPrompt:()=> 'Question',setObjectVisual(){},setQuestionVisual(){},fetch:async(url,options)=>{
 const body=JSON.parse(options.body);calls.push({url,body,headers:options.headers});
 if(url.includes('/auth/'))return {ok:true,json:async()=>({access_token:'test-access',refresh_token:'test-refresh',user:{id:'test-user'}})};
 if(body.p_action==='answer'&&!expired){expired=true;return {ok:false,status:401,json:async()=>({message:'expired'})}};
 game=body.p_game||'moreless';
 if(body.p_action==='start')attempts[game]??={answered:0,score:0};
 let data=response();
 if(body.p_action==='answer'){const a=attempts[game];a.answered++;a.score+=game==='estimate'?100:1;data=response();data.reveal={no:body.p_question,choice:body.p_choice,correct:true,points:game==='estimate'?100:1,right_value:5,unit:'m',correct_name:'A',answer:game==='facts'?true:42,explanation:'Fact explanation'}};
 return {ok:true,json:async()=>data};
}});
vm.runInContext(fs.readFileSync('assets/daily.js','utf8'),ctx);
await vm.runInContext('openDaily()',ctx);
assert(storage.has('ml_daily_auth_v1'),'daily identity persists across page reloads');
el('dailyName').value='<script>test</script>';
await vm.runInContext('startDaily()',ctx);
assert.equal(el('dailyProgress').textContent,'Frage 1 / 10 · Test');
for(let i=1;i<=10;i++){
 await vm.runInContext("answerDaily('a')",ctx);
 assert.equal(el('dailyA').disabled,true,'answers lock after successful save');
 vm.runInContext('nextDaily()',ctx);
}
assert.equal(el('dailyMine').textContent,'Dein Ergebnis: 10 / 10 Punkte · Rang 1');
assert.equal(el('dailyBoard').children[0].children[1].textContent,'<script>test</script> · Du','names are rendered as text');
assert.equal(calls.filter(c=>c.url.includes('refresh_token')).length,1,'expired access token is refreshed once');
assert(calls.filter(c=>c.url.includes('/rpc/')).every(c=>c.headers.Authorization==='Bearer test-access'));
assert(!calls.some(c=>Object.hasOwn(c.body,'score')),'client never sends its own score');
const count=calls.length;await vm.runInContext("answerDaily('a')",ctx);assert.equal(calls.length,count,'completed run cannot submit more answers');
for(const selected of ['estimate','facts']){
 ctx.selected=selected;await vm.runInContext('selectDailyGame(selected)',ctx);await vm.runInContext('startDaily()',ctx);
 for(let i=1;i<=10;i++){
  if(selected==='estimate'){el('dailyEstimateValue').value='42';ctx.event={preventDefault(){}};await vm.runInContext('submitDailyEstimate(event)',ctx);await new Promise(resolve=>setTimeout(resolve,0));assert.equal(el('dailyEstimateSubmit').disabled,true)}else await vm.runInContext("answerDaily('true')",ctx);
  vm.runInContext('nextDaily()',ctx);if(i<10&&selected==='estimate')assert.equal(el('dailyEstimateSubmit').disabled,false,'next estimate unlocks submit');
 }
 assert.equal(el('dailyMine').textContent,'Dein Ergebnis: '+max(selected)+' / '+max(selected)+' Punkte · Rang 1');
}
await vm.runInContext("selectDailyGame('overall')",ctx);assert.equal(el('dailyMine').textContent,'Dein Gesamtstand: 300 / 300 Punkte · Rang 1');
console.log('OK: three Daily flows, auth refresh, answer lock, safe names, server score and global leaderboard');
