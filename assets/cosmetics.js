/* Shared shop state with decorative leaderboard helpers. */
(()=>{
 const script=document.currentScript,frames=['starter','neon','emerald','gold','david','kippa','cross','thorns','ufo','toast','potato','rocket'];
 const node=id=>document.getElementById(id);
 function style(avatar,name,entry={}){if(avatar){const id=entry.frame||'frame-starter',key=id.replace('frame-','');avatar.dataset.frame=id;avatar.style.setProperty('--frame-art',frames.includes(key)?'url("'+new URL('frames/'+key+'.svg',script.src).href+'")':'none')}if(name)name.dataset.nameColor=entry.name_color||'color-default'}
 function initials(name){return String(name||'Gast').trim().split(/\s+/).map(p=>Array.from(p)[0]||'').slice(0,2).join('').toLocaleUpperCase('de-DE')}
 window.cosmeticPlayer=function(entry){const player=document.createElement('span');player.className='cosmeticPlayer';const avatar=document.createElement('span');avatar.className='cosmeticAvatar';avatar.setAttribute('aria-hidden','true');avatar.textContent=initials(entry.name);const name=document.createElement('b');name.textContent=entry.name+(entry.mine?' · Du':'');style(avatar,name,entry);player.append(avatar,name);return player};
 window.styleCosmeticPlayer=style;
 window.openCosmeticShop=()=>window.gameEconomy.open();window.refreshCosmeticIdentity=()=>window.gameEconomy.profile().catch(()=>{});
 const button=document.createElement('button');button.type='button';button.id='cosmeticOpen';button.textContent='Style-Shop';button.setAttribute('aria-haspopup','dialog');button.onclick=window.openCosmeticShop;node('accountDock').append(button);
 const shortcut=document.createElement('button');shortcut.type='button';shortcut.textContent='Rahmen, Titel, Musik & Münzen →';shortcut.onclick=window.openCosmeticShop;node('playerHub').append(shortcut);
})();
