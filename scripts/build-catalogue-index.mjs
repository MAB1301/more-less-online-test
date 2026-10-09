import fs from 'node:fs';import vm from 'node:vm';
const context=vm.createContext({window:{}});vm.runInContext(fs.readFileSync('content/approved.js','utf8'),context);vm.runInContext(fs.readFileSync('assets/content-registry.js','utf8'),context);
const rows=vm.runInContext(`Object.entries(window.GAME_CONTENT_PACK).filter(([game])=>game!=='images').flatMap(([game,pool])=>registerContent(game,pool).map(q=>({id:q.content_id,game,payload:q})))`,context);
const images=vm.runInContext('window.GAME_CONTENT_PACK.images',context);
fs.writeFileSync('content/catalogue-index.json',JSON.stringify({version:1,rows,images})+'\n');console.log(rows.length+' editable reviewed questions indexed');
