import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const at=html.indexOf('async function jeopSyncState()'),end=html.indexOf('\nfunction startJeopardy()',at);
assert(at>=0&&end>at);
const source=html.slice(at,end);
const shared={revision:12,team_1_score:200,team_2_score:100,used_cells:[],game_status:'buzzed',buzz_team:2,buzz_user_id:'guest',question_token:'token-12',selected_col:0,selected_row:0,selected_value:100,selected_category:'Test',selected_question:'Frage?',selected_answer:'Au'};
function fixture(host){
  const elements=new Map();
  const el=id=>{
    if(!elements.has(id)){
      const classes=new Set();elements.set(id,{classList:{add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)},textContent:'',dataset:{}});
    }
    return elements.get(id);
  };
  const button={classList:{add:()=>{}},dataset:{col:'0',row:'0'}};
  const ctx=vm.createContext({S:{room:'room',host,uid:host?'host':'guest',myTeam:host?1:2},JEOP:{data:[['Test',[['Frage?','Au']]]],scores:[0,0]},el,req:async()=>[shared],document:{querySelector:()=>button},setQuestionVisual:()=>{},jeopTheme:()=>'',setTimeout:()=>{},endJeopardy:()=>{}});
  vm.runInContext('let JEOP_SYNC_BUSY=false,JEOP_SYNC_REV=-1;'+source,ctx);
  return {ctx,el};
}
for(const host of [true,false]){
  const {ctx,el}=fixture(host);
  await vm.runInContext('jeopSyncState()',ctx);
  assert.equal(el('jeopScoreA').textContent,200);
  assert.equal(el('jeopScoreB').textContent,100);
  assert.equal(el('jeopJudge').classList.contains('hide'),!host,'only host receives verdict controls');
  assert.equal(el('jeopAnswerEntry').classList.contains('hide'),host,'buzz winner keeps answer entry after sync');
  assert.equal(ctx.JEOP.onlineState.question_token,'token-12');
}
console.log('OK: Jeopardy host and guest show the same score; only host judges a guest buzz');


shared.revision++;
shared.game_status='submitted';shared.submitted_answer='Gold';
for(const host of [true,false]){
  const {ctx,el}=fixture(host);
  await vm.runInContext('jeopSyncState()',ctx);
  assert.equal(el('jeopAnswerEntry').classList.contains('hide'),true);
  assert.equal(el('jeopAnswer').textContent.includes('Gold'),true,'host sees the saved guest answer');
  assert.equal(el('jeopAnswer').textContent.includes('Au'),false,'solution stays hidden before verdict');
  assert.equal(el('jeopJudge').classList.contains('hide'),!host);
}
shared.game_status='question';shared.revision++;shared.passed_teams=[2];
{
  const {ctx,el}=fixture(false);
  await vm.runInContext('jeopSyncState()',ctx);
  assert.equal(ctx.JEOP.active,null,'pass clears active team');
  assert.equal(el('jeopBuzzA').classList.contains('hide'),true,'guest cannot buzz for opposing team');
  assert.equal(el('jeopBuzzB').classList.contains('hide'),true,'passed team cannot buzz again');
}
console.log('OK: guest input survives synchronization; submitted answer reaches host; safe pass releases turn');

const submitSource=html.slice(html.indexOf('async function submitJeopAnswer()'),html.indexOf('\nfunction revealJeop()'));
const passSource=html.slice(html.indexOf('async function jeopSafePass()'),html.indexOf('\nfunction jeopPass()'));
{
  const {ctx,el}=fixture(false);
  ctx.JEOP.active=1;ctx.JEOP.cell={col:0,row:0};
  ctx.JEOP.onlineState={game_status:'buzzed',buzz_user_id:'guest',question_token:'token-12'};
  el('jeopAnswerInput').value='Gold';
  let calls=[],syncs=0;
  ctx.jeopRpc=async(fn,body)=>{calls.push({fn,body});return null};
  ctx.jeopSyncState=async()=>{syncs++};ctx.msg=()=>{};
  vm.runInContext(submitSource+'\n'+passSource,ctx);
  await vm.runInContext('submitJeopAnswer()',ctx);
  assert.equal(el('jeopAnswerEntry').classList.contains('hide'),false,'save error keeps input available');
  assert.equal(ctx.JEOP.answerPending,false,'save error allows retry');
  assert.equal(calls[0].fn,'jeopardy_submit_answer');
  assert.equal(calls[0].body.p_answer,'Gold');
  assert.equal(calls[0].body.p_question_token,'token-12');
  assert.equal(syncs,0);
  let release;
  ctx.jeopRpc=async(fn,body)=>{calls.push({fn,body});return await new Promise(resolve=>{release=resolve})};
  const saving=vm.runInContext('submitJeopAnswer()',ctx);
  await vm.runInContext('submitJeopAnswer()',ctx);
  assert.equal(calls.length,2,'double click sends only one in-flight answer');
  release({game_status:'submitted'});await saving;
  assert.equal(syncs,1);
  assert.equal(el('jeopAnswerEntry').classList.contains('hide'),true);
  ctx.jeopRpc=async(fn,body)=>{calls.push({fn,body});return {game_status:'question'}};
  await vm.runInContext('jeopSafePass()',ctx);
  assert.equal(calls.at(-1).fn,'jeopardy_safe_pass');
  assert.equal(calls.at(-1).body.p_question_token,'token-12');
  assert.equal(syncs,2);
}
console.log('OK: guest answer RPC uses question token, retries save errors, blocks duplicate clicks, and syncs safe pass');
