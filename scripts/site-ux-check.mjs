import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const nodes=new Map();
function node(id){if(!nodes.has(id)){const classes=new Set(['hide']);nodes.set(id,{dataset:{},hidden:false,textContent:'',open:false,classList:{contains:x=>classes.has(x),add:x=>classes.add(x),remove:x=>classes.delete(x)},showModal(){this.open=true},close(){this.open=false},focus(){this.focused=true},getBoundingClientRect:()=>({width:200}),setAttribute(){}})}return nodes.get(id)}
let calls=[];
const ctx={document:{getElementById:node},window:{devicePixelRatio:2},S:{},SOLO:{on:false},DAILY:{data:null},EST:{mode:'classic'},JEOP:{mode:'standard'},GAME_WORLD:'moreless',FACT_DIFFICULTY:'easy',FACT_LEVEL_NAMES:{easy:'Leicht'},openFriendsMenu:(...args)=>calls.push(['online',...args]),playSolo:()=>calls.push(['solo']),startEstimateSolo:()=>calls.push(['estimate']),startFactCheck:()=>calls.push(['facts']),openJeopTeamSetup:()=>calls.push(['teams']),closeWorldMenu:()=>calls.push(['home']),leaveMatch:()=>calls.push(['confirm']),clearInterval(){},closeDaily(){},menuBack(){}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('assets/site-ux.js','utf8').split('(function initSiteUX()')[0],ctx);
node('worldMenu').dataset.options='open';ctx.siteChoosePlayType();assert.equal(node('worldMenu').dataset.options,'closed');assert.ok(node('siteLocalStart').focused);ctx.siteShowModes();assert.equal(node('worldMenu').dataset.options,'open');ctx.siteEntry('local');assert.equal(calls.pop()[0],'solo');
ctx.GAME_WORLD='quiz';ctx.siteEntry('local');assert.equal(calls.pop()[0],'teams');assert.equal(node('worldMenu').dataset.options,'teams');
ctx.GAME_WORLD='facts';ctx.siteEntryUpdate();assert.equal(node('siteOnlineStart').hidden,false);ctx.siteEntry('local');assert.equal(calls.pop()[0],'facts');
ctx.GAME_WORLD='estimate';ctx.siteEntry('online');assert.equal(calls.pop()[1],'estimate');
ctx.S.room='room';ctx.siteMainMenu();assert.equal(node('siteNavigation').open,true);assert.equal(ctx.S.room,'room');ctx.siteResume();assert.equal(node('siteNavigation').open,false);assert.equal(ctx.S.room,'room');
ctx.siteEntry('local');assert.equal(node('siteNavigation').open,true);ctx.siteEndRound();assert.equal(calls.pop()[0],'confirm');assert.equal(ctx.S.room,'room');
assert.match(ctx.siteIdentityCopy(false).copy,/anderes Gerät/);assert.match(ctx.siteIdentityCopy(true).copy,/nicht automatisch übertragen/);
vm.runInContext(fs.readFileSync('assets/site-images.js','utf8'),ctx);
const map=JSON.parse(fs.readFileSync('assets/site-images.js','utf8').match(/VARIANTS=(.*);/)[1]);const [file,variant]=Object.entries(map)[0];
assert.equal(ctx.siteImageSource('../assets/visuals/'+file,node('image')),'../assets/visuals/'+variant.path);
ctx.window.devicePixelRatio=3;assert.equal(ctx.siteImageSource('assets/visuals/'+file,node('image')),'assets/visuals/'+file);
assert.equal(ctx.siteImageSource('assets/visuals/flag.svg',node('image')),'assets/visuals/flag.svg');
for(const [original,v] of Object.entries(map)){assert.ok(fs.statSync('assets/visuals/'+v.path).size<fs.statSync('assets/visuals/'+original).size)}
console.log('OK: direct local/online routes, local team setup, resume preserves room, leave confirms, truthful identity and responsive/offline image sources');
