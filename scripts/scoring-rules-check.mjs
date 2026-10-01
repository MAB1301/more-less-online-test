import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
function source(name){
  const start=html.indexOf('function '+name+'(');
  assert(start>=0,name);
  let depth=0,quote='',escaped=false;
  for(let i=html.indexOf('{',start);i<html.length;i++){
    const c=html[i];
    if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote='';continue}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue}
    if(c==='{')depth++;
    if(c==='}'&&!--depth)return html.slice(start,i+1);
  }
  throw Error(name);
}
const els=new Map(),el=id=>{
  if(!els.has(id))els.set(id,{value:'',textContent:'',style:{},classList:{add:()=>{},remove:()=>{}},querySelector:()=>({style:{}})});
  return els.get(id);
};
let cleared=0,judged=null;
const context=vm.createContext({el,S:{room:null,host:false},EST:{mode:'blitz',i:0,score:0,history:[],timer:1,lives:3,streak:0},ESTIMATE_Q:[{q:'Test',a:100,u:'m'}],clearInterval:()=>cleared++,msg:()=>{},JEOP:{active:0,cell:{col:0,row:0},data:[['Kategorie',[['Frage','Au']]]]},judgeJeop:ok=>{judged=ok}});
context.EST.questions=context.ESTIMATE_Q;
vm.runInContext(['parseGameNumber','parseEstimateInput','jeopCanonicalAnswer','jeopQuantity','jeopAnswerVerdict'].map(source).join('\n')+'\n'+source('submitEstimate')+'\n'+source('normJeopAnswer')+'\n'+source('submitJeopAnswer'),context);
vm.runInContext('submitEstimate()',context);
assert.equal(cleared,0,'invalid Blitz input keeps timer running');
context.EST.mode='king';context.EST.streak=2;
el('estimateValue').value='95';
vm.runInContext('submitEstimate(true)',context);
assert.equal(context.EST.score,0,'timeout never grants points in King mode');
el('jeopAnswerInput').value='Auto';
vm.runInContext('submitJeopAnswer()',context);
assert.equal(judged,false,'Auto must not count as Au');
assert.equal(el('jeopAnswer').textContent.includes('Auto'),true);
context.S.room='test-room';judged=null;
vm.runInContext('submitJeopAnswer()',context);
assert.equal(judged,null,'guest answer waits for host verdict');
assert.equal(el('jeopAnswer').textContent.includes('Richtige Antwort'),false,'guest cannot reveal solution before verdict');
const storage=new Map(),facts=vm.createContext({localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},factShuffle:xs=>xs});
vm.runInContext(source('factRound'),facts);
facts.pool=Array.from({length:28},(_,i)=>({s:'Aussage '+i,a:i<14}));
const first=vm.runInContext('factRound(pool)',facts),second=vm.runInContext('factRound(pool)',facts);
assert.equal(first.length,10);
assert.equal(first.filter(q=>q.a).length,5);
assert.equal(second.filter(q=>first.includes(q)).length,0,'second Fakt oder Fake round prefers unseen questions');
console.log('OK: Blitz timer, King timeout, and strict Jeopardy answer matching');

for(const answer of ['50 m','50 M','50 Meter','50 Metern','0,05 km','5000 cm'])assert.equal(vm.runInContext(`jeopAnswerVerdict(${JSON.stringify(answer)},'50 Meter')`,context),'correct',answer);
for(const answer of ['500 m','50 km','5 m','50 Minuten'])assert.equal(vm.runInContext(`jeopAnswerVerdict(${JSON.stringify(answer)},'50 Meter')`,context),'wrong',answer);
assert.equal(vm.runInContext("jeopAnswerVerdict('Barcelna','Barcelona')",context),'review');
assert.equal(vm.runInContext("jeopAnswerVerdict('Berlin','Bern')",context),'wrong');
assert.equal(vm.runInContext("parseEstimateInput('47,2',{u:'Menschen'},1000000)",context),47200000);
assert.equal(vm.runInContext("parseEstimateInput('47,2 Millionen',{u:'Menschen'},1000000)",context),47200000);
assert.equal(vm.runInContext("parseEstimateInput('47.280.433 Menschen',{u:'Menschen'},1000000)",context),47280433);
assert.equal(vm.runInContext("parseEstimateInput('42,195',{u:'km'},1)",context),42.195);
assert(Number.isNaN(vm.runInContext("parseEstimateInput('47 Hunde',{u:'Menschen'},1000000)",context)));
context.S.room=null;context.EST={mode:'classic',i:0,score:0,history:[],inputScale:1000000,questions:[{q:'Bevölkerung',a:47280433,u:'Menschen'}]};el('estimateValue').value='47,2';vm.runInContext('submitEstimate()',context);assert.equal(context.EST.score,100);assert.match(el('estimateMine').textContent,/47.200.000/);
console.log('OK: equivalent measurement units, conservative typo review, German decimals and millions preserve numerical scoring');
