/* Shared game explanations and participant progress. No guesses are exposed. */
const GAME_UX={approved:null,previewKey:null,timer:null,onStart:null,onCancel:null,returnFocus:null,rounds:4,settings:null};
function gameRuleCopy(game,mode,rule=null){
 mode=String(mode||'classic').toLowerCase();
 if(game==='moreless'&&rule){const r=CHAOS_RULES.find(x=>x.id===rule);if(r)return {title:r.name,lines:rule==='sprint'?[r.text,'Die Runde endet nach 60 Sekunden. Während des Sprints gibt es keine Kartenpausen.']:[r.text,'Diese Regel gilt für diese fünf Fragen. Danach wird eine neue Regel zugeordnet.','Fünf richtige Antworten: +1 Bonuspunkt.']}}
 const comparison='Wähle die Karte mit dem höheren Wert. Der bekannte Wert hilft beim Vergleichen.';
 if(game==='moreless'){
  const rules={classic:[comparison,'Jede richtige Antwort gibt einen Punkt.'],party:[comparison,'Online stehen fünf Joker zur Verfügung. Jeder Joker ist einmal pro Match nutzbar; pro Frage ist ein Joker erlaubt.'],survival:[comparison,'Du hast drei Leben. Jeder Fehler kostet eines. Online schaust du nach dem Ausscheiden bis zum nächsten Match zu.'],king:[comparison,'Richtige Antworten in Folge geben +1, +2, +3, +4, dann höchstens +5 Punkte. Ein Fehler setzt die Serie zurück.'],blitz:[comparison,'Antworte innerhalb der gewählten Zeit. Zu spät zählt als falsch.','Online: richtig +1 Punkt; in der ersten Hälfte des Countdowns zusätzlich +0,5.'],chaos:['Jede Runde bekommt eine zufällige Chaos-Regel. Lies die Vorschau nach der Kategorienwahl.','Die Regel wird nach der Runde ersetzt. Fünf richtige Antworten bringen einen Bonuspunkt.']};
  return {title:{classic:'Classic',party:'Party',survival:'Survival',king:'King',blitz:'Blitz',chaos:'Chaos'}[mode]||'More / Less',lines:rules[mode]||rules.classic};
 }
 if(game==='estimate'){
  const rules={classic:['Gib eine Zahl ein. Je näher sie an der Lösung liegt, desto mehr Punkte bekommst du – bis zu 100 pro Frage.'],risk:['Du startest mit 500 Punkten und wählst vor jeder Frage einen Einsatz.','Bis 10 % Abweichung gewinnst du den Einsatz; bis 2 % das Doppelte. Sonst verlierst du deinen Einsatz.'],survival:['Du hast drei Leben. Mehr als 35 % Abweichung kostet ein Leben.','Genauere Schätzungen geben mehr Punkte, bis zu 100 pro Frage.'],blitz:['Du hast acht Sekunden pro Schätzung. Ohne rechtzeitige Antwort gibt es keine Punkte.','Die Vorschau zählt nicht zur Antwortzeit.'],king:['Bis 15 % Abweichung steigt deine Serie und damit der Multiplikator – höchstens bis ×5.','Eine größere Abweichung setzt die Serie zurück.']};
  return {title:'Schätzduell · '+({classic:'Classic',risk:'Risk',survival:'Survival',blitz:'Blitz',king:'King'}[mode]||'Classic'),lines:[...(rules[mode]||rules.classic),...(S.room?['Alle spielen dieselbe Frage. Die Lösung erscheint, sobald alle geantwortet haben. Der Host startet die nächste Frage.']:[])]};
 }
 if(game==='facts')return {title:'Fakt oder Fake',lines:['Entscheide bei zehn Aussagen: wahr oder falsch?','Jede richtige Antwort gibt einen Punkt. Nach jeder Antwort bekommst du eine Erklärung.']};
 return {title:'Jeopardy',lines:['Wähle eine Kategorie und einen Punktewert auf dem Board.','Das Team, das buzzert, darf antworten. Richtig gibt Punkte, falsch kostet Punkte.','Online bewertet der Host die Antwort.']};
}
function gameRules(game,mode,rule=null){
 const rules=gameRuleCopy(game,mode,rule),m=String(mode||'classic').toLowerCase(),online=!!S.room;
 rules.game=game;rules.mode=m;rules.rule=rule;
 const labels={moreless:'MORE / LESS',estimate:'SCHÄTZDUELL',facts:'FAKT ODER FAKE',quiz:'JEOPARDY'};
 rules.brand=labels[game]||'GAME / NIGHT';
 const seconds=game==='estimate'?8:online?Number(S.roomConfig?.timer_enabled?S.roomConfig.timer_seconds:S.roomConfig?.blitz_seconds)||8:typeof blitzSeconds==='function'?blitzSeconds():8;
 const questions=game==='estimate'?(Number(online?S.roomConfig?.questions_per_round:EST.roundLength)||10)+' Fragen':game==='facts'?'10 Aussagen':game==='quiz'?'6 Kategorien':online?(typeof onlineTotalQuestions==='function'?onlineTotalQuestions():20)+' Fragen':GAME_UX.rounds+(GAME_UX.rounds===1?' Runde':' Runden');
 const modeInfo={classic:game==='estimate'?'Bis zu 100 Punkte':'+1 pro Treffer',party:online?'5 Joker pro Match':'+1 pro Treffer',blitz:seconds+' Sekunden pro Frage',survival:'3 Leben',king:game==='estimate'?'Multiplikator bis ×5':'Serie bis +5',risk:'500 Startpunkte',chaos:'Neue Regel je Runde'};
 if(game==='moreless'&&m==='party'&&!online)rules.lines=[rules.lines[0],'Jede richtige Antwort gibt einen Punkt.','Joker stehen in einer Online-Lobby zur Verfügung.'];
 rules.meta=[questions,modeInfo[m]||(game==='facts'?'+1 pro Treffer':'30 Fragenfelder')];
 if(game==='moreless'&&!online&&!rule){rules.meta.splice(1,0,'5 Fragen je Kategorie');if(m==='classic')rules.lines=['Kategorie ziehen','Höheren Wert wählen','Punkte sammeln'];}
 if(game==='moreless'&&m==='blitz')rules.lines=[rules.lines[0],'Du hast '+seconds+' Sekunden pro Frage. Zu spät zählt als falsch.',online?'Richtig: +1 Punkt. In der ersten Zeithälfte zusätzlich +0,5.':'Jede richtige Antwort gibt einen Punkt.'];
 if(rule){const info={double:'+2 pro Treffer',risk:'Richtig +1 · falsch −1',blitz:'8 Sekunden pro Frage',reverse:'Kleineren Wert wählen',streak:'Serie bis +3',final:'Finalfrage: +5',blind:'Vergleichswert verborgen',rescue:'Erster Fehler frei',sprint:'60 Sekunden'};rules.meta=[rule==='sprint'?'Zufällige Kategorien':'5 Fragen',info[rule]||'Chaos-Regel'];}
 return rules;
}
function fillRuleMeta(id,items){
 const box=el(id);if(!box)return;box.replaceChildren();for(const text of items){const chip=document.createElement('span');chip.textContent=text;box.appendChild(chip)}
}
function configureRuleSettings(rules,editable=false){
 GAME_UX.settings=editable&&rules.game==='moreless'?rules:null;
 const box=el('gameRuleSettings');box.classList.toggle('hide',!GAME_UX.settings);
 el('gameRuleRounds').value=GAME_UX.rounds;
 el('gameRuleSecondsField').classList.toggle('hide',rules.mode!=='blitz');
 el('gameRuleSeconds').value=typeof blitzSeconds==='function'?blitzSeconds():8;
}
function updateRuleSettings(){
 const settings=GAME_UX.settings;if(!settings||S.room)return;
 GAME_UX.rounds=Math.max(1,Math.min(4,Number(el('gameRuleRounds').value)||4));
 if(settings.mode==='blitz'){const seconds=Math.max(5,Math.min(15,Number(el('gameRuleSeconds').value)||8));el('gameRuleSeconds').value=seconds;el('blitzSeconds').value=seconds;if(typeof refreshTimePicker==='function')refreshTimePicker('blitzSeconds');}
 const rules=gameRules(settings.game,settings.mode);fillRuleMeta('gameRuleMeta',rules.meta);
 const list=el('gameRuleList');list.replaceChildren();for(const text of rules.lines){const li=document.createElement('li');li.textContent=text;list.appendChild(li)}
}
function selectedSoloRounds(){return GAME_UX.rounds}
function decorateChaosPreview(rule){
 const rules=gameRules('moreless','chaos',rule.id);fillRuleMeta('chaosIntroMeta',rules.meta);
}
function fillRulePreview(rules,context){
 const d=el('gameRulePreview');d.dataset.game=rules.game||'moreless';el('gameCategoryOptions')?.classList.toggle('hide',rules.game!=='moreless'||!!S.room);GAME_UX.returnFocus=document.activeElement;
 el('gameRuleContext').textContent=(rules.brand||'GAME / NIGHT')+' · '+context;el('gameRuleTitle').textContent=rules.title;
 el('gameRulePrefix').textContent=context==='SPIELREGELN'?'So spielst du':rules.rule?'Deine Chaos-Regel':'Bereit für';
 el('gameRuleQuestion').classList.toggle('hide',context==='SPIELREGELN');fillRuleMeta('gameRuleMeta',rules.meta||[]);configureRuleSettings(rules,false);el('gameRuleCountdown').classList.add('hide');
 const list=el('gameRuleList');list.replaceChildren();for(const text of rules.lines){const li=document.createElement('li');li.textContent=text;list.appendChild(li)}
 if(!d.open)d.showModal();
}
function closeRulePreview(){
 clearInterval(GAME_UX.timer);GAME_UX.timer=null;const d=el('gameRulePreview');if(d?.open)d.close();
 GAME_UX.onStart=null;GAME_UX.onCancel=null;GAME_UX.returnFocus?.focus?.();
}
function needsRulePreview(game,mode,run){
 if(S.room)return false;const key=game+':'+mode;
 if(GAME_UX.approved===key){GAME_UX.approved=null;return false}
 closeRulePreview();if(typeof closeForeignGames==='function')closeForeignGames(null);fillRulePreview(gameRules(game,mode),'DEIN NÄCHSTES MATCH');configureRuleSettings(gameRules(game,mode),true);
 el('gameRuleStart').disabled=false;el('gameRuleStart').textContent='Los geht’s →';el('gameRuleCancel').textContent='Zurück';
 GAME_UX.onStart=()=>{closeRulePreview();GAME_UX.approved=key;run()};GAME_UX.onCancel=()=>{closeRulePreview();openWorldMenu(game)};
 return true;
}
function rulePreviewStart(){GAME_UX.onStart?.()}
function rulePreviewCancel(){if(GAME_UX.onCancel)GAME_UX.onCancel();else closeRulePreview()}
function questionStartsIn(q){const start=Date.parse(q?.starts_at);return Number.isFinite(start)?Math.max(0,Math.ceil((start-Date.now()-(S.serverOffset||0))/1000)):0}
function refreshOnlineReadiness(q){
 if(!q||S.q!==q.question_no||S.questionId!==q.question_id||S.reviewMode||S.newGameLobby)return;
 const starting=questionStartsIn(q)>0,me=S.modePlayers?.find(x=>x.user_id===S.uid),inactive=String(S.roomConfig?.game_mode).toUpperCase()==='SURVIVAL'&&me?.lives===0;
 const timed=S.roomConfig?.timer_enabled||String(S.roomConfig?.game_mode).toUpperCase()==='BLITZ'||q.rule==='blitz';const expired=timed&&q.deadline&&Date.parse(q.deadline)<=Date.now()+(S.serverOffset||0);
 const locked=starting||inactive||S.answeredQ===q.question_no||S.answerSaving||q.status!=='open'||!!S.revealHistory[S.q]||!!expired;
 el('a').disabled=el('b').disabled=locked;
 document.querySelectorAll('.jokerBtn').forEach(b=>b.disabled=locked||S.usedJokers.includes(b.dataset.j));
 if(starting)el('reveal').textContent='Runde startet in '+questionStartsIn(q)+' …';
}
function showOnlineRulePreview(game,q){
 if(!q?.question_id||GAME_UX.previewKey===q.question_id||questionStartsIn(q)<=0)return;
 closeRulePreview();GAME_UX.previewKey=q.question_id;
 const mode=game==='estimate'?q.mode:S.roomConfig?.game_mode||LOBBY_MODE;
 fillRulePreview(gameRules(game,mode,game==='moreless'&&String(mode).toUpperCase()==='CHAOS'?q.rule:null),game==='moreless'?'NÄCHSTE RUNDE · '+(q.category||''):'MATCH STARTET');
 el('gameRuleCountdown').classList.remove('hide');el('gameRuleStart').disabled=true;el('gameRuleCancel').textContent='Vorschau schließen';
 const tick=()=>{const left=questionStartsIn(q);el('gameRuleStart').textContent='Start in '+left+' Sekunden';el('gameRuleCountdown').value=left;
  if(game==='moreless')refreshOnlineReadiness(q);else if(EST.onlineId===q.question_id)el('estimateEntry').classList.toggle('hide',left>0||!!EST.onlineState?.mine);
  if(left<=0){closeRulePreview();if(game==='moreless'){refreshOnlineReadiness(q);if(S.answeredQ!==q.question_no)el('reveal').textContent=q.rule==='reverse'?'Wähle das Objekt mit dem kleineren Wert.':'Wähle das Objekt mit dem höheren Wert.'}else if(EST.onlineState)renderEstimateOnline(EST.onlineState)}
 };
 GAME_UX.timer=setInterval(tick,200);tick();
}
function showCurrentRules(){
 closeRulePreview();const game=GAME_WORLD||LOBBY_GAME||'moreless',mode=game==='estimate'?EST.mode:SOLO.on?SOLO.mode:S.roomConfig?.game_mode||LOBBY_MODE;
 const rule=game==='moreless'&&String(mode).toUpperCase()==='CHAOS'?(SOLO.on?SOLO.chaosRule?.id:S.questionData?.[S.q]?.rule):null;
 fillRulePreview(gameRules(game,mode,rule),'SPIELREGELN');el('gameRuleStart').disabled=false;el('gameRuleStart').textContent='Weiter spielen';el('gameRuleCancel').textContent='Schließen';GAME_UX.onStart=closeRulePreview;
 if((game==='estimate'&&EST.mode==='blitz')||String(mode).toUpperCase()==='BLITZ'||rule==='blitz'||rule==='sprint')el('gameRuleContext').textContent='SPIELREGELN · DER COUNTDOWN LÄUFT WEITER';
}
function renderWaiting(id,state,questionId,open){
 const box=el(id);if(!box)return;const visible=!!open&&state?.active&&state.question_id===questionId&&(state.players||[]).length>1;
 box.classList.toggle('hide',!visible);if(!visible)return;
 const players=state.players,pending=players.filter(p=>!p.answered),done=players.length-pending.length;
 const title=box.querySelector('[data-wait-count]'),names=box.querySelector('[data-wait-names]');
 const count=done+' von '+players.length+' Antworten gespeichert';if(title.textContent!==count)title.textContent=count;
 const labels=pending.slice(0,3).map(p=>(p.user_id===S.uid?'Du':p.name||'Spieler')+(p.connected===false?' (Verbindung unterbrochen)':''));
 const detail=pending.length?'Noch offen: '+labels.join(', ')+(pending.length>3?' und '+(pending.length-3)+' weitere':''):'Alle Antworten sind da – Auswertung läuft.';
 if(names.textContent!==detail)names.textContent=detail;
 box.querySelector('progress').max=players.length;box.querySelector('progress').value=done;
}
