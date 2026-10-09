/* Optional solo preference. Does not alter database-owned online question banks. */
(function(){
 const pack=window.GAME_COMPARISON_EXTENSION;if(!pack)return;
 const key=q=>JSON.stringify([q.u,...[q.l,q.r].sort()]),seen=new Set(SOLO_Q.map(key));
 for(const q of pack.moreless)if(!seen.has(key(q))){SOLO_Q.push(q);seen.add(key(q))}
 const catalogue=window.GAME_CONTENT_PACK?.moreless;if(catalogue){const catalogued=new Set(catalogue.map(key));for(const q of pack.moreless)if(!catalogued.has(key(q))){catalogue.push(q);catalogued.add(key(q))}}
 const prompts=new Map(pack.moreless.filter(q=>q.prompt).map(q=>[q.u,q.prompt]));if(typeof moreLessPrompt==='function'){const basePrompt=moreLessPrompt;moreLessPrompt=function(left,right,unit,metric=''){return prompts.get(unit)||basePrompt(left,right,unit,metric)}}
 for(const [subject,image]of Object.entries(pack.images)){VISUAL_IMG[subject]=image.card;VISUAL_DETAIL[subject]=image.detail}
 if(window.GAME_CONTENT_PACK?.images)Object.assign(window.GAME_CONTENT_PACK.images,pack.images);
 let preferred='';try{preferred=localStorage.getItem('ml_preferred_criterion_v1')||''}catch{}
 const baseFilter=contentFilterPool;contentFilterPool=function(game,pool){const usable=typeof S!=='undefined'&&S.room?pool.filter(q=>!q.frontend_only):pool;return baseFilter(game,usable)};
 const baseSelect=selectComparisonQuestions;selectComparisonQuestions=function(pool,count,...args){
  if(!preferred||!count||typeof S!=='undefined'&&S.room)return baseSelect(pool,count,...args);
  const matching=pool.filter(q=>q.u===preferred);if(!matching.length)return baseSelect(pool,count,...args);
  const first=baseSelect(matching,1,...args)[0];if(!first)return baseSelect(pool,count,...args);
  return [first,...baseSelect(pool.filter(q=>key(q)!==key(first)),Math.max(0,count-1),...args)];
 };
 const baseRefresh=refreshContentSets;refreshContentSets=function(...args){const result=baseRefresh.apply(this,args);render();return result};
 function render(){const host=document.getElementById('contentSetPicker');if(!host||GAME_WORLD!=='moreless')return;host.querySelector('.comparisonCriterionPicker')?.remove();
  const box=document.createElement('div');box.className='comparisonCriterionPicker';const label=document.createElement('label'),select=document.createElement('select'),note=document.createElement('p');label.textContent='Bevorzugtes Vergleichskriterium (Solo)';select.setAttribute('aria-label','Bevorzugtes Vergleichskriterium');
  const rows=contentFilterPool('moreless',SOLO_Q),counts=new Map();for(const q of rows)counts.set(q.u,(counts.get(q.u)||0)+1);
  const options=[['','Alle Kriterien'],...[...counts].sort(([a],[b])=>a.localeCompare(b,'de')).map(([unit,n])=>[unit,unit+' · '+n+' Vergleiche'])];for(const [value,text]of options){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option)}
  select.value=counts.has(preferred)?preferred:'';select.disabled=!!S.room;select.onchange=()=>{preferred=select.value;try{localStorage.setItem('ml_preferred_criterion_v1',preferred)}catch{};updateNote()};
  function updateNote(){note.textContent=S.room?'Online nutzt den bestehenden Server-Katalog. Neue Kriterien sind hier noch nicht verfügbar.':'Ein frischer Vergleich des gewählten Kriteriums wird bevorzugt; die Runde wird mit anderen frischen Kriterien vervollständigt. Keine Wiederholung zum Auffüllen.'}
  updateNote();label.append(select);box.append(label,note);host.append(box);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();
