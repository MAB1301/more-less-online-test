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
    if(c==='}'&&!--depth)return (html.slice(start-6,start)==='async '?'async ':'')+html.slice(start,i+1);
  }
  throw new Error(`Unclosed ${name}`);
};
const nodes=new Map();const el=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',disabled:false,classList:{toggle:()=>{}}});return nodes.get(id)};
let calls=0;const ctx=vm.createContext({S:{host:true,q:0,room:'room',roomConfig:{game:'moreless',game_mode:'CHAOS',rounds:2,questions_per_round:5}},el,LOBBY_GAME:'moreless',LOBBY_MODE:'CHAOS',blitzSeconds:()=>8,Number,Math,rpc:async(name,p)=>{calls++;assert.equal(name,'ml_update_room_settings');assert.equal(p.p_rounds,3);return {game:'moreless',game_mode:'CHAOS',rounds:3,questions_per_round:5,timer_enabled:true,timer_seconds:12,max_players:6}},sync:async()=>{}});
vm.runInContext('let LOBBY_SETTINGS_DIRTY=false,LOBBY_SETTINGS_SAVING=false;'+['onlineTotalQuestions','markLobbySettingsDirty','renderLobbySettings','saveLobbySettings'].map(source).join('\n'),ctx);
vm.runInContext('renderLobbySettings()',ctx);assert.equal(el('settingTime').value,0);assert.equal(el('settingRounds').value,2);
el('settingRounds').value='3';el('settingTime').value='12';el('settingPlayers').value='6';vm.runInContext('markLobbySettingsDirty();renderLobbySettings()',ctx);assert.equal(el('settingRounds').value,'3','polling preserves edits');assert.equal(el('overlayStart').disabled,true);
ctx.event={preventDefault:()=>{}};await vm.runInContext('saveLobbySettings(event)',ctx);assert.equal(calls,1);assert.equal(vm.runInContext('onlineTotalQuestions()',ctx),15);assert.equal(el('overlayStart').disabled,false);
el('settingTime').value='2';await vm.runInContext('saveLobbySettings(event)',ctx);assert.equal(calls,1,'invalid duration never submitted');
ctx.S.roomConfig.game_mode='BLITZ';vm.runInContext('renderLobbySettings()',ctx);assert.equal(el('settingTime').min,5);assert.equal(el('settingTime').max,15);
console.log('OK: host settings save, dirty edits survive polling, actual question count, validation and Blitz limits');
