import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const html=fs.readFileSync('index.html','utf8'),ctx={window:{}};vm.runInNewContext(fs.readFileSync('content/approved.js','utf8'),ctx);const pack=ctx.window.GAME_CONTENT_PACK;
const groups=Object.groupBy(pack.moreless,q=>q.cat);assert.equal(groups['Fußballer'].length,10);assert.equal(groups.Autos.length,6);
const pairKeys=new Set();for(const q of pack.moreless){assert.notEqual(q.lv,q.rv);assert(q.sources.length===2&&q.sources.every(url=>url.startsWith('https://')));const key=[q.cat,q.u,...[q.l,q.r].sort()].join('|');assert(!pairKeys.has(key));pairKeys.add(key);assert(pack.images[q.l]&&pack.images[q.r]);}
for(const image of Object.values(pack.images)){assert(fs.existsSync('assets/visuals/'+image.card));assert(image.generated)}
assert.notEqual(pack.images.Orca.card,pack.images.Delfin.card);assert.notEqual(pack.images['Kylian Mbappé'].card,pack.images['Erling Haaland'].card);
const funcs=['countryName','questionSubject'].map(n=>html.split('\n').find(l=>l.startsWith('function '+n+'('))).join('\n');const start=html.indexOf('function moreLessPrompt('),end=html.indexOf('\nfunction ',start+1);
const test=vm.createContext({COUNTRY_CODE:{Italien:'it',Spanien:'es'},VISUAL_IMG:Object.fromEntries(Object.keys(pack.images).map(n=>[n,pack.images[n].card]))});vm.runInContext(funcs+'\n'+html.slice(start,end),test);
assert.equal(vm.runInContext("questionSubject('Orcas gehören zur Familie der Delfine.')",test),'Orcas');assert.equal(vm.runInContext("questionSubject('Eine gebleichte Koralle ist immer bereits tot.')",test),'Koralle');
assert.equal(vm.runInContext("moreLessPrompt('Italien (UNESCO-Welterbe)','Spanien (UNESCO-Welterbe)','Anzahl Welterbestätten')",test),'Wer hat mehr UNESCO-Welterbestätten: Italien oder Spanien?');
assert.match(vm.runInContext("moreLessPrompt('A','B','Tempo-Wertung · EA SPORTS FC 26 · Basiskarte')",test),/Tempo-Wertung/);assert.match(vm.runInContext("moreLessPrompt('A','B','Sekunden · 0–100 km\/h laut Hersteller')",test),/mehr Sekunden/);
console.log('OK: distinct subjects, sourced FC26/car measures, unequal values, no mirrored duplicates, correct prompts');
