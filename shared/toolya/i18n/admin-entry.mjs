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
 const notice=document.createElement('p');notice.className='ty-admin-language-notice';notice.setAttribute('role','status');notice.lang='en';
 notice.textContent='Some dynamically generated administrator messages have not yet been translated.';
 for(const lang of ['de','en']){
  const button=document.createElement('button');button.type='button';button.textContent=lang.toUpperCase();button.lang=lang;button.dataset.adminLocale=lang;
  button.addEventListener('click',()=>apply(lang,true));bar.append(button);
 }
 header.append(bar);header.after(notice);
 const nodes=['state','healthStatus','result','progress','fileStatus','configuration','selection','pageLabel','ranking-diagnostic','tool-ranking']
  .map(id=>document.getElementById(id)).filter(Boolean);
 // Only exact catalogue matches change live status text; dynamic data is untouched.
 const statusSources=new WeakMap();
 function updateStatus(){for(const el of nodes){if(el.children.length)continue;const old=el.textContent,previous=statusSources.get(el);const source=previous?.rendered===old?previous.source:old;const translated=adminText(source,selected);statusSources.set(el,{source,rendered:translated});if(old!==translated)el.textContent=translated}}
 function apply(lang,persist){
  selected=lang;globalThis.__toolyaAdminLocale=lang;
  if(persist){
   try{localStorage.setItem(key,lang)}catch{}
   const url=new URL(location.href);url.searchParams.set('lang',lang);history.replaceState(history.state,'',url.pathname+url.search+url.hash);
  }
  updateStatus();applyAdminLocale(document,lang);
  document.title=lang==='en'?adminText(oldTitle.replace(' · Toolya Admin','').replace(' · Toolya',''),'en')+' · Toolya':oldTitle;
  bar.setAttribute('aria-label',lang==='en'?'Choose interface language':'Sprache der Oberfläche wählen');
  for(const b of bar.querySelectorAll('button')){
   const target=b.dataset.adminLocale;
   b.setAttribute('aria-pressed',String(target===lang));
   const label=target==='de'?(lang==='en'?'Switch to German':'Deutsch auswählen'):(lang==='en'?'English selected':'Englisch auswählen');
   b.lang=lang;b.setAttribute('aria-label',label);b.setAttribute('title',label);
  }
  notice.hidden=lang!=='en';document.documentElement.lang=lang;document.dispatchEvent(new Event('toolya:admin-locale-change'));
 }
 if(typeof MutationObserver==='function'){
  const observer=new MutationObserver(updateStatus);
  for(const el of nodes)observer.observe(el,{childList:true,characterData:true,subtree:true});
 }
 for(const method of ['alert','confirm']){const native=globalThis[method]?.bind(globalThis);if(native)globalThis[method]=(message,...args)=>native(adminText(message,selected),...args);}
 apply(selected,false);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();