import fs from 'node:fs';
const html=fs.readFileSync('index.html','utf8');
const offline=fs.readFileSync('offline/index.html','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1}, ok=m=>console.log('OK:',m);
if(html===offline)ok('online/offline HTML identical');else fail('online/offline HTML differ');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const dup=[...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))];
dup.length?fail('duplicate IDs: '+dup.join(', ')):ok(ids.length+' unique DOM IDs');
const onclick=[...html.matchAll(/onclick="([^"]+)"/g)].map(m=>m[1]);
const calls=[...new Set(onclick.flatMap(h=>[...h.matchAll(/(?:^|[; ])([A-Za-z_$][\w$]*)\s*\(/g)].map(m=>m[1])))];
const defined=n=>new RegExp('function\\s+'+n+'\\s*\\(|(?:const|let|var)\\s+'+n+'\\s*=').test(html)||['setTimeout','clearInterval'].includes(n);
const missing=calls.filter(n=>!defined(n));
missing.length?fail('onclick calls missing functions: '+missing.join(', ')):ok(onclick.length+' click handlers resolve to '+calls.length+' functions');
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
fs.writeFileSync('/tmp/game-inline.js',script);
ok('extracted '+script.length+' bytes inline JavaScript');
if(process.exitCode)process.exit(process.exitCode);
