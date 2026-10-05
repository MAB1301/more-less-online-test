import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const offline=fs.readFileSync('offline/index.html','utf8');
const library=fs.readFileSync('assets/vendor/qrcode.min.js','utf8');
assert.match(html,/src="assets\/vendor\/qrcode.min.js(?:\?[^"]*)?"/);
assert.match(offline,/src="\.\.\/assets\/vendor\/qrcode.min.js(?:\?[^"]*)?"/);
assert(!html.includes('qrcode@1.5.4/build/qrcode.min.js'));
function source(name){
  const start=html.indexOf('function '+name+'(');
  assert(start>=0,name+' exists');
  const open=html.indexOf('{',start);
  let depth=0,quote='',escape=false;
  for(let i=open;i<html.length;i++){
    const c=html[i];
    if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote='';continue}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue}
    if(c==='{')depth++;
    if(c==='}'&&!--depth)return html.slice(start,i+1);
  }
  throw Error('Unclosed '+name);
}
let dark=0,light=0,opened=0;
const pixels={
  set fillStyle(color){this.color=color},
  fillRect(){if(this.color==='#101827')dark++;else if(this.color==='#ffffff')light++},
  strokeRect(){},clearRect(){},set strokeStyle(_value){},set lineWidth(_value){}
};
const target={children:[],replaceChildren(){this.children=[]},appendChild(item){this.children.push(item)}};
const status={textContent:''},code={value:''},name={focus(){this.focused=true}};
const el=id=>({joinQr:target,qrStatus:status,code,name})[id];
const document={
  documentElement:{tagName:'HTML'},
  createElement(tag){
    if(tag==='canvas')return {style:{},getContext:()=>pixels};
    if(tag==='img')return {style:{},set src(value){this.url=value}};
    throw Error('Unexpected element '+tag);
  }
};
const location={href:'https://mab1301.github.io/more-less-online-test/?home=1'};
const context=vm.createContext({document,navigator:{userAgent:'Safari'},CanvasRenderingContext2D:function(){},
  location,URL,S:{code:'AB12CD'},LOBBY_GAME:'moreless',LOBBY_MODE:'CLASSIC',el,
  openHomeLobby:()=>opened++,msg:()=>{}});
context.window=context;
vm.runInContext(library,context);
vm.runInContext(['joinUrl','updateQr','applyJoinLink'].map(source).join('\n'),context);
vm.runInContext('updateQr()',context);
const link=new URL(target.title);
assert.equal(link.searchParams.get('join'),'AB12CD');
assert.equal(link.searchParams.get('game'),'moreless');
assert.equal(link.searchParams.get('mode'),'CLASSIC');
assert.equal(link.searchParams.has('home'),false);
assert.equal(target.children.length,2,'library draws canvas and fallback image');
assert(dark>100&&light>100,'QR has a populated light/dark matrix');
assert.equal(status.textContent,'Scannen & beitreten');
location.href=link.toString();
vm.runInContext('applyJoinLink()',context);
assert.equal(opened,1,'scanned link opens the join form');
assert.equal(code.value,'AB12CD');
assert.equal(name.focused,true);
context.QRCode=undefined;
vm.runInContext('updateQr()',context);
assert.equal(target.children.length,0,'failed library state removes a stale QR');
assert.match(status.textContent,/Raumcode verwenden/,'fallback tells players how to join');
console.log('OK: bundled QR renders locally and scanned URL opens join form with room code');
