import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context={window:{},console};vm.createContext(context);
vm.runInContext(fs.readFileSync('assets/content-categories.js','utf8'),context);
vm.runInContext(fs.readFileSync('content/approved.js','utf8'),context);
const pack=context.window.GAME_CONTENT_PACK;
for(const kind of ['moreless','estimate','facts','jeopardy'])for(const q of pack[kind]){
 assert(!['Fußballer','FIFA-Ratings'].includes(q.cat));
 if(q.cat==='Fußball'||q.cat==='Fußballlegenden')assert(!/EA SPORTS FC|FIFA\s*\d\d|Basiskarte|ea\.com\/games/.test(JSON.stringify(q)));
 if(q.expansion===9){assert(q.source.startsWith('https://'));assert.equal(q.verified,'2026-10-05');}
}
for(const cat of ['Kultur','Star Wars','Videospiele','Fußballlegenden']){
 const clues=pack.jeopardy.filter(q=>q.cat===cat&&q.question_type==='identity');
 assert(clues.length>=5,cat);for(const q of clues){assert(q.q.startsWith('Wer ist das?'));assert(!q.subject,'No answer-revealing subject or portrait');}
}
for(const cat of ['Fußball','Videospiele'])for(const kind of ['moreless','estimate'])assert(pack[kind].filter(q=>q.cat===cat&&q.expansion===9).length>=5);
const gamingNames=new Set(pack.jeopardy.filter(q=>q.cat==='Videospiele'&&q.expansion===9).map(q=>q.a));
for(const name of ['Creeper','Enderman','Ghost','Sledge','Link','Pikachu','Mario'])assert(gamingNames.has(name));
const html=fs.readFileSync('index.html','utf8');
// Parse every inline classic script to catch syntax errors after HTML integration.
for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g))if(!/type="(?:module|application\/)/.test(match[1]))new vm.Script(match[2]);
const declaration=html.slice(html.indexOf('const JEOP_CATS='),html.indexOf('\nlet JEOP'));
context.knowledgeJeopardyQuestions=()=>[];
vm.runInContext(declaration,context);
const merge=html.slice(html.indexOf('(function mergeReviewedContent(){'),html.indexOf('const FACT_LEVEL_NAMES='));
vm.runInContext('const SOLO_Q=[],ESTIMATE_Q=[],FACT_Q=[],VISUAL_IMG={},VISUAL_DETAIL={},GENERATED_SUBJECTS=new Set();'+merge,context);
const rows=vm.runInContext('JEOP_CATS',context);
assert.equal(new Set(rows.map(q=>q[0])).size,rows.length);
for(const cat of ['Fußball','Fußballlegenden','Vereinsstationen','Transfers','Champions League','Sportregeln']){
 const row=rows.find(q=>q[0]===cat);assert(row&&row[1].length>=5,cat);assert(!/FIFA\s*\d\d|EA SPORTS FC|Basiskarte/.test(JSON.stringify(row)));
}
vm.runInContext(fs.readFileSync('assets/content-sets.js','utf8'),context);
assert(vm.runInContext("contentMatches({cat:'Fußball'},{cat:'Fußballer',sub:'all',set:'all'})",context));
assert(vm.runInContext("contentMatches({cat:'Videospiele'},{cat:'FIFA-Ratings',sub:'all',set:'all'})",context));
assert(vm.runInContext("normalizeContentQuestion({cat:'Fußballer',u:'Tempo · EA SPORTS FC 26'}).cat==='Videospiele'",context));
assert(vm.runInContext("normalizeContentQuestion({cat:'Länder',u:'FIFA-Ranking'}).cat==='Länder'",context));
const criteria=JSON.parse(fs.readFileSync('content/criteria.json','utf8'));assert(criteria.Fußball.includes('Champions-League-Assists'));
const counts=Object.fromEntries(['moreless','estimate','jeopardy'].map(k=>[k,pack[k].filter(q=>q.expansion===9).length]));
console.log('Category routing, six football columns, identity clues, sources, legacy selections and inline syntax passed.',counts);
