/* UI coordination only. Server clocks, answer ownership and scores stay in the engines. */
const PRIORITY_UI={top:null,frames:[],inert:new Map(),scheduled:false,hostBusy:false,hostState:null};
function priorityPendingSave(game,id,data){try{sessionStorage.setItem('ml_retry_'+game,JSON.stringify({room:S.room,uid:S.uid,id,...data}))}catch{}}
function priorityPendingRead(game,id){try{const p=JSON.parse(sessionStorage.getItem('ml_retry_'+game)||'null');return p&&p.room===S.room&&p.uid===S.uid&&p.id===id?p:null}catch{return null}}
function priorityPendingClear(game,id){try{const p=JSON.parse(sessionStorage.getItem('ml_retry_'+game)||'null');if(!p||!id||p.id===id)sessionStorage.removeItem('ml_retry_'+game)}catch{}}
function friendlyGameError(text){
 const value=String(text||'');
 if(/^JS:/i.test(value))return 'Die Ansicht konnte nicht vollständig aktualisiert werden. Bitte öffne das Hauptmenü und starte die Ansicht erneut.';
 if(/Failed to fetch|NetworkError|fetch failed|Load failed|offline/i.test(value))return 'Die Verbindung ist unterbrochen. Dein Spielzugang bleibt gespeichert. Bitte erneut verbinden.';
 if(/permission denied|insufficient_privilege|not a member|members only/i.test(value))return 'Für diese Aktion fehlt der Zugang zur Lobby. Bitte über den Raumcode erneut beitreten.';
 if(/host only|Host only|not host/i.test(value))return 'Diese Aktion kann nur der Host ausführen.';
 if(/JWT expired|Invalid JWT|session.*expired/i.test(value))return 'Dein Zugang ist abgelaufen. Bitte erneut verbinden oder im Account anmelden.';
 if(/rule preview still running/i.test(value))return 'Die Regelvorschau läuft noch. Du kannst gleich antworten.';
 if(/question not accepting|stale question|question.*closed/i.test(value))return 'Diese Frage nimmt keine Antworten mehr an. Der aktuelle Spielstand wird neu geladen.';
 return value.slice(0,500);
}
function berlinDay(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)}
function prioritySelection(game,online=!!S.room){
 const cfg=online?(S.roomConfig||{}):{},mode=String(online?cfg.game_mode||LOBBY_MODE:game==='moreless'?el('chosenMode')?.textContent:game==='estimate'?EST.mode:game==='facts'?FACT_PLAY_MODE:JEOP.mode).toLowerCase();
 const names={moreless:'More / Less',estimate:'Schätzduell',facts:'Fakt oder Fake',quiz:'Jeopardy'};
 const label={classic:'Classic',party:'Party',blitz:'Blitz',survival:'Survival',king:'King',chaos:'Chaos',risk:'Risk',confidence:'Wie sicher?',standard:'Standard',big:'Big Board',random:'Random',football:'Fußball',nerd:'Schwer',sport:'Sport',geo:'Geo'}[mode]||mode;
 const count=game==='moreless'?(online?onlineTotalQuestions():(typeof selectedSoloRounds==='function'?selectedSoloRounds():4)*5)+' Fragen':game==='estimate'?(online?cfg.questions_per_round||10:EST.roundLength||10)+' Fragen':game==='facts'?'10 Aussagen':'6 Kategorien · 30 Felder';
 const timed=game==='facts'&&online?60:mode==='blitz'?game==='estimate'?8:online?cfg.blitz_seconds||8:blitzSeconds():game==='moreless'&&online&&cfg.timer_enabled?cfg.timer_seconds:0;
 const category=game==='moreless'?(typeof CATEGORY_OPTIONS!=='undefined'&&CATEGORY_OPTIONS.mode==='chosen'?CATEGORY_OPTIONS.category:'Zufällige Kategorien'):game==='facts'&&!online?(FACT_LEVEL_NAMES[FACT_DIFFICULTY]||FACT_DIFFICULTY):game==='quiz'?'Board: '+label:'Gemischte Kategorien';
 const players=online?'Online · '+Object.keys(S.playerNames||{}).length+' Spieler':game==='quiz'?'Lokal · 2 Teams':'Solo · 1 Spieler';
 return [names[game]+' · '+label,players+' · '+count,category,timed?timed+' Sekunden pro Frage':'Ohne Countdown'].join('\n');
}
function updatePrioritySummary(){const box=el('prioritySetup');if(box)box.textContent=prioritySelection(GAME_WORLD||'moreless',false)}
function dailyDayNotice(){
 const box=el('dailyDayNotice');if(!box)return;const today=berlinDay();
 box.hidden=!DAILY.data||today<=(DAILY.today||DAILY.data.day);if(box.hidden)return;
 el('dailyDayNoticeText').textContent='Ein neuer Daily-Tag ist da. Dein bisheriger Versuch bleibt beim ursprünglichen Datum. Du kannst ihn im Archiv fortsetzen oder zum heutigen Daily wechseln.';
 el('dailyDayNoticeGo').disabled=DAILY.busy;
}
async function openTodaysDaily(){if(DAILY.busy)return;DAILY.today=berlinDay();await chooseDailyDay(DAILY.today);dailyDayNotice()}
function modalVisible(node){return !!node&&node.getClientRects().length>0&&!node.hidden&&!node.classList.contains('hide')}
function priorityModals(){
 return [...document.querySelectorAll('dialog[open],.overlay:not(.hide),#jeopQuestion.on,#jeopSelect:not(.hide),#exitAsk.on,#finishOverlay.on,#catOverlay.on,#soloCardDraw.on,#localEndScreen:not(.hide),#modeInfo.on')].filter(modalVisible);
}
function priorityFocusables(node){return [...node.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex="0"]')].filter(n=>modalVisible(n)&&!n.closest('[inert]'))}
function priorityCloseTop(){
 const node=PRIORITY_UI.top;if(!node)return false;
 if(node.tagName==='DIALOG'){if(node.dispatchEvent(new Event('cancel',{cancelable:true})))node.close();return true}
 const actions={dailyOverlay:closeDaily,lobbyOverlay:leaveMatch,exitAsk:closeExitAsk,finishOverlay:closeFinish,jeopSelect:()=>{JEOP.cell?.btn?.classList.remove('selected');el('jeopSelect').classList.add('hide')},jeopQuestion:()=>{if(!S.room&&el('jeopQuestion').classList.contains('answerReview'))el('jeopQuestion').classList.remove('on');else leaveMatch()},localEndScreen:()=>endToModeMenu(),catOverlay:leaveMatch,soloCardDraw:leaveMatch,modeInfo:()=>closeModeInfo()};
 if(actions[node.id]){actions[node.id]();return true}return false;
}
function syncPriorityModals(){
 PRIORITY_UI.scheduled=false;
 for(const [node,was] of PRIORITY_UI.inert){node.inert=was}PRIORITY_UI.inert.clear();
 const active=priorityModals();
 const closed=PRIORITY_UI.frames.filter(frame=>!active.includes(frame.node));PRIORITY_UI.frames=PRIORITY_UI.frames.filter(frame=>active.includes(frame.node));
 for(const node of active){
  if(!node.classList.contains('priorityModal'))node.classList.add('priorityModal');
  if(node.tagName!=='DIALOG'){node.setAttribute('role','dialog');node.setAttribute('aria-modal','true');if(!node.hasAttribute('aria-label')&&!node.hasAttribute('aria-labelledby'))node.setAttribute('aria-label',node.querySelector('h1,h2,h3')?.textContent||'Spielansicht')}
  if(!PRIORITY_UI.frames.some(f=>f.node===node))PRIORITY_UI.frames.push({node,focus:node.priorityReturnFocus||document.activeElement});
 }
 const native=PRIORITY_UI.frames.map(f=>f.node).filter(n=>n.tagName==='DIALOG'),top=native.at(-1)||PRIORITY_UI.frames.at(-1)?.node||null,changed=top!==PRIORITY_UI.top;PRIORITY_UI.top=top;
 document.body.dataset.modalOpen=String(!!top);
 for(const frame of closed.reverse()){if(frame.focus?.isConnected&&(!top||top.contains(frame.focus))){frame.focus.focus({preventScroll:true});break}}
 for(const notice of [el('hostRecoveryNotice'),el('priorityError')].filter(Boolean)){const target=top?(top.querySelector('.modal')||top):document.body;if(notice.parentElement!==target)target.append(notice);notice.style.position=target===document.body?'fixed':'static'}
 if(top){
  for(let node=top;node&&node!==document.body;node=node.parentElement){for(const sibling of node.parentElement?.children||[]){if(sibling===node||sibling.tagName==='SCRIPT'||sibling.tagName==='STYLE'||sibling.tagName==='LINK')continue;PRIORITY_UI.inert.set(sibling,sibling.inert);sibling.inert=true}}
  if(changed&&!top.contains(document.activeElement)){const first=priorityFocusables(top)[0];if(first)first.focus({preventScroll:true});else{top.tabIndex=-1;top.focus({preventScroll:true})}}
 }
 document.querySelectorAll('.recapQ[onclick],.catCard[onclick]').forEach(n=>{if(n.tagName!=='BUTTON'){n.setAttribute('role','button');n.tabIndex=0}});
 document.querySelectorAll('[role=status],.answerState').forEach(n=>{n.setAttribute('aria-live','polite');n.setAttribute('aria-atomic','true')});
}
function schedulePriorityModals(){if(PRIORITY_UI.scheduled)return;PRIORITY_UI.scheduled=true;requestAnimationFrame(syncPriorityModals)}
function updateVisibleViewport(){
 const viewport=window.visualViewport,height=viewport?.height||window.innerHeight,top=viewport?.offsetTop||0;
 document.documentElement.style.setProperty('--visible-height',height+'px');document.documentElement.style.setProperty('--visible-top',top+'px');
 document.body.dataset.keyboardOpen=String(!!viewport&&window.innerHeight-height>140);
}
async function refreshHostRecovery(){
 if(!S.room||PRIORITY_UI.hostBusy)return;const room=S.room;PRIORITY_UI.hostBusy=true;
 try{const state=await rpc('ml_room_recovery',{p_room:room,p_action:'state'});if(S.room!==room)return;PRIORITY_UI.hostState=state;S.host=state.host_id===S.uid;S.hostUID=state.host_id;
  el('overlayHost').classList.toggle('hide',!S.host);el('host').classList.toggle('hide',!S.host);if(typeof renderEstimateOnline==='function'&&EST.onlineState&&EST.online)renderEstimateOnline(EST.onlineState);
  const box=el('hostRecoveryNotice');box.hidden=state.host_connected||S.host;
  el('hostRecoveryText').textContent=state.can_claim?'Der Host ist seit mindestens 90 Sekunden nicht erreichbar. Ein Mitspieler kann die Leitung übernehmen. Spielstand und Punkte bleiben erhalten.':'Der Host ist gerade nicht erreichbar. Die laufende Antwortzeit läuft weiter; für die nächste Frage warten wir auf seine Rückkehr. Nach 90 Sekunden kann ein Mitspieler die Leitung übernehmen.';
  el('hostRecoveryClaim').hidden=!state.can_claim;el('hostRecoveryClaim').disabled=false;
 }catch{ /* Room sync owns connection errors. A failed presence read never grants authority. */
  const button=el('hostRecoveryClaim');if(button)button.hidden=true;
 }finally{PRIORITY_UI.hostBusy=false}
}
async function claimRoomHost(){
 if(!S.room||PRIORITY_UI.hostBusy)return;const room=S.room;PRIORITY_UI.hostBusy=true;el('hostRecoveryClaim').disabled=true;
 try{const state=await rpc('ml_room_recovery',{p_room:room,p_action:'claim'});if(room!==S.room)return;S.host=state.host_id===S.uid;saveSession();await sync();msg('Du leitest jetzt die Lobby. Spielstand und Punkte bleiben erhalten.')}
 catch(error){el('hostRecoveryText').textContent=error.message+' Bitte erneut prüfen.'}
 finally{PRIORITY_UI.hostBusy=false;await refreshHostRecovery()}
}
function priorityAnswerState(game,kind,history,before){
 const rows=history()||[];if(rows.length<=before)return;const last=rows.at(-1);if(kind==='timeout')setGameAnswerStatus(game,'wrong','⏱ Zeit abgelaufen · keine rechtzeitige Antwort');
 else if(game==='estimate')setGameAnswerStatus(game,last.ok?'correct':'wrong',last.ok?'✓ Gute Schätzung':'↔ Schätzung ausgewertet · siehe Abweichung');
 else setGameAnswerStatus(game,last.ok?'correct':'wrong');
}
(function initPriorityRelease(){
 const dialogProto=window.HTMLDialogElement?.prototype;if(dialogProto?.showModal){const nativeShow=dialogProto.showModal;dialogProto.showModal=function(...args){if(!this.open)this.priorityReturnFocus=document.activeElement;return nativeShow.apply(this,args)}}
 const switchDialog=document.createElement('dialog');switchDialog.id='accountSwitchNotice';switchDialog.setAttribute('aria-labelledby','accountSwitchTitle');const switchTitle=document.createElement('h2');switchTitle.id='accountSwitchTitle';switchTitle.textContent='Account wurde geändert';const switchText=document.createElement('p');switchText.textContent='In einem anderen Tab wurde ein anderer Zugang gewählt. Lade diese Ansicht neu, damit Profil und Ergebnisse zum richtigen Account gehören. Eine Online-Runde bleibt auf dem Server erhalten.';const switchReload=document.createElement('button');switchReload.textContent='Ansicht neu laden';switchReload.onclick=()=>goMainMenu();switchDialog.addEventListener('cancel',event=>event.preventDefault());switchDialog.append(switchTitle,switchText,switchReload);document.body.append(switchDialog);
 const setup=document.createElement('p');setup.id='prioritySetup';setup.className='prioritySetup';setup.setAttribute('aria-label','Zusammenfassung deiner Auswahl');document.querySelector('.siteEntry').insertBefore(setup,document.querySelector('.siteEntryActions'));
 const dailyNotice=document.createElement('div');dailyNotice.id='dailyDayNotice';dailyNotice.className='priorityNotice';dailyNotice.hidden=true;const noticeText=document.createElement('p');noticeText.id='dailyDayNoticeText';const todayButton=document.createElement('button');todayButton.id='dailyDayNoticeGo';todayButton.textContent='Zum heutigen Daily';todayButton.onclick=openTodaysDaily;dailyNotice.append(noticeText,todayButton);el('dailyStatus').before(dailyNotice);
 const errorNotice=document.createElement('div');errorNotice.id='priorityError';errorNotice.className='priorityNotice';errorNotice.hidden=true;errorNotice.setAttribute('role','alert');const errorText=document.createElement('p');errorText.id='priorityErrorText';const dismiss=document.createElement('button');dismiss.textContent='Schließen';dismiss.onclick=()=>{errorNotice.hidden=true};errorNotice.append(errorText,dismiss);document.body.append(errorNotice);errorNotice.style.cssText='position:fixed;top:max(8px,env(safe-area-inset-top));left:12px;right:12px;z-index:10001;max-width:620px;margin:auto';
 const hostNotice=document.createElement('div');hostNotice.id='hostRecoveryNotice';hostNotice.className='priorityNotice';hostNotice.hidden=true;const hostText=document.createElement('p');hostText.id='hostRecoveryText';const claim=document.createElement('button');claim.id='hostRecoveryClaim';claim.textContent='Host übernehmen';claim.onclick=claimRoomHost;hostNotice.append(hostText,claim);el('connectionBanner').after(hostNotice);
 hostNotice.style.cssText='position:fixed;top:max(8px,env(safe-area-inset-top));left:12px;right:12px;z-index:10000;max-width:620px;margin:auto';
 const skip=document.createElement('a');skip.href='#homeScreen';skip.textContent='Zum Hauptinhalt';skip.className='prioritySkip';document.body.prepend(skip);el('homeScreen').tabIndex=-1;
 el('status').setAttribute('role','status');
 const ruleSummary=document.createElement('p');ruleSummary.id='priorityRuleSetup';ruleSummary.className='prioritySetup';el('gameRuleMeta').after(ruleSummary);const fill=fillRulePreview;fillRulePreview=function(rules,...args){const result=fill.call(this,rules,...args);ruleSummary.hidden=args[0]==='SPIELREGELN';ruleSummary.textContent=prioritySelection(rules.game||'moreless');return result};const ruleSettings=updateRuleSettings;updateRuleSettings=function(...args){const result=ruleSettings.apply(this,args);if(GAME_UX.settings)ruleSummary.textContent=prioritySelection(GAME_UX.settings.game);updatePrioritySummary();return result};
 const mainMenu=goMainMenu;goMainMenu=async function(){if(PRIORITY_UI.leaving)return;PRIORITY_UI.leaving=true;clearInterval(S.t);clearGameTimer();msg('Runde wird verlassen …');try{if(S.room)await rpc('ml_room_recovery',{p_room:S.room,p_action:'leave'})}catch{ /* Local exit still works when offline. Server presence expires normally. */ }finally{clearPendingOnlineAnswer();mainMenu()}};
 const heartbeat=connectionHeartbeat;connectionHeartbeat=function(...args){if(!PRIORITY_UI.leaving)return heartbeat.apply(this,args)};
 const closeMenu=closeWorldMenu;closeWorldMenu=function(...args){const result=closeMenu.apply(this,args);el('homeScreen').style.display='';if(!S.room)el('lobby').classList.add('preLobbyHidden');return result};
 if(!S.room&&!el('homeScreen').classList.contains('hide'))el('lobby').classList.add('preLobbyHidden');
 const back=siteBack;siteBack=function(...args){if(PRIORITY_UI.top&&priorityCloseTop())return;return back.apply(this,args)};
 const originalMessage=msg;msg=function(text,error=false){const message=error?friendlyGameError(text):text;originalMessage(message,error);if(error&&el('priorityError')){el('priorityErrorText').textContent=message;el('priorityError').hidden=false}};
 const selection=siteEntryUpdate;siteEntryUpdate=function(...args){const r=selection.apply(this,args);updatePrioritySummary();return r};
 const lobbySummary=updateLobbySummary;updateLobbySummary=function(...args){const result=lobbySummary.apply(this,args);const game=S.roomConfig?.game||LOBBY_GAME,mode=S.roomConfig?.game_mode||LOBBY_MODE;if(game==='moreless'||game==='estimate')el('lobbyRuleNote').textContent=gameRuleCopy(game,mode).lines.join(' ');return result};
 const originalDailyRpc=dailyRpc;dailyRpc=async function(...args){const uid=(await window.gameAccount?.current())?.uid;const result=await originalDailyRpc.apply(this,args);if((await window.gameAccount?.current())?.uid!==uid)throw Error('Der Account wurde inzwischen gewechselt. Bitte die Daily-Ansicht erneut öffnen.');return result};
 const dailyRender=renderDailyHome;renderDailyHome=function(...args){const r=dailyRender.apply(this,args);dailyDayNotice();return r};
 const factWait=document.createElement('div');factWait.id='factWaiting';factWait.className='onlineWaiting hide';const waitCount=document.createElement('p');waitCount.dataset.waitCount='';const waitNames=document.createElement('p');waitNames.dataset.waitNames='';const waitProgress=document.createElement('progress');const waitTime=document.createElement('span');waitTime.id='factWaitTime';factWait.append(waitCount,waitNames,waitProgress,waitTime);el('factProgress').after(factWait);const factRender=renderFactOnline;renderFactOnline=function(state){const result=factRender.call(this,state);if(FACT_ONLINE.state?.question_id===state.question_id)renderWaiting('factWaiting',state.waitingStatus,state.question_id,state.phase==='open'&&!state.spectator);return result};setInterval(()=>{const state=FACT_ONLINE.state;if(FACT.online&&state?.phase==='open'){waitTime.textContent='Noch '+Math.max(0,Math.ceil((Date.parse(state.deadline)-Date.now()-(S.serverOffset||0))/1000))+' Sekunden bis zur Auflösung'}},1000);
 const estimateRender=renderEstimateOnline;renderEstimateOnline=function(state){const changed=EST.onlineId!==state.question_id,result=estimateRender.call(this,state);if(state.mine||state.phase!=='open'){priorityPendingClear('estimate',state.question_id);return result}const pending=priorityPendingRead('estimate',state.question_id);if(pending){EST.pendingSubmit={id:pending.id,value:pending.value,bet:pending.bet};if(changed){el('estimateValue').value=pending.raw;const bet=el('estimateOnlineBet');if(bet&&pending.bet!==null)bet.value=pending.bet}setGameAnswerStatus('estimate','uncertain','Speicherung nicht bestätigt · dieselbe Schätzung erneut senden')}return result};
 const localEnd=showLocalEnd;showLocalEnd=function(...args){if(PRIORITY_UI.identityBlocked)return;const r=localEnd.apply(this,args);const next=document.querySelector('#localEndScreen button[onclick="replayFromEnd()"]');if(next)next.textContent=S.room?(S.host?'Neue Runde in dieser Lobby':'Zur Lobby'):'Noch einmal spielen';return r};
 for(const [name,game,history] of [['soloPick','moreless',()=>SOLO.history],['submitEstimate','estimate',()=>EST.history],['answerFact','facts',()=>FACT.history]]){
  const original=window[name];window[name]=function(...args){if(PRIORITY_UI.identityBlocked)return;const before=(history()||[]).length,result=original.apply(this,args);const finish=()=>priorityAnswerState(game,args[0]===null||args[0]===true&&game==='estimate'?'timeout':'answer',history,before);if(result?.then)return result.then(value=>{finish();return value});finish();return result};
 }
 document.addEventListener('keydown',event=>{
  const top=PRIORITY_UI.top;if(event.key==='Escape'&&top&&top.tagName!=='DIALOG'){if(priorityCloseTop()){event.preventDefault();event.stopPropagation()}return}
  if(event.key==='Tab'&&top){const controls=priorityFocusables(top),first=controls[0],last=controls.at(-1);if(!first){event.preventDefault();return}if(event.shiftKey&&(document.activeElement===first||!top.contains(document.activeElement))){last.focus();event.preventDefault()}else if(!event.shiftKey&&(document.activeElement===last||!top.contains(document.activeElement))){first.focus();event.preventDefault()}}
  if((event.key==='Enter'||event.key===' ')&&event.target.matches('.recapQ[role=button],.catCard[role=button]')){event.preventDefault();event.stopPropagation();event.target.click()}
 },true);
 document.addEventListener('focusin',event=>{if(PRIORITY_UI.top&&!PRIORITY_UI.top.contains(event.target)){priorityFocusables(PRIORITY_UI.top)[0]?.focus({preventScroll:true})}if(event.target.matches('input,select,textarea'))event.target.scrollIntoView({block:'nearest'})});
 document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('close',schedulePriorityModals);if(d.id==='gameRulePreview')d.addEventListener('cancel',event=>{event.preventDefault();rulePreviewCancel()})});
 window.addEventListener('storage',event=>{if(event.key!=='ml_account_auth_v1')return;let before,after;try{before=JSON.parse(event.oldValue||'null')?.uid;after=JSON.parse(event.newValue||'null')?.uid}catch{return}if(before===after)return;clearInterval(S.t);clearGameTimer();clearInterval(EST.timer);PRIORITY_UI.identityBlocked=true;const d=el('accountSwitchNotice');if(!d.open)d.showModal();schedulePriorityModals()});
 const originalRequest=req;req=async function(path,...args){if(PRIORITY_UI.identityBlocked&&!path.endsWith('/ml_room_recovery'))throw Error('Der Account wurde in einem anderen Tab geändert. Bitte die Ansicht neu laden.');const result=await originalRequest.call(this,path,...args);if(PRIORITY_UI.identityBlocked&&!path.endsWith('/ml_room_recovery'))throw Error('Der Account wurde in einem anderen Tab geändert. Bitte die Ansicht neu laden.');return result};
 new MutationObserver(schedulePriorityModals).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','open']});
 window.visualViewport?.addEventListener('resize',updateVisibleViewport);window.visualViewport?.addEventListener('scroll',updateVisibleViewport);window.addEventListener('resize',updateVisibleViewport);
 updateVisibleViewport();updatePrioritySummary();schedulePriorityModals();setInterval(dailyDayNotice,30000);setInterval(refreshHostRecovery,15000);refreshHostRecovery();
})();
