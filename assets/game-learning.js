/* Device-local introductions and reveal presentation. Game engines own scoring. */
(()=>{
 'use strict';
 const node=id=>document.getElementById(id),titles={moreless:'More / Less',estimate:'Schätzduell',facts:'Fakt oder Fake',quiz:'Jeopardy'};
 const explain=document.createElement('button');explain.type='button';explain.id='gameExplain';explain.textContent='ⓘ';explain.setAttribute('aria-label','Spielprinzip und Modi erklären');explain.setAttribute('aria-haspopup','dialog');explain.onclick=()=>openGameInfo(GAME_WORLD);node('worldMenuTitle').after(explain);
 // Retain engine reveal gating: no solution is read or rendered while answers are open.
 const fmt=(value,unit)=>Number(value).toLocaleString('de-DE',{maximumFractionDigits:2})+(unit?' '+unit:'');
 function estimateScale(guess,truth,unit,absent=false){
  let box=node('estimateComparison');if(!box){box=document.createElement('section');box.id='estimateComparison';box.className='estimateComparison';node('estimateMine').after(box)}box.replaceChildren();
  if(absent||!Number.isFinite(guess)||!Number.isFinite(truth)){const p=document.createElement('p');p.textContent='Kein gewerteter Tipp für diese Frage.';box.append(p);return}
  const max=Math.max(Math.abs(guess),Math.abs(truth),1),low=Math.min(0,guess,truth),high=Math.max(0,guess,truth)+max*.15,position=v=>100*(v-low)/(high-low);
  const delta=Math.abs(guess-truth),p=document.createElement('p');p.textContent='Abweichung: '+(truth===0?fmt(delta,unit)+' absolut (Lösung 0)':(100*delta/Math.abs(truth)).toLocaleString('de-DE',{maximumFractionDigits:1})+' %')+(guess===truth?' · Genau getroffen!':guess<truth?' · zu niedrig':' · zu hoch');
  const labels=document.createElement('p');labels.textContent='Dein Tipp: '+fmt(guess,unit)+' · Lösung: '+fmt(truth,unit);
  const track=document.createElement('div');track.className='estimateScaleTrack';track.setAttribute('aria-hidden','true');for(const [v,kind] of [[guess,'guess'],[truth,'truth']]){const marker=document.createElement('span');marker.className='estimateMarker '+kind;marker.style.left=position(v)+'%';marker.textContent=kind==='guess'?'▼':'◆';track.append(marker)}
  const legend=document.createElement('small');legend.textContent='▼ Dein Tipp · ◆ Lösung · Skala '+fmt(low,unit)+' bis '+fmt(high,unit);box.append(p,labels,track,legend);
 }
 const submit=submitEstimate;submitEstimate=function(timeout=false){const x=EST.questions?.[EST.i],guess=!EST.online&&x?parseEstimateInput(node('estimateValue').value,x,EST.inputScale||1):NaN;const result=submit.apply(this,arguments);if(!EST.online&&x&&!node('estimateReveal').classList.contains('hide'))estimateScale(guess,Number(x.a),x.u,!!timeout);return result};
 const onlineEstimate=renderEstimateOnline;renderEstimateOnline=function(state){const result=onlineEstimate.apply(this,arguments);if(state.phase!=='open'&&state.result){const mine=state.result.answers?.find(a=>a.user_id===S.uid);if(mine)estimateScale(Number(mine.guess),Number(state.result.truth),state.question.u,mine.timeout||mine.neutral)}return result};
 function comparison(left,right,lv,rv,unit){if(!Number.isFinite(Number(lv))||!Number.isFinite(Number(rv)))return;let box=node('comparisonExplanation');if(!box){box=document.createElement('p');box.id='comparisonExplanation';node('reveal').append(box)}box.textContent=left+': '+fmt(lv,unit)+' · '+right+': '+fmt(rv,unit)+'. '+(Number(lv)===Number(rv)?'Beide Werte sind gleich.':(Number(lv)>Number(rv)?left:right)+' liegt um '+fmt(Math.abs(lv-rv),unit)+' höher.');}
 const pick=soloPick;soloPick=function(){const x=SOLO.questions?.[SOLO.i],locked=SOLO.locked;const result=pick.apply(this,arguments);if(x&&!locked&&SOLO.locked)comparison(x.l,x.r,x.lv,x.rv,x.u);return result};
 const reveal=showReveal;showReveal=function(z){const result=reveal.apply(this,arguments),q=S.questionData?.[S.q];if(q)comparison(q.left_name,q.right_name,z.left_value??q.left_value,z.right_value,z.unit??q.unit);return result};
 // Fact/Fake already ships sourced explanations. Give the correction a clear heading.
 const factAnswer=answerFact;answerFact=function(v){const result=factAnswer.apply(this,arguments);if(!FACT.online&&FACT.locked){const q=FACT.q?.[FACT.i],p=node('factReveal').querySelector('p');if(q&&p)p.textContent=(q.a?'Warum das stimmt: ':'Richtig ist: ')+q.e}return result};
 const factRender=renderFactOnline;renderFactOnline=function(state){const result=factRender.apply(this,arguments);if(FACT_ONLINE.state===state&&state.phase!=='open'&&state.result){const p=node('factReveal').querySelector('p');if(p)p.textContent=(state.result.answer?'Warum das stimmt: ':'Richtig ist: ')+state.result.explanation}return result};
 const end=showLocalEnd;showLocalEnd=function(g){const result=end.apply(this,arguments);node('localEndReplay').textContent=S.room?(S.host?'Revanche · gleiche Lobby →':'Zur Lobby · Host startet Revanche →'):'Revanche · gleiche Einstellungen →';return result};
 // The active buzzer team is engine state, never inferred from the leading score.
 const teamNodes=[...document.querySelectorAll('#jeopGame .jeopTeams .jeopTeam')],notice=document.createElement('p');notice.id='jeopActiveNotice';notice.className='jeopActiveNotice';notice.setAttribute('role','status');node('jeopQuestion').querySelector('.jeopQBox').prepend(notice);
 function activeTeam(){const active=node('jeopQuestion').classList.contains('on')&&[0,1].includes(JEOP.active)?JEOP.active:null;teamNodes.forEach((n,i)=>{if(n.classList.contains('learningActive')!==(active===i))n.classList.toggle('learningActive',active===i)});const text=active===null?'Noch kein Team am Zug · zuerst buzzern':'Am Zug: '+node(active===0?'jeopNameA':'jeopNameB').textContent;if(notice.textContent!==text)notice.textContent=text;}
 new MutationObserver(activeTeam).observe(node('jeopQuestion'),{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});activeTeam();
})();
