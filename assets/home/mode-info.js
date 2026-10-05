/* Independent demonstrations: opening help never starts or changes a match. */
const MODE_INFO={game:null,mode:null,focus:null,answered:false};
function openModeInfo(game,mode){
 const rules=gameRuleCopy(game,mode);MODE_INFO.game=game;MODE_INFO.mode=String(mode).toLowerCase();if(!el('modeInfoDialog').open)MODE_INFO.focus=document.activeElement;MODE_INFO.answered=false;
 const boardNames={standard:'Standard',big:'Big Board',football:'Fußball',random:'Random',nerd:'Schwer',sport:'Sport',geo:'Geo',party:'Party'};
 const levelNames={easy:'Leicht',medium:'Mittel',hard:'Schwer'};
 el('modeInfoTitle').textContent=game==='quiz'?'Jeopardy · '+(boardNames[mode]||mode):game==='facts'?'Fakt oder Fake · '+(levelNames[mode]||mode):rules.title+' erklärt';
 el('modeInfoBrand').textContent='SPIELREGELN · BEISPIEL ZUM AUSPROBIEREN';
 const list=el('modeInfoRules');list.replaceChildren();
 const lines=[...rules.lines];
 if(game==='moreless'&&MODE_INFO.mode==='party')lines[1]='Joker gibt es in einer Online-Lobby. Solo gibt jede richtige Antwort einen Punkt.';
 if(game==='quiz'&&mode==='geo')lines.unshift('Sechs Geo-Themen: Länder & Grenzen, Städte & Hauptstädte, Natur & Landschaften, Europa, Nationalparks und Weltreise & Welterbe.');
 if(game==='quiz'&&mode==='random')lines.unshift('Sechs verschiedene Kategorien werden zufällig für dein Board gewählt.');
 for(const text of lines){const li=document.createElement('li');li.textContent=text;list.appendChild(li)}
 const base=typeof VISUAL_BASE==='string'?VISUAL_BASE:'assets/visuals/';
 const demo=el('modeInfoDemo');
 if(game==='moreless'){
  el('modeInfoPrompt').textContent='Welche Stadt hat die größere Fläche?';
  demo.innerHTML='<div class="infoCompare"><button type="button" class="infoExampleCard" onclick="answerModeExample(\'berlin\')"><img src="'+base+'berlin.webp" alt="Berlin" width="480" height="320"><b>Berlin</b><span>891 km²</span></button><button type="button" class="infoExampleCard" onclick="answerModeExample(\'paris\')"><img src="'+base+'paris.webp" alt="Paris" width="480" height="320"><b>Paris</b><span id="modeInfoHiddenValue">?</span></button></div>';
 }else if(game==='estimate'){
  el('modeInfoPrompt').textContent='Wie groß ist der Durchmesser des Mars?';
  demo.innerHTML='<img class="infoSubjectImage" src="'+base+'mars.webp" alt="Mars" width="480" height="320"><label class="infoEstimateLabel" for="modeInfoEstimate">Deine Schätzung in km</label><div class="infoEstimateEntry"><input type="number" id="modeInfoEstimate" min="0" step="any" inputmode="decimal" placeholder="z. B. 7000"><button type="button" onclick="answerModeExample(\'estimate\')">Schätzen →</button></div>';
 }else if(game==='facts'){
  el('modeInfoPrompt').textContent='Ein Schachbrett hat 64 Felder.';
  demo.innerHTML='<div class="infoChess" aria-hidden="true">'+Array.from({length:64},(_,i)=>'<span class="'+((Math.floor(i/8)+i)%2?'dark':'light')+'"></span>').join('')+'</div><div class="infoFactChoices"><button type="button" onclick="answerModeExample(\'fact\')">Fakt</button><button type="button" onclick="answerModeExample(\'fake\')">Fake</button></div>';
 }else{
  el('modeInfoPrompt').textContent='Wähle ein Punktefeld auf dem Board.';
  demo.innerHTML='<div class="infoBoard"><b>Geografie</b><b>Sport</b><b>Kultur</b>'+[100,200,300].flatMap(n=>[0,1,2].map(()=>'<button type="button" onclick="answerModeExample(\'board\')">'+n+'</button>')).join('')+'</div>';
 }
 el('modeInfoResult').textContent='Nur ein Beispiel – dein Spielstand bleibt unverändert.';el('modeInfoResult').classList.remove('correct','wrong');
 el('modeInfoNote').textContent=game==='moreless'&&mode==='chaos'?'Hier siehst du das Grundprinzip. Im Chaos-Modus bestimmt die gezogene Regel, welcher Wert zählt und wie viele Punkte du bekommst.':game==='moreless'&&mode==='blitz'?'Im Match gilt deine eingestellte Zeit. Dieses Beispiel hat keinen Countdown.':game==='estimate'?'Das Beispiel zeigt die normale Punkteberechnung. Risk, Survival und King wenden zusätzlich ihre Modusregeln an.':'';
 el('modeInfoDialog').dataset.game=game;if(!el('modeInfoDialog').open)el('modeInfoDialog').showModal();
}
function closeModeInfo(){el('modeInfoDialog').close();MODE_INFO.focus?.focus?.();MODE_INFO.game=null;MODE_INFO.answered=false}
function answerModeExample(choice){
 if(!MODE_INFO.game)return;const result=el('modeInfoResult');
 if(MODE_INFO.game==='moreless'){
  if(MODE_INFO.answered)return;MODE_INFO.answered=true;el('modeInfoHiddenValue').textContent='105 km²';
  const correct=choice==='berlin';result.textContent=correct?'Richtig! Berlin hat die größere Fläche: 891 km² gegenüber 105 km².':'Paris hat 105 km². Berlin ist mit 891 km² größer.';result.classList.toggle('correct',correct);result.classList.toggle('wrong',!correct);
  el('modeInfoDemo').querySelectorAll('button').forEach(b=>b.disabled=true);
 }else if(MODE_INFO.game==='estimate'){
  const raw=el('modeInfoEstimate').value.trim(),value=Number(raw);if(!raw||!Number.isFinite(value)||value<0){result.textContent='Gib eine gültige Zahl ein.';return}
  const points=Math.round(100*Math.max(0,1-Math.min(Math.abs(value-6792)/6792,1)));result.textContent='Lösung: 6.792 km · Deine Schätzung: '+value.toLocaleString('de-DE')+' km · '+points+' Beispielpunkte';result.classList.add('correct');
 }else if(MODE_INFO.game==='facts'){
  result.textContent=choice==='fact'?'Richtig! Acht Reihen mit je acht Feldern ergeben 64.':'Das ist ein Fakt: 8 × 8 = 64 Felder.';result.classList.toggle('correct',choice==='fact');result.classList.toggle('wrong',choice!=='fact');
 }else{
  el('modeInfoPrompt').textContent='Beispiel: Wie heißt die Hauptstadt Frankreichs?';result.textContent='Antwort: Paris. Im Match buzzert ein Team und beantwortet die Frage. Die Bewertung erfolgt durch den Host.';
 }
}

