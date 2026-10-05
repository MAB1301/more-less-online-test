const PLAYER_HUB={busy:false,historyUID:null,historyFlight:null,remote:{},historyWrites:Promise.resolve(),pendingRuns:new Map()};
const PLAYER_HISTORY_KEYS={moreless:'ml_comparison_recent_v1',estimate:'ml_estimate_recent_v1',facts:'ml_fact_recent_v1',quiz:'ml_jeop_history_v2'};
const PLAYER_GAME_NAMES={moreless:'More / Less',estimate:'Schätzduell',facts:'Fakt oder Fake',quiz:'Jeopardy'};
async function playerHubRpc(action,data={}){if(window.accountReady)await window.accountReady;const auth=await window.gameAccount?.current();if(auth&&!auth.guest)return window.gameAccount.authorized('/rest/v1/rpc/ml_player_hub',{p_action:action,p_data:data});await dailyAuth();return dailyFetch('/rest/v1/rpc/ml_player_hub',{p_action:action,p_data:data},DAILY.auth.token)}
async function syncPlayerHistory(){if(PLAYER_HUB.historyFlight)return PLAYER_HUB.historyFlight;PLAYER_HUB.historyFlight=(async()=>{if(window.accountReady)await window.accountReady;const auth=navigator.onLine===false?localPlayerIdentity():await window.gameAccount?.current();if(!auth||auth.guest){if(PLAYER_HUB.historyUID){for(const [g,k] of Object.entries(PLAYER_HISTORY_KEYS)){const guest=localStorage.getItem(k+'_guest_backup');if(guest)localStorage.setItem(k,guest);else localStorage.removeItem(k)}PLAYER_HUB.historyUID=null;PLAYER_HUB.remote={}}return}if(PLAYER_HUB.historyUID!==auth.uid){for(const key of Object.values(PLAYER_HISTORY_KEYS)){if(!PLAYER_HUB.historyUID)localStorage.setItem(key+'_guest_backup',localStorage.getItem(key)||'[]');else localStorage.setItem(key+'_account_'+PLAYER_HUB.historyUID,localStorage.getItem(key)||'[]');localStorage.setItem(key,localStorage.getItem(key+'_account_'+auth.uid)||'[]')}PLAYER_HUB.historyUID=auth.uid;PLAYER_HUB.remote={}}if(navigator.onLine===false)return;await PLAYER_HUB.historyWrites;const data=await playerHubRpc('history');PLAYER_HUB.remote=data;for(const [g,k] of Object.entries(PLAYER_HISTORY_KEYS))localStorage.setItem(k,JSON.stringify((data[g]||[]).slice(-({moreless:400,estimate:100,facts:100,quiz:240}[g]))))})().catch(()=>{});try{await PLAYER_HUB.historyFlight}finally{PLAYER_HUB.historyFlight=null}}
function markPlayerHistory(game,keys){if(!PLAYER_HUB.historyUID||!keys.length)return;const uid=PLAYER_HUB.historyUID;PLAYER_HUB.historyWrites=PLAYER_HUB.historyWrites.then(async()=>{const auth=await window.gameAccount?.current();if(auth?.uid!==uid||auth.guest)return;const data=await playerHubRpc('history_mark',{[game]:keys.slice(-2000)});PLAYER_HUB.remote=data}).catch(()=>{})}
function personalRunMode(game){return game==='moreless'?SOLO.on?SOLO.mode:LOBBY_MODE:game==='estimate'?EST.mode:game==='facts'?FACT.online?'online-classic':(FACT.playMode||'classic')+'-'+FACT_DIFFICULTY:JEOP.mode}
function personalMetrics(rows){const answers=rows.filter(r=>typeof r.ok==='boolean');let streak=0,best=0;for(const row of answers){streak=row.ok?streak+1:0;best=Math.max(best,streak)}return {answered:answers.length,correct:answers.filter(r=>r.ok).length,best_streak:best}}
function localPlayerRuns(){const auth=localPlayerIdentity(),owner=auth&&!auth.guest?auth.uid:PLAYER_HUB.historyUID||'guest';try{const data=JSON.parse(localStorage.getItem('ml_personal_runs_v1_'+owner)||'[]');return Array.isArray(data)?data:[]}catch{return []}}
function renderPersonalSummary(game,mode,score,metrics,node){if(!node)return;node.replaceChildren();if(!metrics.answered)return;const previous=localPlayerRuns().find(r=>r.game===game&&r.mode===mode),accuracy=Math.round(metrics.correct/metrics.answered*100);const lines=[accuracy+' % Trefferquote',metrics.best_streak+' richtige Antworten in Folge'];if(previous&&previous.answered===metrics.answered)lines.push('Zum letzten Versuch: '+(score-previous.score>=0?'+':'')+(score-previous.score)+' Punkte');else if(previous)lines.push('Zum letzten Versuch: '+(accuracy-Math.round(previous.correct/previous.answered*100)>=0?'+':'')+(accuracy-Math.round(previous.correct/previous.answered*100))+' Prozentpunkte Trefferquote');for(const text of lines){const p=document.createElement('span');p.textContent=text;node.append(p)}}
const PLAYER_PENDING_KEY='ml_pending_personal_runs_v1';
function localPlayerIdentity(){return window.gameAccount?.peek?.()||null}
function persistPendingRuns(){localStorage.setItem(PLAYER_PENDING_KEY,JSON.stringify([...PLAYER_HUB.pendingRuns.values()]))}
try{const saved=JSON.parse(localStorage.getItem(PLAYER_PENDING_KEY)||'[]');if(Array.isArray(saved))for(const run of saved){if(run&&typeof run.owner==='string'&&typeof run.run_id==='string')PLAYER_HUB.pendingRuns.set(run.owner+':'+run.run_id,run)}}catch{}
let personalFlush=null;
async function flushPersonalRuns(){
 if(personalFlush)return personalFlush;if(navigator.onLine===false)return;
 personalFlush=(async()=>{const auth=await window.gameAccount?.current();if(!auth||auth.guest)return;
  for(const [id,run] of PLAYER_HUB.pendingRuns){if(run.owner!==auth.uid)continue;
   const current=await window.gameAccount.current();if(current?.uid!==auth.uid||current.guest)return;
   const {owner,...payload}=run;await window.gameAccount.authorized('/rest/v1/rpc/ml_player_hub',{p_action:'record',p_data:payload},'POST',{},auth.uid);
   PLAYER_HUB.pendingRuns.delete(id);persistPendingRuns();
  }
 })();try{await personalFlush}finally{personalFlush=null}
}
async function savePersonalRun(run){
 const auth=localPlayerIdentity()||await window.gameAccount?.current().catch(()=>null),owner=auth&&!auth.guest?auth.uid:'guest';
 let runs;try{runs=JSON.parse(localStorage.getItem('ml_personal_runs_v1_'+owner)||'[]')}catch{runs=[]}if(!Array.isArray(runs))runs=[];
 if(!runs.some(r=>r.run_id===run.run_id)){runs.unshift({...run,date:new Date().toISOString()});try{localStorage.setItem('ml_personal_runs_v1_'+owner,JSON.stringify(runs.slice(0,200)))}catch{}}
 if(auth&&!auth.guest){
  const id=auth.uid+':'+run.run_id;
  PLAYER_HUB.pendingRuns.set(id,{...run,owner:auth.uid});
  const status=document.getElementById('personalSyncStatus');
  try{persistPendingRuns()}catch{if(status)status.textContent='Account-Sicherung vorgemerkt, aber der Gerätespeicher ist voll. Bitte online synchronisieren.';return}
  try{await flushPersonalRuns();if(status)status.textContent=PLAYER_HUB.pendingRuns.has(id)?'Auf diesem Gerät gespeichert. Wird bei Internetverbindung mit deinem Account synchronisiert.':'Im Account gespeichert.'}
  catch{if(status)status.textContent='Auf diesem Gerät gespeichert. Account-Sicherung wird bei Internetverbindung erneut versucht.'}
 }
}
async function openPlayerHub(){await syncPlayerHistory();document.getElementById('playerHub').showModal();document.getElementById('playerHubClose').focus();if(PLAYER_HUB.busy)return;PLAYER_HUB.busy=true;const status=document.getElementById('playerHubStatus');status.textContent='Fortschritt wird geladen …';try{await flushPersonalRuns();const auth=await window.gameAccount?.current(),data=await playerHubRpc('profile');if(auth&&!auth.guest)localStorage.setItem('ml_player_profile_cache_v1_'+auth.uid,JSON.stringify(data));renderPlayerHub(data,!!auth&&!auth.guest);status.textContent='Daily-Ergebnisse werden vom Server gewertet. Solo-Bestleistungen sind deine persönlichen Spielaufzeichnungen.'}catch(error){const auth=localPlayerIdentity();let cached=null;try{if(auth&&!auth.guest)cached=JSON.parse(localStorage.getItem('ml_player_profile_cache_v1_'+auth.uid)||'null')}catch{}status.textContent='Offline: gespeicherter Fortschritt. Noch nicht synchronisierte Runden bleiben auf diesem Gerät.';renderPlayerHub(cached||{runs:[],daily:[],rewards:[]},!!cached)}finally{PLAYER_HUB.busy=false}}
window.addEventListener('online',()=>flushPersonalRuns().catch(()=>{}));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)flushPersonalRuns().catch(()=>{})});
setTimeout(()=>window.accountReady?.then(()=>flushPersonalRuns()).catch(()=>{}),0);
function closePlayerHub(){document.getElementById('playerHub').close()}
function renderPlayerHub(data,fixed){const list=document.getElementById('playerHubStats'),rewards=document.getElementById('playerHubRewards');list.replaceChildren();rewards.replaceChildren();let runs=data.runs;if(!fixed){const groups=new Map();for(const r of localPlayerRuns()){const key=r.game+'|'+r.mode;if(!groups.has(key))groups.set(key,{game:r.game,mode:r.mode,runs:0,best_score:r.score,answered:0,correct:0,best_streak:0});const g=groups.get(key);g.runs++;g.best_score=Math.max(g.best_score,r.score);g.answered+=r.answered;g.correct+=r.correct;g.best_streak=Math.max(g.best_streak,r.best_streak)}runs=[...groups.values()]}for(const r of runs){const p=document.createElement('p');p.textContent=(PLAYER_GAME_NAMES[r.game]||r.game)+' · '+r.mode+' · '+r.runs+' Runden · Rekord '+r.best_score+' P · '+Math.round(r.correct/Math.max(r.answered,1)*100)+' % · beste Serie '+r.best_streak;list.append(p)}for(const r of data.daily){const p=document.createElement('p');p.textContent=(PLAYER_GAME_NAMES[r.game]||r.game)+' Daily · '+r.completed+' abgeschlossen · Rekord '+r.best_score+' P';list.append(p)}if(!list.children.length)list.textContent='Dein Fortschritt erscheint nach der ersten abgeschlossenen Runde.';let bestRank=4;for(const r of data.rewards){bestRank=Math.min(bestRank,Number(r.rank));const badge=document.createElement('span');badge.className='placementReward rewardRank'+r.rank;badge.textContent=(r.period==='week'?'Wochen':'Tages')+'-'+(['','Gold','Silber','Bronze'][r.rank])+' · '+(PLAYER_GAME_NAMES[r.game]||r.game)+' · '+r.day;rewards.append(badge)}if(!data.rewards.length)rewards.textContent='Nach Ende eines Tages oder einer Woche erhalten Plätze 1–3 ein Abzeichen. Punktgleiche Spieler erhalten dieselbe Belohnung. Archiv-Abschlüsse nach Tagesende zählen dafür nicht.';document.getElementById('accountProfileAvatar').dataset.reward=bestRank<4?String(bestRank):'';document.getElementById('playerHubScope').textContent=fixed?'Account-Fortschritt auf deinen Geräten':'Gast: Solo-Fortschritt in diesem Browser'}
let EXTENDED_BOARD_REQUEST=0;
async function refreshExtendedLeaderboard(offset=0){
 const request=++EXTENDED_BOARD_REQUEST;
 const status=document.getElementById('extendedBoardStatus'),list=document.getElementById('extendedBoardList');
 const prev=document.getElementById('extendedBoardPrev'),next=document.getElementById('extendedBoardNext');
 const selection={game:DAILY.game,day:DAILY.day||undefined,period:document.getElementById('boardPeriod').value,scope:document.getElementById('boardScope').value,offset};
 const current=()=>request===EXTENDED_BOARD_REQUEST&&selection.game===DAILY.game&&selection.day===(DAILY.day||undefined)&&selection.period===document.getElementById('boardPeriod').value&&selection.scope===document.getElementById('boardScope').value;
 list.replaceChildren();prev.disabled=true;next.disabled=true;status.textContent='Bestenliste wird geladen …';
 try{
  const data=await playerHubRpc('board',selection);if(!current())return;
  for(const entry of data.leaderboard){
   const row=document.createElement('div');row.className='dailyBoardRow'+(entry.mine?' dailyMineRow':'');
   const rank=document.createElement('span');rank.textContent=entry.rank+'.';const name=document.createElement('span');name.textContent=entry.name+(entry.mine?' · Du':'');const score=document.createElement('span');score.textContent=entry.score+' P';row.append(rank,window.cosmeticPlayer?window.cosmeticPlayer(entry):name,score);list.append(row);
  }
  if(!data.total)list.textContent='Noch keine fristgerecht abgeschlossenen Ergebnisse für diese Auswahl.';
  const updated=new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date());
  status.textContent=data.start+' bis '+data.end+' (Enddatum exklusiv) · '+(data.settled?'Abgeschlossen':'Laufende Wertung')+' · '+data.total+' Spieler · Online aktualisiert '+updated+'. Archiv-Abschlüsse nach Tagesende zählen nicht.';
  prev.disabled=offset===0;next.disabled=offset+50>=data.total;
  prev.onclick=()=>refreshExtendedLeaderboard(Math.max(0,offset-50));next.onclick=()=>refreshExtendedLeaderboard(offset+50);
 }catch(error){
  if(!current())return;
  status.textContent='Bestenliste konnte nicht geladen werden: '+error.message;
  const retry=document.createElement('button');retry.type='button';retry.textContent='Erneut laden';retry.onclick=()=>refreshExtendedLeaderboard(offset);list.append(retry);
 }
}
(function initPlayerHub(){
 for(const name of ['playSolo','startEstimateSolo','startFactCheck','startJeopardy','startAutomaticOnlineCategory']){const original=window[name];window[name]=async function(...args){await syncPlayerHistory();return original.apply(this,args)}}
 const selections=[['selectComparisonQuestions','moreless',q=>comparisonIdentity(q)],['selectEstimateQuestions','estimate',q=>q.q],['factRound','facts',q=>q.s]];
 for(const [name,game,key] of selections){const original=window[name];window[name]=function(...args){const chosen=original.apply(this,args);markPlayerHistory(game,chosen.map(key));return chosen}}
 const originalBuild=buildJeopData;buildJeopData=function(...args){const result=originalBuild.apply(this,args);if(!S.room)markPlayerHistory('quiz',JEOP.data.flatMap(cat=>cat[1].map(q=>jeopQuestionKey(cat[0],q))));return result};
 const originalEnd=showLocalEnd;showLocalEnd=function(game,summary,rows){document.getElementById('personalRoundStats').replaceChildren();document.getElementById('personalSyncStatus').textContent='';const result=originalEnd(game,summary,rows),metrics=personalMetrics(rows),mode=personalRunMode(game),score=game==='moreless'?SOLO.score:game==='estimate'?EST.score:game==='facts'?FACT.score:Math.max(...JEOP.scores);if(!S.room&&metrics.answered){renderPersonalSummary(game,mode,score,metrics,document.getElementById('personalRoundStats'));savePersonalRun({run_id:QUESTION_QUALITY.round,game,mode,score,...metrics})}return result};
 const originalFinish=showFinish;showFinish=async function(...args){const result=await originalFinish.apply(this,args);const rows=Object.entries(S.answerHistory||{}).sort((a,b)=>Number(a[0])-Number(b[0])).map(([,ok])=>({ok})),metrics=personalMetrics(rows),score=Number(S.lastScores?.[S.uid]?.score||0),mode='online-'+LOBBY_MODE;if(metrics.answered){renderPersonalSummary('moreless',mode,score,metrics,document.getElementById('onlinePersonalStats'));savePersonalRun({run_id:S.room+'-'+S.questionId,game:'moreless',mode,score,...metrics})}return result};const originalScores=showDailyScores;showDailyScores=function(show){originalScores(show);if(!show)EXTENDED_BOARD_REQUEST++};
 const originalDailyRender=renderDailyHome;renderDailyHome=function(...args){const result=originalDailyRender.apply(this,args);if(DAILY.scores)refreshExtendedLeaderboard();return result};window.accountReady?.then(()=>syncPlayerHistory());
})();
