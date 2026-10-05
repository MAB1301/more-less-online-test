import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dest=path.join(root,'dist-web');
const result=spawnSync('python3',['scripts/build-asset-manifest.py'],{cwd:root,encoding:'utf8'});if(result.status!==0)throw Error(result.stderr);process.stdout.write(result.stdout);
await fs.rm(dest,{recursive:true,force:true});await fs.mkdir(dest);
for(const name of ['index.html','offline/index.html','service-worker.js','pwa-asset-manifest.js']){await fs.mkdir(path.dirname(path.join(dest,name)),{recursive:true});await fs.copyFile(path.join(root,name),path.join(dest,name))}
await fs.cp(path.join(root,'assets'),path.join(dest,'assets'),{recursive:true});await fs.mkdir(path.join(dest,'content'));
for(const name of ['approved.js','catalogue.json','trivia.json','review-schedule.json'])await fs.copyFile(path.join(root,'content',name),path.join(dest,'content',name));
console.log('Publish the contents of dist-web over HTTPS. No Apple membership is needed.');
