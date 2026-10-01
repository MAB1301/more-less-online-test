import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
function source(name){
 const start=html.search(new RegExp('(?:async )?function '+name+'\\('));
 assert(start>=0,name+' exists');
 const open=html.indexOf('{',start);let depth=0,quote='',escape=false;
 for(let i=open;i<html.length;i++){
  const c=html[i];
  if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote='';continue}
  if(c==='\''||c==='"'||c==='`'){quote=c;continue}
  if(c==='{')depth++;
  if(c==='}'&&!--depth)return html.slice(start,i+1);
 }
 throw Error('Unclosed '+name);
}
const home=html.slice(html.indexOf('<div id="homeScreen"'),html.indexOf('<div id="worldMenu"'));
assert.equal((home.match(/class="worldCard"/g)||[]).length,4);
assert(!home.includes('friendsAccess'),'online disclosures do not add choices to the home menu');
assert.equal((home.match(/onclick="openDaily\(\)"/g)||[]).length,1,'one entry opens daily challenges');
assert.equal((home.match(/class="homeTileCopy"/g)||[]).length,4,'every game has native visible labels');
assert(home.includes('Tages-Challenges'));
assert(!home.includes('homeDailyLink'));
assert(!home.includes('homeAccessibleText'),'labels are visible, not only inside the picture');
assert.equal((html.match(/class="friendsAccess friendsMenuTrigger"/g)||[]).length,3);
assert(!html.includes('<details class="friendsAccess"'));
assert(html.includes('<dialog id="friendsMenu"'));

const nodes=new Map();
const el=id=>{
 if(!nodes.has(id)){
  const classes=new Set();
  nodes.set(id,{textContent:'',value:'',className:'',dataset:{},focus(){this.focused=true},select(){this.selected=true},
   classList:{add:(...names)=>names.forEach(n=>classes.add(n)),remove:(...names)=>names.forEach(n=>classes.delete(n)),contains:n=>classes.has(n),toggle(n,on){if(on)classes.add(n);else classes.delete(n)}}});
 }
 return nodes.get(id);
};
const modes=['Classic','Party','Blitz','Survival','King','Chaos'].map(name=>{
 const node=el('mode-'+name);node.attrs={};node.setAttribute=(key,value)=>node.attrs[key]=value;
 node.dataset={modeShort:name+' short',modeDescription:name+' explanation'};node.title={textContent:name};node.description={textContent:name+' short'};
 node.querySelector=selector=>selector==='b'?node.title:node.description;return node;
});
const context=vm.createContext({el,document:{querySelectorAll:()=>modes},LOBBY_MODE:'CLASSIC'});
vm.runInContext(source('enterMoreLessMode'),context);
vm.runInContext("enterMoreLessMode(null,'Blitz')",context);
assert.equal(el('chosenMode').textContent,'BLITZ');
assert.equal(el('morelessStartLabel').textContent,'Blitz starten');
assert.equal(modes[2].attrs['aria-pressed'],'true');
assert.equal(modes[2].description.textContent,'Blitz explanation');
vm.runInContext("enterMoreLessMode(null,'Party')",context);
assert.equal(modes[2].description.textContent,'Blitz short','previous card returns to short description');
assert.equal(modes[1].description.textContent,'Party explanation');
vm.runInContext("enterMoreLessMode(null,'Blitz')",context);
assert(!html.includes('id="morelessSummary"'),'no separate summary box');
assert.equal(modes.filter(b=>b.classList.contains('active')).length,1,'restored mode has one selected card');
assert.equal(el('blitzSetup').classList.contains('hide'),false);

context.FACT_LEVEL_NAMES={easy:'LEICHT',medium:'MITTEL',hard:'SCHWER'};
context.FACT_DIFFICULTY='hard';
vm.runInContext(source('updateFactPreview'),context);
vm.runInContext('updateFactPreview()',context);
assert.equal(el('factStartLabel').textContent,'Schwer starten');

const writes=[];
context.S={code:'AB12CD'};
context.location={href:'https://example.com/game/?token=private#question'};
context.URL=URL;context.LOBBY_GAME='quiz';context.LOBBY_MODE='football';
context.navigator={clipboard:{writeText:async text=>writes.push(text)}};
vm.runInContext(source('joinUrl')+'\n'+source('copyInviteLink'),context);
await vm.runInContext('copyInviteLink()',context);
assert.equal(writes[0],'https://example.com/game/?join=AB12CD&game=quiz&mode=football');
assert(el('inviteLinkFallback').classList.contains('hide'));
context.navigator.clipboard.writeText=async()=>{throw Error('Permission denied')};
await vm.runInContext('copyInviteLink()',context);
assert(!el('inviteLinkFallback').classList.contains('hide'));
assert(el('inviteLinkValue').focused&&el('inviteLinkValue').selected,'clipboard failure exposes a selectable invitation');
assert.equal(el('inviteLinkValue').value,writes[0]);
console.log('OK: home stays simple, restored mode remains selected, start labels follow selection, invitation copying and manual fallback');