// One voluntary help surface for the principle, mode overview and mode examples.
function openGameInfo(game){
 const names={moreless:'More / Less',estimate:'Schätzduell',facts:'Fakt oder Fake',quiz:'Jeopardy'};
 const principles={moreless:'Vergleiche zwei Karten mit derselben Messgröße. Wähle die Karte mit dem höheren Wert; im Chaos-Modus kann eine gezogene Regel das Ziel ändern.',estimate:'Schätze den gesuchten Zahlenwert und achte auf die Einheit. Je näher dein Tipp an der Lösung liegt, desto mehr Punkte bekommst du.',facts:'Entscheide bei jeder Aussage: Fakt oder Fake? Nach der Antwort bekommst du die Auflösung mit Erklärung.',quiz:'Wählt Kategorien und Punktefelder auf dem Board, buzzert und beantwortet die Frage. Richtige Antworten bringen den Feldwert, falsche Antworten kosten ihn.'};
 const modes={moreless:[['classic','Classic'],['blitz','Blitz'],['survival','Survival'],['king','King'],['party','Party'],['chaos','Chaos']],estimate:[['classic','Classic'],['blitz','Blitz'],['survival','Survival'],['risk','Risk'],['king','King']],facts:[['easy','Leicht'],['medium','Mittel'],['hard','Schwer']],quiz:[['standard','Standard'],['big','Big Board'],['football','Fußball'],['random','Random'],['nerd','Schwer'],['sport','Sport'],['geo','Geo'],['party','Party']]};
 if(!names[game])return;
 MODE_INFO.game=game;MODE_INFO.mode=null;if(!el('modeInfoDialog').open)MODE_INFO.focus=document.activeElement;MODE_INFO.answered=false;
 el('modeInfoTitle').textContent=names[game]+' · Spielprinzip & Modi';el('modeInfoBrand').textContent='SPIELINFORMATION';el('modeInfoPrompt').textContent='Das Spielprinzip';
 const demo=el('modeInfoDemo');demo.replaceChildren();const p=document.createElement('p');p.className='gameInfoPrinciple';p.textContent=principles[game];demo.append(p);
 const list=el('modeInfoRules');list.replaceChildren();
 for(const [mode,title] of modes[game]){const li=document.createElement('li'),button=document.createElement('button');button.type='button';button.className='gameInfoMode';button.textContent=title+' · Regeln ansehen →';button.onclick=()=>openModeInfo(game,mode);li.append(button);list.append(li)}
 el('modeInfoResult').textContent='Wähle einen Modus, um seine Regeln und ein Beispiel zu sehen.';el('modeInfoResult').classList.remove('correct','wrong');el('modeInfoNote').textContent=game==='facts'?'Zusätzlich wählst du Classic oder „Wie sicher?“. Bei „Wie sicher?“ setzt du Punkte auf deine Antwort. Online wird gemeinsam aufgelöst.':'Die ⓘ-Buttons an den Moduskarten öffnen diese Regeln auch direkt.';
 el('modeInfoDialog').dataset.game=game;if(!el('modeInfoDialog').open)el('modeInfoDialog').showModal();
}
