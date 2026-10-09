(function(){
'use strict';
const pack=window.FACT_CONNECTIONS_PACK,E=window.FactConnectionsEngine;
if(!pack||!E)return;
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
let dialog,round,category='',criteria=[],opener;
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
 dialog.querySelector('#fcAvailability').textContent=ready.length?`${criteria.length} Kriterien · ${ready.length} spielbare ${ready.length===1?'Kategorie':'Kategorien'} · 16 Karten pro Runde`:'Wähle weitere Kriterien. Vier Namen brauchen jeweils drei passende Fakten.';
}
function setup(){
 round=null;dialog.querySelector('#fcSetup').classList.remove('fc-hidden');dialog.querySelector('#fcPlay').classList.add('fc-hidden');
}
function start(){
 const cats=availableCats();if(!cats.length)return;
 round=E.createRound(pack,E.shuffle(cats)[0],criteria);
 dialog.querySelector('#fcSetup').classList.add('fc-hidden');dialog.querySelector('#fcPlay').classList.remove('fc-hidden');
 dialog.querySelector('#fcRoundCategory').textContent=round.groups[0].category;
 message('Finde einen Namen und seine drei Fakten.');render();dialog.querySelector('#fcSubmit').focus();
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
 if(art.type==='portrait'){
  frame.classList.add('fc-portrait');frame.style.backgroundImage=`url("${art.src}")`;
  frame.style.backgroundPosition=`${(art.atlas%4)*100/3}% ${Math.floor(art.atlas/4)*50}%`;
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
  if(c.kind==='name'){
   n.classList.add('fc-name-card');const art=nameArt(c);if(art)n.append(art);
   n.append(el('b','fc-name',format(c)));
  }else{n.append(el('small','fc-metric',c.label),el('b','fc-value',format(c)));if(c.scope)n.append(el('small','fc-scope',c.scope));}
  grid.append(n);
 }}
 const solved=dialog.querySelector('#fcSolved');solved.replaceChildren();
 (round.finished?round.groups:round.solved.map(id=>round.groups.find(g=>g.id===id))).forEach((g,i)=>solved.append(reveal(g,i)));
 dialog.querySelector('#fcNext').classList.toggle('fc-hidden',!round.finished);update();
}
function update(){
 dialog.querySelector('#fcHud').textContent=`${round.solved.length} / 4 Gruppen · ${4-round.mistakes} Fehlversuche übrig`;
 dialog.querySelector('#fcSelection').textContent=`${round.selected.length} / 4 ausgewählt`;
 dialog.querySelector('#fcSubmit').disabled=round.finished||round.selected.length!==4;
 dialog.querySelector('#fcClear').disabled=round.finished||!round.selected.length;
 dialog.querySelector('#fcShuffle').disabled=round.finished;
}
function submit(){
 const result=E.submit(round);
 const texts={correct:'Richtig zugeordnet!',won:'Alle vier Gruppen gefunden!',wrong:'Diese vier Karten gehören nicht zusammen.',lost:'Vier Fehlversuche. Hier sind die richtigen Zuordnungen.',repeat:'Diese Kombination hast du schon versucht. Es wird kein weiterer Fehler gezählt.'};
 message(texts[result.status]||'Wähle genau vier Karten.');render();
}
function init(){
 dialog=el('dialog');dialog.id='factConnections';dialog.setAttribute('aria-labelledby','fcTitle');
 const head=el('div','fc-head');const titleWrap=el('div');titleWrap.append(el('div','fc-eyebrow','ZAHLEN. FAKTEN. VERBINDUNGEN.'));const title=el('h2','','Fakten zuordnen');title.id='fcTitle';titleWrap.append(title,el('p','fc-subtitle','Ein Name. Drei Fakten.'));head.append(titleWrap,button('Schließen',()=>dialog.close()));dialog.append(head);
 const help=el('details','fc-help');help.append(el('summary','','So funktioniert’s'),el('p','','16 gemischte Karten: vier Namen und zwölf Zahlenfakten. Wähle jeweils einen Namen und genau die drei zugehörigen Fakten. Du hast vier Fehlversuche. Identische Fakten sind austauschbar. Gelöste Gruppen zeigen die Quellen.'));dialog.append(help);
 const settings=el('section','fc-controls');settings.id='fcSetup';const label=el('label','','Kategorie');const select=el('select');select.id='fcCategory';select.append(new Option('Bunter Mix – eine Kategorie pro Runde',''),...categories.map(c=>new Option(c,c)));select.addEventListener('change',()=>{category=select.value;criteria=fields().map(f=>f.id);choices();});label.append(select);settings.append(label);
 const adjust=el('details','fc-help');adjust.append(el('summary','','Kriterien anpassen'));const checks=el('div','fc-criteria');checks.setAttribute('role','group');checks.setAttribute('aria-label','Kriterien auswählen');adjust.append(checks);settings.append(adjust);
 const status=el('p','fc-note');status.id='fcAvailability';status.setAttribute('role','status');settings.append(status);
 settings.append(el('p','fc-note','Pro Name werden drei verfügbare Kriterien gemischt. Zeiträume, Messbedingungen und Schätzungen stehen auf den Karten.'));
 const startButton=button('Runde starten',start,'fc-primary');startButton.id='fcStart';settings.append(startButton);dialog.append(settings);
 const play=el('section','fc-hidden');play.id='fcPlay';const hud=el('div','fc-hud');const cat=el('b');cat.id='fcRoundCategory';const count=el('span');count.id='fcHud';hud.append(cat,count);play.append(hud);
 const solved=el('div');solved.id='fcSolved';play.append(solved);const grid=el('div','fc-grid');grid.id='fcGrid';grid.setAttribute('role','group');grid.setAttribute('aria-label','Faktenkarten');play.append(grid);
 const msg=el('div','fc-message');msg.id='fcMessage';msg.setAttribute('role','status');msg.setAttribute('aria-live','polite');play.append(msg);
 const selection=el('div','fc-note');selection.id='fcSelection';play.append(selection);
 const actions=el('div','fc-actions');const shuffle=button('Mischen',()=>{round.cards=E.shuffle(round.cards);render();});shuffle.id='fcShuffle';const clear=button('Abwählen',()=>{round.selected=[];render();});clear.id='fcClear';const send=button('Abschicken',submit,'fc-primary');send.id='fcSubmit';actions.append(shuffle,clear,send);play.append(actions);
 const next=button('Nächste Runde',start,'fc-primary fc-hidden');next.id='fcNext';play.append(next,button('Spiel anpassen',setup));dialog.append(play);document.body.append(dialog);
 dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus();});
 const tile=button('',()=>{opener=tile;setup();dialog.showModal();},'worldCard fc-home-button');tile.dataset.game='connections';tile.append(el('span','fc-home-icon','▦'),el('b','','FAKTEN ZUORDNEN'),el('small','','Ein Name. Drei Fakten. Was gehört zusammen?'),el('small','','16 Karten · 4 Gruppen · 4 Fehlversuche'),el('span','fc-home-action','Spiel wählen →'));
 document.querySelector('.worldStrip.worldTabs')?.append(tile);
 criteria=fields().map(f=>f.id);choices();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
