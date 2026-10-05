import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const store=new Map();let runs=[],fixed=false;
const ctx=vm.createContext({window:{gameAccount:{current:async()=>({uid:fixed?'account':'guest',guest:!fixed})}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},localPlayerRuns:()=>runs,savePersonalRun:async r=>{if(!runs.some(x=>x.run_id===r.run_id))runs.unshift(r)},renderPlayerHub(){}});
vm.runInContext(fs.readFileSync('assets/xp-levels.js','utf8'),ctx);
const {runXP,levelXP}=ctx.window.personalXP;
assert.equal(runXP({answered:4,correct:4}),0);assert.equal(runXP({answered:5,correct:5}),25);assert.equal(runXP({answered:500,correct:500}),100);
for(const xp of [0,99,100,224,225,374,375,100000]){const state=levelXP(xp);assert(state.current>=0&&state.current<state.needed);assert.equal(state.next_total-xp,state.needed-state.current)}
assert.equal(levelXP(100).level,2);assert.equal(levelXP(225).level,3);
await ctx.savePersonalRun({run_id:'a',answered:30,correct:30});await ctx.savePersonalRun({run_id:'a',answered:30,correct:30});assert.equal(JSON.parse(store.get('ml_personal_xp_v1_guest')).xp,100);
for(let i=0;i<250;i++)await ctx.savePersonalRun({run_id:'b'+i,answered:5,correct:0});const saved=JSON.parse(store.get('ml_personal_xp_v1_guest'));assert.equal(saved.xp,3850);assert.equal(saved.ids.length,200,'receipt memory bounded without reducing total XP');
fixed=true;await ctx.savePersonalRun({run_id:'account-run',answered:30,correct:30});assert.equal(JSON.parse(store.get('ml_personal_xp_v1_guest')).xp,3850,'account does not alter guest XP');
console.log('PASS: XP thresholds, caps, minimum answers, duplicate receipt prevention, bounded storage, account/guest isolation');
