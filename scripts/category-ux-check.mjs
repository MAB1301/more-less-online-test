import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const nodes=new Map(),storage=new Map();let calls=[],pending,focus=0;
function el(id){if(!nodes.has(id)){const classes=new Set();nodes.set(id,{value:'',textContent:'',children:[],classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)},replaceChildren(){this.children=[]},appendChild(x){this.children.push(x)},querySelector:()=>({disabled:false}),showModal(){this.open=true},close(){this.open=false},focus(){focus++}})}return nodes.get(id)}
const S={room:null,host:false,q:0},cats=['Länder','Städte','Sport','Wissenschaft','Allgemeinwissen'];
let available={Länder:5,Städte:5,Sport:0,Wissenschaft:0,Allgemeinwissen:0};
const ctx=vm.createContext({el,S,SHARED_CATS:cats,SOLO_Q:cats.map(cat=>({cat})),CATEGORY_ART:{Länder:'geography',Städte:'city',Sport:'sport',Wissenschaft:'science'},VISUAL_BASE:'../assets/visuals/',sharedTheme:()=> 'mix',visualFallback:()=> 'science-topic',LOBBY_GAME:'moreless',document:{activeElement:el('focus'),querySelectorAll:()=>[],createElement:()=>({})},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},onlineAvailable:cat=>Array(available[cat]),msg(){},Math,startQ:n=>{calls.push(n);return new Promise(resolve=>pending=resolve)}});
vm.runInContext(fs.readFileSync('assets/home/category-ux.js','utf8'),ctx);const run=code=>vm.runInContext(code,ctx);
assert.equal(run('CATEGORY_OPTIONS.mode'),'random','new devices default to automatic allocation');
run('openCategoryOptions()');el('categoryChoiceMode').value='chosen';el('categoryChoiceName').value='Städte';run('saveCategoryOptions()');assert.equal(focus,1);assert.equal(JSON.parse(storage.get('ml_category_options_v1')).category,'Städte');
ctx.options=[{cat:'Länder'},{cat:'Städte'},{cat:'Sport'}];assert.equal(run('chooseCategoryOption(options).cat'),'Städte');
ctx.options=[{cat:'Länder'}];assert.equal(run('chooseCategoryOption(options).cat'),'Länder','exhausted configured category falls back to a fresh one');
S.room='room';await run('startAutomaticOnlineCategory()');assert.equal(calls.length,0,'guest cannot start category');
S.host=true;const first=run('startAutomaticOnlineCategory()');await run('startAutomaticOnlineCategory()');assert.deepEqual(calls,[1],'concurrent clicks cannot create two first questions');assert.equal(S.cat,'Städte');pending();await first;
S.q=5;available.Städte=0;const second=run('startAutomaticOnlineCategory()');assert.equal(S.cat,'Länder','host selects only categories with five unused questions');assert.equal(calls.at(-1),6);pending();await second;
available.Länder=0;await run('startAutomaticOnlineCategory()');assert.equal(calls.length,2,'no available category does not reuse old questions');
assert.match(run("questionTopicArt('Welcher Club gewann die Champions League?')"),/sport-field/);assert.match(run("questionTopicArt('Wie lang ist ein Tennisfeld?')"),/tennis-court/);assert(!run("questionTopicArt('Eine Frage','<img src=x>')").includes('<img src=x>'),'untrusted category cannot inject markup');
for(const path of run('Object.values(CATEGORY_PHOTOS).concat(Object.values(CATEGORY_SUBJECT_PHOTOS))'))assert(fs.existsSync('assets/visuals/'+path),path);
assert.match(run("categoryPhotoArt('Wissenschaft')"),/art-science/);assert.match(run("categoryPhotoArt('Autos')"),/porsche-gt3/);
console.log('OK: default random categories, explicit saved choice, fresh-category fallback, host authority, duplicate-start lock and football/tennis topic visuals');
