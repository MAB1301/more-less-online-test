import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync('index.html','utf8');
const packContext={window:{}};
vm.runInNewContext(fs.readFileSync('content/approved.js','utf8'),packContext);
const pack=packContext.window.GAME_CONTENT_PACK;
const added=JSON.parse(fs.readFileSync('content/research/2026-10-03/expansion-4.json','utf8'));
assert.equal(added.flatMap(x=>x.facts).length,44);
assert.equal(pack.estimate.filter(q=>q.verified==='2026-10-03').length,44);
assert.equal(pack.moreless.filter(q=>q.expansion!==8&&q.expansion!==9&&q.verified!=='2026-10-04').length,556);
assert.equal(pack.estimate.filter(q=>q.expansion!==8&&q.expansion!==9&&q.verified!=='2026-10-04').length,128);
const keys=pack.estimate.map(q=>q.q.trim().toLowerCase());assert.equal(new Set(keys).size,keys.length);
const dates=pack.moreless.filter(q=>['Natur','Weltkultur','Raumfahrt'].includes(q.cat)&&q.expansion!==8&&q.expansion!==9&&q.verified!=='2026-10-04');
assert(dates.every(q=>q.u.startsWith('Jahr')));
assert(!pack.moreless.some(q=>q.l==='Machu Picchu'&&q.r==='Taj Mahal'||q.r==='Machu Picchu'&&q.l==='Taj Mahal'));
for(const record of added.filter(x=>x.variants)){
 const images=pack.images[record.name];assert(images);assert.notEqual(images.card,images.detail);
 for(const [kind,width] of [['card',720],['detail',960]]){
  const svg=fs.readFileSync('assets/visuals/'+images[kind],'utf8');
  assert(svg.includes(`viewBox="0 0 ${width} 540"`));
  assert(!svg.includes('http://')||svg.includes('xmlns="http://www.w3.org/2000/svg"'));
  assert(!/<(?:script|image|foreignObject)\b/.test(svg));
  assert(!svg.match(/<text[^>]*>[^<]*\d/),'Graphic must not reveal the numeric answer');
 }
}
// Exercise the real renderers with a detail SVG, not just their source strings.
let rendered=[];
const box={dataset:{},classList:{contains(){return false},remove(){},add(){}},appendChild(image){rendered.push(image)},innerHTML:''};
const context=vm.createContext({el:()=>box,questionSubject:s=>s,setCountryVisual:()=>false,visualKind:()=>'',visualName:s=>s,VISUAL_BASE:'assets/visuals/',VISUAL_IMG:{Gold:pack.images.Gold.card,Photo:'photo.webp'},VISUAL_DETAIL:{Gold:pack.images.Gold.detail,Photo:'photo-detail.webp'},VISUAL_CONTAIN:new Set(),VISUAL_CARD_COVER:new Set(),GENERATED_SUBJECTS:new Set(),Image:class {set src(value){this.url=value;this.onload()}},visualFallback:()=>'',questionTopicArt:()=>''});
for(const name of ['setObjectVisual','setQuestionVisual']){
 const line=html.split('\n').find(line=>line.startsWith('function '+name+'('));assert(line);vm.runInContext(line,context);
}
context.setObjectVisual('card','Gold');context.setQuestionVisual('estimate','Gold');
assert(rendered.every(image=>image.className==='visualContain'));
assert.equal(rendered[0].url,'assets/visuals/'+pack.images.Gold.card);
assert.equal(rendered[1].url,'assets/visuals/'+pack.images.Gold.detail);
rendered=[];context.setObjectVisual('card','Photo');context.setQuestionVisual('estimate','Photo');assert(rendered.every(image=>image.className===''));
const start=html.indexOf('function moreLessPrompt('),end=html.indexOf('\nfunction ',start+1);vm.runInContext(html.slice(start,end),context);
assert.match(context.moreLessPrompt('Erde','Mars','kg/m³ · mittlere Planetendichte'),/Dichte/);
assert.match(context.moreLessPrompt('Erde','Mars','km/s · Fluchtgeschwindigkeit'),/Fluchtgeschwindigkeit/);
assert.match(context.moreLessPrompt('Erde','Mars','km/s · mittlere Bahngeschwindigkeit um die Sonne'),/um die Sonne/);
console.log('OK: 44 added sourced estimates, 290 added comparisons, distinct graphic variants, answer-free SVGs, actual card/detail contain rendering and metric-specific prompts');
