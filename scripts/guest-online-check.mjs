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
  throw Error('Unclosed '+name);
}
const question=n=>({question_no:n,metric:'Höhe',category:'Bauwerke',prompt:'Welches ist höher?',
  left_name:'A',right_name:'B',left_value:10,right_value:5,unit:'m'});
const room={questions:[question(1)],answers:{},reveals:{}};
const players=[{user_id:'host',display_name:'Host',score:0},{user_id:'guest',display_name:'Gast',score:0}];
function device(uid,host){
  const nodes=new Map();
  function el(id){
    if(!nodes.has(id)){
      const classes=new Set(),stamp={};
      const find=key=>stamp[key]??={textContent:''};
      nodes.set(id,{classes,stamp,textContent:'',innerHTML:'',disabled:false,
        classList:{add:(...x)=>x.forEach(y=>classes.add(y)),remove:(...x)=>x.forEach(y=>classes.delete(y)),contains:x=>classes.has(x)},
        querySelector:key=>key==='.answerStamp'?{querySelector:find}:find(key),
        getBoundingClientRect:()=>({left:0,top:0,width:100,height:100})});
    }
    return nodes.get(id);
  }
  const S={room:'same-room',uid,host,myName:host?'Host':'Gast',q:0,answeredQ:0,enteredGame:true,
    reviewMode:false,newGameLobby:false,transitionQ:0,usedJokers:[],joker:null,questionData:{},
    questionHistory:{},revealHistory:{},answerHistory:{},playerNames:{},scoredQ:1,finishDismissed:false};
  const req=async path=>{
    if(path.includes('/rooms?'))return [{config:{game:'moreless',game_mode:'CLASSIC'}}];
    if(path.includes('/players?'))return players;
    if(path.includes('/online_team_members?'))return [];
    if(path.includes('/online_ml_questions?'))return room.questions;
    if(path.includes('/online_ml_reveals?')){
      const number=Number(path.match(/question_no=eq\.(\d+)/)?.[1]);
      return room.reveals[number]?[{results:room.reveals[number]}]:[];
    }
    throw Error('Unexpected read: '+path);
  };
  const rpc=async (_name,{p_question_no,p_choice})=>{
    (room.answers[p_question_no]??={})[uid]=p_choice;
    if(Object.keys(room.answers[p_question_no]).length===2){
      room.reveals[p_question_no]={right_value:5,unit:'m',correct_name:'A',
        answers:Object.entries(room.answers[p_question_no]).map(([user_id,choice])=>({user_id,choice,correct:choice==='a'}))};
    }
  };
  const context=vm.createContext({renderSoloProgress(){},renderOnlineProgress(){},updateLobbySummary:()=>{},S,el,req,rpc,LOBBY_GAME:'moreless',LOBBY_MODE:'CLASSIC',clearGameTimer:()=>{},startOnlineTimer:()=>{},
    document:{querySelectorAll:()=>[],querySelector:()=>null,createElement:()=>({style:{},remove:()=>{}}),body:{appendChild:()=>{}}},
    setGlobalBack:()=>{},startTransition:()=>{},endTransition:()=>{},setObjectVisual:()=>{},
    moreLessPrompt:(left,right)=>left+' oder '+right,scheduleAutoNext:()=>{},showFinish:()=>{},setTimeout:()=>{},clearInterval:()=>{},
    msg:message=>{throw Error(message)}});
  vm.runInContext(html.match(/^function escapeHTML.*$/m)[0],context);
  vm.runInContext(['onlineTotalQuestions','setOnlineAnswerState','showQ','showReveal','sync','answer'].map(source).join('\n'),context);
  return {context,S,el,run:code=>vm.runInContext(code,context)};
}
const host=device('host',true),guest=device('guest',false);
await guest.run('sync()');
await host.run('sync()');
assert.equal(guest.S.q,1,'guest receives host question');
assert.equal(guest.el('prompt').textContent,'A oder B');
await guest.run("answer('b')");
assert.equal(guest.el('b').classes.has('lockedPick'),true,'guest answer stays locked before reveal');
await host.run("answer('a')");
await guest.run('sync()');
assert.equal(guest.el('b').classes.has('wrongPick'),true,'guest wrong card turns red');
assert.equal(guest.el('b').stamp['.answerStampText'].textContent,'+0 PUNKTE');
assert.equal(host.el('a').classes.has('correctPick'),true,'host right card turns green');
assert.equal(host.el('a').stamp['.answerStampText'].textContent,'+1 PUNKT');
room.questions.push(question(2));
await guest.run('sync()');
assert.equal(guest.S.q,2,'guest receives following question');
assert.equal(guest.el('b').classes.has('wrongPick'),false,'guest starts new question without old result');
assert.equal(guest.el('b').stamp['.answerStampText'].textContent,'');
await host.run('sync()');
await guest.run("answer('a')");
await host.run("answer('b')");
await guest.run('sync()');
assert.equal(guest.el('a').classes.has('correctPick'),true,'guest can score green without host rights');
assert.equal(guest.el('a').stamp['.answerStampText'].textContent,'+1 PUNKT');
assert.equal(host.el('b').classes.has('wrongPick'),true,'host sees their own red result');
console.log('OK: host and guest share question, lock independently, reveal own score, and reset for next question');
