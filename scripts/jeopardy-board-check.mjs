import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('index.html','utf8');
function source(name){const start=html.indexOf('function '+name+'(');assert(start>=0,name);const open=html.indexOf('{',start);let depth=0,quote='',escape=false;for(let i=open;i<html.length;i++){const c=html[i];if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote='';continue}if(c==='\''||c==='"'||c==='`'){quote=c;continue}if(c==='{')depth++;if(c==='}'&&!--depth)return html.slice(start,i+1)}throw Error(name)}
const ctx=vm.createContext({S:{room:null},JEOP:{mode:'random',boardCats:[0,1,2,3,4,5]},knowledgeJeopardyQuestions:()=>[],jeopHistory:()=>[],saveJeopHistory:()=>{}});
vm.runInContext(html.slice(html.indexOf('const JEOP_CATS='),html.indexOf('let JEOP='))+'\nlet JEOP_RANDOM=null;'+['jeopDifficulty','jeopQuestionKey','jeopRoomRandom','jeopShuffle','jeopPick','jeopQuestionForLevel','buildJeopData'].map(source).join('\n'),ctx);
const uniqueBoard=()=>{const data=ctx.JEOP.data;assert.equal(data.length,6);assert.equal(new Set(data.map(c=>c[0])).size,6);const questions=data.flatMap(c=>c[1].map(q=>q[0].trim().toLowerCase().replace(/\s+/g,' ')));assert.equal(questions.length,30);assert.equal(new Set(questions).size,30,'no repeated question across all 30 cells')};
const seen=new Set();
for(let n=0;n<50;n++){vm.runInContext('buildJeopData()',ctx);uniqueBoard();ctx.JEOP.data.forEach(c=>seen.add(c[0]))}
assert(seen.size>6,'local Random ignores previous lobby-only category choices');
for(const mode of ['standard','big','football','geo','sport','party','nerd']){
 ctx.JEOP.mode=mode;vm.runInContext('buildJeopData()',ctx);uniqueBoard();const names=ctx.JEOP.data.map(c=>c[0]);
 if(['standard','big','football','geo','sport','party'].includes(mode)){vm.runInContext('buildJeopData()',ctx);assert.deepEqual(ctx.JEOP.data.map(c=>c[0]),names,'preset categories stay fixed')}
}
ctx.S={room:'shared-room',roomConfig:{game:'quiz',game_mode:'random',jeop_categories:[1,3,5,7,9,11]}};ctx.JEOP.mode='random';vm.runInContext('buildJeopData()',ctx);uniqueBoard();const host=JSON.stringify(ctx.JEOP.data);
ctx.JEOP.boardCats=null;ctx.JEOP.mode='standard';vm.runInContext('buildJeopData()',ctx);assert.equal(JSON.stringify(ctx.JEOP.data),host,'room config preserves custom board on reconnect');
const sameLevel=Array.from({length:5},(_,i)=>['Question '+i,'Answer',1]);ctx.pool=sameLevel;ctx.picked=new Set();ctx.used=new Set(sameLevel.map(q=>'Test|'+q[0]));
for(let level=1;level<=5;level++){ctx.level=level;const q=vm.runInContext("jeopQuestionForLevel('Test',pool,level,used,picked)",ctx);assert(q);ctx.picked.add(q[0].toLowerCase())}
assert.equal(ctx.picked.size,5,'history exhaustion still chooses five different questions');
assert.equal(vm.runInContext("jeopQuestionForLevel('Test',pool,1,used,picked)",ctx),undefined,'exhausted board never repeats a question');
const intro=html.slice(html.indexOf('id="jeopardyIntro"'),html.indexOf('id="jeopTeamSetup"'));
assert(!intro.includes('jeopRandomSetup'));assert.equal((intro.match(/type="checkbox"/g)||[]).length,1,'only optional Final round toggle remains in intro');assert(intro.includes('id="jeopFinalEnabled"')); 
assert(html.indexOf('id="friendsQuizSetup"')>html.indexOf('<dialog id="friendsMenu"'));
console.log('OK: full-pool Random, six unique categories, thirty unique questions, fixed presets, deterministic custom boards, exhausted history and editor placement');

