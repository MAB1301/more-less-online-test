import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {webcrypto} from 'node:crypto';
const html=fs.readFileSync('index.html','utf8');
function source(name){let start=html.indexOf('function '+name+'(');assert(start>=0,name);if(html.slice(start-6,start)==='async ')start-=6;const open=html.indexOf('){',start)+1;let depth=0,quote='',escape=false;for(let i=open;i<html.length;i++){const c=html[i];if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote='';continue}if(c==='"'||c==="'"||c==='`'){quote=c;continue}if(c==='{')depth++;if(c==='}'&&!--depth)return html.slice(start,i+1)}throw Error(name)}
function fixture(){const nodes=new Map(),store=new Map();function el(id){if(!nodes.has(id)){const classes=new Set(['hide']);nodes.set(id,{value:'',hidden:false,textContent:'',disabled:false,dataset:{},classList:{contains:x=>classes.has(x),add:(...n)=>n.forEach(x=>classes.add(x)),remove:(...n)=>n.forEach(x=>classes.delete(x))},showModal(){this.open=true},close(){this.open=false},focus(){},querySelector:()=>({disabled:false}),replaceChildren(){},append(){},setAttribute(){},addEventListener(){}})}return nodes.get(id)}const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};let calls=[];const c={crypto:webcrypto,TextEncoder,Uint8Array,Date,Math,Number,JSON,String,Promise,document:{getElementById:el,hidden:false},window:{gameAccount:{guest:async()=>({}),authorized:async(path,body)=>{calls.push({path,body});return {id:'report-id'}}}},el,localStorage:storage,sessionStorage:storage,S:{room:null,q:1,questionData:{}},SOLO:{on:false},EST:{},JEOP:{},FACT:{},DAILY:{},FACT_DIFFICULTY:'easy',LOBBY_MODE:'CLASSIC',estimateCategory:()=> 'science',setTimeout,clearTimeout,setInterval:()=>{},navigator:{onLine:true},siteRoundActive:()=>false,msg:(text)=>calls.push({text}),setOnlineAnswerState(){},syncEstimateOnline:async()=>true,jeopSyncState:async()=>{},clearSession:()=>calls.push({clear:true}),ready:()=>calls.push({ready:true}),loadSession:()=>({token:'token',room:'room',code:'ROOM',uid:'me'}),req:async(path)=>path.includes('/user')?{id:'me'}:[{code:'ROOM'}]};vm.createContext(c);return {c,el,calls,storage}}
// A moving question cannot change the report. Lost responses retain the same payload for retry.
{
 const {c,el,calls,storage}=fixture();vm.runInContext(fs.readFileSync('assets/quality-ux.js','utf8').split('(function initQualityUX()')[0],c);
 c.SOLO={on:true,mode:'CLASSIC',i:0,questions:[{l:'A',r:'B',u:'m',cat:'buildings'},{l:'C',r:'D',u:'m'}]};
 c.openQuestionReport();c.SOLO.i=1;el('questionReportReason').value='value';el('questionReportNote').value='Wrong value';await c.sendQuestionReport({preventDefault(){}});assert.match(calls[0].body.p_prompt,/^A \/ B · buildings · m$/);assert.equal(calls[0].body.p_key.length,64);
 const q={game:'facts',prompt:'Claim',unit:'',metric:'easy',mode:'classic'};await c.observeQuality(q,'event',1);assert.equal(calls.length,1,'opt-in off by default');storage.setItem('ml_question_quality_opt_in_v1','true');await c.observeQuality(q,'event',1);await c.observeQuality(q,'event',0);assert.equal(calls.length,2,'one event only');
 let reject=true;c.window.gameAccount.authorized=async()=>{if(reject)throw Error('lost response');return {id:'report-id',duplicate:true}};await c.sendQuestionReport({preventDefault(){}});assert.match(el('questionReportStatus').textContent,/Nicht bestätigt/);assert.equal(el('questionReportNote').value,'Wrong value');reject=false;await c.sendQuestionReport({preventDefault(){}});assert.match(el('questionReportStatus').textContent,/bereits gespeichert/);
 c.setGameAnswerStatus('facts','wrong');assert.match(el('answerState-facts').textContent,/✕ Falsch/);
}
// Restoring a room preserves it on transport failure, but rejects a confirmed invalid session.
{
 const {c,calls}=fixture();vm.runInContext(source('restoreSession'),c);c.req=async()=>{throw Error('offline')};await c.restoreSession();assert.equal(c.S.room,'room');assert.equal(calls.some(x=>x.clear),false);
 c.req=async()=>{const error=Error('expired');error.status=401;throw error};await c.restoreSession();assert.equal(c.S.room,null);assert.equal(calls.some(x=>x.clear),true);
}
// Do not show a successful reconnect when the underlying sync failed, including estimate state.
{
 const {c,calls}=fixture();c.S.room='room';vm.runInContext(source('reconnect'),c);c.sync=async()=>false;await c.reconnect();assert.equal(calls.some(x=>x.text==='Wieder verbunden ✓'),false);
 c.sync=async()=>true;c.EST.online=true;c.syncEstimateOnline=async()=>false;await c.reconnect();assert.equal(calls.some(x=>x.text==='Wieder verbunden ✓'),false);
 c.EST.online=false;c.LOBBY_GAME='moreless';await c.reconnect();assert.equal(calls.some(x=>x.text==='Wieder verbunden ✓'),true);
}
// Uncertain submissions freeze the original choice; a server-confirmed answer clears the retry.
{
 const {c,el}=fixture();c.S={room:'room',q:1,questionData:{1:{question_id:'qid'}}};c.setGameAnswerStatus=()=>{};vm.runInContext(fs.readFileSync('assets/connection-ux.js','utf8').split('(function initConnectionUX()')[0],c);
 c.recoverAnswerUncertainty(1,'a');assert.equal(el('a').disabled,true);assert.equal(c.S.pendingNetAnswer.choice,'a');let choice;c.answer=async x=>{choice=x};await c.retryOnlineAnswer();assert.equal(choice,'a');c.S.savedAnswer={question_id:'qid'};c.reconcilePendingOnlineAnswer();assert.equal(c.S.pendingNetAnswer,null);assert.equal(el('answerRetry-moreless').hidden,true);
 c.recoverAnswerUncertainty(1,'b');c.S.q=2;c.S.questionData[2]={question_id:'next'};c.reconcilePendingOnlineAnswer();assert.equal(c.S.pendingNetAnswer,null,'old question cannot be replayed');
 c.renderConnectionPeers([{user_id:'other',name:'<img>',connected:false}]);assert.match(el('jeopConnectionPeers').textContent,/<img>/,'peer names are text, not HTML');
}
// Background polling and a reconnect share one request, rather than reporting a false failure.
{
 const {c,el}=fixture();c.S.room='room';c.window.addEventListener=()=>{};c.refreshOnlineModes=async()=>{};c.rpc=async()=>{};c.reconnect=async()=>{};let release,requests=0;c.sync=()=>{requests++;return new Promise(resolve=>{release=resolve})};c.setGameAnswerStatus=()=>{};
 vm.runInContext(fs.readFileSync('assets/connection-ux.js','utf8'),c);const first=c.sync(),second=c.sync();assert.equal(requests,1);release(true);assert.equal(await first,true);assert.equal(await second,true);assert.equal(el('connectionBanner').hidden,true);
 c.sync=undefined;
}
// Timeout cancels one API request; other origins and caller cancellation stay untouched.
{
 const {c}=fixture();c.SUPABASE_URL='https://project.example';c.AbortController=AbortController;let expire;c.setTimeout=fn=>{expire=fn;return 1};c.clearTimeout=()=>{};vm.runInContext(fs.readFileSync('assets/connection-ux.js','utf8').split('(function initConnectionUX()')[0],c);let calls=0;const original=async(url,opt)=>{calls++;return new Promise((resolve,reject)=>{opt.signal.addEventListener('abort',()=>{const error=Error('aborted');error.name='AbortError';reject(error)})})};const pending=c.connectionFetch(original,c.SUPABASE_URL+'/auth/v1/user');expire();await assert.rejects(pending,/nicht rechtzeitig/);assert.equal(calls,1);let signal;c.connectionFetch(async(url,opt)=>{signal=opt.signal;return true},'https://other.example');assert.equal(signal,undefined);
}
// Invitation actions still invoke the account controller and return to a newly joined lobby.
{
 const {c,el}=fixture();let sequence=0;c.document.createElement=()=>el('created-'+(++sequence));for(const id of ['inviteCenterList','inviteCenterLobby']){el(id).children=[];el(id).append=function(...children){this.children.push(...children)};el(id).replaceChildren=function(){this.children=[]}}
 c.window.gameAccount.current=async()=>({guest:true});vm.runInContext(fs.readFileSync('assets/invite-center.js','utf8'),c);await c.openInviteCenter();assert.match(el('inviteCenterStatus').textContent,/Als Gast/);
 c.window.gameAccount.current=async()=>({guest:false});const original={onclick:async()=>{c.S.room='joined';c.S.enteredGame=false}},button={disabled:false};c.loadAccountInvitations=async()=>{el('accountInvitationsList').children=[{querySelectorAll:()=>[original],cloneNode:()=>({querySelectorAll:()=>[button]})}]};await c.refreshInviteCenter();await button.onclick();assert.equal(c.S.room,'joined');assert.equal(el('inviteCenter').open,false);
}
// Host restoration must initialize without resetting the shared Jeopardy board.
assert.match(source('startJeopardy'),/jeopInitOnline\(S.host&&!S.resumingRoom\)/);
assert.match(source('sync'),/S.resumingRoom&&signal==='JEOPARDY_START'/);
assert.match(source('req'),/if\(auth&&\(!S.room\|\|S.uid===auth.uid\)\)/,'refresh same guest identity too');
assert.equal((html.match(/class="gameQuickInfo"/g)||[]).length,4);
assert.equal((html.match(/homeTileCopy[\s\S]*?gameQuickInfo[\s\S]*?homeTileAction/g)||[]).length,4,'metadata inside text column');
const css=fs.readFileSync('assets/high-priorities.css','utf8');
assert.match(css,/min-height:44px/);assert.match(css,/:focus-visible/);assert.match(css,/max-height:550px.*orientation:landscape/);
for(const [w,h,expected] of [[390,844,'phone'],[844,390,'tablet'],[820,1180,'tablet'],[1180,820,'tablet']]){const c={window:{innerWidth:w,innerHeight:h},screen:{width:w,height:h},navigator:{maxTouchPoints:1},matchMedia:()=>({matches:true}),document:{documentElement:{dataset:{}}}};vm.createContext(c);vm.runInContext(source('applyAdaptiveLayout'),c);c.applyAdaptiveLayout();assert.equal(c.document.documentElement.dataset.ui,expected);assert.equal(c.document.documentElement.dataset.orientation,w>h?'landscape':'portrait')}
console.log('OK: frozen reports/retries, opt-in event deduplication, transport vs invalid-session recovery, truthful reconnect, immutable pending answers, safe presence and Jeopardy host restoration');
