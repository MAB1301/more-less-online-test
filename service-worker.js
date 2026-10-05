/* Immutable public release snapshots. Auth, rooms, RPCs and user data are never cached. */
importScripts('./pwa-asset-manifest.js');
const ROOT=new URL('./',self.location.href),PREFIX='ml-pwa-v1:'+ROOT.href+':',CACHE_NAME=PREFIX+PWA_RELEASE.id,flights=new Map();
function assetPath(url){const u=new URL(url,ROOT);if(u.origin!==ROOT.origin||!u.pathname.startsWith(ROOT.pathname))return null;const path=u.pathname.slice(ROOT.pathname.length)||'index.html';return Object.hasOwn(PWA_FILES,path)?path:null}
function assetKey(path,revision=PWA_FILES[path].hash.slice(0,16)){const key=new URL(path,ROOT);key.searchParams.set('__revision',revision);return key.href}
async function cachedAsset(path,revision=PWA_FILES[path].hash.slice(0,16)){
 const key=assetKey(path,revision),names=await caches.keys();
 // Reuse unchanged files from earlier releases without a network request.
 for(const name of [CACHE_NAME,...names.filter(n=>n.startsWith(PREFIX)&&n!==CACHE_NAME).reverse()]){const cache=await caches.open(name),hit=await cache.match(key);if(hit)return hit}
 return null;
}
async function loadAsset(path){
 const key=assetKey(path);if(flights.has(key))return flights.get(key);
 const flight=(async()=>{const cache=await caches.open(CACHE_NAME),hit=await cache.match(key);if(hit)return hit;
  const previous=await cachedAsset(path);if(previous){await cache.put(key,previous.clone());return previous}
  const url=new URL(path,ROOT);url.searchParams.set('rev',PWA_FILES[path].hash.slice(0,16));
  const response=await fetch(url.href,{cache:'no-store',credentials:'omit'});
  if(!response.ok||response.type==='opaque')throw Error('Datei konnte nicht geladen werden: '+path);
  const digest=await crypto.subtle.digest('SHA-256',await response.clone().arrayBuffer()),hash=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
  if(hash!==PWA_FILES[path].hash)throw Error('Veröffentlichung noch unvollständig: '+path);
  await cache.put(key,response.clone());return response;
 })();flights.set(key,flight);try{return await flight}finally{flights.delete(key)}
}
async function download(paths,onProgress=()=>{}){let index=0,completed=0,failed=0;async function run(){while(index<paths.length){const path=paths[index++];try{await loadAsset(path)}catch{failed++}completed++;onProgress({completed,total:paths.length,failed,done:false,version:PWA_RELEASE.id,bytes:PWA_RELEASE.bytes})}}await Promise.all([run(),run(),run()]);return {completed,total:paths.length,failed,done:true,version:PWA_RELEASE.id,bytes:PWA_RELEASE.bytes}}
async function audit(){const cache=await caches.open(CACHE_NAME);let saved=0;for(const path of Object.keys(PWA_FILES))if(await cache.match(assetKey(path)))saved++;return {completed:saved,total:Object.keys(PWA_FILES).length,failed:0,done:true,ready:saved===Object.keys(PWA_FILES).length,version:PWA_RELEASE.id,bytes:PWA_RELEASE.bytes}}
self.addEventListener('install',event=>event.waitUntil((async()=>{const result=await download(PWA_CORE,data=>{self.clients.matchAll?.({includeUncontrolled:true,type:'window'}).then(clients=>{for(const client of clients)if(client.url.startsWith(ROOT.href))client.postMessage({...data,type:'OFFLINE_INSTALL_PROGRESS'})}).catch(()=>{})});if(result.failed)throw Error('Offline-Startdateien fehlen')})()));
// No skipWaiting: the user can finish the current game before applying an update.
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const previous=(await caches.keys()).filter(name=>name.startsWith(PREFIX)&&name!==CACHE_NAME);
 // Preserve the previous version as well, including assets for another still-open tab.
 for(const name of previous.slice(0,-1))await caches.delete(name);
 await self.clients.claim();
})()));
async function rangeResponse(response,range){const match=/^bytes=(\d*)-(\d*)$/.exec(range||'');if(!match)return response;const bytes=await response.arrayBuffer();
 const length=bytes.byteLength,start=match[1]?Number(match[1]):Math.max(0,length-Number(match[2])),end=match[1]?(match[2]?Math.min(Number(match[2]),length-1):length-1):length-1;
 if(start>=length||start>end)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+length}});
 return new Response(bytes.slice(start,end+1),{status:206,headers:{'Content-Type':response.headers.get('Content-Type')||'application/octet-stream','Content-Range':'bytes '+start+'-'+end+'/'+length,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes'}});
}
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;const path=assetPath(event.request.url);if(!path)return;
 event.respondWith((async()=>{
  const requested=new URL(event.request.url).searchParams.get('rev'),current=PWA_FILES[path].hash.slice(0,16);
  // A tab from an older version may still request explicitly versioned assets.
  let response=requested&&requested!==current?await cachedAsset(path,requested):await loadAsset(path);
  if(!response)return fetch(event.request);
  return event.request.headers.has('range')?rangeResponse(response,event.request.headers.get('range')):response;
 })().catch(()=>new Response('Diese Datei ist noch nicht offline gespeichert. Bitte mit Internet erneut herunterladen.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})));
});
self.addEventListener('message',event=>{
 const port=event.ports?.[0],source=event.source?.url;if(!port||!source)return;const url=new URL(source);if(url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
 event.waitUntil((async()=>{
  try{
   if(event.data?.type==='GAME_STATUS'){port.postMessage(await audit());return}
   if(event.data?.type==='CACHE_GAME'){port.postMessage(await download(Object.keys(PWA_FILES),data=>port.postMessage(data)));return}
   if(event.data?.type==='ACTIVATE_UPDATE'){const state=await audit();if(!state.ready)throw Error('Bitte zuerst das vollständige Update herunterladen.');port.postMessage({...state,activating:true});await self.skipWaiting();return}
  }catch(error){port.postMessage({done:true,error:error.message})}
 })());
});
