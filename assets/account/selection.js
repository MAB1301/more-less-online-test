// Store only indices of trusted menu buttons; never execute text from storage.
(function(){
 const key='ml_game_selection_v1',groups={moreless:'#morelessModes .gameMode',estimate:'#playType .gameMode',board:'#jeopardyIntro .gameMode',facts:'#factIntro .factLevel',length:'.estimateLength button'};
 let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{}
 for(const [group,selector] of Object.entries(groups)){const buttons=[...document.querySelectorAll(selector)],index=saved[group];if(Number.isInteger(index)&&index>=0&&index<buttons.length)buttons[index].click();buttons.forEach((button,index)=>button.addEventListener('click',()=>{saved[group]=index;try{localStorage.setItem(key,JSON.stringify(saved))}catch{}}))}
})();
