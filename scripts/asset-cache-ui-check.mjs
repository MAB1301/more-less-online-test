import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('assets/asset-cache.js','utf8');
class Element{
 constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.hidden=false;this.disabled=false}
 append(...children){this.children.push(...children)}
 before(element){this.previous=element}
 setAttribute(name,value){this.attributes[name]=value}
 removeAttribute(name){delete this.attributes[name];if(name==='value')delete this.value}
}
function setup({supported=true,registrationFails=false,hasHome=true}={}){
 const header=new Element('header'),comfort=new Element('p'),requests=[];
 const worker={postMessage(payload,ports){requests.push({payload,port:ports[0]})}};
 const context=vm.createContext({URL,Promise,Error,MessageChannel:class{constructor(){this.port1={close(){}};this.port2={postMessage:data=>this.port1.onmessage({data})}}},setTimeout:()=>1,clearTimeout(){},requestIdleCallback(){},performance:{getEntriesByType:()=>[]},document:{currentScript:{src:'https://example.com/game/assets/asset-cache.js'},readyState:'complete',createElement:tag=>new Element(tag),getElementById:()=>comfort,querySelector:()=>hasHome?header:null,documentElement:{classList:{contains:()=>false}}},window:{isSecureContext:supported},navigator:{serviceWorker:{register:async()=>{if(registrationFails)throw Error('Registration failed')},ready:Promise.resolve({active:worker})}}});
 vm.runInContext(source,context);
 const settings=comfort.previous,home=header.children[0];
 return {settings,home,requests};
}
const settle=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
const {settings,home,requests}=setup();await settle();
const [homeButton,homeProgress,homeStatus]=home.children;
const [, ,settingsButton,settingsProgress,settingsStatus]=settings.children;
assert(homeButton.innerHTML.includes('<svg'),'Download icon is directly inside the main menu');
assert.equal(homeButton.disabled,false);assert.equal(homeStatus.hidden,true);
const download=homeButton.onclick();await settle();
assert(homeButton.disabled&&settingsButton.disabled);assert(!homeProgress.hidden&&!settingsProgress.hidden);
await settingsButton.onclick();assert.equal(requests.length,1,'Menu and settings share one download, even on repeated clicks');
requests[0].port.postMessage({completed:7,total:10,failed:1,done:false});
assert.equal(homeProgress.value,7);assert.equal(settingsProgress.value,7);assert.equal(homeStatus.textContent,settingsStatus.textContent);assert.match(homeStatus.textContent,/6 \/ 10/);assert.equal(homeStatus.hidden,false);
requests[0].port.postMessage({completed:10,total:10,failed:1,done:true});await download;
assert.match(homeStatus.textContent,/erneut versuchen/);assert(!homeButton.disabled&&!settingsButton.disabled);assert(homeProgress.hidden&&settingsProgress.hidden);
const retry=settingsButton.onclick();await settle();assert.equal(requests.length,2);
requests[1].port.postMessage({completed:10,total:10,failed:0,done:true});await retry;
assert.match(homeStatus.textContent,/Alle 10/);assert.equal(homeStatus.textContent,settingsStatus.textContent);
for(const options of [{supported:false},{registrationFails:true}]){const state=setup(options);await settle();assert(state.home.children[0].disabled);assert.equal(state.home.children[2].hidden,false);assert.match(state.home.children[2].textContent,/Browser|aktiviert/);assert.equal(state.requests.length,0)}
const withoutHome=setup({hasHome:false});await settle();assert.equal(withoutHome.settings.children[2].disabled,false,'Settings download remains usable when a page has no main-menu header');
console.log('OK: main-menu download icon, shared job/progress, duplicate prevention, retry, success and unavailable-storage feedback');
