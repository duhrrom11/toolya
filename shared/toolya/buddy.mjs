const POSE={welcome:'welcome',success:'success',tip:'tip',warning:'error',error:'error','form-error':'error'};
const REQUIRED=new Set(['warning','error','form-error']);
const MAX_QUEUE=12;
const priority=type=>REQUIRED.has(type)?2:1;
export class ToolyaBuddy {
 constructor({root=document.body,assetBase='./',character='turquoise',quiet=false,motion='normal',tips=true,hidden=false}={}){
  this.tickleTaps=[];this.tickleCooldown=0;this.tickleVariant=0;this.root=root;this.assetBase=assetBase;this.character=character;this.quiet=quiet;this.motion='normal';this.tips=!!tips;this.hidden=!!hidden;this.queue=[];this.current=null;this.timer=null;this.deadline=0;this.dialogs=[];this.destroyed=false;this.pointerOver=false;this.noticeEpoch=0;
  this.host=document.createElement('aside');this.host.className='toolya-buddy';this.host.setAttribute('data-motion',this.quiet?'off':this.motion==='normal'?'on':this.motion);this.host.setAttribute('data-intensity',this.motion);this.host.setAttribute('aria-label','Toolya-Begleiter');
  this.host.innerHTML='<div class="tb-message-box" hidden><img class="tb-avatar" alt="" aria-hidden="true"><div class="tb-text"><strong class="tb-title"></strong><p class="tb-body"></p><button type="button" class="tb-close">Schließen</button></div></div>';
  const avatar=this.host.querySelector('.tb-avatar');avatar.removeAttribute('aria-hidden');avatar.setAttribute('role','button');avatar.setAttribute('tabindex','0');avatar.setAttribute('aria-label','Toolya-Maskottchen');avatar.onclick=()=>this.tickle();avatar.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!e.repeat)this.tickle()}};
  root.append(this.host);this.host.onpointerenter=e=>{if(e.pointerType==='mouse'||e.pointerType==='pen')this.pointerOver=true};this.host.onpointerleave=()=>{this.pointerOver=false};this.host.onpointercancel=()=>{this.pointerOver=false};this.host.onblur=()=>{this.pointerOver=false};this.host.querySelector('.tb-close').onclick=()=>this.dismiss();this.host.querySelector('.tb-close').setAttribute('aria-label','Toolya-Meldung schließen');this.setMotion(motion);this.setHidden(hidden);
 }
 tickle(now=Date.now()){
  if(this.destroyed||this.dialogs.length||this.quiet||this.hidden||REQUIRED.has(this.current?.type)||now<this.tickleCooldown)return false;
  this.tickleTaps=this.tickleTaps.filter(t=>now-t<5000);this.tickleTaps.push(now);
  if(this.tickleTaps.length<5)return false;
  this.tickleTaps=[];this.tickleCooldown=now+15000;
  const lines=['Hihihihi! Ich bin doch soooo kitzlig!','Hahaha! Meine Ohren lachen schon mit!','Kicher! Noch einmal und ich falle um!','Du hast meinen geheimen Kitzelknopf gefunden!'];
  this.show('success',lines[this.tickleVariant++%lines.length]);this.host.setAttribute('data-reaction','tickle');return true;
 }
 image(img,type){if(!['turquoise','purple'].includes(this.character))return;const src=this.assetBase+'toolya_wishlist_'+this.character+'_'+(POSE[type]||'error')+'_1024.png';img.hidden=false;img.onerror=()=>{if(img.src.endsWith(src))img.hidden=true};img.src=src}
 setCharacter(c){if(this.destroyed)return;if(!['turquoise','purple'].includes(c))throw Error('Ungültiger Charakter');this.character=c;if(this.current)this.render(true);for(const d of this.dialogs)this.image(d.img,'warning')}
 setMotion(mode){if(this.destroyed)return;if(!['off','calm','normal','lively'].includes(mode))throw Error('Ungültige Animationsstufe');this.motion=mode;this.host.setAttribute('data-intensity',mode);this.host.setAttribute('data-motion',this.quiet?'off':mode==='normal'?'on':mode)}
 setTips(enabled){if(this.destroyed)return;this.tips=!!enabled;if(!this.tips){this.queue=this.queue.filter(x=>x.type!=='tip');if(this.current?.type==='tip')this.dismiss()}}
 setHidden(value){if(this.destroyed)return;this.hidden=!!value;this.host.setAttribute('data-hidden',String(this.hidden));this.host.hidden=this.hidden&&!REQUIRED.has(this.current?.type);if(this.hidden){this.queue=this.queue.filter(x=>REQUIRED.has(x.type));if(this.current&&!REQUIRED.has(this.current.type))this.dismiss()}}
 setQuiet(q){if(this.destroyed)return;const previous=this.current;this.quiet=!!q;this.host.setAttribute('data-motion',this.quiet?'off':this.motion==='normal'?'on':this.motion);if(this.quiet){this.queue=this.queue.filter(item=>REQUIRED.has(item.type));if(this.current&&!REQUIRED.has(this.current.type))this.current=null;if(!this.current)this.current=this.queue.shift()||null;}this.render(previous===this.current)}
 show(type,message,emotion=null){
  if(this.destroyed||!Object.hasOwn(POSE,type)||typeof message!=='string'||!message.trim())return false;
  if((this.quiet&&!REQUIRED.has(type))||(type==='tip'&&!this.tips)||(this.hidden&&!REQUIRED.has(type)))return false;
  const item={type,message:message.trim(),...(typeof emotion==='string'?{emotion}:{})};
  if(this.current?.type===item.type&&this.current.message===item.message)return true;
  if(this.queue.some(x=>x.type===item.type&&x.message===item.message))return true;
  if(!this.current){this.current=item;this.render();return true}
  if(priority(type)>priority(this.current.type)){
   if(!this.quiet&&!this.hidden&&!REQUIRED.has(this.current.type))this.enqueue(this.current);
   this.current=item;this.render();return true;
  }
  if(REQUIRED.has(this.current.type)||REQUIRED.has(type)){this.enqueue(item);return true}
  this.current=item;this.render();return true;
 }
 enqueue(item){
  if((this.quiet||this.hidden)&&!REQUIRED.has(item.type))return;
  if(this.queue.some(x=>x.type===item.type&&x.message===item.message))return;
  this.queue.push(item);
  this.queue.sort((a,b)=>priority(b.type)-priority(a.type));
  if(this.queue.length>MAX_QUEUE){
   const optional=this.queue.findLastIndex(x=>!REQUIRED.has(x.type));
   if(optional>=0)this.queue.splice(optional,1);
   // Critical alerts are never silently discarded to satisfy the optional queue limit.
  }
 }
 render(preserveTimer=false){this.host.removeAttribute('data-reaction');clearTimeout(this.timer);const epoch=++this.noticeEpoch;const box=this.host.querySelector('.tb-message-box');box.hidden=!this.current;this.host.hidden=this.hidden&&!REQUIRED.has(this.current?.type);if(!this.current){this.deadline=0;this.host.setAttribute('data-pose','idle');return;}const {type,message}=this.current;if(REQUIRED.has(type))this.tickleTaps=[];this.host.setAttribute('data-pose',POSE[type]);this.image(this.host.querySelector('.tb-avatar'),type);const live=this.host.querySelector('.tb-text');live.setAttribute('role',REQUIRED.has(type)?'alert':'status');live.setAttribute('aria-live',REQUIRED.has(type)?'assertive':'polite');live.setAttribute('aria-atomic','true');this.host.querySelector('.tb-title').textContent=({'welcome':'Willkommen','success':'Geschafft','tip':'Tipp','warning':'Achtung','error':'Fehler','form-error':'Bitte Eingabe prüfen'})[type];this.host.querySelector('.tb-body').textContent=message;this.host.querySelector('.tb-close').setAttribute('aria-label','Toolya-Meldung schließen');if(!REQUIRED.has(type)){const duration=type==='tip'?9000:7000;const remaining=preserveTimer&&this.deadline?Math.max(0,this.deadline-Date.now()):duration;this.deadline=Date.now()+remaining;this.timer=setTimeout(()=>this.expireOptional(epoch),remaining)}else this.deadline=0}
 expireOptional(epoch=this.noticeEpoch){if(epoch!==this.noticeEpoch||this.destroyed||!this.current||REQUIRED.has(this.current.type))return;const close=this.host.querySelector('.tb-close');if((document.activeElement===close||document.activeElement===this.host.querySelector('.tb-avatar'))||this.pointerOver||document.hidden||this.dialogs.length){this.timer=setTimeout(()=>this.expireOptional(epoch),1000);return;}this.dismiss()}
 dismiss(){if(this.destroyed)return;clearTimeout(this.timer);this.deadline=0;do{this.current=this.queue.shift()||null}while((this.quiet||this.hidden||(!this.tips&&this.current?.type==='tip'))&&this.current&&!REQUIRED.has(this.current.type));this.render()}
 confirm({message,title='Bitte bestätigen',confirmLabel='Bestätigen',cancelLabel='Abbrechen',danger=false}={}){
  if(typeof message!=='string'||!message.trim())return Promise.reject(Error('Bestätigungstext fehlt'));
  return new Promise(resolve=>{
   if(this.destroyed||this.dialogs.length){resolve(false);return;}const previous=document.activeElement,overlay=document.createElement('dialog');overlay.className='tb-overlay';overlay.setAttribute('role','alertdialog');overlay.setAttribute('aria-modal','true');
   const dialog=document.createElement('div');dialog.className='tb-dialog';
   const img=document.createElement('img');img.className='tb-dialog-avatar';img.alt='';img.setAttribute('aria-hidden','true');this.image(img,'warning');
   const h=document.createElement('h2'),p=document.createElement('p');h.textContent=title;p.textContent=message.trim();
   const id='tb-dialog-'+Math.random().toString(36).slice(2);h.id=id+'-title';p.id=id+'-desc';overlay.setAttribute('aria-labelledby',h.id);overlay.setAttribute('aria-describedby',p.id);
   const cancel=document.createElement('button'),yes=document.createElement('button');cancel.type=yes.type='button';cancel.textContent=cancelLabel;yes.textContent=confirmLabel;if(danger)yes.className='tb-danger';
   dialog.append(img,h,p,cancel,yes);overlay.append(dialog);document.body.append(overlay);
   const entry={img,finish:null};this.dialogs.push(entry);
   const finish=value=>{if(!this.dialogs.includes(entry))return;this.dialogs=this.dialogs.filter(x=>x!==entry);document.removeEventListener('keydown',key,true);overlay.close();overlay.remove();this.host.removeAttribute('data-dialog-open');if(previous?.isConnected&&typeof previous.focus==='function')previous.focus();resolve(value)};
   entry.finish=finish;
   const key=e=>{if(this.dialogs.at(-1)!==entry)return;if(e.key==='Escape'){e.preventDefault();e.stopPropagation();finish(false)}else if(e.key==='Tab'){const a=document.activeElement;if(e.shiftKey&&a===cancel){e.preventDefault();yes.focus()}else if(!e.shiftKey&&a===yes){e.preventDefault();cancel.focus()}else if(a!==cancel&&a!==yes){e.preventDefault();(e.shiftKey?yes:cancel).focus()}}};
   cancel.onclick=()=>finish(false);yes.onclick=()=>finish(true);overlay.addEventListener('cancel',e=>{e.preventDefault();finish(false)});document.addEventListener('keydown',key,true);this.host.setAttribute('data-dialog-open','true');overlay.showModal();cancel.focus();
  });
 }
 destroy(){this.destroyed=true;this.noticeEpoch++;clearTimeout(this.timer);this.deadline=0;this.queue=[];this.current=null;for(const d of [...this.dialogs])d.finish(false);this.host.remove()}
}
