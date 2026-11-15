/* Homepage choreography. No tool, account or cloud-data writes. */
import {buddy} from './platform.mjs';
const stage=document.querySelector('.ty-hero-stage');
const characters=[...stage.querySelectorAll('.ty-hero-character')];
const message=stage.querySelector('.ty-duo-message');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
const roles={alle:null,finanzen:1,zuhause:9,organisation:2,unterwegs:5,tiere:6};
const copy={finanzen:'Wir behalten mit dir den Überblick.',zuhause:'Zusammen machen wir es uns leichter.',organisation:'Ein guter Plan? Da sind wir dabei!',unterwegs:'Bereit für deinen nächsten Weg.',tiere:'Für deine tierischen Freunde sind wir da.'};
const toolRoles={wishlist:0,kassenbon:1,kisten:3,'wg-kasse':2,notizen:4,kfz:5,haustier:6,parken:7,verleih:8,pflanzen:9,energie:10,backform:11};
let role=null,epoch=0,taps=[],cooldown=0,visible=true,disposed=false,posesReady=false;
const timers=new Set(),animations=new Set();
const blocked=()=>disposed||document.hidden||buddy.hidden||buddy.quiet||buddy.dialogs.length>0||['warning','error','form-error'].includes(buddy.current?.type)||[...document.querySelectorAll('dialog,[role=dialog],[role=alertdialog]')].some(d=>d.getClientRects().length);
const mayMove=()=>!reduced.matches&&buddy.motion!=='off'&&!blocked();
const later=(fn,delay)=>{const id=setTimeout(()=>{timers.delete(id);fn();},delay);timers.add(id);return id;};
function clear(){++epoch;for(const id of timers)clearTimeout(id);timers.clear();for(const animation of animations)animation.cancel();animations.clear();}
function pose(index,character){
 const targets=character===undefined?characters:[characters[character]];
 for(const el of targets){el.dataset.art='pose';el.style.backgroundImage=`url("assets/toolya/home/${el.dataset.character}-poses.webp")`;el.style.backgroundSize='400% 200%';el.style.backgroundPosition=`${index%4*100/3}% ${Math.floor(index/4)*100}%`;}
}
function rest(){
 delete stage.dataset.reaction;message.hidden=true;
 if(role===null){stage.dataset.live='false';return;}
 stage.dataset.live='true';
 characters.forEach((el,i)=>{const index=role*2+i;el.dataset.art='outfit';el.style.backgroundImage='url("assets/toolya/outfits.webp")';el.style.backgroundSize='800% 400%';el.style.backgroundPosition=`${index%8*100/7}% ${Math.floor(index/8)*100/3}%`;});
}
function say(text){if(!text)return;message.textContent=text;message.hidden=false;}
function react(kind,index,text='',duration=1800){
 if(blocked()||!visible)return false;
 clear();const current=epoch;
 if(mayMove()&&posesReady){
  stage.dataset.live='true';stage.dataset.reaction=kind;pose(index);
  if(kind==='welcome'){pose(0,1);later(()=>{if(epoch===current&&mayMove())pose(2,1);},260);}
  if(kind==='point'){pose(6,0);pose(6,1);later(()=>{if(epoch===current&&mayMove())pose(3);},180);}
  if(kind==='blink'){pose(0,1);later(()=>{if(epoch===current&&mayMove())pose(1,1);},160);}
 }
 say(text);later(()=>{if(epoch===current)rest();},duration);return true;
}
async function preload(){
 const files=['turquoise-poses.webp','purple-poses.webp','hero-arch.webp'];
 const loaded=await Promise.all(files.map(file=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(true);img.onerror=()=>resolve(false);img.src='assets/toolya/home/'+file;})));
 posesReady=loaded.every(Boolean);stage.dataset.posesReady=String(posesReady);window.toolyaHomeReady=true;
 if(mayMove())react('welcome',2,'',1700);
}
const arch=new Image();arch.className='ty-hero-arch';arch.src='assets/toolya/home/hero-arch.webp';arch.alt='';arch.width=900;arch.height=659;stage.querySelector('.ty-live-duo').prepend(arch);
const cta=document.querySelector('.ty-primary');
cta.addEventListener('pointerenter',()=>{if(finePointer.matches&&mayMove())react('point',3);});
cta.addEventListener('focus',()=>{if(mayMove())react('point',3);});
cta.addEventListener('click',()=>react('point',3,'Los geht’s – such dir deinen Helfer aus.',1800));
document.querySelectorAll('[data-b3-category-filter]').forEach(button=>button.addEventListener('click',()=>{
 const category=button.dataset.b3CategoryFilter;role=roles[category]??null;clear();rest();
 if(!blocked()&&copy[category]){say(copy[category]);later(()=>message.hidden=true,2600);}
 const cards=[...document.querySelectorAll('.ty-tool-card')].filter(el=>el.style.display!=='none');
 if(mayMove())for(const [i,el] of cards.entries()){
  const animation=el.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,delay:Math.min(i*30,180),easing:'ease-out'});
  animations.add(animation);animation.finished.then(()=>animations.delete(animation),()=>animations.delete(animation));
 }
}));
window.addEventListener('toolya:favorite',event=>{
 const {id,active}=event.detail||{};const card=[...document.querySelectorAll('.ty-tool-card')].find(el=>el.dataset.id===id);
 if(!card||!active)return;
 react('celebrate',4,'Ein Lieblingshelfer mehr!',1800);
 if(mayMove()){
  const star=card.querySelector('.fav-btn img');star.classList.remove('ty-star-pop');void star.offsetWidth;star.classList.add('ty-star-pop');
 }
});
function tickle(){
 if(blocked())return;
 const now=Date.now();if(now<cooldown)return;
 taps=taps.filter(t=>now-t<5000);taps.push(now);if(taps.length<5)return;
 taps=[];cooldown=now+15000;react('tickle',5,'Hihihi, wir sind doch soooo kitzlig!',2800);
}
stage.querySelectorAll('.ty-mascot-hit').forEach(button=>button.addEventListener('click',tickle));
document.querySelectorAll('.ty-tool-card').forEach(card=>{
 let raf=0;
 card.addEventListener('pointerenter',()=>{if(finePointer.matches&&mayMove()&&role!==null){role=toolRoles[card.dataset.id]??role;rest();}});
 card.addEventListener('pointermove',event=>{
  if(!finePointer.matches||!mayMove())return;
  cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{if(!mayMove())return;const r=card.getBoundingClientRect();card.style.setProperty('--tilt-x',`${-(event.clientY-r.top-r.height/2)/r.height*4}deg`);card.style.setProperty('--tilt-y',`${(event.clientX-r.left-r.width/2)/r.width*4}deg`);});
 });
 card.addEventListener('pointerleave',()=>{cancelAnimationFrame(raf);card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y');});
});
function preferences(){
 document.body.dataset.homeMotion=mayMove()?'on':'off';stage.classList.toggle('ty-duo-hidden',buddy.hidden);
 if(!mayMove()||!visible){clear();rest();taps=[];for(const card of document.querySelectorAll('.ty-tool-card')){card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y');}}
}
new MutationObserver(preferences).observe(buddy.host,{attributes:true,attributeFilter:['data-motion','data-hidden','data-pose']});
// Native settings/dialogs can open without changing the buddy's pose.
const modalObserver=new MutationObserver(preferences);
for(const modal of document.querySelectorAll('dialog,[role=dialog],[role=alertdialog],#settingsModal'))modalObserver.observe(modal,{attributes:true,attributeFilter:['open','class','hidden','style']});
reduced.addEventListener('change',preferences);document.addEventListener('visibilitychange',preferences);
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;preferences();},{threshold:0}).observe(stage);
const idle=()=>{if(visible&&mayMove()&&!stage.dataset.reaction&&!document.activeElement?.closest('.ty-hero-stage'))react('blink',1,'',550);};
let idleTimer=setInterval(idle,18000);
window.addEventListener('pagehide',()=>{disposed=true;clear();clearInterval(idleTimer);});
window.addEventListener('pageshow',event=>{if(event.persisted){disposed=false;idleTimer=setInterval(idle,18000);preferences();}});
preferences();preload();
