import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const source=name=>{
  const start=html.indexOf('function '+name+'(');
  assert(start>=0,`${name} exists`);
  let depth=0,quote='',escape=false;
  for(let i=html.indexOf('{',start);i<html.length;i++){
    const c=html[i];
    if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote='';continue}
    if(c==='\''||c==='"'||c==='`'){quote=c;continue}
    if(c==='{')depth++;
    if(c==='}'&&!--depth)return html.slice(start,i+1);
  }
  throw new Error(`Unclosed ${name}`);
};
const start=html.indexOf('const SOLO_Q=['),end=html.indexOf('];let SOLO=',start);
assert(start>=0&&end>start);
const context=vm.createContext({S:{cat:'Länder',questionData:{}},Math});
vm.runInContext(html.slice(start,end+2)+'\nlet ONLINE_Q_ORDER=[],ONLINE_Q_CAT="";\n'+source('onlineComparisonKey')+'\n'+source('onlineAvailable')+'\n'+source('onlineQuestion'),context);
const cats=vm.runInContext('[...new Set(SOLO_Q.map(q=>q.cat))]',context);
for(const cat of cats){
  vm.runInContext(`S.cat=${JSON.stringify(cat)}`,context);
  const selected=vm.runInContext('SOLO_Q.filter(q=>q.cat===S.cat)',context);
  for(let n=1;n<=5;n++){
    const row=vm.runInContext(`onlineQuestion(${n})`,context);
    assert(selected.some(q=>q.l===row[0]&&q.r===row[1]&&q.lv===row[2]&&q.rv===row[3]),`${cat}: question ${n} belongs to category`);
  }
}
vm.runInContext('S.cat="Tierwelt"',context);
for(let n=6;n<=10;n++){
  const row=vm.runInContext(`onlineQuestion(${n})`,context);
  assert(vm.runInContext('SOLO_Q.filter(q=>q.cat===S.cat)',context).some(q=>q.l===row[0]&&q.r===row[1]));
}
vm.runInContext('ONLINE_Q_CAT="";ONLINE_Q_ORDER=[];S.questionData={}',context);
const asked=[];
for(let n=1;n<=5;n++){
  const row=vm.runInContext(`onlineQuestion(${n})`,context);
  asked.push(row[0]+'|'+row[1]+'|'+row[5]);
  context.S.questionData[n]={question_no:n,category:'Tierwelt',left_name:row[0],right_name:row[1],unit:row[5]};
}
assert.equal(new Set(asked).size,5,'online category block has five distinct comparisons');
assert.equal(vm.runInContext('onlineAvailable("Tierwelt").length',context),0,'a depleted category cannot be drawn again');

const calls=[];
const elements=new Map(),el=id=>{
  if(!elements.has(id))elements.set(id,{classList:{add:()=>{},remove:()=>{}},textContent:''});
  return elements.get(id);
};
const flow=vm.createContext({S:{host:true,q:5,autoNextQ:0,cat:'Natur'},el,calls,
  setInterval:fn=>{flow.tick=fn;return 1},clearInterval:()=>{},showCategories:()=>calls.push('category'),startQ:n=>calls.push(n)});
vm.runInContext(source('scheduleAutoNext'),flow);
vm.runInContext('scheduleAutoNext()',flow);
for(let i=0;i<3;i++)flow.tick();
assert.deepEqual(calls,['category'],'question 5 opens the next category draw');
flow.S.q=4;flow.S.autoNextQ=0;
vm.runInContext('scheduleAutoNext()',flow);
for(let i=0;i<3;i++)flow.tick();
assert.deepEqual(calls,['category',5],'within a block the next question starts');
flow.S.q=5;
flow.SOLO={on:false};
flow.document={querySelectorAll:()=>[]};
flow.setTimeout=fn=>fn();
vm.runInContext(source('pickCat'),flow);
flow.selected={classList:{add:()=>{}}};
vm.runInContext('pickCat(selected,"Tierwelt")',flow);
assert.equal(flow.S.cat,'Tierwelt');
assert.deepEqual(calls,['category',5,6],'new category begins with question 6');

const solo=vm.createContext({SOLO:{cat:null,i:0,round:0},el,renderSolo:()=>{},soloSubcat:q=>q.sub||'Fläche'});
vm.runInContext(html.slice(start,end+2)+'\n'+source('soloQuestionKey')+'\n'+source('startSoloCategory'),solo);
vm.runInContext('startSoloCategory("Rekorde & Extreme")',solo);
assert.equal(vm.runInContext('SOLO.questions.length',solo),5);
assert.equal(vm.runInContext('SOLO.questions.every(q=>q.cat==="Rekorde & Extreme")',solo),true);
assert.equal(vm.runInContext('new Set(SOLO.questions.map(soloQuestionKey)).size',solo),5,'card has five distinct questions');
const counts=vm.runInContext('Object.entries(Object.groupBy(SOLO_Q,q=>q.cat)).map(([cat,qs])=>[cat,new Set(qs.map(soloQuestionKey)).size])',solo);
for(const [cat,n] of counts)assert(n>=5,`${cat} has at least five distinct questions`);
console.log('OK: each five-question block stays in its selected category');
