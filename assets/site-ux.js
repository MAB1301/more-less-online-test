/* Site-wide entry and navigation; game state remains owned by the game engines. */
function siteRoundActive(){return !!S.room||!!SOLO.on||['estimateGame','jeopGame','factGame'].some(id=>{const n=document.getElementById(id);return n&&!n.classList.contains('hide')})||!!(DAILY.data?.attempt&&!DAILY.data.attempt.complete)}
function siteEntry(kind){
 if(siteRoundActive()){siteMainMenu();return}
 if(kind==='online'){openFriendsMenu(GAME_WORLD,document.getElementById('siteOnlineStart'));return}
 if(GAME_WORLD==='quiz'){document.getElementById('worldMenu').dataset.options='teams';openJeopTeamSetup();return}
 if(GAME_WORLD==='facts'){startFactCheck();return}
 document.getElementById('worldMenu').classList.add('hide');
 if(GAME_WORLD==='estimate'){document.getElementById('estimateGame').classList.remove('hide');startEstimateSolo()}else playSolo();
}
function siteChoosePlayType(){const world=document.getElementById('worldMenu');world.dataset.options='closed';document.getElementById('worldMenuTag').textContent='Wie möchtest du spielen?';siteEntryUpdate();document.getElementById('siteLocalStart').focus();world.scrollTop=0}
function siteShowModes(){const world=document.getElementById('worldMenu');world.dataset.options='open';document.getElementById('worldMenuTag').textContent={moreless:'Wähle deinen MORE / LESS Modus',estimate:'Wähle deinen Schätzmodus',quiz:'Wähle dein Jeopardy-Board',facts:'Wähle Level und Regeln'}[GAME_WORLD];document.getElementById('siteOptions').setAttribute('aria-expanded','true');siteEntryUpdate();world.scrollTop=0}
function siteToggleOptions(){siteShowModes()}
function siteEntryUpdate(){
 const quiz=GAME_WORLD==='quiz',facts=GAME_WORLD==='facts';
 document.getElementById('siteLocalStart').textContent=quiz?'Lokal · 2 Teams starten':'Solo starten';
 document.getElementById('siteOnlineStart').hidden=false;
 document.getElementById('siteEntryNote').textContent=facts?'Solo: gewähltes Level · Online: 10 gemeinsame Aussagen, 60 Sekunden pro Frage':quiz?'Lokal auf einem Gerät oder online in einer gemeinsamen Lobby':'Direkt losspielen oder eine Online-Lobby erstellen / betreten';
 document.getElementById('siteSelection').textContent=GAME_WORLD==='moreless'?document.getElementById('chosenMode').textContent:GAME_WORLD==='estimate'?EST.mode:quiz?JEOP.mode:FACT_LEVEL_NAMES[FACT_DIFFICULTY];
 const next=document.getElementById('siteModeContinue');if(next)next.textContent='Weiter mit '+document.getElementById('siteSelection').textContent+' →';
}
function siteMainMenu(){
 if(!siteRoundActive()){if(document.getElementById('friendsMenu').open)closeFriendsMenu();closeWorldMenu();return}
 const d=document.getElementById('siteNavigation');if(!d.open)d.showModal();document.getElementById('siteResume').focus();
}
function siteResume(){document.getElementById('siteNavigation').close()}
function siteBack(){
 if(document.getElementById('siteNavigation').open){siteResume();return}
 if(siteRoundActive()){siteMainMenu();return}
 if(!document.getElementById('worldMenu').classList.contains('hide')){if(document.getElementById('worldMenu').dataset.options==='closed')siteShowModes();else menuBack()}else closeWorldMenu();
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
 const next=document.createElement('button');next.type='button';next.id='siteModeContinue';next.className='p siteModeContinue';next.onclick=siteChoosePlayType;document.querySelector('#worldMenu .homeMain').append(next);
 document.getElementById('siteOptions').textContent='← Anderen Modus wählen';
 document.querySelector('.siteEntrySteps').textContent='SPIEL → MODUS → SOLO / ONLINE → START';
 const originalMenuBack=menuBack;menuBack=function(){const world=document.getElementById('worldMenu');if(!world.classList.contains('hide')&&world.dataset.options==='closed'){siteShowModes();return}if(world.dataset.options==='teams'){originalMenuBack();siteChoosePlayType();return}return originalMenuBack()};
 const original=openWorldMenu;openWorldMenu=function(w){original(w);document.getElementById('worldMenu').dataset.options='open';document.getElementById('siteOptions').setAttribute('aria-expanded','true');siteEntryUpdate()};
 document.getElementById('worldMenu').addEventListener('click',()=>siteEntryUpdate());
 document.getElementById('siteNavigation').addEventListener('click',event=>{if(event.target===event.currentTarget)siteResume()});
 siteIdentityUpdate(false);siteEntryUpdate();
})();
