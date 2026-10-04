import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync('index.html','utf8'),source=html.slice(html.indexOf('const COUNTRY_CODE='),html.indexOf('const VISUAL_BASE='));
const images=[];class Image{constructor(){images.push(this)}}
const box={className:'objectVisual',dataset:{},children:[],classList:{contains:k=>k==='objectVisual',add(){},remove(){}},replaceChildren(){this.children=[]},append(n){this.children.push(n)}};
const context={Image,document:{createElement:()=>({})}};vm.createContext(context);vm.runInContext(source,context);
for(const [name,code] of [['Italien (UNESCO-Welterbe)','it'],['Spanien (UNESCO-Welterbe)','es'],['Deutschland Bevölkerung 2024','de'],['USA','us'],['Japan','jp']])assert.equal(vm.runInContext(`countryFlagUrl(${JSON.stringify(name)})`,context),'https://flagcdn.com/'+code+'.svg');
assert.equal(vm.runInContext("countryFlagUrl('Indischer Ozean')",context),'');
context.box=box;assert(vm.runInContext("setCountryVisual(box,'Italien (UNESCO-Welterbe)')",context));assert.equal(images[0].alt,'Flagge von Italien');assert.equal(images[0].src,'https://flagcdn.com/it.svg');
vm.runInContext("setCountryVisual(box,'Spanien (UNESCO-Welterbe)')",context);images[0].onerror();assert.equal(box.children[0],images[1]);images[1].onerror();assert.match(box.children[0].textContent,/Spanien/);assert(!box.children[0].textContent.includes('Symbolbild'));
assert.equal(vm.runInContext('Object.keys(COUNTRY_CODE).every(n=>countryFlagUrl(n).endsWith(COUNTRY_CODE[n]+".svg"))',context),true);
console.log('OK: all country flags resolve, UNESCO/population suffixes match, distinct Italy/Spain images, stale and failed loads handled');


for(const [name,code] of [['Österreich','at'],['Schweiz','ch'],['Belgien','be']]){assert.equal(context.countryFlagUrl(name),'assets/visuals/research/'+code+'.svg');assert(fs.existsSync(context.countryFlagUrl(name)));context.location={pathname:'/offline/index.html'};assert.equal(context.countryFlagUrl(name),'../assets/visuals/research/'+code+'.svg');delete context.location;}
console.log('OK: new country flags bundled locally with correct online/offline paths');
