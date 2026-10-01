/* Shared topic artwork and explicit category choices, separate from the main menu. */
const CATEGORY_PHOTOS={geography:'erde.webp',city:'berlin.webp',nature:'nil.webp',sport:'sport-mix.webp',buildings:'burj-khalifa.webp',animals:'afrikanischer-elefant.webp',space:'saturn.webp',science:'mars.webp',mix:'felder-schachbrett.webp',records:'100-m-weltrekord-manner.webp',culture:'kolner-dom.webp',missions:'mond.webp'};
const CATEGORY_SUBJECT_PHOTOS={'Fußballer':'generated/subjects/mbappe.webp','Autos':'generated/subjects/porsche-gt3.webp','UNESCO':'kolner-dom.webp','Flüsse':'rhein.webp','Ozeane':'pazifik.webp','Inseln':'island.webp','Spielfelder':'sport-field.webp','Planetengröße':'jupiter.webp','Monde':'mond.webp'};
function categoryPhoto(name){return CATEGORY_SUBJECT_PHOTOS[name]||CATEGORY_PHOTOS[CATEGORY_ART[name]||sharedTheme(name)]||CATEGORY_PHOTOS.mix}
function categoryPhotoArt(name){if((CATEGORY_ART[name]||sharedTheme(name))==='science')return '<span class="drawArt categoryPhoto visualIllustration art-science" role="img" aria-label="Wissenschaft: Labor und Prisma"></span>';return '<img class="drawArt categoryPhoto" src="'+VISUAL_BASE+categoryPhoto(name)+'" alt="" loading="lazy">'}
function topicFromQuestion(question,category=''){
 const text=String(question).toLowerCase();
 if(/fußball|fussball|champions league|bundesliga|club|verein|torjäger/.test(text+' '+category.toLowerCase()))return 'Fußball';
 if(/tennis|wimbledon/.test(text))return 'Tennis';
 if(/schach/.test(text))return 'Allgemeinwissen';
 if(/rakete|raumfahrt|apollo|mission/.test(text))return 'Raumfahrt';
 if(/planet|mars|jupiter|saturn|weltraum/.test(text))return 'Weltraum';
 if(/klavier|musik|komponist/.test(text))return 'Weltkultur';
 if(/auto|porsche|ferrari/.test(text))return 'Autos';
 return SHARED_CATS.includes(category)?category:'Allgemeinwissen';
}
function questionTopicArt(question,category=''){
 const topic=topicFromQuestion(question,category);if(topic==='Allgemeinwissen')return '';if(/everest|berg/i.test(question))return visualFallback('Berglandschaft');if(topic==='Wissenschaft')return visualFallback('Wissenschaft');
 const photo=topic==='Fußball'?'sport-field.webp':topic==='Tennis'?'tennis-court.webp':categoryPhoto(topic);
 return '<img class="topicQuestionPhoto" src="'+VISUAL_BASE+photo+'" alt="Themenbild: '+topic+'"><span class="visualIllustrationLabel">'+(['Fußball','Tennis'].includes(topic)?'Generiertes Themenbild':'Themenbild')+' · '+topic+'</span>';
}
const CATEGORY_OPTIONS={mode:'random',category:'Länder',focus:null,starting:false};
try{const saved=JSON.parse(localStorage.getItem('ml_category_options_v1')||'null');if(saved&&['random','cards','chosen'].includes(saved.mode)){CATEGORY_OPTIONS.mode=saved.mode;if(SHARED_CATS.includes(saved.category))CATEGORY_OPTIONS.category=saved.category}}catch{}
function openCategoryOptions(){
 if(S.room&&(!S.host||LOBBY_GAME!=='moreless'||S.enteredGame||S.q)){msg('Kategorie-Einstellungen sind vor dem Match beim Host verfügbar.');return}
 CATEGORY_OPTIONS.focus=document.activeElement;
 const mode=el('categoryChoiceMode');mode.value=S.room&&CATEGORY_OPTIONS.mode==='cards'?'random':CATEGORY_OPTIONS.mode;
 mode.querySelector('[value="cards"]').disabled=!!S.room;
 const select=el('categoryChoiceName');select.replaceChildren();
 for(const cat of SHARED_CATS){if(!SOLO_Q.some(q=>q.cat===cat))continue;const option=document.createElement('option');option.value=option.textContent=cat;select.appendChild(option)}
 select.value=CATEGORY_OPTIONS.category;updateCategoryOptionFields();el('categoryOptionsDialog').showModal();
}
function updateCategoryOptionFields(){el('categoryChoiceField').classList.toggle('hide',el('categoryChoiceMode').value!=='chosen')}
function saveCategoryOptions(){
 const mode=el('categoryChoiceMode').value,category=el('categoryChoiceName').value;
 if(!['random','cards','chosen'].includes(mode)||!SHARED_CATS.includes(category))return;
 CATEGORY_OPTIONS.mode=mode;CATEGORY_OPTIONS.category=category;
 try{localStorage.setItem('ml_category_options_v1',JSON.stringify({mode,category}))}catch{}
 closeCategoryOptions();refreshCategoryOptionLabel();
}
function closeCategoryOptions(){el('categoryOptionsDialog').close();CATEGORY_OPTIONS.focus?.focus?.()}
function categoryOptionSummary(){return CATEGORY_OPTIONS.mode==='chosen'?'Kategorie: '+CATEGORY_OPTIONS.category:CATEGORY_OPTIONS.mode==='cards'?'Verdeckte Karten':'Kategorien: Zufall'}
function refreshCategoryOptionLabel(){for(const id of ['gameCategoryOptions','categoryLobbyOptions']){const b=el(id);if(b)b.textContent=categoryOptionSummary()+' · ändern'}}
function chooseCategoryOption(options){
 if(!options.length)return null;
 const selected=CATEGORY_OPTIONS.mode==='chosen'?options.filter(o=>o.cat===CATEGORY_OPTIONS.category&&!o.sub):[];
 const pool=selected.length?selected:options;
 return pool[Math.floor(Math.random()*pool.length)];
}
async function startAutomaticOnlineCategory(){
 if(!S.room||!S.host||CATEGORY_OPTIONS.starting)return;
 const options=SHARED_CATS.filter(cat=>onlineAvailable(cat).length>=5).map(cat=>({cat})),choice=chooseCategoryOption(options);
 if(!choice){msg('Für diese Runde sind keine fünf neuen Fragen verfügbar.',true);return}
 CATEGORY_OPTIONS.starting=true;
 try{S.cat=choice.cat;el('catOverlay').classList.remove('on');await startQ(S.q?S.q+1:1)}finally{CATEGORY_OPTIONS.starting=false}
}
function upgradeCategoryCards(){
 document.querySelectorAll('#sharedCatGrid .premiumDeck').forEach(button=>{
  const name=button.querySelector('.cardRibbon')?.textContent.trim(),photo=button.querySelector('.cardPicture');if(name&&photo)photo.innerHTML=categoryPhotoArt(name);
 });refreshCategoryOptionLabel();
}
upgradeCategoryCards();
