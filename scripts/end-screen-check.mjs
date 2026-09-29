import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
function source(name){
  const start=html.search(new RegExp('(?:async )?function '+name+'\\('));
  assert(start>=0,`${name} exists`);
  let depth=0,quoted=null,escaped=false;
  for(let i=html.indexOf('{',start);i<html.length;i++){
    const c=html[i];
    if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quoted)quoted=null;continue}
    if(c==='"'||c==="'"||c==='`'){quoted=c;continue}
    if(c==='{')depth++;
    if(c==='}'&&!--depth)return html.slice(start,i+1);
  }
  throw Error(`${name} is not closed`);
}
const map=new Map();
const el=id=>{
  if(!map.has(id)){
    const classes=new Set(['hide']);
    map.set(id,{textContent:'',children:[],classList:{add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)},replaceChildren(){this.children=[]},append(x){this.children.push(x)}});
  }
  return map.get(id);
};
const document={createElement:()=>({attributes:{},setAttribute(name,value){this.attributes[name]=value},classList:{toggle(name){this.names??=new Set();if(this.names.has(name)){this.names.delete(name);return false}this.names.add(name);return true}},append(...xs){this.children=xs}}),querySelectorAll:()=>[],getElementById:el};
const context=vm.createContext({el,document,S:{room:null},JEOP:{scores:[120,-50],history:[{label:'Frage',detail:'Antwort',points:100}]},JEOP_SYNC_TIMER:null,clearInterval:()=>{},closeForeignGames:()=>{},openWorldMenu:()=>{},newGameSameLobby:()=>{context.lobbyVisits++},playSolo:()=>{},startFactCheck:()=>{},startEstimateSolo:()=>{},startJeopardy:()=>{},lobbyVisits:0});
vm.runInContext('let LOCAL_END_GAME=null;'+['showLocalEnd','hideLocalEnd','replayFromEnd','endToLobby','endJeopardy','finishEstimate'].map(source).join('\n'),context);
vm.runInContext("showLocalEnd('facts','7 / 10 richtig',[{label:'Aussage',detail:'Fakt',points:1,ok:true}])",context);
assert.equal(el('localEndScreen').classList.contains('hide'),false);
assert.equal(el('localEndRows').children.length,1);
assert.equal(el('localEndRows').children[0].children[0].textContent.startsWith('1. Aussage'),true);
el('localEndRows').children[0].onclick();
assert.equal(el('localEndRows').children[0].attributes['aria-expanded'],'true');
assert.equal(el('localEndLobby').classList.contains('hide'),true);
vm.runInContext("JEOP.completed=false;endJeopardy()",context);
assert.equal(el('localEndSummary').textContent.includes('120'),true);
assert.equal(el('localEndRows').children.length,1);
context.S.room='online-room';
vm.runInContext("JEOP.completed=false;endJeopardy(true);endToLobby()",context);
assert.equal(context.lobbyVisits,1);
context.EST={score:240,history:[{label:'Schätzfrage',detail:'10 km',points:80}]};
vm.runInContext('finishEstimate()',context);
assert.equal(el('localEndSummary').textContent,'240 Punkte · 1 Fragen');
assert.equal(el('localEndRows').children.length,1);
for(const needle of ["showLocalEnd('facts'", "showLocalEnd('moreless'", "showLocalEnd('estimate'", "showLocalEnd('quiz'", "id=\"estimateFinish\"", "if((s.used_cells||[]).length>=JEOP.data.length*5)endJeopardy(true)", '.localEnd.hide{display:none}'])assert(html.includes(needle),needle);
for(const needle of ['id="soloExit"','id="soloRestart"','#game .reviewBack.hide{display:none!important}',"!VISUAL_CARD_COVER.has(key)?'visualContain':''"])assert(html.includes(needle),needle);
console.log('OK: every mode reaches an end screen; results and lobby controls render');
