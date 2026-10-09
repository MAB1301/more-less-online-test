import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';
const dir='content/research/2026-10-09-playable-criteria/',input=JSON.parse(fs.readFileSync(dir+'input.json')),sources=JSON.parse(fs.readFileSync(dir+'sources.json')),ctx={window:{}};
vm.runInNewContext(fs.readFileSync('content/approved.js','utf8'),ctx);
const key=q=>JSON.stringify([q.u,...[q.l,q.r].sort()]),seen=new Set(ctx.window.GAME_CONTENT_PACK.moreless.map(key)),ids=new Set();
const pack={moreless:[],images:{}};
for(const q of input.moreless){assert(!seen.has(key(q)));seen.add(key(q));assert(!ids.has(q.id));ids.add(q.id);assert(q.lv!==q.rv&&Number.isFinite(q.lv)&&Number.isFinite(q.rv)&&q.metric&&q.notes);assert(q.source_refs.every(ref=>sources[ref]?.verified===q.verified));
 const urls=q.source_refs.map(ref=>sources[ref].url);const row={...q,source:urls[0],sources:urls,sub:q.metric,frontend_only:true,release:'playable-criteria-20261009',sets:['Neue Vergleichskriterien'],status:'review-ready'};pack.moreless.push(row);
 for(const subject of [q.l,q.r])pack.images[subject]={card:'criteria/'+q.illustration+'-card.svg',detail:'criteria/'+q.illustration+'-detail.svg',license:'CC0-1.0',description:'Antwortneutrale Themenillustration, keine maßstäbliche Darstellung des Objekts.'};
}
assert.equal(pack.moreless.length,4);for(const image of Object.values(pack.images))for(const kind of ['card','detail'])assert(fs.existsSync('assets/visuals/'+image[kind]));
const output='window.GAME_COMPARISON_EXTENSION='+JSON.stringify(pack)+';\n';const path='assets/comparison-extension-data.js';if(process.argv.includes('--check'))assert.equal(fs.readFileSync(path,'utf8'),output);else fs.writeFileSync(path,output);
console.log('PASS: four sourced playable comparison criteria, unordered uniqueness, source dates and all card/detail paths');
