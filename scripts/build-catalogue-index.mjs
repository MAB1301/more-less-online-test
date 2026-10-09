import fs from 'node:fs';import vm from 'node:vm';
const context=vm.createContext({window:{}});vm.runInContext(fs.readFileSync('content/approved.js','utf8'),context);vm.runInContext(fs.readFileSync('assets/content-registry.js','utf8'),context);
if(fs.existsSync('assets/comparison-extension-data.js')){vm.runInContext(fs.readFileSync('assets/comparison-extension-data.js','utf8'),context);const extension=context.window.GAME_COMPARISON_EXTENSION;context.window.GAME_CONTENT_PACK.moreless.push(...extension.moreless);Object.assign(context.window.GAME_CONTENT_PACK.images,extension.images)}
const rows=vm.runInContext(`Object.entries(window.GAME_CONTENT_PACK).filter(([game])=>game!=='images').flatMap(([game,pool])=>registerContent(game,pool).map(q=>({id:q.content_id,game,payload:q})))`,context);
const images=vm.runInContext('window.GAME_CONTENT_PACK.images',context);
fs.writeFileSync('content/catalogue-index.json',JSON.stringify({version:1,rows,images})+'\n');console.log(rows.length+' editable reviewed questions indexed');
