(function(){
'use strict';
const pack=window.FACT_CONNECTIONS_PACK,E=window.FactConnectionsEngine;
if(!pack||!E)return;
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
let dialog,round,category='',criteria=[],opener;
const MAX_MISTAKES=3;
const categories=[...new Set(pack.subjects.map(s=>s.category))];
const format=c=>c.kind==='name'?c.value:(typeof c.value==='number'?new Intl.NumberFormat('de-DE',{maximumFractionDigits:4,useGrouping:true}).format(c.value):c.value)+(c.unit?' '+c.unit:'');
function button(text,fn,cls){const n=el('button',cls,text);n.type='button';n.addEventListener('click',fn);return n;}
function fields(){
 return [...new Map(pack.subjects.filter(s=>!category||s.category===category).flatMap(s=>s.facts).map(f=>[f.criterion,{id:f.criterion,label:pack.criteria[f.criterion]||f.label}])).values()];
}
function choices(){
 const area=dialog.querySelector('.fc-criteria');area.replaceChildren();
 for(const f of fields()){
  const label=el('label');const input=el('input');input.type='checkbox';input.value=f.id;input.checked=criteria.includes(f.id);
  input.addEventListener('change',()=>{criteria=[...area.querySelectorAll('input:checked')].map(n=>n.value);availability();});label.append(input,document.createTextNode(f.label));area.append(label);
 }
 availability();
}
function availableCats(){return categories.filter(c=>(!category||category===c)&&E.eligible(pack,c,criteria).length>=4);}
function availability(){
 const ready=availableCats();const start=dialog.querySelector('#fcStart');start.disabled=!ready.length;
 dialog.querySelector('#fcAvailability').textContent=ready.length?'16 Karten · 4 Gruppen · 3 Fehlversuche':'Wähle weitere Kriterien: Autos brauchen zwei, andere Kategorien drei Fakten pro Name.';
}
function setup(){
 dialog.dataset.view='setup';round=null;dialog.querySelector('#fcSetup').classList.remove('fc-hidden');dialog.querySelector('#fcPlay').classList.add('fc-hidden');
}
function start(){
 const cats=availableCats();if(!cats.length)return;
 round=E.createRound(pack,E.shuffle(cats)[0],criteria);dialog.dataset.view='play';
 dialog.querySelector('#fcSetup').classList.add('fc-hidden');dialog.querySelector('#fcPlay').classList.remove('fc-hidden');
 dialog.querySelector('#fcRoundCategory').textContent=round.groups[0].category;
 message(round.groups[0].category==='Autos'?'Finde ein Auto-Bild, seinen Namen und zwei Fakten.':'Finde einen Namen und seine drei Fakten.');render();dialog.querySelector('#fcSubmit').focus();
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
 const head=el('div','fc-head');const titleWrap=el('div');titleWrap.append(el('div','fc-eyebrow','ZAHLEN. FAKTEN. VERBINDUNGEN.'));const title=el('h2','','Fakten zuordnen');title.id='fcTitle';titleWrap.append(title,el('p','fc-subtitle','Finde heraus, was zusammengehört.'));head.append(titleWrap,button('Schließen',()=>dialog.close()));dialog.append(head);
 const help=el('details','fc-help');help.append(el('summary','','So funktioniert’s'),el('p','','Autos: Finde jeweils ein Bild, den Namen und zwei zugehörige Zahlenfakten. Logos und Schriftzüge sind verborgen. Andere Kategorien: ein Name mit Bild und drei Fakten. Jede Runde hat 16 gemischte Karten und vier Gruppen. Du hast drei Fehlversuche. Wenn drei Karten zu einer Gruppe passen, bekommst du den Hinweis „Knapp daneben“. Identische Fakten sind austauschbar. Gelöste Gruppen zeigen die Quellen.'));dialog.append(help);
 const settings=el('section','fc-controls');settings.id='fcSetup';const intro=el('div','fc-setup-intro');intro.append(el('span','fc-setup-symbol','▦'),el('h3','','Vier Karten. Ein Zusammenhang.'),el('p','','Wähle vier Karten, die zum selben Namen gehören. Finde alle vier Gruppen, bevor deine drei Fehlversuche aufgebraucht sind.'));settings.append(intro);const chips=el('div','fc-theme-chips');chips.setAttribute('role','group');chips.setAttribute('aria-label','Thema wählen');settings.append(el('h3','fc-theme-title','Worüber möchtest du rätseln?'),chips);const label=el('label','','Kategorie');const select=el('select');select.id='fcCategory';select.append(new Option('Bunter Mix – eine Kategorie pro Runde',''),...categories.map(c=>new Option(c,c)));select.addEventListener('change',()=>{category=select.value;criteria=fields().map(f=>f.id);choices();paintThemes();});label.append(select);const all=el('details','fc-help fc-all-themes');all.append(el('summary','','Alle Themen ansehen'),label);settings.append(all);
 function paintThemes(){chips.replaceChildren();for(const [value,label] of [['','✦ Bunter Mix'],['Tierwelt','🐾 Tiere'],['Sport','⚽ Sport'],['Weltraum','✧ Weltraum'],['Autos','◆ Autos']].filter(([v])=>!v||categories.includes(v))){const b=button(label,()=>{category=value;select.value=value;criteria=fields().map(f=>f.id);choices();paintThemes();});b.setAttribute('aria-pressed',String(category===value));chips.append(b)}}paintThemes();
 const adjust=el('details','fc-help');adjust.append(el('summary','','Spiel anpassen'));const checks=el('div','fc-criteria');checks.setAttribute('role','group');checks.setAttribute('aria-label','Kriterien auswählen');adjust.append(checks);settings.append(adjust);
 const status=el('p','fc-note');status.id='fcAvailability';status.setAttribute('role','status');settings.append(status);
 const preview=el('div','fc-setup-preview');for(const [icon,text] of [['◇','Name / Bild'],['①','Fakt'],['②','Fakt'],['③','Fakt / Bild']]){const card=el('span');card.append(el('b','',icon),el('small','',text));preview.append(card)}settings.append(preview);
 const startButton=button('Los geht’s →',start,'fc-primary');startButton.id='fcStart';settings.append(startButton);dialog.append(settings);
 const play=el('section','fc-hidden');play.id='fcPlay';const hud=el('div','fc-hud');const cat=el('b');cat.id='fcRoundCategory';const count=el('span');count.id='fcHud';hud.append(cat,button('Spiel anpassen',setup,'fc-adjust'),count);play.append(hud);
 const solved=el('div');solved.id='fcSolved';play.append(solved);const grid=el('div','fc-grid');grid.id='fcGrid';grid.setAttribute('role','group');grid.setAttribute('aria-label','Faktenkarten');play.append(grid);
 const msg=el('div','fc-message');msg.id='fcMessage';msg.setAttribute('role','status');msg.setAttribute('aria-live','polite');play.append(msg);
 const selection=el('div','fc-note');selection.id='fcSelection';play.append(selection);
 const actions=el('div','fc-actions');const shuffle=button('Mischen',()=>{round.cards=E.shuffle(round.cards);render();});shuffle.id='fcShuffle';const clear=button('Abwählen',()=>{round.selected=[];render();});clear.id='fcClear';const send=button('Gruppe prüfen',submit,'fc-primary');send.id='fcSubmit';actions.append(shuffle,clear,send);play.append(actions);
 const next=button('Nächste Runde',start,'fc-primary fc-hidden');next.id='fcNext';play.append(next);dialog.append(play);document.body.append(dialog);
 dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus();});
 const tile=button('',()=>{opener=tile;setup();dialog.showModal();},'worldCard fc-home-button');tile.dataset.game='connections';tile.append(el('span','fc-home-icon','▦'),el('b','','FAKTEN ZUORDNEN'),el('small','','Bilder. Namen. Zahlenfakten. Was gehört zusammen?'),el('small','','16 Karten · 4 Gruppen · 3 Fehlversuche'),el('span','fc-home-action','Spiel wählen →'));
 document.querySelector('.worldStrip.worldTabs')?.append(tile);
 criteria=fields().map(f=>f.id);choices();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
