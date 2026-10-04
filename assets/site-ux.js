/* Site-wide entry and navigation; game state remains owned by the game engines. */
function siteRoundActive(){return !!S.room||!!SOLO.on||['estimateGame','jeopGame','factGame'].some(id=>{const n=document.getElementById(id);return n&&!n.classList.contains('hide')})||!!(DAILY.data?.attempt&&!DAILY.data.attempt.complete)}
function siteEntry(kind){
 if(siteRoundActive()){siteMainMenu();return}
 if(kind==='online'){openFriendsMenu(GAME_WORLD,document.getElementById('siteOnlineStart'));return}
 if(GAME_WORLD==='quiz'){document.getElementById('worldMenu').dataset.options='open';openJeopTeamSetup();return}
 if(GAME_WORLD==='facts'){startFactCheck();return}
 document.getElementById('worldMenu').classList.add('hide');
 if(GAME_WORLD==='estimate'){document.getElementById('estimateGame').classList.remove('hide');startEstimateSolo()}else playSolo();
}
function siteToggleOptions(){const n=document.getElementById('worldMenu'),open=n.dataset.options!=='open';n.dataset.options=open?'open':'closed';document.getElementById('siteOptions').setAttribute('aria-expanded',String(open))}
function siteEntryUpdate(){
 const quiz=GAME_WORLD==='quiz',facts=GAME_WORLD==='facts';
 document.getElementById('siteLocalStart').textContent=quiz?'Lokal · 2 Teams starten':'Solo starten';
 document.getElementById('siteOnlineStart').hidden=false;
 document.getElementById('siteEntryNote').textContent=facts?'Solo: gewähltes Level · Online: 10 gemeinsame Aussagen, 60 Sekunden pro Frage':quiz?'Lokal auf einem Gerät oder online in einer gemeinsamen Lobby':'Direkt losspielen oder eine Online-Lobby erstellen / betreten';
 document.getElementById('siteSelection').textContent=GAME_WORLD==='moreless'?document.getElementById('chosenMode').textContent:GAME_WORLD==='estimate'?EST.mode:quiz?JEOP.mode:FACT_LEVEL_NAMES[FACT_DIFFICULTY];
}
function siteMainMenu(){
 if(!siteRoundActive()){if(document.getElementById('friendsMenu').open)closeFriendsMenu();closeWorldMenu();return}
 const d=document.getElementById('siteNavigation');if(!d.open)d.showModal();document.getElementById('siteResume').focus();
}
function siteResume(){document.getElementById('siteNavigation').close()}
function siteBack(){
 if(document.getElementById('siteNavigation').open){siteResume();return}
 if(siteRoundActive()){siteMainMenu();return}
 if(!document.getElementById('worldMenu').classList.contains('hide'))menuBack();else closeWorldMenu();
}
function siteEndRound(){
 siteResume();if(S.room){leaveMatch();return}
 if(!document.getElementById('factGame').classList.contains('hide'))closeFactCheck();
 else if(!document.getElementById('jeopGame').classList.contains('hide'))endJeopardy();
 else if(SOLO.on)exitSoloToModes();
 else if(!document.getElementById('estimateGame').classList.contains('hide')){clearInterval(EST.timer);document.getElementById('estimateGame').classList.add('hide');openWorldMenu('estimate')}
 else if(typeof closeDaily==='function')closeDaily();
}
function siteIdentityCopy(fixed){return fixed?{badge:'Account · geräteübergreifend',copy:'Melde dich auf Handy und Tablet mit demselben Account an. Profil, Einstellungen und Account-Daily-Ergebnisse gehören zu diesem Account. Frühere Gast-Ergebnisse bleiben beim Gastzugang; sie werden nicht automatisch übertragen.'}:{badge:'Gast · dieser Browser',copy:'Dein Gastprofil und deine Daily-Ergebnisse gehören zu diesem Browser. Ein anderes Gerät oder Browser hat einen eigenen Gastzugang. Für gemeinsame Account-Daily-Ergebnisse auf Handy und Tablet: auf beiden mit demselben Account anmelden.'}}
function siteIdentityUpdate(fixed){const copy=siteIdentityCopy(fixed),badge=document.getElementById('siteIdentity'),note=document.getElementById('siteAccountScope');if(badge)badge.textContent=copy.badge;if(note)note.textContent=copy.copy}
(function initSiteUX(){
 const original=openWorldMenu;openWorldMenu=function(w){original(w);document.getElementById('worldMenu').dataset.options='closed';document.getElementById('siteOptions').setAttribute('aria-expanded','false');siteEntryUpdate()};
 document.getElementById('worldMenu').addEventListener('click',()=>siteEntryUpdate());
 document.getElementById('siteNavigation').addEventListener('click',event=>{if(event.target===event.currentTarget)siteResume()});
 siteIdentityUpdate(false);siteEntryUpdate();
})();
