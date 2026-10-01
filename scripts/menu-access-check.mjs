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
assert.equal((html.match(/<details class="friendsAccess"/g)||[]).length,3);

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
 node.querySelector=()=>({textContent:name});return node;
});
const context=vm.createContext({el,document:{querySelectorAll:()=>modes},LOBBY_MODE:'CLASSIC'});
vm.runInContext(source('enterMoreLessMode'),context);
vm.runInContext("enterMoreLessMode(null,'Blitz')",context);
assert.equal(el('chosenMode').textContent,'BLITZ');
assert.equal(el('morelessStartLabel').textContent,'Blitz starten');
assert.equal(modes[2].attrs['aria-pressed'],'true');
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
