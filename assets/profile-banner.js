/* One profile surface; frame ornaments remain anchored to their own portrait. */
(()=>{
 const $=id=>document.getElementById(id),dock=$('accountDock'),button=$('accountButton'),home=$('homeScreen');if(!dock||!button)return;
 const marker=document.createComment('profile toolbar');dock.before(marker);
 const copy=document.createElement('span');copy.className='profileBannerCopy';copy.append($('accountDockName'));
 const title=document.createElement('span');title.className='profileBannerTitle';title.textContent='Ohne Titel';
 const level=document.createElement('span');level.className='profileBannerLevel';level.textContent='Level wird geladen …';
 const bar=document.createElement('progress');bar.className='profileBannerXP';bar.max=1;bar.value=0;bar.setAttribute('aria-label','Level-Fortschritt');
 copy.append(title,level,bar);button.append(copy);button.setAttribute('aria-label','Profil mit Level und Titel öffnen');
 function layout(){const visible=home&&!home.classList.contains('hide'),world=$('worldMenu'),worldVisible=world?.classList.contains('friendlyMenu')&&!world.classList.contains('hide');dock.classList.toggle('profileHomeDock',visible);dock.classList.toggle('profileWorldDock',!!worldVisible);if(visible){const header=home.querySelector('.homeHeader');if(dock.parentNode!==header)header.prepend(dock)}else if(worldVisible){const main=world.querySelector('.homeMain');if(dock.parentNode!==main)main.prepend(dock)}else if(dock.parentNode!==marker.parentNode)marker.after(dock)}
 new MutationObserver(layout).observe(home,{attributes:true,attributeFilter:['class']});layout();new MutationObserver(layout).observe($('worldMenu'),{attributes:true,attributeFilter:['class']});
 function style(){const data=window.getCosmeticCollection?.();title.textContent=data?.title_name&&data.title!=='title-none'?data.title_name:'Ohne Titel';title.dataset.title=data?.title||'title-none'}
 function xp(state){if(!state||!Number.isFinite(state.level)){level.textContent='Level gerade nicht verfügbar';bar.hidden=true;return}bar.hidden=false;level.textContent='Level '+state.level+' · '+state.current+' / '+state.needed+' XP';bar.max=state.needed;bar.value=state.current;bar.setAttribute('aria-label','Fortschritt zu Level '+(state.level+1));}
 let request=0;
 window.refreshProfileBanner=async()=>{const ticket=++request;style();level.textContent='Level wird geladen …';bar.hidden=true;try{await window.accountReady;const auth=await window.gameAccount?.current(),fixed=auth&&!auth.guest;let data=null;try{if(navigator.onLine!==false)data=await playerHubRpc('profile')}catch{}if(fixed&&!data){try{data=JSON.parse(localStorage.getItem('ml_player_profile_cache_v1_'+auth.uid)||'null')}catch{}}const after=await window.gameAccount?.current();if(ticket!==request||auth?.uid!==after?.uid)return;xp(fixed?data?.progression:window.personalXP.guestState(data?.progression?.daily_xp));}catch{if(ticket===request)xp(null)}};
 window.addEventListener('profile-style-changed',style);window.addEventListener('profile-xp-changed',e=>xp(e.detail));window.addEventListener('online',()=>window.refreshProfileBanner());
 const render=window.renderGuestProfile;window.renderGuestProfile=function(...args){const result=render.apply(this,args);window.refreshProfileBanner();return result};
 window.refreshProfileBanner();
})();
