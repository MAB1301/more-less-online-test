// Persistent account identity, independent of disposable rooms and retained guest Dailys.
// Keep account identity independent of moreless_online_session_v1 (a disposable room).
export function createAccountSession({url,key,storage,fetchImpl=fetch,now=Date.now}){
 const store='ml_account_auth_v1';let session=null;let refreshFlight=null;
 const save=data=>{
  if(!data.access_token||!data.refresh_token||!data.user?.id)throw Error('Unvollständige Anmeldung.');
  const next={token:data.access_token,refresh:data.refresh_token,uid:data.user.id,guest:data.user.is_anonymous===true,expiresAt:now()+(data.expires_in??3600)*1000};
  storage.setItem(store,JSON.stringify(next));session=next;return {...next};
 };
 const read=()=>{if(session)return session;try{session=JSON.parse(storage.getItem(store)||'null')}catch{session=null}return session};
 const call=async(path,body,token,method='POST',headers={})=>{
  const response=await fetchImpl(url+path,{method,headers:{apikey:key,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const text=await response.text();const data=text?JSON.parse(text):null;if(!response.ok){const error=Error(data?.msg||data?.message||data?.error_description||'Anmeldung fehlgeschlagen.');error.status=response.status;throw error}return data;
 };
 async function refresh(){
  if(refreshFlight)return refreshFlight;
  const saved=read();if(!saved?.refresh)throw Error('Bitte erneut anmelden.');
  refreshFlight=(async()=>{const data=await call('/auth/v1/token?grant_type=refresh_token',{refresh_token:saved.refresh});if(data.user?.id!==saved.uid)throw Error('Die Identität der Anmeldung hat sich geändert.');return save(data)})();
  try{return await refreshFlight}finally{refreshFlight=null}
 }
 async function current(){const saved=read();if(!saved)return null;return saved.expiresAt<=now()+60000?refresh():{...saved}}
 async function authorized(path,body,method='POST',headers={}){
  let auth=await current();if(!auth)throw Error('Bitte anmelden.');
  try{return await call(path,body,auth.token,method,headers)}catch(error){if(error.status!==401)throw error;auth=await refresh();return call(path,body,auth.token,method,headers)}
 }
 return {
  current,refresh,authorized,
  async invitations(){const auth=await current();return authorized('/rest/v1/ml_game_invitations?select=*&or=(sender_id.eq.'+auth.uid+',recipient_id.eq.'+auth.uid+')&status=eq.pending&expires_at=gt.'+encodeURIComponent(new Date(now()).toISOString())+'&order=created_at.desc&limit=50',undefined,'GET')},
  async sendInvitation(recipient,room){return authorized('/rest/v1/rpc/ml_send_game_invitation',{p_recipient:recipient,p_room:room})},
  async acceptInvitation(id,name){return (await authorized('/rest/v1/rpc/ml_accept_game_invitation',{p_invitation:id,p_name:name}))?.[0]},
  async dismissInvitation(id,status){return authorized('/rest/v1/ml_game_invitations?id=eq.'+encodeURIComponent(id),{status},'PATCH')},
  async user(){return authorized('/auth/v1/user',undefined,'GET')},
  async importCallback(token,refreshToken,expires=3600){const user=await call('/auth/v1/user',undefined,token,'GET');return save({access_token:token,refresh_token:refreshToken,expires_in:expires,user})},
  forget(){storage.removeItem(store);session=null},
  async registerNew(email,password,redirect){const result=await call('/auth/v1/signup'+(redirect?'?redirect_to='+encodeURIComponent(redirect):''),{email,password});return result.access_token?{session:save(result),confirmationRequired:false}:{session:null,confirmationRequired:true}},
  async recover(email,redirect){return call('/auth/v1/recover?redirect_to='+encodeURIComponent(redirect),{email})},
  async changePassword(password){return authorized('/auth/v1/user',{password},'PUT')},
  async readProfile(){const auth=await current();return (await authorized('/rest/v1/ml_profiles?user_id=eq.'+auth.uid+'&select=user_id,handle,display_name',undefined,'GET'))?.[0]||null},
  async updateProfile(handle,displayName){const auth=await current();return authorized('/rest/v1/ml_profiles?user_id=eq.'+auth.uid,{handle,display_name:displayName},'PATCH')},
  async settings(){const auth=await current();return (await authorized('/rest/v1/ml_account_settings?user_id=eq.'+auth.uid+'&select=muted,volume,reduced_motion,avatar_data',undefined,'GET'))?.[0]||null},
  async savePreferences(preferences,photo){const auth=await current();if(!auth||auth.guest)throw Error('Bitte mit einem festen Account anmelden.');return authorized('/rest/v1/ml_account_settings?on_conflict=user_id',{user_id:auth.uid,muted:preferences.muted,volume:Math.round(preferences.volume*100),reduced_motion:preferences.reducedMotion,avatar_data:photo||''},'POST',{Prefer:'resolution=merge-duplicates'})},
  async findProfile(handle){return (await authorized('/rest/v1/ml_profiles?select=user_id,handle,display_name&handle=eq.'+encodeURIComponent(handle),undefined,'GET'))?.[0]||null},
  async friendProfiles(ids){if(!ids.length)return [];if(ids.some(id=>!/^[-a-f0-9]{36}$/i.test(id)))throw Error('Ungültige Spieler-ID.');return authorized('/rest/v1/ml_profiles?select=user_id,handle,display_name&user_id=in.('+ids.join(',')+')',undefined,'GET')},
  async removeFriend(senderId,recipientId){return authorized('/rest/v1/ml_friendships?sender_id=eq.'+encodeURIComponent(senderId)+'&recipient_id=eq.'+encodeURIComponent(recipientId),undefined,'DELETE')},
  async guest(){const existing=await current();return existing||save(await call('/auth/v1/signup',{}))},
  async login(email,password){return save(await call('/auth/v1/token?grant_type=password',{email,password}))},
  async register(email,password){const existing=await current();if(existing?.guest)throw Error('Nutze upgrade, damit dein Gastprofil erhalten bleibt.');const result=await call('/auth/v1/signup',{email,password});return result.access_token?{session:save(result),confirmationRequired:false}:{session:null,confirmationRequired:true}},
  async upgrade(email,password){const auth=await current();if(!auth?.guest)throw Error('Kein Gastprofil angemeldet.');return authorized('/auth/v1/user',{email,password},'PUT')},
  async logout(){try{if(read())await authorized('/auth/v1/logout',{})}finally{storage.removeItem(store);session=null}},
  async profile(handle,displayName){const auth=await current();if(!auth||auth.guest)throw Error('Für ein Profil brauchst du einen bestätigten Account.');return authorized('/rest/v1/ml_profiles',{user_id:auth.uid,handle,display_name:displayName})},
  async friends(){return authorized('/rest/v1/ml_friendships?select=sender_id,recipient_id,status,created_at',undefined,'GET')},
  async requestFriend(recipientId){const auth=await current();if(!auth||auth.guest)throw Error('Bitte mit einem festen Account anmelden.');return authorized('/rest/v1/ml_friendships',{sender_id:auth.uid,recipient_id:recipientId})},
  async acceptFriend(senderId){const auth=await current();if(!auth||auth.guest)throw Error('Bitte mit einem festen Account anmelden.');return authorized('/rest/v1/ml_friendships?sender_id=eq.'+encodeURIComponent(senderId)+'&recipient_id=eq.'+encodeURIComponent(auth.uid),{status:'accepted'},'PATCH')}
 };
}
