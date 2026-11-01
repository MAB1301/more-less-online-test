import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const dir = new URL('content/research/2026-11-01-planetenphysik/', root);
const input = JSON.parse(fs.readFileSync(new URL('input.json', dir)));
const pack = JSON.parse(fs.readFileSync(new URL('draft-pack.json', dir)));
const daily = JSON.parse(fs.readFileSync(new URL('daily-catalogue-check.json', dir)));
const context = {window:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL('content/approved.js', root), 'utf8'), context);
const main = context.window.GAME_CONTENT_PACK;
const games = ['moreless','estimate','facts','jeopardy'];
assert.deepEqual(games.map(g => pack[g].length), [2,4,6,8]);
assert.equal(new Set(input.questions.map(q => q.id)).size, 20);
assert.equal(new Set(input.questions.map(q => q.semantic_key)).size, 20);
assert.equal(new Set(input.questions.flatMap(q => q.observation_keys)).size, 22);
for (const level of ['easy','medium','hard']) assert.deepEqual(pack.facts.filter(q=>q.difficulty===level).map(q=>q.a).sort(), [false,true]);
for (const q of pack.moreless) {
  assert.notEqual(q.lv, q.rv);
  assert(q.metric && q.u && q.notes.includes('Gleiche'));
  const reverse = pack.moreless.find(x => x !== q && x.l === q.r && x.r === q.l && x.metric === q.metric);
  assert.equal(reverse, undefined);
}
const mainText = games.flatMap(g=>main[g]).map(q=>JSON.stringify(q).toLowerCase()).join('\n');
for (const q of input.questions) {
  assert(!mainText.includes(q.semantic_key.toLowerCase()), `Main semantic collision: ${q.id}`);
  assert(q.source_refs.length && q.rounding && q.notes && q.data_year);
}
assert.equal(daily.database_writes, 0);
assert.equal(daily.catalogue_total, 7187);
assert(daily.targeted_terms.every(x => x.matches === 0));
for (const name of ['card','detail']) {
  const svg = fs.readFileSync(new URL(`visuals/planetenphysik-neutral-${name}.svg`, dir), 'utf8');
  const expected = name === 'card' ? 'width="720" height="540"' : 'width="960" height="540"';
  assert(svg.includes(expected));
  assert(svg.includes('x="40" y="40"'));
  assert(!/<text\b|Merkur|Venus|Erde|Mars|Jupiter|Saturn|Uranus|Neptun/.test(svg));
}
console.log('Planetenphysik draft: content, duplicate, fact-balance, image and import checks passed');
