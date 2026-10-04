// Preferences belong to this device until permanent accounts are enabled.
(function(){
 const key='ml_game_preferences_v1';
 let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{}
 const prefs={muted:saved.muted===true,volume:Number.isFinite(saved.volume)?Math.max(0,Math.min(1,saved.volume)):.35,reducedMotion:saved.reducedMotion===true};
 let context=null,master=null;
 const node=id=>document.getElementById(id);
 function render(){
  document.documentElement.classList.toggle('reduceMotion',prefs.reducedMotion);
  const button=node('muteButton');if(button){button.setAttribute('aria-pressed',String(prefs.muted));button.setAttribute('aria-label',prefs.muted?'Ton einschalten':'Ton stummschalten');button.title=prefs.muted?'Ton einschalten':'Ton stummschalten';button.dataset.muted=String(prefs.muted)}
  if(node('soundEnabled'))node('soundEnabled').checked=!prefs.muted;
  if(node('soundVolume'))node('soundVolume').value=Math.round(prefs.volume*100);
  if(node('soundVolumeValue'))node('soundVolumeValue').textContent=Math.round(prefs.volume*100)+' %';
  if(node('reducedMotion'))node('reducedMotion').checked=prefs.reducedMotion;
  if(window.dispatchEvent)window.dispatchEvent(new Event('gamepreferenceschange'));
  if(master)master.gain.setValueAtTime(prefs.muted?0:prefs.volume,context.currentTime);
 }
 function persist(){render();window.saveAccountPreferences?.();try{localStorage.setItem(key,JSON.stringify(prefs));if(node('preferencesStatus'))node('preferencesStatus').textContent='Auf diesem Gerät gespeichert.'}catch{if(node('preferencesStatus'))node('preferencesStatus').textContent='Einstellung aktiv, konnte aber nicht gespeichert werden.'}}
 function initializeAudio(){try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;if(!context){context=new Audio();master=context.createGain();master.connect(context.destination);render()}if(context.state==='suspended')context.resume().catch(()=>{});return true}catch{return false}}
 window.getGamePreferences=()=>({...prefs});
 window.applyGamePreferences=value=>{prefs.muted=value.muted===true;prefs.volume=Number.isFinite(value.volume)?Math.max(0,Math.min(1,value.volume)):.35;prefs.reducedMotion=value.reducedMotion===true;render();try{localStorage.setItem(key,JSON.stringify(prefs))}catch{}};
 window.toggleGameMute=function toggleGameMute(){prefs.muted=!prefs.muted;persist();if(!prefs.muted)initializeAudio()};
 window.updateGamePreferences=function updateGamePreferences(){prefs.muted=!node('soundEnabled').checked;prefs.volume=Math.max(0,Math.min(100,Number(node('soundVolume').value)||0))/100;prefs.reducedMotion=node('reducedMotion').checked;persist()};
 window.playGameSound=(kind)=>{
  if(prefs.muted||prefs.volume===0||!initializeAudio()||context.state!=='running')return;
  const frequencies=kind==='correct'?[523.25,659.25]:[220,164.81],start=context.currentTime;
  try{frequencies.forEach((frequency,i)=>{const oscillator=context.createOscillator(),gain=context.createGain(),at=start+i*.09;oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.16,at+.015);gain.gain.exponentialRampToValueAtTime(.001,at+.14);oscillator.connect(gain);gain.connect(master);oscillator.start(at);oscillator.stop(at+.15)})}catch{}
 };
 window.previewGameSound=function previewGameSound(){window.playGameSound('correct')};
 document.addEventListener('pointerdown',()=>{if(!prefs.muted)initializeAudio()},{once:true});
 document.addEventListener('keydown',()=>{if(!prefs.muted)initializeAudio()},{once:true});
 render();
})();
