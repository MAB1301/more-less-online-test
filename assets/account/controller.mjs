import {createAccountSession} from './session.mjs?v=accounts-content-13';
const client=createAccountSession({url:SUPABASE_URL,key:KEY,storage:localStorage});
window.gameAccount=client;
let profile=null,accountBusy=false,loading=false,settingsTimer=null;
const $=id=>document.getElementById(id),message=text=>{$('accountMenuStatus').textContent=text};
const errorText=error=>/email_address_not_authorized|email.*not.*authorized/i.test(error.message)?'Der E-Mail-Versand ist im Projekt noch nicht für diese Adresse eingerichtet.':error.status===409?'Dieser Benutzername oder diese Freundschaft existiert bereits.':error.message;
const redirect=()=>location.origin+location.pathname;
function activeMatch(){return !!S.room||DAILY.busy||!!(DAILY.data?.attempt&&!DAILY.data.attempt.complete)}
function backupGuest(){try{const saved=localStorage.getItem('ml_account_auth_v1');if(saved&&JSON.parse(saved).guest)localStorage.setItem('ml_guest_account_backup_v1',saved);if(!localStorage.getItem('ml_guest_appearance_backup_v1'))localStorage.setItem('ml_guest_appearance_backup_v1',JSON.stringify({profile:localStorage.getItem('ml_guest_profile_v1'),preferences:localStorage.getItem('ml_game_preferences_v1')}))}catch{}}
async function renderAccount(){
 const auth=await client.current();const fixed=!!auth&&!auth.guest;
 $('accountModeLine').textContent=fixed?'Angemeldet · '+(profile?.handle?'@'+profile.handle:'Account'):'Du spielst als Gast.';
 $('accountProfileNote').textContent=fixed?'Profil und Einstellungen im Account':'Gastprofil auf diesem Gerät';
 $('accountAuthControls').classList.toggle('hide',fixed);
 $('accountMemberControls').classList.toggle('hide',!fixed);
 $('accountHandleField').classList.toggle('hide',!fixed);
 if(profile)$('accountHandle').value=profile.handle;
 renderGuestProfile();
}
async function loadAccount(){
 loading=true;
 try{
  const auth=await client.current();if(!auth||auth.guest){profile=null;await renderAccount();return}
  const user=await client.user();if(user.is_anonymous||!user.email_confirmed_at)throw Error('Bitte zuerst deine E-Mail-Adresse bestätigen.');
  profile=await client.readProfile();
  if(!profile){const handle='spieler_'+auth.uid.replaceAll('-','').slice(0,12);await client.profile(handle,getGuestProfile().name||'Spieler');profile=await client.readProfile()}
  let settings=await client.settings();if(!settings){await client.savePreferences(window.getGamePreferences(),getGuestProfile().photo);settings=await client.settings()}
  localStorage.setItem('ml_guest_profile_v1',JSON.stringify({name:profile.display_name,photo:settings?.avatar_data||''}));$('accountGuestName').value=profile.display_name;GUEST_PHOTO_DRAFT=settings?.avatar_data||'';
  if(settings)window.applyGamePreferences({muted:settings.muted,volume:settings.volume/100,reducedMotion:settings.reduced_motion});
  await renderAccount();await loadAccountFriends();
 }finally{loading=false}
}
window.accountPanelOpened=()=>{window.accountReady.then(()=>renderAccount()).catch(error=>message(errorText(error)))};
window.showAccountAuth=function showAccountAuth(mode){$('accountAuthForm').classList.remove('hide');$('accountAuthMode').value=mode;$('accountAuthTitle').textContent=mode==='register'?'Account erstellen':'Anmelden';$('accountAuthSubmit').textContent=mode==='register'?'Account erstellen':'Anmelden';$('accountPassword').autocomplete=mode==='register'?'new-password':'current-password';$('accountRegistrationNote').classList.toggle('hide',mode!=='register');$('accountEmail').focus()};
window.submitAccountAuth=async function submitAccountAuth(event){
 event.preventDefault();if(accountBusy)return;if(activeMatch()){message('Beende zuerst deine laufende Daily-Runde oder verlasse die Lobby, bevor du den Account wechselst.');return}
 const email=$('accountEmail').value.trim(),password=$('accountPassword').value,mode=$('accountAuthMode').value;if(mode==='register'&&password.length<8){message('Bitte ein Passwort mit mindestens 8 Zeichen wählen.');return}
 accountBusy=true;$('accountAuthSubmit').disabled=true;message('Anmeldung wird bearbeitet …');
 try{
  backupGuest();clearTimeout(settingsTimer);
  if(mode==='register'){const result=await client.registerNew(email,password,redirect());if(result.confirmationRequired){message('Bitte bestätige die E-Mail. Danach kehre auf diese Seite zurück und melde dich an. Dein Gastzugang bleibt bis dahin aktiv.');return}}
  else await client.login(email,password);
  // Keep existing guest Daily credentials; fixed accounts use their own shared identity.
  DAILY.auth=null;DAILY.data=null;S.token=null;S.uid=null;
  await loadAccount();$('accountAuthForm').classList.add('hide');message('Du bist angemeldet. Dein Profil und deine Einstellungen werden im Account gespeichert.');
 }catch(error){message(errorText(error))}finally{accountBusy=false;$('accountAuthSubmit').disabled=false;$('accountPassword').value=''}
};
window.logoutAccount=async function logoutAccount(){
 if(accountBusy)return;if(activeMatch()){message('Beende zuerst deine Daily-Runde oder verlasse die Lobby, bevor du dich abmeldest.');return}
 accountBusy=true;clearTimeout(settingsTimer);
 try{await client.logout()}catch{message('Auf diesem Gerät abgemeldet. Die Server-Abmeldung konnte nicht bestätigt werden.')}
 try{const guest=localStorage.getItem('ml_guest_account_backup_v1');if(guest)localStorage.setItem('ml_account_auth_v1',guest);const backup=JSON.parse(localStorage.getItem('ml_guest_appearance_backup_v1')||'null');if(backup){for(const [key,value] of [['ml_guest_profile_v1',backup.profile],['ml_game_preferences_v1',backup.preferences]]){if(value)localStorage.setItem(key,value);else localStorage.removeItem(key)}localStorage.removeItem('ml_guest_appearance_backup_v1');window.applyGamePreferences(JSON.parse(backup.preferences||'{}'))}profile=null;DAILY.auth=null;DAILY.data=null;S.token=null;S.uid=null;await renderAccount();message('Abgemeldet. Du spielst wieder als Gast.')}catch(error){message(errorText(error))}finally{accountBusy=false}
};
window.saveAccountPreferences=function saveAccountPreferences(){if(loading)return;clearTimeout(settingsTimer);settingsTimer=setTimeout(async()=>{try{const auth=await client.current();if(auth&&!auth.guest){await client.savePreferences(window.getGamePreferences(),getGuestProfile().photo);$('preferencesStatus').textContent='Im Account gespeichert.'}}catch(error){$('preferencesStatus').textContent='Nur auf diesem Gerät gespeichert: '+errorText(error)}},500)};
window.saveAccountProfile=async function saveAccountProfile(){
 const auth=await client.current();if(!auth||auth.guest)return;if(accountBusy)throw Error('Bitte die laufende Account-Aktion abwarten.');accountBusy=true;try{
 const handle=$('accountHandle').value.trim().toLowerCase();if(!/^[a-z0-9_]{3,24}$/.test(handle))throw Error('Benutzername: 3–24 kleine Buchstaben, Zahlen oder Unterstriche.');
 await client.updateProfile(handle,getGuestProfile().name);await client.savePreferences(window.getGamePreferences(),getGuestProfile().photo);profile=await client.readProfile();await renderAccount();message('Profil im Account gespeichert.');}finally{accountBusy=false}
};
window.loadAccountFriends=async function loadAccountFriends(){
 const auth=await client.current();if(!auth||auth.guest)return;
 const list=$('accountFriendsList');list.replaceChildren();
 const friends=await client.friends(),ids=[...new Set(friends.map(f=>f.sender_id===auth.uid?f.recipient_id:f.sender_id))],profiles=await client.friendProfiles(ids);
 if(!friends.length){list.textContent='Noch keine Freunde. Füge jemanden über den Benutzernamen hinzu.';return}
 for(const f of friends){const other=f.sender_id===auth.uid?f.recipient_id:f.sender_id,p=profiles.find(p=>p.user_id===other),row=document.createElement('div'),label=document.createElement('span');row.className='accountFriendRow';label.textContent=(p?.display_name||'Spieler')+' · @'+(p?.handle||'unbekannt')+(f.status==='pending'?(f.recipient_id===auth.uid?' · Anfrage erhalten':' · Anfrage gesendet'):'');row.append(label);
  function action(text,fn){const button=document.createElement('button');button.type='button';button.textContent=text;button.onclick=async()=>{button.disabled=true;try{await fn();await loadAccountFriends()}catch(error){message(errorText(error));button.disabled=false}};row.append(button)}
  if(f.status==='pending'&&f.recipient_id===auth.uid)action('Annehmen',()=>client.acceptFriend(f.sender_id));
  action(f.status==='accepted'?'Entfernen':'Ablehnen / zurückziehen',()=>client.removeFriend(f.sender_id,f.recipient_id));list.append(row);
 }
};
window.addAccountFriend=async function addAccountFriend(event){event.preventDefault();if(accountBusy)return;const handle=$('accountFriendHandle').value.trim().toLowerCase();if(!/^[a-z0-9_]{3,24}$/.test(handle)){message('Bitte einen gültigen Benutzernamen eingeben.');return}accountBusy=true;try{const target=await client.findProfile(handle),auth=await client.current();if(!target)throw Error('Kein Account mit diesem Benutzernamen gefunden.');if(target.user_id===auth.uid)throw Error('Du kannst dich nicht selbst hinzufügen.');await client.requestFriend(target.user_id);await loadAccountFriends();message('Freundesanfrage gesendet.');$('accountFriendHandle').value=''}catch(error){message(errorText(error))}finally{accountBusy=false}};
window.recoverAccount=async function recoverAccount(){const email=$('accountEmail').value.trim();if(!email||!$('accountEmail').checkValidity()){message('Gib zuerst deine E-Mail-Adresse ein.');return}try{await client.recover(email,redirect());message('Falls ein Account existiert, bekommst du eine E-Mail zum Zurücksetzen.')}catch(error){message(errorText(error))}};
window.setRecoveredPassword=async function setRecoveredPassword(event){event.preventDefault();const password=$('accountRecoveryPassword').value;if(password.length<8){message('Mindestens 8 Zeichen verwenden.');return}try{await client.changePassword(password);$('accountRecoveryForm').classList.add('hide');message('Passwort geändert.')}catch(error){message(errorText(error))}finally{$('accountRecoveryPassword').value=''}};
window.accountReady=(async()=>{
 const hash=new URLSearchParams(location.hash.slice(1));if(hash.has('access_token')){const token=hash.get('access_token'),refresh=hash.get('refresh_token'),recovery=hash.get('type')==='recovery';history.replaceState(null,'',location.pathname+location.search);if(refresh){backupGuest();await client.importCallback(token,refresh,Number(hash.get('expires_in'))||3600);if(recovery){openAccountMenu();$('accountRecoveryForm').classList.remove('hide')}}}
 await loadAccount();
})().catch(async error=>{if(error.status===400||error.status===401){client.forget();profile=null;await renderAccount();message('Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.')}else message(errorText(error));return null});