// The dialog launches the real room path directly, without an extra setup screen.
const popup=el('friendsMenu');popup.open=false;popup.showModal=()=>popup.open=true;popup.close=()=>popup.open=false;
context.S={myName:'Saved name'};context.FRIENDS_MENU_BUSY=false;context.FRIENDS_MENU_GAME='moreless';context.FRIENDS_MENU_RETURN=null;context.EST={mode:'risk'};context.JEOP={mode:'football'};
let creates=0,joins=0,completeCreate;
context.createRoom=()=>{creates++;return new Promise(resolve=>completeCreate=resolve)};
context.joinRoom=async()=>{joins++;return true};
for(const name of ['openFriendsMenu','closeFriendsMenu','friendsBackdrop','submitFriendsLobby'])vm.runInContext(source(name),context);
el('chosenMode').textContent='BLITZ';
vm.runInContext("openFriendsMenu('moreless',el('trigger'))",context);
assert(popup.open);assert.equal(el('friendsPlayerName').value,'Saved name');
el('friendsPlayerName').value='';await vm.runInContext('submitFriendsLobby(false)',context);assert.equal(creates,0,'blank name cannot create room');
el('friendsPlayerName').value='Alice';const pending=vm.runInContext('submitFriendsLobby(false)',context);
await vm.runInContext('submitFriendsLobby(false)',context);assert.equal(creates,1,'double click creates only one room');
vm.runInContext('closeFriendsMenu()',context);assert(popup.open,'busy dialog stays open');
assert.equal(context.LOBBY_MODE,'BLITZ');completeCreate(true);await pending;assert(!popup.open);
for(const game of ['estimate','quiz']){
 context.selectedGame=game;vm.runInContext("openFriendsMenu(selectedGame,el('trigger'))",context);
 el('friendsRoomCode').value=' ab12cd ';await vm.runInContext('submitFriendsLobby(true)',context);
 assert.equal(el('code').value,'AB12CD');assert.equal(context.LOBBY_GAME,game);assert.equal(context.LOBBY_MODE,game==='estimate'?'risk':'football');assert(!popup.open);
}
assert.equal(joins,2);
context.joinRoom=async()=>{throw Error('Raum nicht gefunden')};vm.runInContext("openFriendsMenu('moreless',el('trigger'))",context);el('friendsRoomCode').value='INVALID';await vm.runInContext('submitFriendsLobby(true)',context);
assert(popup.open);assert.equal(el('friendsStatus').textContent,'Raum nicht gefunden');assert.equal(el('friendsJoin').disabled,false,'retry controls unlock after error');
vm.runInContext('closeFriendsMenu()',context);assert(el('trigger').focused);
console.log('OK: popup name validation, direct create/join, duplicate-click lock, selected mode, errors, close and focus return');

context.JEOP_CATS=Array.from({length:8},(_,i)=>['Category '+i,[]]);
context.document.createElement=()=>({children:[],append(...nodes){this.children.push(...nodes)}});
const catBox=el('friendsQuizCats');catBox.children=[];catBox.replaceChildren=()=>catBox.children=[];catBox.append=node=>catBox.children.push(node);
for(const name of ['toggleJeopLobbyBoard','renderJeopLobbyCats'])vm.runInContext(source(name),context);
vm.runInContext("openFriendsMenu('quiz',el('trigger'))",context);
el('friendsCustomBoard').checked=true;vm.runInContext('toggleJeopLobbyBoard()',context);
assert.equal(catBox.children.length,8);assert(catBox.children[6].children[0].disabled,'unselected categories disable at six');
catBox.children[0].children[0].checked=false;catBox.children[0].children[0].onchange();assert.equal(context.FRIENDS_JEOP_CATS.length,5);
await vm.runInContext('submitFriendsLobby(false)',context);assert(popup.open);assert(el('friendsStatus').textContent.includes('genau 6'));
context.FRIENDS_JEOP_CATS=[1,2,3,4,5,6];let captured=null;
context.createRoom=async()=>{captured={mode:context.JEOP.mode,cats:[...context.JEOP.boardCats]};return false};
const oldMode=context.JEOP.mode;await vm.runInContext('submitFriendsLobby(false)',context);assert.equal(context.JEOP.mode,oldMode,'failed custom create restores previous board');assert.deepEqual(captured.cats,[1,2,3,4,5,6]);assert.equal(captured.mode,'random');
context.createRoom=async()=>true;await vm.runInContext('submitFriendsLobby(false)',context);assert(!popup.open);assert.deepEqual(Array.from(context.JEOP.boardCats),[1,2,3,4,5,6]);
console.log('OK: custom lobby requires six categories, selection limits, persisted choice and restoration after failed create');
