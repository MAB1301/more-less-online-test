import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const at=html.indexOf('async function jeopSyncState()'),end=html.indexOf('\nfunction startJeopardy()',at);
assert(at>=0&&end>at);
const source=html.slice(at,end);
const shared={revision:12,team_1_score:200,team_2_score:100,used_cells:[],game_status:'buzzed',buzz_team:2,selected_col:0,selected_row:0,selected_value:100,selected_category:'Test',selected_question:'Frage?',selected_answer:'Au'};
function fixture(host){
  const elements=new Map();
  const el=id=>{
    if(!elements.has(id)){
      const classes=new Set();elements.set(id,{classList:{add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle:(x,v)=>{v?classes.add(x):classes.delete(x)}},textContent:'',dataset:{}});
    }
    return elements.get(id);
  };
  const button={classList:{add:()=>{}},dataset:{col:'0',row:'0'}};
  const ctx=vm.createContext({S:{room:'room',host},JEOP:{data:[['Test',[['Frage?','Au']]]],scores:[0,0]},el,req:async()=>[shared],document:{querySelector:()=>button},setQuestionVisual:()=>{},jeopTheme:()=>'',setTimeout:()=>{},endJeopardy:()=>{}});
  vm.runInContext('let JEOP_SYNC_BUSY=false,JEOP_SYNC_REV=-1;'+source,ctx);
  return {ctx,el};
}
for(const host of [true,false]){
  const {ctx,el}=fixture(host);
  await vm.runInContext('jeopSyncState()',ctx);
  assert.equal(el('jeopScoreA').textContent,200);
  assert.equal(el('jeopScoreB').textContent,100);
  assert.equal(el('jeopJudge').classList.contains('hide'),!host,'only host receives verdict controls');
}
console.log('OK: Jeopardy host and guest show the same score; only host judges a guest buzz');
