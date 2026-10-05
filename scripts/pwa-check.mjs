import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {createAccountSession} from '../assets/account/session.mjs';
const manifest=JSON.parse(fs.readFileSync('assets/app.webmanifest','utf8'));
assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'../');assert.equal(manifest.scope,'../');
for(const icon of manifest.icons)assert(fs.existsSync('assets/'+icon.src));
const html=fs.readFileSync('index.html','utf8'),offline=fs.readFileSync('offline/index.html','utf8');
assert(html.includes('rel="manifest"'));assert(html.includes('rel="apple-touch-icon"'));assert(offline.includes('href="../assets/app.webmanifest"'));
assert(!fs.existsSync('dist-web/supabase'));assert(!fs.existsSync('dist-web/content/research'));assert(fs.existsSync('dist-web/pwa-asset-manifest.js'));
for(const match of html.matchAll(/(?:src|href)="((?:assets|content)\/[^"]+)"/g))assert(fs.existsSync('dist-web/'+match[1].split('?')[0]));
console.log('PASS: standalone manifest, Apple Home Screen icon, complete public deploy bundle and subdirectory installation paths');
// Run the actual storage/upload code across offline save, restart and account switches.
const store=new Map(),recorded=[],listeners={};let identity={uid:'account-A',guest:false},online=false;
function fixture(){
 const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',classList:{contains:()=>true},replaceChildren(){},append(){},showModal(){},focus(){}});return nodes.get(id)};
 const ctx={navigator:{get onLine(){return online}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},gameAccount:{peek:()=>identity,current:async()=>{if(!online)throw Error('expired token offline');return identity},authorized:async(_,body)=>{recorded.push({uid:identity.uid,data:body.p_data});return {saved:true}}},Date,Map,Set,Promise,setTimeout(){},addEventListener:(name,fn)=>listeners[name]=fn,document:{hidden:false,getElementById:node,addEventListener(){},createElement:()=>node('new')},DAILY:{},SOLO:{},EST:{},FACT:{},JEOP:{},S:{}};ctx.window=ctx;
 vm.runInNewContext(fs.readFileSync('assets/player-hub.js','utf8').split('(function initPlayerHub()')[0],ctx);return ctx;
}
let ctx=fixture();const run={run_id:'offline-round',game:'facts',mode:'classic',score:4,answered:5,correct:4,best_streak:3};
await ctx.savePersonalRun(run);assert.equal(recorded.length,0);assert.equal(JSON.parse(store.get('ml_pending_personal_runs_v1')).length,1);assert.equal(JSON.parse(store.get('ml_personal_runs_v1_account-A')).length,1);
ctx=fixture();online=true;identity={uid:'account-B',guest:false};await ctx.flushPersonalRuns();assert.equal(recorded.length,0,'Do not upload A runs under B');
identity={uid:'account-A',guest:false};await ctx.flushPersonalRuns();assert.equal(recorded.length,1);assert.equal(recorded[0].uid,'account-A');assert(!('owner' in recorded[0].data));assert.equal(JSON.parse(store.get('ml_pending_personal_runs_v1')).length,0);
await ctx.flushPersonalRuns();assert.equal(recorded.length,1,'Uploaded queue removed');
online=false;await ctx.savePersonalRun({...run,run_id:'retry-round'});ctx=fixture();online=true;ctx.gameAccount.authorized=async()=>{throw Error('lost response')};await assert.rejects(()=>ctx.flushPersonalRuns(),/lost response/);assert.equal(JSON.parse(store.get('ml_pending_personal_runs_v1')).length,1,'Failed upload retained across another restart');
ctx=fixture();await ctx.flushPersonalRuns();assert.equal(recorded.length,2);
identity=null;online=false;await ctx.savePersonalRun({...run,run_id:'guest-round'});assert.equal(JSON.parse(store.get('ml_personal_runs_v1_guest')).length,1);assert.equal(JSON.parse(store.get('ml_pending_personal_runs_v1')).length,0);
console.log('PASS: expired offline identity, durable retry queue, restart recovery, account isolation, guest isolation and acknowledged upload cleanup');

const authStorage=new Map([['ml_account_auth_v1',JSON.stringify({uid:'account-B',guest:false,token:'token',refresh:'refresh',expiresAt:Date.now()+3600000})]]);let authRequests=0;
const session=createAccountSession({url:'https://example.invalid',key:'key',storage:{getItem:key=>authStorage.get(key)||null},fetchImpl:async()=>{authRequests++;return new Response('{}')}});
await assert.rejects(()=>session.authorized('/rest/v1/rpc/ml_player_hub',{},'POST',{},'account-A'),/gewechselt/);
assert.equal(authRequests,0,'Owner-bound uploads must fail before sending under another account');
console.log('PASS: owner-bound server requests reject account-switch races before transmission');
