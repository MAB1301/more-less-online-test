// Account foundation. Not loaded by the game until database and auth settings are ready.
// Keep account identity independent of moreless_online_session_v1 (a disposable room).
export function createAccountSession({url,key,storage,fetchImpl=fetch,now=Date.now}){
 const store='ml_account_auth_v1';let session=null;let refreshFlight=null;
 const save=data=>{
  if(!data.access_token||!data.refresh_token||!data.user?.id)throw Error('Unvollständige Anmeldung.');
  const next={token:data.access_token,refresh:data.refresh_token,uid:data.user.id,guest:data.user.is_anonymous===true,expiresAt:now()+(data.expires_in??3600)*1000};
  storage.setItem(store,JSON.stringify(next));session=next;return {...next};
 };
 const read=()=>{if(session)return session;try{session=JSON.parse(storage.getItem(store)||'null')}catch{session=null}return session};
 const call=async(path,body,token,method='POST')=>{
  const response=await fetchImpl(url+path,{method,headers:{apikey:key,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const text=await response.text();const data=text?JSON.parse(text):null;if(!response.ok){const error=Error(data?.msg||data?.message||data?.error_description||'Anmeldung fehlgeschlagen.');error.status=response.status;throw error}return data;
 };
 async function refresh(){
  if(refreshFlight)return refreshFlight;
  const saved=read();if(!saved?.refresh)throw Error('Bitte erneut anmelden.');
  refreshFlight=(async()=>{const data=await call('/auth/v1/token?grant_type=refresh_token',{refresh_token:saved.refresh});if(data.user?.id!==saved.uid)throw Error('Die Identität der Anmeldung hat sich geändert.');return save(data)})();
  try{return await refreshFlight}finally{refreshFlight=null}
 }
 async function current(){const saved=read();if(!saved)return null;return saved.expiresAt<=now()+60000?refresh():{...saved}}
 async function authorized(path,body,method='POST'){
  let auth=await current();if(!auth)throw Error('Bitte anmelden.');
  try{return await call(path,body,auth.token,method)}catch(error){if(error.status!==401)throw error;auth=await refresh();return call(path,body,auth.token,method)}
 }
 return {
  current,
  async guest(){const existing=await current();return existing||save(await call('/auth/v1/signup',{}))},
  async login(email,password){return save(await call('/auth/v1/token?grant_type=password',{email,password}))},
  async register(email,password){const existing=await current();if(existing?.guest)throw Error('Nutze upgrade, damit dein Gastprofil erhalten bleibt.');const result=await call('/auth/v1/signup',{email,password});return result.access_token?{session:save(result),confirmationRequired:false}:{session:null,confirmationRequired:true}},
  async upgrade(email,password){const auth=await current();if(!auth?.guest)throw Error('Kein Gastprofil angemeldet.');return authorized('/auth/v1/user',{email,password},'PUT')},
  async logout(){if(read())await authorized('/auth/v1/logout',{});storage.removeItem(store);session=null},
  async profile(handle,displayName){const auth=await current();if(!auth||auth.guest)throw Error('Für ein Profil brauchst du einen bestätigten Account.');return authorized('/rest/v1/ml_profiles',{user_id:auth.uid,handle,display_name:displayName})},
  async friends(){return authorized('/rest/v1/ml_friendships?select=sender_id,recipient_id,status,created_at',undefined,'GET')},
  async requestFriend(recipientId){const auth=await current();if(!auth||auth.guest)throw Error('Bitte mit einem festen Account anmelden.');return authorized('/rest/v1/ml_friendships',{sender_id:auth.uid,recipient_id:recipientId})},
  async acceptFriend(senderId){const auth=await current();if(!auth||auth.guest)throw Error('Bitte mit einem festen Account anmelden.');return authorized('/rest/v1/ml_friendships?sender_id=eq.'+encodeURIComponent(senderId)+'&recipient_id=eq.'+encodeURIComponent(auth.uid),{status:'accepted'},'PATCH')}
 };
}
