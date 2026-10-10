(function(){
'use strict';
const pack=window.FACT_CONNECTIONS_PACK,E=window.FactConnectionsEngine;
if(!pack||!E)return;
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
let dialog,round,criteria=[],opener,drawTimer=null,drawGeneration=0,drawing=false,drawnCategory=null;
const assetBase=new URL('.',document.currentScript?.src||location.href).href;
const MAX_MISTAKES=3;
const categories=[...new Set(pack.subjects.map(s=>s.category))];
const themeImages={'Autos':'autotechnik','Länder':'geografie','Städte':'deutschland','Natur':'nationalparks','Tierwelt':'wissenschaft','Raumfahrt':'raumfahrtmissionen','Weltkultur':'weltkultur','Wissenschaft':'wissenschaft','Weltraum':'weltraum','Bauwerke':'geschichte','Fußballer':'fussball','Videospiele':'videospiele','Sport':'sport'};
const format=c=>c.kind==='name'?c.value:(typeof c.value==='number'?new Intl.NumberFormat('de-DE',{maximumFractionDigits:4,useGrouping:true}).format(c.value):c.value)+(c.unit?' '+c.unit:'');
function button(text,fn,cls){const n=el('button',cls,text);n.type='button';n.addEventListener('click',fn);return n;}
function availableCats(){return categories.filter(c=>E.eligible(pack,c,criteria).length>=4);}
function cancelDraw(){drawGeneration++;clearTimeout(drawTimer);drawTimer=null;drawing=false;drawnCategory=null;if(dialog){dialog.classList.remove('fc-drawing');dialog.querySelector('#fcStart').disabled=false;dialog.querySelector('#fcSkip').classList.add('fc-hidden');}}
function setup(){
 cancelDraw();dialog.dataset.view='setup';round=null;dialog.querySelector('#fcSetup').classList.remove('fc-hidden');dialog.querySelector('#fcPlay').classList.add('fc-hidden');dialog.querySelector('#fcStart').textContent='Kategorie ziehen & starten →';paintSlot('Zufall entscheidet');dialog.querySelector('#fcDrawStatus').textContent='Jede Runde bringt eine zufällige Kategorie.';dialog.scrollTop=0;
}
function paintSlot(value){
 const cats=availableCats(),i=cats.indexOf(value),labels=i<0?['Weltraum',value,'Sport']:[cats[(i+cats.length-1)%cats.length],value,cats[(i+1)%cats.length]];
 dialog.querySelectorAll('.fc-reel b').forEach((n,j)=>n.textContent=labels[j]);
 dialog.querySelectorAll('.fc-reel-art').forEach((n,j)=>{n.replaceChildren();const file=themeImages[labels[j]];if(file){const image=el('img');image.src=assetBase+'jeopardy/categories/'+file+'.webp';image.alt='';n.append(image)}else n.textContent='?';});
}
function finishDraw(){
 if(!drawing||!dialog.open)return;const chosen=drawnCategory;cancelDraw();
 round=E.createRound(pack,chosen,criteria);dialog.dataset.view='play';
 dialog.querySelector('#fcSetup').classList.add('fc-hidden');dialog.querySelector('#fcPlay').classList.remove('fc-hidden');
 dialog.querySelector('#fcRoundCategory').textContent=round.groups[0].category;
 message(round.groups[0].category==='Autos'?'Finde ein Auto-Bild, seinen Namen und zwei Fakten.':'Finde einen Namen und seine drei Fakten.');render();dialog.scrollTop=0;dialog.querySelector('#fcSubmit').focus();
}
function start(){
 if(drawing)return;const cats=availableCats();if(!cats.length)return;
 setup();drawnCategory=E.shuffle(cats)[0];drawing=true;const generation=drawGeneration;
 dialog.querySelector('#fcStart').disabled=true;dialog.querySelector('#fcSkip').classList.remove('fc-hidden');dialog.classList.add('fc-drawing');dialog.querySelector('#fcDrawStatus').textContent='Die Kategorien rollen …';
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||document.documentElement.classList.contains('reduceMotion');let step=0;
 function tick(){if(generation!==drawGeneration||!dialog.open)return;
 if(reduced||step>=12){paintSlot(drawnCategory);dialog.classList.remove('fc-drawing');dialog.querySelector('#fcDrawStatus').textContent='Deine Kategorie: '+drawnCategory;drawTimer=setTimeout(()=>{if(generation===drawGeneration)finishDraw();},reduced?250:650);return;}
 paintSlot(cats[step%cats.length]);step++;drawTimer=setTimeout(tick,65+step*13);
 }tick();
}
function message(text){dialog.querySelector('#fcMessage').textContent=text;}
function reveal(g,level){
 const details=el('details','fc-solved');details.dataset.level=level;
 const summary=el('summary','',g.name+' · '+g.category+' · Quellen');details.append(summary);
 const list=el('ul');g.cards.filter(c=>c.kind==='fact').forEach(c=>{
  const li=el('li','',`${c.label}: ${format(c)}${c.scope?' ('+c.scope+')':''} — `);
  const a=el('a','','Quelle');a.href=c.source;a.target='_blank';a.rel='noopener noreferrer';li.append(a);list.append(li);
 });details.append(list);return details;
}
function nameArt(card){
 const art=window.FACT_CONNECTIONS_VISUALS?.[card.value];if(!art)return null;
 const frame=el('span','fc-art');frame.setAttribute('aria-hidden','true');
 if(art.atlas!==undefined){
  frame.classList.add('fc-portrait');if(/gesamte Marke$/.test(card.value))frame.classList.add('fc-car-art');frame.style.backgroundImage=`url("${art.src}")`;
  const cols=art.columns||4,rows=art.rows||3;frame.style.backgroundSize=`${cols*100}% ${rows*100}%`;
  frame.style.backgroundPosition=`${(art.atlas%cols)*100/(cols-1)}% ${art.offsetY??Math.floor(art.atlas/cols)*100/(rows-1)}%`;
 }else{
  const image=el('img');image.src=art.src;image.alt='';image.decoding='async';
  image.addEventListener('error',()=>frame.remove(),{once:true});frame.append(image);
  if(art.type==='category')frame.classList.add('fc-category-art');
 }
 return frame;
}
function render(){
 const grid=dialog.querySelector('#fcGrid');grid.replaceChildren();
 if(!round.finished){for(const c of round.cards){
  const n=button('',()=>{
   if(round.selected.includes(c.id))round.selected=round.selected.filter(id=>id!==c.id);
   else if(round.selected.length<4)round.selected.push(c.id);
   else {message('Vier Karten sind ausgewählt. Wähle erst eine ab.');return;}
   n.setAttribute('aria-pressed',String(round.selected.includes(c.id)));update();
  },'fc-card');n.dataset.cardId=c.id;n.setAttribute('aria-pressed',String(round.selected.includes(c.id)));
  if(c.kind==='image'){
   n.classList.add('fc-name-card','fc-image-card');n.setAttribute('aria-label','Auto-Bild '+(Math.floor(c.id/4)+1));
   const art=nameArt(c);if(art)n.append(art);n.append(el('small','','Bild'));
  }else if(c.kind==='name'){
   if(round.groups[0].category!=='Autos'){n.classList.add('fc-name-card');const art=nameArt(c);if(art)n.append(art);}
   else n.append(el('small','','Name'));
   n.append(el('b','fc-name',format(c)));
  }else{n.append(el('small','fc-metric',c.label),el('b','fc-value',format(c)));if(c.scope)n.append(el('small','fc-scope',c.scope));}
  grid.append(n);
 }}
 const solved=dialog.querySelector('#fcSolved');solved.replaceChildren();
 (round.finished?round.groups:round.solved.map(id=>round.groups.find(g=>g.id===id))).forEach((g,i)=>solved.append(reveal(g,i)));
 dialog.querySelector('#fcNext').classList.toggle('fc-hidden',!round.finished);update();
}
function update(){
 const remaining=Math.max(0,(round.maxMistakes||MAX_MISTAKES)-round.mistakes);const hud=dialog.querySelector('#fcHud');hud.replaceChildren();hud.append(el('b','',round.solved.length+' / 4 Gruppen gefunden'));const attempts=el('span','fc-attempts');attempts.setAttribute('aria-label',remaining+' von 3 Fehlversuchen übrig');for(let i=0;i<MAX_MISTAKES;i++){const dot=el('span','fc-attempt-dot'+(i<remaining?'':' fc-used'));dot.setAttribute('aria-hidden','true');attempts.append(dot)}attempts.append(el('span','fc-attempt-label',remaining+' '+(remaining===1?'Fehlversuch':'Fehlversuche')+' übrig'));hud.append(attempts);
 dialog.querySelector('#fcSelection').textContent=round.finished?'Runde beendet':round.selected.length===4?'Vier Karten gewählt – bereit zum Prüfen':round.selected.length+' von 4 Karten gewählt';
 dialog.querySelector('#fcSubmit').disabled=round.finished||round.selected.length!==4;
 dialog.querySelector('#fcClear').disabled=round.finished||!round.selected.length;
 dialog.querySelector('#fcShuffle').disabled=round.finished;
}
function submit(){
 const result=E.submit(round);
 const texts={correct:'Richtig zugeordnet!',won:'Alle vier Gruppen gefunden!',wrong:'Diese vier Karten gehören nicht zusammen.',lost:'Keine Fehlversuche mehr übrig. Schau dir die richtigen Gruppen an.',repeat:'Diese Kombination hast du schon versucht. Es wird kein weiterer Fehler gezählt.'};
 const hint=result.near?'Knapp daneben – drei deiner Karten passen zusammen. ':'';message(hint+(result.near&&result.status==='wrong'?'Tausche eine Karte und versuche es noch einmal.':texts[result.status]||'Wähle genau vier Karten.'));dialog.querySelector('#fcMessage').dataset.tone=result.near?'near':['correct','won'].includes(result.status)?'success':result.status==='repeat'?'repeat':'wrong';render();
}
function init(){
 dialog=el('dialog');dialog.id='factConnections';dialog.setAttribute('aria-labelledby','fcTitle');
 const head=el('div','fc-head');const titleWrap=el('div');titleWrap.append(el('div','fc-eyebrow','GAME NIGHT · VERBINDUNGEN'));const title=el('h2','','Fakten zuordnen');title.id='fcTitle';titleWrap.append(title,el('p','fc-subtitle','Vier Karten. Ein Zusammenhang.'));head.append(titleWrap,button('Schließen',()=>dialog.close()));dialog.append(head);
 const settings=el('section','fc-controls');settings.id='fcSetup';
 const layout=el('div','fc-entry-layout');const machine=el('div','fc-slot-machine');machine.append(el('div','fc-eyebrow','EINE RUNDE. EIN ZUFÄLLIGES THEMA.'),el('h3','','Was zieht ihr heute?'),el('p','','Die Kategorie wird für euch gezogen. Danach findet ihr die vier zusammengehörigen Gruppen.'));
 const reels=el('div','fc-reels');reels.setAttribute('aria-hidden','true');for(const [icon,text] of [['✦','Weltraum'],['?','Zufall entscheidet'],['⚽','Sport']]){const reel=el('div','fc-reel');reel.append(el('span','fc-reel-art',icon),el('b','',text));reels.append(reel)}machine.append(reels);const drawStatus=el('p','fc-draw-status','Jede Runde bringt eine zufällige Kategorie.');drawStatus.id='fcDrawStatus';drawStatus.setAttribute('role','status');drawStatus.setAttribute('aria-live','polite');machine.append(drawStatus);const skip=button('Animation überspringen →',finishDraw,'fc-hidden');skip.id='fcSkip';machine.append(skip);layout.append(machine);
 const guide=el('aside','fc-entry-guide');guide.append(el('h3','','So geht’s'));const puzzle=el('div','fc-puzzle');puzzle.setAttribute('aria-hidden','true');for(const icon of ['◇','①','②','③'])puzzle.append(el('span','',icon));guide.append(puzzle);const steps=el('ol');for(const text of ['4 passende Karten wählen','Alle 4 Gruppen finden','3 Fehlversuche frei'])steps.append(el('li','',text));guide.append(steps,el('p','fc-near-note','Knapp daneben? Bei drei passenden Karten bekommst du einen Hinweis.'));const help=el('details','fc-help');help.append(el('summary','','Mehr zur Zuordnung'),el('p','','Autos: ein Bild, der Name und zwei Zahlenfakten. Andere Kategorien: ein Name mit Bild und drei Fakten. Identische Fakten sind austauschbar. Gelöste Gruppen zeigen die Quellen.'));guide.append(help);layout.append(guide);settings.append(layout);
 const footer=el('div','fc-entry-footer');const status=el('p','fc-note','16 Karten · 4 Gruppen · 3 Fehlversuche');status.id='fcAvailability';footer.append(status);const startButton=button('Kategorie ziehen & starten →',start,'fc-primary');startButton.id='fcStart';footer.append(startButton);settings.append(footer);dialog.append(settings);
 const play=el('section','fc-hidden');play.id='fcPlay';const hud=el('div','fc-hud');const cat=el('b');cat.id='fcRoundCategory';const count=el('span');count.id='fcHud';hud.append(cat,button('Zur Übersicht',setup,'fc-adjust'),count);play.append(hud);
 const solved=el('div');solved.id='fcSolved';play.append(solved);const grid=el('div','fc-grid');grid.id='fcGrid';grid.setAttribute('role','group');grid.setAttribute('aria-label','Faktenkarten');play.append(grid);
 const msg=el('div','fc-message');msg.id='fcMessage';msg.setAttribute('role','status');msg.setAttribute('aria-live','polite');play.append(msg);
 const selection=el('div','fc-note');selection.id='fcSelection';play.append(selection);
 const actions=el('div','fc-actions');const shuffle=button('Mischen',()=>{round.cards=E.shuffle(round.cards);render();});shuffle.id='fcShuffle';const clear=button('Abwählen',()=>{round.selected=[];render();});clear.id='fcClear';const send=button('Gruppe prüfen',submit,'fc-primary');send.id='fcSubmit';actions.append(shuffle,clear,send);play.append(actions);
 const next=button('Nächste Runde',start,'fc-primary fc-hidden');next.id='fcNext';play.append(next);dialog.append(play);document.body.append(dialog);
 dialog.addEventListener('close',()=>{cancelDraw();if(opener?.isConnected)opener.focus();});
 dialog.addEventListener('cancel',cancelDraw);
 const tile=button('',()=>{opener=tile;setup();dialog.showModal();},'worldCard fc-home-button');tile.dataset.game='connections';tile.append(el('span','fc-home-icon','▦'),el('b','','FAKTEN ZUORDNEN'),el('small','','Bilder. Namen. Zahlenfakten. Was gehört zusammen?'),el('small','','16 Karten · 4 Gruppen · 3 Fehlversuche'),el('span','fc-home-action','Spiel wählen →'));
 document.querySelector('.worldStrip.worldTabs')?.append(tile);
 criteria=Object.keys(pack.criteria);setup();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
