import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('content/approved.js','utf8'),ctx);
const pack=ctx.window.GAME_CONTENT_PACK,tag='small-categories-20261006';
const rows=pack.moreless.filter(q=>q.release===tag);
assert.equal(rows.length,120);assert.equal(pack.estimate.filter(q=>q.release===tag).length,40);
for(const [cat,n] of Object.entries({'Allgemeinwissen':81,'Länder':21,'Städte':15,'Tierwelt':3}))assert.equal(rows.filter(q=>q.cat===cat).length,n);
const keys=new Set();for(const q of pack.moreless){const key=[q.cat,q.metric,...[q.l,q.r].sort()].join('|');assert(!keys.has(key));keys.add(key);assert.notEqual(q.lv,q.rv)}
for(const q of rows){assert(q.verified==='2026-10-06');assert(q.sources.every(s=>s.startsWith('https://')));assert(pack.images[q.l]&&pack.images[q.r]);assert.equal(q.data_years.length,2)}
const facts=pack.facts.filter(q=>q.release===tag);assert.equal(facts.length,8);assert.equal(facts.filter(q=>q.a).length,4);
const clues=pack.jeopardy.filter(q=>q.release===tag);assert.equal(clues.length,8);assert(clues.every(q=>!q.subject));
for(const file of fs.readdirSync('assets/visuals/small-categories')){const s=fs.readFileSync('assets/visuals/small-categories/'+file,'utf8');assert(s.includes(file.includes('-card')?'viewBox="0 0 720 540"':'viewBox="0 0 960 540"'));assert(!/\b(?:1973|1981|1995|1896|1936|1952|1956)\b/.test(s))}
const css=fs.readFileSync('assets/cosmetics.css','utf8');assert(/\[data-frame\]\.cosmeticAvatar,\[data-frame\]\.profileAvatar,\[data-frame\]\.dailyPodiumAvatar\{position:relative;/.test(css));
console.log('OK: 120 unequal sourced comparisons, 40 estimates, balanced facts, neutral graphics and avatar ornament anchor');
