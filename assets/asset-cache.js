/* Registration and background warming happen after the page is usable. */
(()=>{
 const script=document.currentScript,root=new URL('../',script.src);let workerReady=null,busy=false;
 const panel=document.createElement('fieldset');panel.className='assetCachePanel';const legend=document.createElement('legend');legend.textContent='Bilder auf diesem Gerät';const description=document.createElement('p');description.className='tiny';description.textContent='Gesehene Grafiken werden automatisch gespeichert. Alle Spielbilder vorab herunterladen: ungefähr 12 MB, am besten im WLAN. Neue Bildversionen werden automatisch ersetzt.';const button=document.createElement('button');button.type='button';button.textContent='Spielbilder vorab speichern';button.disabled=true;const status=document.createElement('p');status.className='tiny';status.setAttribute('role','status');const progress=document.createElement('progress');progress.hidden=true;progress.setAttribute('aria-label','Gespeicherte Spielbilder');panel.append(legend,description,button,progress,status);document.getElementById('comfortStatus')?.before(panel);
 const controls=[{button,status,progress}];
 const header=document.querySelector('#homeScreen .homeHeader');
 if(header){
  const home=document.createElement('div');home.className='homeImageDownload';
  const homeButton=document.createElement('button');homeButton.type='button';homeButton.className='homeImageDownloadButton';homeButton.disabled=true;homeButton.setAttribute('aria-label','Spielbilder vorab herunterladen');homeButton.title='Spielbilder auf diesem Gerät speichern · ca. 12 MB';
  homeButton.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/></svg><span>Bilder laden</span>';
  const homeStatus=document.createElement('p');homeStatus.className='tiny';homeStatus.setAttribute('role','status');homeStatus.hidden=true;
  const homeProgress=document.createElement('progress');homeProgress.hidden=true;homeProgress.setAttribute('aria-label','Gespeicherte Spielbilder');
  home.append(homeButton,homeProgress,homeStatus);header.append(home);controls.push({button:homeButton,status:homeStatus,progress:homeProgress});
 }
 function setStatus(text,reveal=false){for(const control of controls){control.status.textContent=text;if(reveal)control.status.hidden=false}}
 function setDisabled(disabled){for(const control of controls)control.button.disabled=disabled}
 function message(worker,payload,onProgress){return new Promise((resolve,reject)=>{const channel=new MessageChannel();let timer;function renew(){clearTimeout(timer);timer=setTimeout(()=>{channel.port1.close();reject(Error('Das Speichern wurde unterbrochen. Du kannst es erneut starten.'))},45000)}renew();channel.port1.onmessage=event=>{renew();onProgress?.(event.data);if(event.data.done){clearTimeout(timer);channel.port1.close();resolve(event.data)}};worker.postMessage({type:'CACHE_ASSETS',...payload},[channel.port2])})}
 async function register(){if(!window.isSecureContext||!('serviceWorker' in navigator)){setDisabled(true);setStatus('Dieser Browser unterstützt den zusätzlichen Bildspeicher hier nicht.',true);return null}try{await navigator.serviceWorker.register(new URL('service-worker.js',root),{scope:root.pathname,updateViaCache:'none'});const registration=await navigator.serviceWorker.ready;setDisabled(false);setStatus('Automatischer Bildspeicher aktiv.');return registration.active}catch{setDisabled(true);setStatus('Bildspeicher konnte nicht aktiviert werden. Die Seite bleibt normal spielbar.',true);return null}}
 async function downloadImages(){
  if(busy)return;busy=true;setDisabled(true);
  for(const control of controls){control.button.setAttribute('aria-busy','true');control.progress.hidden=false;control.progress.removeAttribute('value')}
  setStatus('Bildspeicher wird vorbereitet …',true);
  try{
   const worker=await workerReady;if(!worker)throw Error('Bildspeicher ist in diesem Browser nicht verfügbar.');
   const result=await message(worker,{allImages:true},data=>{
    for(const control of controls){control.progress.max=data.total||1;control.progress.value=data.completed}
    setStatus((data.completed-data.failed)+' / '+data.total+' Bilder gespeichert'+(data.failed?' · '+data.failed+' noch nicht verfügbar':''),true);
   });
   setStatus(result.failed?'Speichern beendet · '+result.failed+' Bilder konnten nicht gespeichert werden. Du kannst es erneut versuchen.':'Alle '+result.total+' Spielbilder sind auf diesem Gerät gespeichert.',true);
  }catch(error){setStatus(error.message,true)}finally{
   busy=false;setDisabled(false);for(const control of controls){control.button.removeAttribute('aria-busy');control.progress.hidden=true}
  }
 }
 for(const control of controls)control.button.onclick=downloadImages;
 function start(){workerReady=register();const warm=async()=>{if(navigator.connection?.saveData||document.documentElement.classList.contains('dataSaving'))return;const worker=await workerReady;if(!worker)return;const paths=performance.getEntriesByType('resource').map(entry=>{const u=new URL(entry.name);return u.origin===root.origin&&u.pathname.startsWith(root.pathname)?u.pathname.slice(root.pathname.length)+u.search:''}).filter(p=>/^(assets\/|content\/approved\.js(?:\?|$))/.test(p)&&/\.(js|mjs|css|webp|svg|png)(?:\?.*)?$/.test(p));message(worker,{paths},()=>{}).catch(()=>{})};if('requestIdleCallback' in window)requestIdleCallback(warm,{timeout:5000});else setTimeout(warm,2000)}
 if(document.readyState==='complete')start();else window.addEventListener('load',start,{once:true});
})();
