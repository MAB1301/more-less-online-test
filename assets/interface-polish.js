/* Presentation-only improvements: no changes to room state, scoring or identity. */
function openDailyLeaderboards(){
 const dialog=document.getElementById('dailyLeaderboardChooser');
 if(!dialog.open)dialog.showModal();
}
(function(){
 const account=document.getElementById('accountMenu');
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
