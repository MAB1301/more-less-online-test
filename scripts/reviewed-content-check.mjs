import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const html=fs.readFileSync('index.html','utf8'),ctx={window:{}};vm.runInNewContext(fs.readFileSync('content/approved.js','utf8'),ctx);const pack=ctx.window.GAME_CONTENT_PACK;for(const kind of ['moreless','estimate','facts','jeopardy'])pack[kind]=pack[kind].filter(q=>q.expansion!==8&&q.expansion!==9);
const groups=Object.groupBy(pack.moreless,q=>q.cat);assert.equal(groups['Fußball'].length+groups['Videospiele'].length,56);assert.equal(groups.Autos.length,20);
const pairKeys=new Set();for(const q of pack.moreless){assert.notEqual(q.lv,q.rv);assert(q.sources.length===2&&q.sources.every(url=>url.startsWith('https://')));const key=[q.cat,q.u,...[q.l,q.r].sort()].join('|');assert(!pairKeys.has(key));pairKeys.add(key);assert(pack.images[q.l]&&pack.images[q.r]);}
for(const image of Object.values(pack.images)){assert(fs.existsSync('assets/visuals/'+image.card));assert(image.source.startsWith("https://")&&image.license);assert.equal(typeof image.generated,"boolean")}
assert.notEqual(pack.images.Orca.card,pack.images.Delfin.card);assert.notEqual(pack.images['Kylian Mbappé'].card,pack.images['Erling Haaland'].card);
const funcs=['countryName','questionSubject'].map(n=>html.split('\n').find(l=>l.startsWith('function '+n+'('))).join('\n');const start=html.indexOf('function moreLessPrompt('),end=html.indexOf('\nfunction ',start+1);
const test=vm.createContext({COUNTRY_CODE:{Italien:'it',Spanien:'es'},VISUAL_IMG:Object.fromEntries(Object.keys(pack.images).map(n=>[n,pack.images[n].card]))});vm.runInContext(funcs+'\n'+html.slice(start,end),test);
assert.equal(vm.runInContext("questionSubject('Orcas gehören zur Familie der Delfine.')",test),'Orcas');assert.equal(vm.runInContext("questionSubject('Eine gebleichte Koralle ist immer bereits tot.')",test),'Koralle');
assert.equal(vm.runInContext("moreLessPrompt('Italien (UNESCO-Welterbe)','Spanien (UNESCO-Welterbe)','Anzahl Welterbestätten')",test),'Wer hat mehr UNESCO-Welterbestätten: Italien oder Spanien?');
assert.match(vm.runInContext("moreLessPrompt('A','B','Tempo-Wertung · EA SPORTS FC 26 · Basiskarte')",test),/Tempo-Wertung/);assert.match(vm.runInContext("moreLessPrompt('A','B','Sekunden · 0–100 km\/h laut Hersteller')",test),/mehr Sekunden/);
console.log('OK: distinct subjects, sourced FC26/car measures, unequal values, no mirrored duplicates, correct prompts');

assert.equal(vm.runInContext("questionSubject('Wie groß ist der Erddurchmesser am Äquator?')",test),'Erde');
assert.equal(vm.runInContext("questionSubject('Wie viele Tasten hat ein Standard-Klavier?')",test),'Tasten Klavier');
assert.equal(vm.runInContext("questionSubject('Wie viele Felder hat ein Schachbrett?')",test),'Felder Schachbrett');


assert.equal(pack.moreless.length,691);assert.equal(pack.estimate.length,213);
for(const q of pack.estimate){assert(pack.images[q.subject]);assert(q.source.startsWith('https://'));assert(['2026-10-01','2026-10-03','2026-10-04'].includes(q.verified));assert(!/Tragzeit/.test(q.q));}
for(const [cat,count] of Object.entries({'Länder':6,'Städte':6,'Natur':57,'Sport':17,'Bauwerke':6,'Tierwelt':6,'Weltraum':206,'Wissenschaft':213,'Allgemeinwissen':4,'Rekorde & Extreme':6,'Raumfahrt':58,'Weltkultur':30}))assert.equal(groups[cat].length,count);
for(const unit of ['Jahr · Geburtsjahr','Jahr · Gründungsjahr','Jahr · Startjahr','Jahr · Erstes UNESCO-Welterbe-Einschreibungsjahr','Jahr · Jahr der offiziellen Eröffnung'])assert.match(test.moreLessPrompt('A','B',unit),/später/);
assert.match(test.moreLessPrompt('A','B','Monate ungefähr · Tragzeit als grober Richtwert'),/grober Richtwert/);
console.log('OK: 680 net new research comparisons, 213 sourced estimates, every subject illustrated, year semantics correct');

const temperatures=pack.moreless.filter(q=>/temperatur/i.test(q.metric));assert.equal(temperatures.length,12);assert(temperatures.every(q=>q.lv<0&&q.rv<0||q.metric==='Mittlere Oberflächentemperatur'));
assert(!pack.moreless.some(q=>[q.l,q.r].includes('Erde')&&[q.l,q.r].includes('Venus')&&q.metric==='Umlaufdauer um die Sonne'));
assert(!pack.moreless.some(q=>[q.l,q.r].includes('Fußball')&&[q.l,q.r].includes('Feldhockey')));
for(const [name,value] of [['Erde',149.6],['Neptun',4515]]){const rows=pack.estimate.filter(q=>q.subject===name&&q.u==='Millionen km');assert.equal(rows.length,1);assert.equal(rows[0].a,value);}
assert(!html.includes("a:149.7,u:'Mio. km'"));assert(!html.includes("a:4.5,u:'Mrd. km'"));
assert.match(test.moreLessPrompt('A','B','Millionen km · mittlere Sonnenentfernung'),/mittlere Entfernung/);
assert.match(test.moreLessPrompt('A','B','°C · Mittlere Atmosphärentemperatur bei 1 bar ungefähr'),/1 bar/);
for(const image of Object.values(pack.images))assert(fs.existsSync('assets/visuals/'+image.detail));
console.log('OK: expanded groups, surface/atmosphere split, equal-value exclusion, legacy duplicate exclusion and sourced distance replacements');

for(const name of ['parseGameNumber','parseEstimateInput']){const start=html.indexOf('function '+name+'('),end=html.indexOf('\nfunction ',start+1);vm.runInContext(html.slice(start,end),test);}
assert.equal(test.parseEstimateInput('-140',{u:'°C'}),-140);assert.equal(test.parseEstimateInput('-195 °C',{u:'°C'}),-195);assert.equal(test.parseEstimateInput('1,5 Milliarden km',{u:'Millionen km'}),1500);
console.log('OK: signed temperature guesses and magnitude conversion parse correctly');
