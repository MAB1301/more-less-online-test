import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('index.html','utf8');
function source(name){let start=html.indexOf('function '+name+'(');if(html.slice(start-6,start)==='async ')start-=6;const open=html.indexOf('{',start);let depth=0,quote='',escape=false;for(let i=open;i<html.length;i++){const c=html[i];if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote='';continue}if(c==='"'||c==="'"||c==='`'){quote=c;continue}if(c==='{')depth++;if(c==='}'&&!--depth)return html.slice(start,i+1)}throw Error(name)}
const state={phase:'open',mode:'classic',index:0,total:10,question_id:'q1',question:{q:'Wie hoch?',u:'m'},stats:{host:{name:'Anna',score:0,lives:3,streak:0},guest:{name:'<img src=x>',score:0,lives:3,streak:0}},result:null,last:false};
const guesses={};let nextCalls=0,submitCalls=0,reject=false;
function device(uid,host){const nodes=new Map();function el(id){if(!nodes.has(id)){const classes=new Set(),children=[];nodes.set(id,{textContent:'',innerHTML:'',value:'',style:{},disabled:false,children,classList:{add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)},replaceChildren(...x){this.children=x},appendChild(x){this.children.push(x)},querySelector:selector=>el(id+selector)})}return nodes.get(id)}
 const S={room:'room',uid,host,enteredGame:true,serverOffset:0},EST={online:true,history:[],mode:'classic'};
 const rpc=async(fn,p)=>{
  if(fn==='ml_estimate_state')return {...structuredClone(state),mine:guesses[uid]||null};
  if(fn==='ml_estimate_submit'){submitCalls++;if(reject)throw Error('Netzfehler');guesses[uid]={guess:p.p_guess};if(guesses.host&&guesses.guest){state.phase='revealed';state.result={truth:100,answers:[{user_id:'host',name:'Anna',guess:100,points:100,score:100,accuracy:1,correct:true},{user_id:'guest',name:'<img src=x>',guess:150,points:50,score:50,accuracy:.5,correct:false}]};state.stats.host.score=100;state.stats.guest.score=50}return}
  if(fn==='ml_estimate_next'){nextCalls++;state.question_id='q2';state.index=1;state.phase='open';state.result=null;delete guesses.host;delete guesses.guest;return}
  throw Error(fn);
 };
 const context=vm.createContext({S,EST,el,rpc,estimateCategory:()=> 'Bauwerke',sharedTheme:()=> 'buildings',sharedArt:()=> '',categoryPhotoArt:()=> '',setQuestionVisual(){},document:{createElement:()=>({textContent:''})},clearInterval(){},setInterval(){return 1},Date,Number,Math,showLocalEnd:(g,summary,rows)=>{context.finished=rows}});
 vm.runInContext(html.match(/^function escapeHTML.*$/m)[0],context);
 vm.runInContext(['parseGameNumber','estimateInputConfig','configureEstimateInput','parseEstimateInput','syncEstimateOnline','renderEstimateOnline','submitEstimateOnline','nextEstimateOnline','finishEstimateOnline'].map(source).join('\n'),context);
 return {S,EST,el,context,run:code=>vm.runInContext(code,context)};
}
const host=device('host',true),guest=device('guest',false);
await host.run('syncEstimateOnline()');await guest.run('syncEstimateOnline()');
assert.equal(host.el('estimateQuestion').textContent,guest.el('estimateQuestion').textContent);
guest.el('estimateValue').value='150';await guest.run('syncEstimateOnline()');assert.equal(guest.el('estimateValue').value,'150','polling preserves unfinished input');
await guest.run('submitEstimateOnline()');assert(guest.el('estimateEntry').classList.contains('hide'));assert(guest.el('estimateReveal').classList.contains('hide'),'truth hidden while waiting');
await guest.run('submitEstimateOnline()');assert.equal(submitCalls,1,'locked answer cannot submit twice');
host.el('estimateValue').value='100';await host.run('submitEstimateOnline()');await guest.run('syncEstimateOnline()');
assert.equal(guest.el('estimateTruth').textContent,'100 m');assert.equal(host.el('estimateTruth').textContent,'100 m');
assert.equal(guest.el('estimatePoints').textContent,'+50 Punkte');assert.equal(guest.el('estimateOnlineScores').children[1].textContent.startsWith('<img src=x>'),true,'player name is literal text');
assert(guest.el('estimateReveal.estimateActions .p').classList.contains('hide'),'guest cannot advance');
await guest.run('nextEstimateOnline()');assert.equal(nextCalls,0);
await host.run('nextEstimateOnline()');await guest.run('syncEstimateOnline()');assert.equal(guest.EST.onlineId,'q2');assert.equal(guest.el('estimateValue').value,'');
reject=true;guest.el('estimateValue').value='20';await guest.run('submitEstimateOnline()');assert.equal(guest.EST.saving,false);assert.equal(guest.el('estimateEntrybutton').disabled,false);assert.match(guest.el('estimateUnit').textContent,/Netzfehler/);
state.last=true;state.phase='revealed';state.result={truth:100,answers:[{user_id:'guest',name:'Gast',guess:20,points:20,score:70,accuracy:.2,correct:false}]};await guest.run('syncEstimateOnline()');assert.equal(guest.el('estimateFinish').classList.contains('hide'),false);
guest.run('finishEstimateOnline()');assert.equal(guest.EST.onlineFinished,true);assert.equal(guest.context.finished[0].label,'Anna','shared standings are sorted');
console.log('OK: two estimate clients share question/reveal/standings, preserve inputs, lock once, restrict advancement, retry failures and show final standings');

guest.EST.onlineFinished=false;state.last=false;state.question_id='q3';state.phase='open';state.question={q:'Wie viele Menschen leben dort?',u:'Menschen'};state.result=null;delete guesses.guest;reject=false;
await guest.run('syncEstimateOnline()');assert.equal(guest.EST.inputScale,1000000);guest.el('estimateValue').value='47,2';await guest.run('submitEstimateOnline()');assert.equal(guesses.guest.guess,47200000,'online RPC receives full base value, not millions count');
console.log('OK: online population input converts millions before sending and reset follows question change');
