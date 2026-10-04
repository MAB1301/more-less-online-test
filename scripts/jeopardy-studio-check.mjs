import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const html=fs.readFileSync('index.html','utf8'),ctx={window:{}};
vm.runInNewContext(fs.readFileSync('content/approved.js','utf8'),ctx);
vm.runInNewContext(fs.readFileSync('assets/jeopardy/categories.js','utf8'),ctx);
const images=ctx.window.JEOP_CATEGORY_IMAGES;
const clues=ctx.window.GAME_CONTENT_PACK.jeopardy;
assert.equal(clues.filter(q=>q.cat==='Videospiele').length,30);
assert(clues.filter(q=>q.cat==='Transfers').length>=40);
assert(!clues.some(q=>['Transfers 2025','Transfers 2026','FC 27-Werte'].includes(q.cat)));
for(const edition of ['FIFA 19','FIFA 20','FIFA 21','FIFA 22','FIFA 23','FC 24','FC 25','FC 26','FC 27'])assert(clues.some(q=>q.cat==='FIFA-Ratings'&&q.q.includes(edition)),edition+' missing');
const game=vm.createContext({window:{GAME_CONTENT_PACK:ctx.window.GAME_CONTENT_PACK},VISUAL_IMG:{},VISUAL_DETAIL:{},GENERATED_SUBJECTS:new Set(),SOLO_Q:[],ESTIMATE_Q:[],FACT_Q:[],knowledgeJeopardyQuestions:()=>[],localStorage:{getItem:()=>null,setItem:()=>{}},S:{room:null},JEOP:{mode:'standard'}});
vm.runInContext(html.slice(html.indexOf('const JEOP_CATS='),html.indexOf('let JEOP=')),game);
const merge=html.indexOf('(function mergeReviewedContent(){');vm.runInContext(html.slice(merge,html.indexOf('})();',merge)+5),game);
vm.runInContext(html.slice(html.indexOf('const JEOP_HISTORY_KEY='),html.indexOf('let JEOP_SYNC_REV=')),game);
const cats=vm.runInContext('JEOP_CATS.map(c=>c[0])',game);
assert.equal(Object.keys(images).length,cats.length);assert.equal(new Set(Object.values(images)).size,cats.length,'Each category requires a distinct image');
for(const name of cats){assert(images[name],name+' missing image');const bytes=fs.readFileSync('assets/jeopardy/categories/'+images[name]);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');assert(bytes.length<200000,'Keep banners compact')}
for(const mode of ['standard','big','football','random','nerd','sport','geo','party']){game.JEOP.mode=mode;game.buildJeopData();assert.equal(game.JEOP.data.length,6);for(const [name,questions] of game.JEOP.data){assert(images[name],mode+' has unmapped category');assert.equal(questions.length,5)}assert.equal(game.JEOP.step,mode==='big'?200:100)}
for(const path of ['index.html','offline/index.html']){const page=fs.readFileSync(path,'utf8');assert.match(page,/jeopardy\/categories.js\?v=20261004-studio/);assert.match(page,/jeopardy-polish.js\?v=20261004-backgrounds/)}
console.log('OK: all 26 categories have distinct optimized WebP assets; every board mode resolves category imagery and retains its points and questions; online/offline load the same presentation');

const backgrounds=fs.readFileSync('assets/game-backgrounds.css','utf8');for(const name of ['menu','jeopardy','estimate','facts']){const bytes=fs.readFileSync('assets/backgrounds/'+name+'-20261004.webp');assert.equal(bytes.toString('ascii',0,4),'RIFF');assert(bytes.length<150000);assert(backgrounds.includes(name+'-20261004.webp'))}assert.match(backgrounds,/html:not\(\.dataSaving\)/);assert.match(backgrounds,/html.dataSaving #jeopQuestion/);for(const name of ['index.html','offline/index.html'])assert(fs.readFileSync(name,'utf8').indexOf('ml_comfort_v1')<fs.readFileSync(name,'utf8').indexOf('<style>'),'Apply data-saving before style parsing');
