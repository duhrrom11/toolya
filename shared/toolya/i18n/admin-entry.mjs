import {adminText} from './admin-copy.mjs';
import {applyAdminLocale} from './admin-dom.mjs';
const key='toolya-locale-v1';
function locale(){
 const q=new URLSearchParams(location.search).get('lang');
 if(q==='de'||q==='en')return q;
 try{return localStorage.getItem(key)==='en'?'en':'de'}catch{return 'de'}
}
function mount(){
 const header=document.querySelector('body > header');if(!header)return;
 const bar=document.createElement('nav');bar.className='ty-admin-language';bar.setAttribute('aria-label','Language / Sprache');
 const oldTitle=document.title;let selected=locale();
 const notice=document.createElement('p');notice.className='ty-admin-language-notice';notice.setAttribute('role','status');
 notice.textContent='Some dynamically generated administrator messages have not yet been translated.';
 for(const lang of ['de','en']){
  const button=document.createElement('button');button.type='button';button.textContent=lang.toUpperCase();button.lang=lang;button.dataset.adminLocale=lang;
  button.addEventListener('click',()=>apply(lang,true));bar.append(button);
 }
 header.append(bar);header.after(notice);
 const nodes=['state','healthStatus','result','progress','fileStatus','configuration','selection']
  .map(id=>document.getElementById(id)).filter(Boolean);
 // Only exact catalogue matches change live status text; dynamic data is untouched.
 function updateStatus(){for(const el of nodes){if(el.children.length)continue;const old=el.textContent,translated=adminText(old,selected);if(old!==translated)el.textContent=translated}}
 function apply(lang,persist){
  selected=lang;
  if(persist){
   try{localStorage.setItem(key,lang)}catch{}
   const url=new URL(location.href);url.searchParams.set('lang',lang);history.replaceState(history.state,'',url.pathname+url.search+url.hash);
  }
  applyAdminLocale(document,lang);updateStatus();
  document.title=lang==='en'?adminText(oldTitle.replace(' · Toolya Admin','').replace(' · Toolya',''),'en')+' · Toolya':oldTitle;
  for(const b of bar.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.adminLocale===lang));
  notice.hidden=lang!=='en';
 }
 if(typeof MutationObserver==='function'){
  const observer=new MutationObserver(updateStatus);
  for(const el of nodes)observer.observe(el,{childList:true,characterData:true,subtree:true});
 }
 apply(selected,false);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();