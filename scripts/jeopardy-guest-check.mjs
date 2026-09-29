import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('index.html','utf8');
const at=html.indexOf('async function jeopSyncState()'),end=html.indexOf('\nasync function startJeopardy()',at);
assert(at>=0&&end>at);const source=html.slice(at,end);
const shared={revision:12,question_token:'token',team_1_score:200,team_2_score:100,used_cells:[],passed_teams:[],answer_history:[],game_status:'buzzed',buzz_user_id:'guest',buzz_team:2,selected_col:0,selected_row:0,selected_value:100,selected_category:'Test',selected_question:'Frage?',selected_answer:'Au'};
function fixture(host){
 const elements=new Map(),el=id=>{
  if(!elements.has(id)){const classes=new Set();const node={classList:{add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)},textContent:'',dataset:{},value:'',querySelector:()=>node};elements.set(id,node)}return elements.get(id)
 };
 const button=el('cell');button.dataset={col:'0',row:'0'};
 const ctx=vm.createContext({S:{room:'room',host,uid:host?'host':'guest',myTeam:host?1:2},JEOP:{data:[['Test',[['Frage?','Au']]]],scores:[0,0]},el,req:async()=>[shared],document:{querySelector:()=>button},setQuestionVisual:()=>{},jeopTheme:()=>'',setTimeout:()=>{},endJeopardy:()=>{},msg:(m)=>{throw Error(m)}});
 vm.runInContext('let JEOP_SYNC_BUSY=false,JEOP_SYNC_REV=-1;'+source,ctx);return{ctx,el};
}
for(const host of [true,false]){
 const{ctx,el}=fixture(host);await vm.runInContext('jeopSyncState()',ctx);
 assert.equal(el('jeopScoreA').textContent,200);assert.equal(el('jeopScoreB').textContent,100);
 assert.equal(el('jeopJudge').classList.contains('hide'),!host);
 assert.equal(el('jeopAnswerEntry').classList.contains('hide'),host,'only buzzer owner types');
 shared.game_status='submitted';shared.submitted_answer='<b>Au</b>';shared.revision++;
 await vm.runInContext('jeopSyncState()',ctx);
 assert.equal(el('jeopAnswer').textContent,'Antwort von Team 2: <b>Au</b>','answer displayed as text');
 assert.equal(el('jeopAnswerEntry').classList.contains('hide'),true);
 assert.equal(el('jeopAnswer').textContent.includes('Lösung'),false);
 shared.game_status='buzzed';shared.revision++;
}
console.log('OK: shared guest answers, buzzer-owner input, host-only judging, shared scores');
