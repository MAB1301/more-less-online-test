/* Ingame casino: server-owned bets/results, explicit play, owner-bound retry receipts. */
(function(){
'use strict';
const symbols=['🍒','🍋','🔔','⭐','💎','7'];let dialog,state=null,owner=null,pending=null,busy=false,view='slots',ticket=0,animation=null,opener=null;
const $=id=>dialog.querySelector('#'+id);
function stopAnimation(){clearInterval(animation);animation=null;dialog.classList.remove('casinoSpinning');}
function message(text){$('casinoStatus').textContent=text;}
function saved(uid){try{return JSON.parse(localStorage.getItem('ml_casino_pending_'+uid)||'null')}catch{return null}}
function save(value){const key='ml_casino_pending_'+owner;if(value)localStorage.setItem(key,JSON.stringify(value));else localStorage.removeItem(key);pending=value;}
function selected(mode){if(busy||pending)return;view=mode;paint();}
function card(value){const ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'],suits=['♠','♥','♦','♣'];const n=document.createElement('span');n.className='casinoCard';n.textContent=value===null?'?':ranks[value%13]+' '+suits[Math.floor(value/13)];if(value!==null&&[1,2].includes(Math.floor(value/13)))n.classList.add('red');return n;}
function paint(){
 const active=state?.status==='playing';if(active)view='blackjack';
 dialog.querySelectorAll('[data-casino-view]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.casinoView===view));b.disabled=busy||!!pending||active;});
 for(const mode of ['slots','blackjack','wheel'])$('casino-'+mode).hidden=view!==mode;
 $('casinoBalance').textContent=state?state.balance+' ◈ Münzen':'Münzen werden geladen …';
 $('casinoBet').disabled=busy||!!pending||active||!state;
 for(const id of ['casinoSpin','casinoDeal'])$(id).disabled=busy||!!pending||active||!state||state.balance<Number($('casinoBet').value);
 $('casinoHit').disabled=$('casinoStand').disabled=busy||!!pending||!active;
 $('casinoDeal').hidden=active;$('casinoHit').hidden=$('casinoStand').hidden=!active;
 $('casinoWheelSpin').disabled=busy||!!pending||!state||state.wheel_claimed;
 $('casinoRetry').hidden=!pending;$('casinoRetry').disabled=busy;
 $('casinoBetRow').hidden=view==='wheel';
 if(state){
  $('casinoSymbols').querySelectorAll('span').forEach((n,i)=>n.textContent=symbols[state.slots?.[i]??i]);
  for(const [id,values] of [['casinoPlayer',state.player||[]],['casinoDealer',active?[...(state.dealer||[]),null]:state.dealer||[]]]){const area=$(id);area.replaceChildren(...values.map(card));}
  $('casinoPlayerTotal').textContent=state.player?.length?'Du · '+state.player_total+' Punkte':'Deine Karten';
  $('casinoDealerTotal').textContent=active?'Dealer · eine Karte verdeckt':state.dealer?.length?'Dealer · '+state.dealer_total+' Punkte':'Dealer';
  $('casinoResult').textContent=state.game===view&&state.bet?state.status==='playing'?'Einsatz: '+state.bet+' Münzen':state.result+' Auszahlung: '+state.payout+' Münzen (inkl. Einsatz).':'';
  $('casinoWheelLabel').textContent=state.wheel_today?'+'+state.wheel_today+' XP':'10–100 XP';
  $('casinoWheelNote').textContent=state.wheel_claimed?'Heute schon gedreht · morgen ab 00:00 Uhr deutscher Zeit wieder.':'Ein kostenloser Dreh pro Tag · XP zählen für dein Level.';
 }
}
async function open(){if(!dialog.open){opener=document.activeElement;dialog.showModal();}const t=++ticket;state=null;owner=null;pending=null;busy=true;paint();message('Dein Guthaben wird geladen …');try{
 const who=await window.getCasinoIdentity();if(t!==ticket)return;owner=who.uid;pending=saved(owner);
 const data=await window.requestCasino('home',0,null,owner);if(t!==ticket)return;state=data.result;
 if(state.status==='playing')view='blackjack';else if(pending)view=pending.action==='wheel'?'wheel':pending.action==='slots'?'slots':'blackjack';
 message(pending?'Ein Zug ist noch nicht bestätigt. Mit „Zug erneut senden“ wird derselbe Zug geprüft.':'');
 }catch(e){if(t===ticket)message(e.message)}finally{if(t===ticket){busy=false;paint();}}
}
async function play(action){
 if(busy||!owner||!state)return;if(pending&&pending.action!==action)return;
 const t=ticket;busy=true;
 try{if(!pending)save({action,bet:action==='slots'||action==='deal'?Number($('casinoBet').value):0,id:crypto.randomUUID()});
 const move={...pending};paint();message('Wird gespeichert …');
 if(action==='slots'){dialog.classList.add('casinoSpinning');animation=setInterval(()=>$('casinoSymbols').querySelectorAll('span').forEach(n=>n.textContent=symbols[Math.floor(Math.random()*symbols.length)]),95);}
 if(action==='wheel')dialog.classList.add('casinoSpinning');
 const data=await window.requestCasino(move.action,move.bet,move.id,owner);
 if(t!==ticket)return;save(null);state=data.result;
 // Server receipts can be older than the current wallet after a lost response; refresh before another bet.
 const current=await window.requestCasino('home',0,null,owner);if(t!==ticket)return;state=current.result;
 if(action==='wheel')view='wheel';message(action==='wheel'?'Glücksrad: +'+data.result.wheel_award+' XP gespeichert.':state.status==='playing'?'Karte ziehen oder stehen bleiben.':'Runde gespeichert.');
 window.refreshCosmeticCollection?.();window.refreshProfileBanner?.();
 }catch(e){if(t!==ticket)return;if(e.status>=400&&e.status<500&&e.status!==401){save(null);}message(pending?'Speicherung nicht bestätigt. Bitte denselben Zug erneut senden.':e.message);
 }finally{if(t===ticket){stopAnimation();busy=false;paint();}}
}
function init(){
 dialog=document.createElement('dialog');dialog.id='casinoDialog';dialog.setAttribute('aria-labelledby','casinoTitle');
 dialog.innerHTML='<header class="casinoHead"><div><small>GAME NIGHT · COIN LOUNGE</small><h2 id="casinoTitle">Dein Glück. Dein Spiel.</h2></div><button id="casinoClose" type="button" aria-label="Casino schließen">×</button></header><div class="casinoWallet"><b id="casinoBalance"></b><button type="button" id="casinoRefresh">↻ Aktualisieren</button></div><nav class="casinoTabs" aria-label="Casino-Spiele"><button type="button" data-casino-view="slots">🎰 Slotmaschine</button><button type="button" data-casino-view="blackjack">♠ Blackjack</button><button type="button" data-casino-view="wheel">✦ XP-Glücksrad</button></nav><div class="casinoContent"><section id="casino-slots"><small class="casinoEyebrow">DREI SYMBOLE. EIN GLÜCKSMOMENT.</small><h3>Bring die Walzen zum Rollen</h3><div id="casinoSymbols" class="casinoReels" aria-label="Ergebnis der Slotmaschine"><span>🍒</span><span>🍋</span><span>🔔</span></div><p>3 gleiche Symbole: 12× Einsatz · 2 gleiche: Einsatz zurück.</p><button type="button" id="casinoSpin" class="casinoPrimary">Drehen →</button></section><section id="casino-blackjack" hidden><h3>Näher an 21 als der Dealer</h3><b id="casinoDealerTotal"></b><div id="casinoDealer" class="casinoCards"></div><b id="casinoPlayerTotal"></b><div id="casinoPlayer" class="casinoCards"></div><div class="casinoActions"><button type="button" id="casinoDeal" class="casinoPrimary">Karten geben →</button><button type="button" id="casinoHit">Karte ziehen</button><button type="button" id="casinoStand" class="casinoPrimary">Stehen bleiben</button></div><details><summary>Regeln &amp; Auszahlung</summary><p>Ein Deck, Ass zählt 1 oder 11. Dealer steht ab 17, auch bei weicher 17. Gewinn: 2× Einsatz, Blackjack: 2,5×, Gleichstand: Einsatz zurück. Kein Split, Verdoppeln oder Versicherung. Deine laufende Runde bleibt beim Schließen erhalten.</p></details></section><section id="casino-wheel" hidden><h3>Ein Dreh für dein nächstes Level</h3><div class="casinoWheel"><b id="casinoWheelLabel">10–100 XP</b></div><p>Gewinne 10, 20, 30, 50, 75 oder 100 XP.</p><p id="casinoWheelNote"></p><button type="button" id="casinoWheelSpin" class="casinoPrimary">Kostenlos drehen →</button></section><div id="casinoBetRow" class="casinoBetRow"><label for="casinoBet">Dein Einsatz</label><select id="casinoBet"><option value="10">10 Münzen</option><option value="20">20 Münzen</option><option value="50">50 Münzen</option><option value="100">100 Münzen</option></select></div><p id="casinoResult" role="status"></p><p id="casinoStatus" role="status" aria-live="polite"></p><button type="button" id="casinoRetry" hidden>Zug erneut senden ↻</button><p class="casinoFootnote">Du spielst mit deinen Game-Night-Münzen. Sammle sie mit Dailys und Besuchsbelohnungen im Shop. Kein Echtgeld, kein Auszahlen.</p></div>';
 document.body.append(dialog);$('casinoClose').onclick=()=>dialog.close();$('casinoRefresh').onclick=()=>{if(!busy)open()};$('casinoBet').onchange=paint;
 for(const [id,action] of [['casinoSpin','slots'],['casinoDeal','deal'],['casinoHit','hit'],['casinoStand','stand'],['casinoWheelSpin','wheel']])$(id).onclick=()=>play(action);
 $('casinoRetry').onclick=()=>pending&&play(pending.action);dialog.querySelectorAll('[data-casino-view]').forEach(n=>n.onclick=()=>selected(n.dataset.casinoView));
 dialog.addEventListener('close',()=>{ticket++;stopAnimation();busy=false;if(opener?.isConnected)opener.focus();});
 const tab=document.createElement('button');tab.type='button';tab.className='casinoOpen';tab.textContent='🎰 Casino';tab.onclick=open;document.querySelector('.homeHeader .dailyTabs,.unifiedHeader .dailyTabs')?.append(tab);
 window.openCasino=open;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
