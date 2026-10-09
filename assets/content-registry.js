/* Stable content identities, shared metadata and reviewed editorial overlays. */
const CONTENT_REGISTRY={version:1,rows:new Map(),publication:0,ready:null};
function contentNormal(text){return String(text||'').normalize('NFKC').toLocaleLowerCase('de').replace(/\s+/g,' ').trim()}
function contentHash(text){let a=2166136261,b=5381;for(const c of text){a=Math.imul(a^c.charCodeAt(0),16777619);b=Math.imul(b,33)^c.charCodeAt(0)}return (a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0')}
function contentFactKey(game,q){
 if(q.fact_id)return q.fact_id;
 if(game==='moreless')return JSON.stringify([contentNormal(q.metric||q.u),contentNormal(q.u),...[q.l,q.r].map(contentNormal).sort()]);
 if(game==='estimate'){
  if(/lichtgeschwindigkeit|licht im vakuum/i.test(q.q)&&q.u==='m/s')return 'physics:light-speed-vacuum:m/s';
  return JSON.stringify([contentNormal(q.subject||q.q),contentNormal(q.metric||q.q),contentNormal(q.u)]);
 }
 return contentNormal(q.q||q.s);
}
function contentIdentity(game,q){if(q.content_id)return q.content_id;return game+':'+contentHash(contentFactKey(game,q))}
function registerContent(game,pool){const unique=new Map();for(const q of pool){const id=contentIdentity(game,q);q.content_id=id;q.content_version=CONTENT_REGISTRY.version;if(!unique.has(id)||q.verified&&!unique.get(id).verified)unique.set(id,q)}for(const [id,q] of unique)CONTENT_REGISTRY.rows.set(id,{id,game,payload:q});return [...unique.values()]}
function refreshContentRegistry(){CONTENT_REGISTRY.rows.clear();for(const [game,pool] of [['moreless',SOLO_Q],['estimate',ESTIMATE_Q],['facts',FACT_Q]])pool.splice(0,pool.length,...registerContent(game,pool));for(const [cat,pool] of JEOP_CATS){const rows=pool.map(q=>({q:q[0],a:q[1],difficulty:q[2],subject:q[3],cat}));const approved=window.GAME_CONTENT_PACK?.jeopardy||[];for(const q of rows){const meta=approved.find(x=>x.q===q.q);if(meta)Object.assign(q,meta)}const clean=registerContent('jeopardy',rows);pool.splice(0,pool.length,...clean.map(q=>[q.q,q.a,q.difficulty,q.subject,q.content_id]))}}
function contentAsOf(q){if(!q)return '';const time=q.time_dependent||/bestätigte monde|welterbestätten|rating|rekord|einwohner|bevölker/i.test(q.q||q.s||q.metric||q.u||'');return time&&(q.as_of||q.verified)?(q.as_of?'Datenstand: '+q.as_of:'Quellenprüfung: '+q.verified):''}
function contentImageIssues(name,image){const issues=[];if(!image?.card)issues.push('Bild fehlt');if(!image?.source||!image?.license)issues.push('Bildnachweis unvollständig');if(image?.generated)issues.push('Illustration');if(!image?.detail)issues.push('Fragezuschnitt fehlt');if(/\.svg(?:\?|$)/.test(image?.card||''))issues.push('Beschriftungen auf Antwort-Hinweise prüfen');return issues}
function contentAppendSource(id,q){const box=el(id);if(!box||!q)return;box.querySelector('.contentEvidence')?.remove();if(!q.source&&!contentAsOf(q))return;const p=document.createElement('p');p.className='contentEvidence';p.textContent=contentAsOf(q);if(/^https:\/\//.test(q.source||'')){const a=document.createElement('a');a.href=q.source;a.rel='noopener noreferrer';a.target='_blank';a.textContent=' Quelle ansehen ↗';p.append(a)}box.append(p)}
function applyContentPublication(data){
 if(!data?.revision||!Array.isArray(data.entries))return;
 CONTENT_REGISTRY.publication=data.revision;
 for(const entry of data.entries){let old=CONTENT_REGISTRY.rows.get(entry.id);if(old&&old.game!==entry.game)continue;const q={...(old?.payload||{}),...entry.payload,content_id:entry.id};if(!old){old={id:entry.id,game:entry.game,payload:q};CONTENT_REGISTRY.rows.set(entry.id,old)}old.payload=q;old.disabled=entry.disabled;if(q.content_image&&/^https:\/\//.test(q.content_image.url)){VISUAL_IMG[q.content_image.subject]=q.content_image.url;VISUAL_DETAIL[q.content_image.subject]=q.content_image.url;}const pack=window.GAME_CONTENT_PACK?.[entry.game];if(pack){const pi=pack.findIndex(x=>x.content_id===entry.id);if(pi>=0){if(entry.disabled)pack.splice(pi,1);else pack[pi]=q}else if(!entry.disabled)pack.push(q)}
  if(entry.game==='jeopardy'){let found=false;for(const [cat,pool] of JEOP_CATS){const i=pool.findIndex(x=>x[4]===entry.id);if(i<0)continue;found=true;if(entry.disabled)pool.splice(i,1);else if(!entry.disabled)pool[i]=[q.q,q.a,q.difficulty,q.subject,entry.id];}if(!found&&!entry.disabled){const cat=JEOP_CATS.find(x=>x[0]===q.cat);if(cat)cat[1].push([q.q,q.a,q.difficulty,q.subject,entry.id]);else JEOP_CATS.push([q.cat,[[q.q,q.a,q.difficulty,q.subject,entry.id]]])}}
  else{const pool={moreless:SOLO_Q,estimate:ESTIMATE_Q,facts:FACT_Q}[entry.game],i=pool.findIndex(x=>x.content_id===entry.id);if(i>=0){if(entry.disabled)pool.splice(i,1);else pool[i]=q}else if(!entry.disabled)pool.push(q)}
 }
}
async function loadContentPublication(){
 let timer;try{applyContentPublication(JSON.parse(localStorage.getItem('ml_content_publication_v1')||'null'))}catch{}
 try{const request=(async()=>{await window.accountReady;if(!window.gameAccount)return null;await window.gameAccount.guest();return window.gameAccount.authorized('/rest/v1/rpc/ml_content_published',{})})();const data=await Promise.race([request,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('content offline')),2500)})]);if(data){applyContentPublication(data);try{localStorage.setItem('ml_content_publication_v1',JSON.stringify(data))}catch{}}}catch{}finally{clearTimeout(timer)}
}

function visualAssetURL(path){return /^https:\/\//.test(path||'')?path:VISUAL_BASE+path}
function initContentRegistry(){refreshContentRegistry();CONTENT_REGISTRY.ready=loadContentPublication();for(const name of ['playSolo','startEstimateSolo','startFactCheck','startJeopardy','createRoom']){const original=window[name];window[name]=async function(...args){await CONTENT_REGISTRY.ready;return original.apply(this,args)}}const estimateRender=renderEstimate;renderEstimate=function(...args){const result=estimateRender.apply(this,args);const q=EST.questions?.[EST.i];contentAppendSource('estimateReveal',q);const stamp=contentAsOf(q);if(stamp)el('estimateQuestion').textContent=q.q+' · '+stamp;return result};const factRender=renderFact;renderFact=function(...args){const result=factRender.apply(this,args),q=FACT.q?.[FACT.i],stamp=contentAsOf(q);if(stamp)el('factStatement').textContent=q.s+' · '+stamp;return result};}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initContentRegistry,{once:true});else initContentRegistry()}
