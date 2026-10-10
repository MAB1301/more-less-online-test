/* Presentation-only improvements: no changes to room state, scoring or identity. */
function openDailyLeaderboards(){
 const dialog=document.getElementById('dailyLeaderboardChooser');
 if(!dialog.open)dialog.showModal();
}
(function(){
 const dock=document.getElementById('accountDock'),profile=document.getElementById('accountButton');
 dock.classList.add('quickAccessDock');
 const profileLabel=document.createElement('span');profileLabel.className='quickProfileLabel';profileLabel.textContent='Profil';profile.append(profileLabel);
 const menuToggle=document.createElement('button');menuToggle.type='button';menuToggle.id='quickAccessToggle';menuToggle.textContent='Menü ▾';menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-controls','quickAccessMenu');
 const menu=document.createElement('nav');menu.id='quickAccessMenu';menu.className='quickAccessMenu';menu.setAttribute('aria-label','Schnellzugriff');
 const profileShortcut=document.createElement('button');profileShortcut.type='button';profileShortcut.className='quickProfileShortcut';profileShortcut.textContent='Profil';profileShortcut.onclick=()=>profile.click();menu.append(profileShortcut);
 const preferences=document.getElementById('comfortOpen'),shop=document.getElementById('cosmeticOpen'),friends=document.querySelector('.inviteCenterOpen');
 preferences.textContent='Einstellungen';shop.textContent='Shop';
 friends.firstChild.textContent='Freunde';friends.setAttribute('aria-label','Freunde, Einladungen und Lobby öffnen');friends.setAttribute('aria-haspopup','dialog');
 menu.append(preferences,shop,friends);dock.append(menuToggle,menu);
 function collapse(returnFocus=false){dock.classList.remove('quickAccessExpanded');menuToggle.setAttribute('aria-expanded','false');if(returnFocus)menuToggle.focus()}
 menuToggle.onclick=()=>{const expanded=dock.classList.toggle('quickAccessExpanded');menuToggle.setAttribute('aria-expanded',String(expanded));if(expanded)menu.querySelector('button').focus()};
 menu.addEventListener('click',event=>{if(event.target.closest('button'))collapse()});
 document.addEventListener('click',event=>{if(!dock.contains(event.target))collapse()});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&dock.classList.contains('quickAccessExpanded')){event.preventDefault();collapse(true)}});
 for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('close',()=>{if(window.matchMedia('(max-width: 700px)').matches&&menu.contains(document.activeElement))menuToggle.focus()});
 document.getElementById('inviteCenterTitle').textContent='Freunde & Lobby';
 const friendsManage=document.createElement('button');friendsManage.type='button';friendsManage.textContent='Freunde verwalten →';
 friendsManage.onclick=()=>{closeInviteCenter();openAccountMenu();const list=document.querySelector('.accountFriends');if(list)list.open=true};
 document.getElementById('inviteCenterList').after(friendsManage);
 const account=document.getElementById('accountMenu');
 const auth=document.getElementById('accountAuthControls');
 account.querySelector('.accountMenuPanel>header').after(auth);
 auth.querySelector('b').textContent='Dein Profil auf allen Geräten';
 auth.querySelector('p').textContent='Melde dich an, um dein Profil, Freunde und Account-Daily-Ergebnisse auf deinen Geräten zu nutzen.';
 auth.querySelector('button').classList.add('p');
 const appearance=document.querySelector('#cosmeticShop .studioCollectionBar');
 const shopTabs=document.querySelector('#cosmeticShop>.studioTabs');
 appearance.classList.add('shopStylePreview');shopTabs.before(appearance);
 const shopIntro=document.createElement('p');shopIntro.className='shopIntro';shopIntro.textContent='Dein Look für den nächsten Spieleabend. Vorschau ansehen, dann auswählen.';shopTabs.before(shopIntro);
 const settingDescriptions=['Sounds für Antworten und Aktionen.','Dein Hintergrundtrack für den Spieleabend.','Der Sound für deinen nächsten Online-Sieg.'];
 document.querySelectorAll('#studioSettings-ton .studioSettingGroup').forEach((group,i)=>{const description=document.createElement('p');description.className='settingDescription';description.textContent=settingDescriptions[i];group.querySelector('h3').after(description)});
 function paintRange(input){const min=Number(input.min)||0,max=Number(input.max)||100,percent=Math.max(0,Math.min(100,(Number(input.value)-min)/(max-min)*100));input.style.setProperty('--range-fill',percent+'%')}
 const ranges=[...document.querySelectorAll('#comfortDialog input[type="range"]')];
 for(const range of ranges){paintRange(range);range.addEventListener('input',()=>paintRange(range))}
 document.getElementById('comfortOpen').addEventListener('click',()=>ranges.forEach(paintRange));
 window.addEventListener('gamepreferenceschange',()=>ranges.forEach(paintRange));
 const shortcut=document.createElement('button');shortcut.type='button';shortcut.className='accountPreferencesShortcut';shortcut.textContent='Spiel & Ton →';
 shortcut.onclick=()=>{closeAccountMenu();document.getElementById('comfortOpen').click()};
 account.querySelector('.gamePreferences,.accountPreferences').before(shortcut);
 const settings=document.getElementById('friendlySettings'),footer=document.createElement('footer');footer.className='friendlyFooter';
 footer.append(document.getElementById('friendlySettingsSummary'),document.getElementById('friendlySettingsStatus'),settings.querySelector('.friendlyApply'));settings.append(footer);
 const optional=document.createElement('details'),optionalTitle=document.createElement('summary');optional.className='accountScopeDetails';optionalTitle.textContent='Fragenqualität unterstützen';optional.append(optionalTitle);const quality=account.querySelector('.qualityPreference');quality.before(optional);optional.append(quality);
 const dialog=document.createElement('dialog');dialog.id='dailyLeaderboardChooser';dialog.setAttribute('aria-labelledby','dailyLeaderboardChooserTitle');
 const header=document.createElement('header'),title=document.createElement('h2'),close=document.createElement('button');
 title.id='dailyLeaderboardChooserTitle';title.textContent='Bestenliste wählen';close.type='button';close.textContent='×';close.setAttribute('aria-label','Bestenlisten schließen');close.onclick=()=>dialog.close();header.append(title,close);
 const choices=document.createElement('div');choices.className='dailyLeaderboardChoices';
 for(const [game,label] of [['moreless','MORE / LESS'],['estimate','SCHÄTZDUELL'],['facts','FAKT ODER FAKE']]){
  const button=document.createElement('button');button.type='button';button.textContent=label+' →';
  button.onclick=()=>{dialog.close();selectDailyGame(game,true)};choices.append(button);
 }
 dialog.append(header,choices);dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});document.body.append(dialog);
})();
