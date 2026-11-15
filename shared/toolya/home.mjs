/* Homepage choreography only. Tool data, authentication and cloud state stay in their owners. */
import {buddy} from './platform.mjs';
const stage=document.querySelector('.ty-hero-stage');
const characters=[...stage.querySelectorAll('.ty-hero-character')];
const message=stage.querySelector('.ty-duo-message');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
let clearReaction, taps=[],cooldown=0, epoch=0, role=null;
const roles={alle:null,finanzen:1,zuhause:9,organisation:2,unterwegs:5,tiere:6};
const copy={finanzen:'Wir behalten mit dir den Überblick.',zuhause:'Zusammen machen wir es uns leichter.',organisation:'Ein guter Plan? Da sind wir dabei!',unterwegs:'Bereit für deinen nächsten Weg.',tiere:'Für deine tierischen Freunde sind wir da.'};
const blocked=()=>document.hidden||buddy.hidden||buddy.quiet||buddy.dialogs.length>0||['warning','error','form-error'].includes(buddy.current?.type)||[...document.querySelectorAll('dialog,[role=dialog],[role=alertdialog]')].some(d=>d.getClientRects().length);
const mayMove=()=>!reduced.matches&&buddy.motion!=='off'&&!blocked();
function cell(element,index,file){element.style.backgroundImage=`url("assets/toolya/${file}")`;element.style.backgroundPosition=`${index%8*100/7}% ${Math.floor(index/8)*100/3}%`;}
function paintRole(){characters.forEach((el,i)=>cell(el,(role??12)*2+i,'outfits.webp'));stage.dataset.live=String(role!==null);}
function reset(){delete stage.dataset.reaction;message.hidden=true;paintRole();}
function react(kind,emotion,text='',duration=1800){
 if(blocked())return false;
 clearTimeout(clearReaction);const current=++epoch;
 if(mayMove()){
  stage.dataset.live='true';stage.dataset.reaction=kind;
  characters.forEach((el,i)=>cell(el,emotion*2,`emotions-${i?'purple':'turquoise'}.webp`));
  // Each atlas contains independently drawn eye, ear, paw and tail frames.
  setTimeout(()=>{if(epoch!==current||!mayMove())return;characters.forEach((el,i)=>cell(el,emotion*2+1,`emotions-${i?'purple':'turquoise'}.webp`));},360);
 }
 if(text){message.textContent=text;message.hidden=false;}
 clearReaction=setTimeout(()=>{if(current===epoch)reset();},duration);return true;
}
const cta=document.querySelector('.ty-primary');
cta.addEventListener('pointerenter',()=>{if(finePointer.matches&&mayMove())react('point',2);});
cta.addEventListener('focus',()=>{if(mayMove())react('point',2);});
cta.addEventListener('click',()=>react('point',12,'Los geht’s – such dir deinen Helfer aus.',1800));
document.querySelectorAll('[data-b3-category-filter]').forEach(button=>button.addEventListener('click',()=>{
 const category=button.dataset.b3CategoryFilter;role=roles[category]??null;
 clearTimeout(clearReaction);++epoch;reset();
 if(!blocked()&&copy[category]){message.textContent=copy[category];message.hidden=false;clearReaction=setTimeout(()=>message.hidden=true,2600);}
 const visible=[...document.querySelectorAll('.ty-tool-card')].filter(el=>el.style.display!=='none');
 if(mayMove())visible.forEach((el,i)=>el.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,delay:Math.min(i*30,180),easing:'ease-out'}));
}));
window.addEventListener('toolya:favorite',event=>{
 const {id,active}=event.detail||{};const card=[...document.querySelectorAll('.ty-tool-card')].find(el=>el.dataset.id===id);
 const star=card?.querySelector('.fav-btn img');
 if(active&&mayMove()&&star){star.classList.remove('ty-star-pop');void star.offsetWidth;star.classList.add('ty-star-pop');}
 if(active)react('celebrate',14,'Ein Lieblingshelfer mehr!',1800);
});
function tickle(){
 if(blocked())return;
 const now=Date.now();if(now<cooldown)return;
 taps=taps.filter(t=>now-t<5000);taps.push(now);
 if(taps.length<5)return;
 taps=[];cooldown=now+15000;react('tickle',10,'Hihihi, wir sind doch soooo kitzlig!',2800);
}
stage.querySelectorAll('.ty-mascot-hit').forEach(button=>button.addEventListener('click',tickle));
document.querySelectorAll('.ty-tool-card').forEach(card=>{
 let raf=0;
 card.addEventListener('pointermove',e=>{
  if(!finePointer.matches||!mayMove())return;
  cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{const r=card.getBoundingClientRect();card.style.setProperty('--tilt-x',`${-(e.clientY-r.top-r.height/2)/r.height*4}deg`);card.style.setProperty('--tilt-y',`${(e.clientX-r.left-r.width/2)/r.width*4}deg`);});
 });
 card.addEventListener('pointerleave',()=>{cancelAnimationFrame(raf);card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y');});
});
function preferences(){
 document.body.dataset.homeMotion=mayMove()?'on':'off';
 stage.classList.toggle('ty-duo-hidden',buddy.hidden);
 if(!mayMove()){++epoch;clearTimeout(clearReaction);reset();taps=[];}
}
new MutationObserver(preferences).observe(buddy.host,{attributes:true,attributeFilter:['data-motion','data-hidden','data-pose']});
reduced.addEventListener('change',preferences);document.addEventListener('visibilitychange',preferences);preferences();
// A finite welcome gesture; no continuous bouncing or autoplay sound.
if(mayMove())react('welcome',0,'',1800);
const idleTimer=setInterval(()=>{
 if(!mayMove()||stage.dataset.reaction||document.activeElement?.closest('.ty-hero-stage'))return;
 if(role!==null)react('blink',0,'',850);
},16000);
window.addEventListener('pagehide',()=>{clearInterval(idleTimer);clearTimeout(clearReaction);},{once:true});
