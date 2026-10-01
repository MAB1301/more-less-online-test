import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('assets/account/preferences.js','utf8');
function setup(saved){
 const store=new Map([['ml_game_preferences_v1',saved],['ml_daily_auth_v1','daily'],['ml_account_auth_v1','auth']]);
 const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',checked:false,dataset:{},attributes:{},setAttribute(k,v){this.attributes[k]=v}});return nodes.get(id)};
 let oscillators=0,masterGain=null;const classes=new Set();
 class Audio{state='running';currentTime=1;destination={};createGain(){const gain={value:0,setValueAtTime(v){this.value=v},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}};masterGain??=gain;return {gain,connect(){}}}createOscillator(){oscillators++;return {frequency:{},connect(){},start(){},stop(){}}}}
 const context={window:{AudioContext:Audio},document:{getElementById:node,documentElement:{classList:{toggle(k,v){if(v)classes.add(k);else classes.delete(k)}}},addEventListener(){}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}};
 vm.runInNewContext(source,context);return {context,node,store,classes,count:()=>oscillators,gain:()=>masterGain};
}
const s=setup('{}');s.context.window.playGameSound('correct');assert.equal(s.count(),2);s.context.window.toggleGameMute();assert.equal(s.gain().value,0);s.context.window.playGameSound('wrong');assert.equal(s.count(),2);assert.equal(s.node('muteButton').attributes['aria-pressed'],'true');
s.node('soundEnabled').checked=true;s.node('soundVolume').value='60';s.node('reducedMotion').checked=true;s.context.window.updateGamePreferences();assert.equal(s.gain().value,.6);assert(s.classes.has('reduceMotion'));assert.equal(s.store.get('ml_daily_auth_v1'),'daily');assert.equal(s.store.get('ml_account_auth_v1'),'auth');
const restored=setup(s.store.get('ml_game_preferences_v1'));assert.equal(restored.node('soundVolume').value,60);assert(restored.classes.has('reduceMotion'));
const invalid=setup('{broken');assert.equal(invalid.node('soundVolume').value,35);
const noAudio=setup('{}');delete noAudio.context.window.AudioContext;assert.doesNotThrow(()=>noAudio.context.window.playGameSound('correct'));
console.log('OK: sound mute stops master gain, preferences persist independently, motion and unsupported audio work');
