import {createAccountSession} from './session.mjs?v=high-release-20261004';
const client=createAccountSession({url:SUPABASE_URL,key:KEY,storage:localStorage});
window.gameAccount=client;
let profile=null,accountBusy=false,loading=false,settingsTimer=null;
const $=id=>document.getElementById(id),message=text=>{$('accountMenuStatus').textContent=text};
const errorText=error=>/email_address_not_authorized|email.*not.*authorized/i.test(error.message)?'Der E-Mail-Versand ist im Projekt noch nicht für diese Adresse eingerichtet.':error.status===409?'Dieser Benutzername oder diese Freundschaft existiert bereits.':error.message;
const redirect=()=>location.origin+location.pathname;
function playingSolo(){return !!SOLO.on||['estimateGame','jeopGame','factGame'].some(id=>$(id)&&!$(id).classList.contains('hide'))}
function activeMatch(){return !!S.room||DAILY.busy||!!(DAILY.data?.attempt&&!DAILY.data.attempt.complete&&!$('dailyOverlay').classList.contains('hide'))}
function backupGuest(){try{const saved=localStorage.getItem('ml_account_auth_v1');if(saved&&JSON.parse(saved).guest)localStorage.setItem('ml_guest_account_backup_v1',saved);if(!localStorage.getItem('ml_guest_appearance_backup_v1'))localStorage.setItem('ml_guest_appearance_backup_v1',JSON.stringify({profile:localStorage.getItem('ml_guest_profile_v1'),preferences:localStorage.getItem('ml_game_preferences_v1')}))}catch{}}
async function renderAccount(){
 const auth=await client.current();const fixed=!!auth&&!auth.guest;
 if(typeof window.siteIdentityUpdate==='function')window.siteIdentityUpdate(fixed);void window.syncPlayerHistory?.();
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
window.accountPanelOpened=()=>{window.accountReady.then(async()=>{await renderAccount();await loadAccountFriends();await loadAccountInvitations()}).catch(error=>message(errorText(error)))};
window.showAccountAuth=function showAccountAuth(mode){$('accountAuthForm').classList.remove('hide');$('accountAuthMode').value=mode;$('accountAuthTitle').textContent=mode==='register'?'Account erstellen':'Anmelden';$('accountAuthSubmit').textContent=mode==='register'?'Account erstellen':'Anmelden';$('accountPassword').autocomplete=mode==='register'?'new-password':'current-password';$('accountRegistrationNote').classList.toggle('hide',mode!=='register');$('accountEmail').focus()};
window.submitAccountAuth=async function submitAccountAuth(event){
 event.preventDefault();if(accountBusy)return;if(activeMatch()||playingSolo()){message('Beende zuerst deine laufende Daily-Runde oder verlasse die Lobby, bevor du den Account wechselst.');return}
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
 if(accountBusy)return;if(activeMatch()||playingSolo()){message('Beende zuerst deine Daily-Runde oder verlasse die Lobby, bevor du dich abmeldest.');return}
 accountBusy=true;clearTimeout(settingsTimer);
 try{await client.logout()}catch{message('Auf diesem Gerät abgemeldet. Die Server-Abmeldung konnte nicht bestätigt werden.')}
 try{const guest=localStorage.getItem('ml_guest_account_backup_v1');if(guest)localStorage.setItem('ml_account_auth_v1',guest);const backup=JSON.parse(localStorage.getItem('ml_guest_appearance_backup_v1')||'null');if(backup){for(const [key,value] of [['ml_guest_profile_v1',backup.profile],['ml_game_preferences_v1',backup.preferences]]){if(value)localStorage.setItem(key,value);else localStorage.removeItem(key)}localStorage.removeItem('ml_guest_appearance_backup_v1');window.applyGamePreferences(JSON.parse(backup.preferences||'{}'))}profile=null;DAILY.auth=null;DAILY.data=null;S.token=null;S.uid=null;await renderAccount();await loadAccountInvitations();message('Abgemeldet. Du spielst wieder als Gast.')}catch(error){message(errorText(error))}finally{accountBusy=false}
};
window.saveAccountPreferences=function saveAccountPreferences(){if(loading)return;clearTimeout(settingsTimer);settingsTimer=setTimeout(async()=>{try{const auth=await client.current();if(auth&&!auth.guest){await client.savePreferences(window.getGamePreferences(),getGuestProfile().photo);$('preferencesStatus').textContent='Im Account gespeichert.'}}catch(error){$('preferencesStatus').textContent='Nur auf diesem Gerät gespeichert: '+errorText(error)}},500)};
window.saveAccountProfile=async function saveAccountProfile(){
 const auth=await client.current();if(!auth||auth.guest)return;if(accountBusy)throw Error('Bitte die laufende Account-Aktion abwarten.');accountBusy=true;try{
 const handle=$('accountHandle').value.trim().toLowerCase();if(!/^[a-z0-9_]{3,24}$/.test(handle))throw Error('Benutzername: 3–24 kleine Buchstaben, Zahlen oder Unterstriche.');
 await client.updateProfile(handle,getGuestProfile().name);await client.savePreferences(window.getGamePreferences(),getGuestProfile().photo);profile=await client.readProfile();await renderAccount();message('Profil im Account gespeichert.');}finally{accountBusy=false}
};
window.loadAccountFriends=async function loadAccountFriends(){
 const auth=await client.current();const list=$('accountFriendsList');list.replaceChildren();if(!auth||auth.guest)return;
 const friends=await client.friends(),ids=[...new Set(friends.map(f=>f.sender_id===auth.uid?f.recipient_id:f.sender_id))],profiles=await client.friendProfiles(ids);if((await client.current())?.uid!==auth.uid)return;
 if(!friends.length){list.textContent='Noch keine Freunde. Füge jemanden über den Benutzernamen hinzu.';return}
 for(const f of friends){const other=f.sender_id===auth.uid?f.recipient_id:f.sender_id,p=profiles.find(p=>p.user_id===other),row=document.createElement('div'),label=document.createElement('span');row.className='accountFriendRow';label.textContent=(p?.display_name||'Spieler')+' · @'+(p?.handle||'unbekannt')+(f.status==='pending'?(f.recipient_id===auth.uid?' · Anfrage erhalten':' · Anfrage gesendet'):'');row.append(label);
  function action(text,fn){const button=document.createElement('button');button.type='button';button.textContent=text;button.onclick=async()=>{button.disabled=true;try{await fn();await loadAccountFriends()}catch(error){message(errorText(error));button.disabled=false}};row.append(button)}
  if(f.status==='pending'&&f.recipient_id===auth.uid)action('Annehmen',()=>client.acceptFriend(f.sender_id));
  if(f.status==='accepted')action('Einladen',()=>openFriendInvite(other,p?.display_name||'Spieler'));
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

const INVITE_MODES={facts:{classic:'Klassisch'},moreless:{CLASSIC:'Classic',PARTY:'Party',BLITZ:'Blitz',SURVIVAL:'Survival',KING:'King',CHAOS:'Chaos'},estimate:{classic:'Classic',risk:'Risk',survival:'Survival',blitz:'Blitz',king:'King'},quiz:{standard:'Standard',big:'Big Board',football:'Fußball',random:'Random',nerd:'Schwer',sport:'Sport',geo:'Geo',party:'Party'}};
const GAME_NAMES={facts:'Fakt oder Fake',moreless:'More / Less',estimate:'Schätzduell',quiz:'Jeopardy'};
let inviteTarget=null,inviteFlight=false,inviteListFlight=false;
window.updateInviteModes=function updateInviteModes(){const game=$('friendInviteGame').value,select=$('friendInviteMode');select.replaceChildren();for(const [value,label] of Object.entries(INVITE_MODES[game]||{})){const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option)}};
window.openFriendInvite=function openFriendInvite(uid,name){
 if(inviteFlight)return;if((activeMatch()||playingSolo())&&!S.room){message('Beende zuerst deine Daily-Runde.');return}if(S.room&&!S.host){message('Nur der Host kann Freunde in diese Lobby einladen.');return}
 inviteTarget=uid;$('friendInviteTitle').textContent=name+' einladen';$('friendInviteStatus').textContent=S.room?'Du lädst in deine bestehende Lobby ein.':'Wähle Spiel und Modus. Wir erstellen eine Lobby und senden die Einladung.';
 $('friendInviteGame').value=S.room?(S.roomConfig?.game||LOBBY_GAME):'moreless';updateInviteModes();$('friendInviteMode').value=S.room?(S.roomConfig?.game_mode||LOBBY_MODE):'CLASSIC';
 $('friendInviteGame').disabled=$('friendInviteMode').disabled=!!S.room;$('friendInviteSend').textContent=S.room?'In diese Lobby einladen':'Lobby öffnen & einladen';$('accountMenu').close();$('friendInviteDialog').showModal();$('friendInviteGame').focus();
};
window.closeFriendInvite=function closeFriendInvite(){if(inviteFlight)return;$('friendInviteDialog').close();openAccountMenu()};
window.sendFriendInvite=async function sendFriendInvite(event){
 event.preventDefault();if(inviteFlight||!inviteTarget)return;inviteFlight=true;window.friendInviteBusy=true;$('friendInviteSend').disabled=true;$('friendInviteClose').disabled=true;
 try{const auth=await client.current();if(!auth||auth.guest)throw Error('Bitte mit einem festen Account anmelden.');
  if(!S.room){if(activeMatch()||playingSolo())throw Error('Beende zuerst deine laufende Runde.');LOBBY_GAME=$('friendInviteGame').value;LOBBY_MODE=$('friendInviteMode').value;
   if(!INVITE_MODES[LOBBY_GAME]?.[LOBBY_MODE])throw Error('Bitte einen gültigen Modus wählen.');
   if(LOBBY_GAME==='quiz'){JEOP.mode=LOBBY_MODE;JEOP.boardCats=null}if(LOBBY_GAME==='estimate')EST.mode=LOBBY_MODE;
   $('name').value=profile?.display_name||getGuestProfile().name||'Spieler';$('friendInviteStatus').textContent='Lobby wird erstellt …';if(!await createRoom())throw Error('Die Lobby konnte nicht erstellt werden. Bitte erneut versuchen.');
  }
  if(!S.host)throw Error('Nur der Host kann einladen.');$('friendInviteStatus').textContent='Einladung wird gesendet …';await client.sendInvitation(inviteTarget,S.room);
  $('friendInviteDialog').close();msg('Einladung gesendet. Dein Freund kann sie im Account-Menü annehmen.');await loadAccountInvitations();
 }catch(error){$('friendInviteStatus').textContent=error.status===409?'Für diese Lobby liegt bereits eine offene Einladung vor.':errorText(error)}finally{inviteFlight=false;window.friendInviteBusy=false;$('friendInviteSend').disabled=false;$('friendInviteClose').disabled=false}
};
window.loadAccountInvitations=async function loadAccountInvitations(){
 if(inviteListFlight)return;inviteListFlight=true;
 try{const auth=await client.current(),list=$('accountInvitationsList'),badge=$('accountInviteBadge');if(!auth||auth.guest){list.replaceChildren();badge.classList.add('hide');if(typeof updateInviteCenterBadge==='function')updateInviteCenterBadge(0);return}
  const invitations=await client.invitations();const ids=[...new Set(invitations.flatMap(i=>[i.sender_id,i.recipient_id]))],names=await client.friendProfiles(ids);if((await client.current())?.uid!==auth.uid)return;
  const count=invitations.filter(i=>i.recipient_id===auth.uid).length;badge.textContent=String(count);badge.classList.toggle('hide',!count);if(typeof updateInviteCenterBadge==='function')updateInviteCenterBadge(count);$('accountButton').setAttribute('aria-label',count?'Account · '+count+' offene Einladungen':'Account öffnen');list.replaceChildren();
  if(!invitations.length){list.textContent='Keine offenen Einladungen.';return}
  for(const i of invitations){const incoming=i.recipient_id===auth.uid,other=incoming?i.sender_id:i.recipient_id,name=names.find(p=>p.user_id===other)?.display_name||'Spieler';const row=document.createElement('div'),label=document.createElement('span');row.className='accountFriendRow';label.textContent=(incoming?'Von ':'An ')+name+' · '+(GAME_NAMES[i.game]||i.game)+' · '+(INVITE_MODES[i.game]?.[i.game_mode]||i.game_mode);row.append(label);
   function button(text,fn){const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=async()=>{b.disabled=true;try{await fn();await loadAccountInvitations()}catch(error){message(errorText(error));b.disabled=false}};row.append(b)}
   if(incoming)button('Annehmen',async()=>{if(activeMatch())throw Error('Verlasse zuerst deine Lobby oder beende deine Daily-Runde.');if(playingSolo())throw Error('Beende zuerst dein laufendes Spiel.');const joined=await client.acceptInvitation(i.id,profile?.display_name||getGuestProfile().name||'Spieler');if(!joined?.room_id)throw Error('Die Lobby konnte nicht betreten werden.');const auth=await client.current();S.token=auth.token;S.uid=auth.uid;S.room=joined.room_id;S.code=joined.room_code;S.host=false;S.myName=profile?.display_name||'Spieler';S.roomConfig=null;LOBBY_GAME=joined.game;LOBBY_MODE=joined.game_mode;closeAccountMenu();ready()});
   button(incoming?'Ablehnen':'Zurückziehen',()=>client.dismissInvitation(i.id,incoming?'declined':'cancelled'));list.append(row);
  }
 }finally{inviteListFlight=false}
};
window.accountReady.then(()=>loadAccountInvitations()).catch(()=>{});
setInterval(()=>{if(!document.hidden)loadAccountInvitations().catch(()=>{})},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)loadAccountInvitations().catch(()=>{})});

