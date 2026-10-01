import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('index.html','utf8');
const daily=fs.readFileSync('assets/daily.js','utf8')+fs.readFileSync('assets/account/menu.js','utf8')+fs.readFileSync('assets/account/preferences.js','utf8')+fs.readFileSync('assets/account/controller.mjs','utf8');
const offline=fs.readFileSync('offline/index.html','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1}, ok=m=>console.log('OK:',m);
if(html===offline.replaceAll('src="../assets/','src="assets/').replaceAll('href="../assets/','href="assets/').replaceAll('src="../content/','src="content/'))ok('online/offline HTML identical except content path');else fail('online/offline HTML differ beyond content path');
const visualMap=html.match(/const VISUAL_IMG=\{([\s\S]*?)\};/);
if(!visualMap)fail('visual asset map missing');
else{
  const files=[...visualMap[1].matchAll(/:'([^']+\.(?:webp|svg))'/g)].map(m=>m[1]);
  const missing=files.filter(name=>!fs.existsSync('assets/visuals/'+name));
  missing.length?fail('missing local visuals: '+missing.join(', ')):ok(files.length+' local visual mappings resolve');
}
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const dup=[...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))];
dup.length?fail('duplicate IDs: '+dup.join(', ')):ok(ids.length+' unique DOM IDs');
const onclick=[...html.matchAll(/onclick="([^"]+)"/g)].map(m=>m[1]);
const calls=[...new Set(onclick.flatMap(h=>[...h.matchAll(/(?:^|[; ])([A-Za-z_$][\w$]*)\s*\(/g)].map(m=>m[1])))];
const defined=n=>new RegExp('function\\s+'+n+'\\s*\\(|(?:const|let|var)\\s+'+n+'\\s*=').test(html+daily)||['setTimeout','clearInterval'].includes(n);
const missing=calls.filter(n=>!defined(n));
missing.length?fail('onclick calls missing functions: '+missing.join(', ')):ok(onclick.length+' click handlers resolve to '+calls.length+' functions');
const worldButtons=[...html.matchAll(/class="worldCard" onclick="openWorldMenu\('([^']+)'\)"/g)].map(m=>m[1]);
const expectedWorlds=['moreless','estimate','facts','quiz'];
JSON.stringify(worldButtons)===JSON.stringify(expectedWorlds)&&!/\.worldCard[\s\S]{0,250}\.onclick\s*=|btn\.onclick\s*=/.test(html)
  ?ok('four home cards keep their own mode handlers')
  :fail('home card handler overridden or mode mapping wrong');
html.includes('#worldMenu #morelessModes.hide{display:none!important}')
  ?ok('More/Less modes stay hidden in the other game menus')
  :fail('More/Less mode cards can appear in another game menu');
const contentStart=html.indexOf('const KNOWLEDGE_POOL='),contentEnd=html.indexOf('let JEOP=',contentStart);
if(contentStart<0||contentEnd<0)fail('Jeopardy catalogue missing');
else{
  const categories=vm.runInNewContext(html.slice(contentStart,contentEnd)+'\nJEOP_CATS.map(([name,questions])=>({name,count:questions.length}))');
  const incomplete=categories.filter(x=>x.count<5);
  incomplete.length?fail('Jeopardy category has empty board cells: '+incomplete.map(x=>x.name+'('+x.count+')').join(', ')):ok(categories.length+' Jeopardy categories have at least five clues');
}
const required=[
['MORE/LESS render','function renderSolo('],['MORE/LESS answer','function soloPick('],['MORE/LESS category','function pickCat('],
['Estimate start','function startEstimateSolo('],['Estimate render','function renderEstimate('],['Estimate submit','function submitEstimate('],['Estimate next','function nextEstimate('],
['Jeopardy start','function startJeopardy('],['Jeopardy board select','function confirmJeopCell('],['Jeopardy buzz','function jeopBuzz('],['Jeopardy judge','function judgeJeop('],['Jeopardy end','function endJeopardy('],
['Lobby create','function createRoom('],['Lobby join','function joinRoom('],['Lobby sync','function sync('],['Reconnect','function reconnect('],
['Exit','function leaveMatch('],['Main menu','function goMainMenu('],['New game','function newGameSameLobby('],
['Visual renderer','function setObjectVisual('],['Shared visual renderer','function setQuestionVisual('],
['online room RPC','ml_create_room'],['online answer RPC','ml_online_ml_submit'],['Jeopardy RPC','jeopardy_buzz']
];
for(const [name,needle] of required)html.includes(needle)?ok(name):fail(name+' missing');
const script=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).join('\n');
ok('extracted '+script.length+' bytes inline JavaScript');
const {spawnSync}=await import('node:child_process');
const syntax=spawnSync(process.execPath,['--check','-'],{input:script,encoding:'utf8'});
if(syntax.status===0)ok('inline JavaScript syntax valid');else fail('inline JavaScript syntax error: '+syntax.stderr);
if(process.exitCode)process.exit(process.exitCode);
await import('./online-answer-feedback-check.mjs');
await import('./guest-online-check.mjs');
await import('./qr-join-check.mjs');
await import('./end-screen-check.mjs');
await import('./scoring-rules-check.mjs');
await import('./jeopardy-guest-check.mjs');

await import('./blitz-timer-check.mjs');

await import('./lobby-settings-check.mjs');

await import('./daily-check.mjs');

await import('./menu-access-check.mjs');

await import('./account-foundation-check.mjs');

await import('./jeopardy-board-check.mjs');

await import('./art-profile-check.mjs');

await import('./preferences-check.mjs');

await import("./country-flags-check.mjs");

await import('./reviewed-content-check.mjs');
await import('./account-controller-check.mjs');

await import("./selection-check.mjs");

await import("./category-progress-check.mjs");

await import("./chaos-rules-check.mjs");

const onlineEstimate=spawnSync(process.execPath,["scripts/online-estimate-client-check.mjs"],{encoding:"utf8"});process.stdout.write(onlineEstimate.stdout);process.stderr.write(onlineEstimate.stderr);if(onlineEstimate.status!==0)fail("online estimate client checks");
