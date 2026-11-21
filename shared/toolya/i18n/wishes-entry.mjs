import {wishesText} from './wishes-copy.mjs';
import {applyWishLocale} from './wishes-dom.mjs';
const key='toolya-locale-v1';
function storedLocale(){
 const query=new URLSearchParams(location.search).get('lang');
 if(query==='en'||query==='de')return query;
 try{return localStorage.getItem(key)==='en'?'en':'de'}catch{return 'de'}
}
function mount(){
 if(document.querySelector('.ty-wishes-language'))return;
 const header=document.querySelector('body > header')||document.body;
 const nav=document.createElement('nav');nav.className='ty-wishes-language';
 nav.setAttribute('aria-label','Language / Sprachauswahl');
 const notice=document.createElement('p');notice.className='ty-wishes-language-notice';
 notice.setAttribute('role','status');
 notice.textContent='The English version is still being completed. Some dynamic and account messages may remain in German.';
 const initialTitle=document.title;
 let active=storedLocale();
 for(const lang of ['de','en']){
  const button=document.createElement('button');button.type='button';button.lang=lang;button.textContent=lang.toUpperCase();
  button.dataset.wishesLocale=lang;
  button.addEventListener('click',()=>apply(lang,true));nav.append(button);
 }
 header.append(nav);header.after(notice);
 function apply(lang,persist){
  active=lang;globalThis.__toolyaWishesLocale=lang;
  if(persist){
   try{localStorage.setItem(key,lang)}catch{}
   const url=new URL(location.href);url.searchParams.set('lang',lang);
   history.replaceState(history.state,'',url.pathname+url.search+url.hash);
  }
  applyWishLocale(document,lang);
  document.title=lang==='en'?wishesText(initialTitle.replace(' · Toolya Wishes',''),'en')+' · Toolya Wishes':initialTitle;
  nav.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.wishesLocale===lang)));
  notice.hidden=lang!=='en';
  document.dispatchEvent(new Event('toolya:wishes-locale-change'));
 }
 for(const type of ['alert','confirm','prompt']){
  const original=globalThis[type];if(typeof original!=='function')continue;
  const native=original.bind(globalThis);
  globalThis[type]=(message,...args)=>native(wishesText(message,active),...args);
 }
 apply(active,false);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
else mount();