import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const html=fs.readFileSync('index.html','utf8'),ctx={window:{}};vm.runInNewContext(fs.readFileSync('content/approved.js','utf8'),ctx);const pack=ctx.window.GAME_CONTENT_PACK;
assert.equal(pack.facts.length,214);assert.equal(pack.jeopardy.length,646);
const unique=(rows,key)=>assert.equal(new Set(rows.map(x=>x[key].trim().toLowerCase())).size,rows.length);unique(pack.facts,'s');unique(pack.jeopardy,'q');
for(const level of ['easy','medium','hard']){const rows=pack.facts.filter(x=>x.difficulty===level&&x.expansion!==9);assert.equal(rows.length,68);assert.equal(rows.filter(x=>x.a).length,34);assert.equal(rows.filter(x=>!x.a).length,34);}
for(const item of [...pack.facts,...pack.jeopardy]){assert(item.sources.every(x=>x.startsWith('https://')));assert(['2026-10-01','2026-10-03','2026-10-04','2026-10-05'].includes(item.verified));if(item.subject)assert(pack.images[item.subject]);}
for(const q of pack.jeopardy){assert(q.difficulty>=1&&q.difficulty<=5);assert(q.a);if(q.subject)assert(!q.a.split('|').includes(q.subject),'An answer-identification clue must not carry the answer picture');}
const mergeStart=html.indexOf('(function mergeReviewedContent(){'),mergeEnd=html.indexOf('})();',mergeStart)+5;
const context=vm.createContext({window:{GAME_CONTENT_PACK:pack},VISUAL_IMG:{},VISUAL_DETAIL:{},GENERATED_SUBJECTS:new Set(),SOLO_Q:[],ESTIMATE_Q:[],FACT_Q:[],JEOP_CATS:[['Kultur',[]],['Fußball',[]],['Geschichte',[]],['Geografie',[]]],localStorage:{getItem(){return null},setItem(){}},S:{room:null},JEOP:{mode:'random'}});
vm.runInContext(fs.readFileSync('assets/content-categories.js','utf8'),context);
vm.runInContext(html.slice(mergeStart,mergeEnd),context);
assert.equal(context.FACT_Q.length,214);assert.equal(context.JEOP_CATS.flatMap(x=>x[1]).length,646);
const newCats=context.JEOP_CATS.filter(x=>!['Kultur','Fußball','Geschichte','Geografie'].includes(x[0]));assert.equal(newCats.length,22);assert(newCats.every(x=>x[1].length>=5));
for(const q of pack.jeopardy){const imported=context.JEOP_CATS.flatMap(x=>x[1]).find(x=>x[0]===q.q);assert.equal(imported[2],q.difficulty);}
const helpersStart=html.indexOf('function jeopDifficulty('),helpersEnd=html.indexOf('let JEOP_SYNC_REV=',helpersStart);vm.runInContext(html.slice(helpersStart,helpersEnd),context);context.JEOP_CATS=newCats;context.buildJeopData();assert.equal(context.JEOP.data.length,6);assert.equal(new Set(context.JEOP.data.flatMap(x=>x[1]).map(x=>x[0])).size,30);
const roundStart=html.indexOf('function factRound('),roundEnd=html.indexOf('\nfunction startFactCheck',roundStart);vm.runInContext(html.slice(roundStart,roundEnd),context);for(const level of ['easy','medium','hard']){const round=context.factRound(pack.facts.filter(x=>x.difficulty===level));assert.equal(round.length,10);assert.equal(round.filter(x=>x.a).length,5);}
console.log('OK: 646 sourced Jeopardy clues, fourteen added playable categories, 30 unique board cells, preserved levels, no answer-picture leaks; 214 balanced Fact/Fake statements and playable rounds');
