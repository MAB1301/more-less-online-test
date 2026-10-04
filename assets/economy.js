/* The installed Supabase wallet owns purchases, rewards and equipped items. */
(function(){
 const state={data:null,owner:null,scope:null,version:0,busy:false};
 const tracks=[
  {id:'music-game-night',name:'Game Night',file:'game-night.mp3'},
  {id:'music-night-drive',name:'Night Drive · House',file:'night-drive.mp3'},
  {id:'music-pixel-riot',name:'Pixel Riot · Breakbeat',file:'pixel-riot.mp3'},
  {id:'music-moon-bounce',name:'Moon Bounce · Glitch',file:'moon-bounce.mp3'}
 ];
 const frames=['starter','neon','emerald','gold','david','kippa','cross','thorns','ufo','toast','potato','rocket'];
 const script=document.currentScript,preview=document.createElement('audio');preview.preload='none';preview.volume=.25;let previewTimer=null,previewId=0;
 const dialog=document.createElement('dialog');dialog.id='gameShop';dialog.className='playerHub gameShop';dialog.setAttribute('aria-labelledby','gameShopTitle');
 dialog.innerHTML='<header class="row"><h2 id="gameShopTitle">Shop & Musik</h2><button type="button" id="gameShopClose">Schließen</button></header><p id="gameShopBalance" class="shopBalance"></p><p id="gameShopScope" class="tiny muted"></p><p id="gameShopStatus" role="status" aria-live="polite"></p><button type="button" id="gameShopRefresh">Aktualisieren</button><div id="gameShopItems" class="shopGrid"></div><h3>So verdienst du Münzen</h3><p>Daily-Challenges abschließen und einmalige Daily-Achievements erreichen. Münzen sind reine Spielwährung.</p>';
 document.body.append(dialog,preview);const node=id=>document.getElementById(id);
 function stopPreview(){previewId++;clearTimeout(previewTimer);preview.pause();preview.removeAttribute('src')}
 function syncAccount(auth){const scope=auth&&!auth.guest?auth.uid:'guest';if(state.scope!==scope){state.scope=scope;state.version++;state.data=null;state.owner=null;stopPreview();render();window.dispatchEvent(new Event('gameeconomychange'))}}
 async function identity(){if(window.accountReady)await window.accountReady;const auth=await window.gameAccount?.current();syncAccount(auth);if(auth&&!auth.guest)return {uid:auth.uid,fixed:true};await dailyAuth();return {uid:DAILY.auth.uid,fixed:false}}
 async function request(action='profile',item=null){
  const owner=await identity(),version=state.version;
  const data=owner.fixed?await window.gameAccount.authorized('/rest/v1/rpc/ml_cosmetics',{p_action:action,p_item:item}):await dailyFetch('/rest/v1/rpc/ml_cosmetics',{p_action:action,p_item:item},DAILY.auth.token);
  const current=await identity();if(version!==state.version||current.uid!==owner.uid)throw Error('Der Zugang hat sich geändert. Bitte den Shop erneut öffnen.');
  state.owner=owner.uid;state.data=data;render();window.dispatchEvent(new Event('gameeconomychange'));return data;
 }
 function owned(id){return id==='music-game-night'||id==='title-none'||!!state.data?.catalog?.find(c=>c.id===id&&c.owned)}
 function track(id){return tracks.find(t=>t.id===id)}
 function source(id){const t=track(id);return t?new URL('audio/'+t.file,script.src).href:null}
 async function open(){if(!dialog.open)dialog.showModal();node('gameShopClose').focus();await refresh()}
 async function refresh(){if(state.busy)return;state.busy=true;node('gameShopStatus').textContent='Shop wird geladen …';try{await request();render();node('gameShopStatus').textContent=state.data.achievement_earned?'Neue Achievements: +'+state.data.achievement_earned+' Münzen.':''}catch(error){node('gameShopStatus').textContent='Shop nicht verfügbar: '+error.message}finally{state.busy=false;render()}}
 async function choose(item){if(state.busy)return;state.busy=true;render();node('gameShopStatus').textContent='Wird gespeichert …';try{await request(item.owned?'equip':'buy',item.id);node('gameShopStatus').textContent=item.owned?'Ausgewählt.':'Gekauft und ausgewählt.'}catch(error){node('gameShopStatus').textContent=error.message}finally{state.busy=false;render()}}
 function listen(id){stopPreview();if(window.getGamePreferences?.().muted){node('gameShopStatus').textContent='Für die Hörprobe zuerst Spielton einschalten.';return}const src=source(id);if(!src)return;preview.src=src;const attempt=previewId;preview.play().then(()=>{if(attempt!==previewId){preview.pause();return}previewTimer=setTimeout(stopPreview,8000)}).catch(()=>{node('gameShopStatus').textContent='Hörprobe konnte nicht gestartet werden.'})}
 function render(){
  const data=state.data;for(const id of ['accountProfileAvatar','accountAvatar']){const target=node(id);if(target){const frame=data?.frame?.replace('frame-','')||'starter';target.dataset.frame=frame;target.style.setProperty('--frame-art',frames.includes(frame)?'url("'+new URL('frames/'+frame+'.svg',script.src).href+'")':'none')}}for(const id of ['accountProfileName','accountDockName']){const target=node(id);if(target)target.dataset.nameColor=data?.name_color||'color-default'}node('gameShopBalance').textContent=data?data.balance+' Münzen':'Münzstand wird geladen';node('gameShopScope').textContent=state.scope==='guest'?'Gast-Wallet für deinen Daily-Zugang in diesem Browser. Ein neuer Account hat einen eigenen Münzstand.':'Deine Käufe und Münzen sind in deinem Account gespeichert.';
  node('gameShopRefresh').disabled=state.busy;const root=node('gameShopItems');root.replaceChildren();for(const id of ['accountPlayerTitle','accountDockTitle']){const target=node(id);if(target){target.textContent='';target.hidden=true}}if(!data)return;
  const names={music:'Musik',title:'Titel',frame:'Profilrahmen',color:'Namensfarbe'},equipped={music:data.music,title:data.title,frame:data.frame,color:data.name_color};
  for(const item of data.catalog||[]){
   const card=document.createElement('article');card.className='shopItem';const type=document.createElement('small');type.textContent=names[item.kind]||item.kind;const title=document.createElement('h4');title.textContent=item.name;const detail=document.createElement('p');detail.textContent=item.unlock_achievement?'Belohnung für '+item.unlock_achievement.replace('daily-score-','Daily-Punkte ').replace('daily-','Daily-Tage '):item.price?item.price+' Münzen':'Kostenlos';card.append(type,title,detail);if(item.kind==='frame'&&frames.includes(item.id.replace('frame-',''))){const image=document.createElement('img');image.className='framePreview';image.alt='Vorschau: '+item.name;image.src=new URL('frames/'+item.id.replace('frame-','')+'.svg',script.src).href;card.append(image)}
   if(item.kind==='music'&&track(item.id)){const play=document.createElement('button');play.type='button';play.textContent='8 Sekunden anhören';play.onclick=()=>listen(item.id);card.append(play)}
   const button=document.createElement('button');button.type='button';button.textContent=equipped[item.kind]===item.id?'Ausgewählt':item.owned?'Auswählen':item.unlock_achievement?'Durch Achievement freischalten':'Für '+item.price+' Münzen kaufen';button.disabled=state.busy||equipped[item.kind]===item.id||(!item.owned&&(!!item.unlock_achievement||data.balance<item.price));button.onclick=()=>choose(item);card.append(button);root.append(card);
  }
  const title=data.title_name&&data.title!=='title-none'?data.title_name:'';for(const id of ['accountPlayerTitle','accountDockTitle']){const target=node(id);if(target){target.textContent=title;target.hidden=!title}}
 }
 dialog.addEventListener('close',stopPreview);dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});node('gameShopClose').onclick=()=>dialog.close();node('gameShopRefresh').onclick=refresh;
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPreview()});window.addEventListener('pagehide',stopPreview);
 window.gameEconomy={profile:()=>request(),equipMusic:id=>{if(!track(id)||!owned(id))return Promise.reject(Error('Diesen Beat zuerst im Shop freischalten.'));return request('equip',id)},open,owned,tracks,source,syncAccount,get data(){return state.data}};

})();

function openGameShop(){return window.gameEconomy.open()}
