import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
function source(name){
  let start=html.indexOf('function '+name+'(');
  assert(start>=0,name+' exists');
  if(html.slice(start-6,start)==='async ')start-=6;
  const open=html.indexOf('{',start);
  let depth=0,quote='',escape=false;
  for(let i=open;i<html.length;i++){
    const c=html[i];
    if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote='';continue}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue}
    if(c==='{')depth++;
    if(c==='}'&&!--depth)return html.slice(start,i+1);
  }
  throw new Error('Unclosed '+name);
}
const nodes=new Map();
function node(id){
  if(!nodes.has(id)){
    const classes=new Set(),stamp={};
    const classList={
      add:(...names)=>names.forEach(x=>classes.add(x)),
      remove:(...names)=>names.forEach(x=>classes.delete(x)),
      contains:x=>classes.has(x)
    };
    const find=selector=>stamp[selector]??={textContent:''};
    nodes.set(id,{classes,classList,disabled:false,textContent:'',innerHTML:'',
      querySelector:selector=>selector==='.answerStamp'?{querySelector:find}:find(selector),stamp});
  }
  return nodes.get(id);
}
let reject=false;
const S={q:1,room:'test',uid:'me',answeredQ:0,myChoice:null,joker:null,usedJokers:[],
  answerHistory:{},playerNames:{},scoredQ:1,host:false,finishDismissed:false,finishShownQ:0,finishTimer:null};
const context=vm.createContext({
  S,el:node,document:{querySelector:()=>null},
  rpc:async()=>{if(reject)throw Error('Netzfehler')},
  sync:async()=>{},scheduleAutoNext:()=>{},showFinish:()=>{},
  setTimeout:()=>{},Math
});
vm.runInContext(['setOnlineAnswerState','answer','showReveal'].map(source).join('\n'),context);
await vm.runInContext("answer('a')",context);
assert.equal(node('a').classes.has('lockedPick'),true,'chosen card is visibly locked');
assert.equal(node('a').stamp['.answerStampText'].textContent,'EINGELOGGT');
assert.equal(node('a').stamp['.answerStampIcon'].textContent,'🔒');
vm.runInContext("showReveal({answers:[{user_id:'me',choice:'a',correct:false}],right_value:5,unit:'m',correct_name:'B'})",context);
assert.equal(node('a').classes.has('wrongPick'),true,'wrong answer turns red');
assert.equal(node('a').classes.has('lockedPick'),false,'old locked state is cleared');
assert.equal(node('a').stamp['.answerStampText'].textContent,'+0 PUNKTE');

S.q=2;S.answeredQ=0;S.scoredQ=2;
await vm.runInContext("answer('b')",context);
vm.runInContext("showReveal({answers:[{user_id:'me',choice:'b',correct:true}],right_value:5,unit:'m',correct_name:'B'})",context);
assert.equal(node('b').classes.has('correctPick'),true,'correct answer turns green');
assert.equal(node('b').stamp['.answerStampText'].textContent,'+1 PUNKT');
assert.equal(node('a').classes.has('wrongPick'),false,'previous question state is cleared');

S.q=3;S.answeredQ=0;reject=true;
await vm.runInContext("answer('a')",context);
assert.equal(node('a').classes.has('lockedPick'),false,'failed save unlocks the card');
assert.equal(node('a').disabled,false,'failed save allows retry');
assert.equal(S.myChoice,null,'failed save clears selected answer');
console.log('OK: online answer locks, resolves green/red, and retries after save errors');
