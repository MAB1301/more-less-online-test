import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const selectors=['#morelessModes .gameMode','#playType .gameMode','#jeopardyIntro .gameMode','#factIntro .factLevel','.estimateLength button'],groups={};let clicks=0;
for(const selector of selectors)groups[selector]=Array.from({length:3},()=>({click(){clicks++},addEventListener(_type,handler){this.handler=handler}}));
const values=new Map([['ml_game_selection_v1',JSON.stringify({moreless:2,facts:99,board:'alert(1)'})],['ml_account_auth_v1','unchanged']]);
const source=fs.readFileSync('assets/account/selection.js','utf8');vm.runInNewContext(source,{document:{querySelectorAll:selector=>groups[selector]},localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)}});assert.equal(clicks,1);groups[selectors[2]][1].handler();assert.equal(JSON.parse(values.get('ml_game_selection_v1')).board,1);assert.equal(values.get('ml_account_auth_v1'),'unchanged');
console.log('OK: menu selections restore valid indices, ignore invalid values, and keep account storage untouched');
