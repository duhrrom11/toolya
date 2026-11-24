/* No hooks into encryption, authentication, export or clipboard logic. */
import {estateText} from './estate-copy.mjs';
import {applyEstateLocale} from './estate-dom.mjs';
const key='toolya-locale-v1';
const trustedStatusIds=['message','entry-file-status','mail-status','keyStatus','exportStatus',
 'openStatus','countdown','confirm-title','confirm-text','backup-state','alarm-state','checkin-state','review-state','entry-heading','person-heading','save-person'];
const sources=new WeakMap();
function translateEstateStatuses(lang){
 for(const id of trustedStatusIds){
  const el=document.getElementById(id);
  if(!el||el.children.length||el.isContentEditable)continue;
  const old=el.textContent,prev=sources.get(el),source=prev?.rendered===old?prev.source:old,next=estateText(source,lang);
  sources.set(el,{source,rendered:next});
  if(old!==next)el.textContent=next;
 }
}
function observeEstateStatuses(currentLanguage){
 if(typeof MutationObserver!=='function')return;
 const observer=new MutationObserver(()=>{translateEstateStatuses(currentLanguage());applyEstateLocale(document,currentLanguage())});
 observer.observe(document.body,{childList:true,characterData:true,subtree:true});
}

function saved(){const q=new URLSearchParams(location.search).get('lang');
if(q==='de'||q==='en')return q;
try{return localStorage.getItem(key)==='en'?'en':'de'}catch{return 'de'}}
function mount(){
 const print=location.pathname.endsWith('/print-key.html');
 const originalTitle=document.title;
 let lang=saved();
 let nav=null,notice=null;
 const header=document.querySelector('body > header');
 if(!print&&header){
  nav=document.createElement('nav');nav.className='ty-estate-locale';nav.setAttribute('aria-label','Language / Sprache');
  notice=document.createElement('p');notice.className='ty-estate-locale-notice';notice.setAttribute('role','status');
  notice.textContent='English translation is being completed; some security and account messages remain in German.';
  for(const target of ['de','en']){
   const b=document.createElement('button');b.type='button';b.textContent=target.toUpperCase();b.lang=target;b.dataset.estateLocale=target;
   b.addEventListener('click',()=>apply(target,true));nav.append(b);
  }
  function mountLanguageControls(){
   const hero=document.querySelector('.ty-tool-hero');
   const host=hero?.querySelector('.ty-tool-hero-copy')||header;
   host.append(nav);
   header.after(notice);
  }
  mountLanguageControls();
  document.addEventListener('toolya:tool-hero-ready',()=>{
   mountLanguageControls();
   apply(lang,false);
  },{once:true});
 }
 function apply(target,persist){
  lang=target;
  if(persist){
   try{localStorage.setItem(key,lang)}catch{}
   const url=new URL(location.href);url.searchParams.set('lang',lang);
   history.replaceState(history.state,'',url.pathname+url.search+url.hash);
  }
  translateEstateStatuses(lang);
  applyEstateLocale(document,lang);
  globalThis.__toolyaEstateLocale=lang;
  translateEstateStatuses(lang);
  document.title=lang==='en'?estateText(originalTitle.replace(' | Toolya',''),'en')+' | Toolya':originalTitle;
  nav?.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.estateLocale===lang)));
  if(notice)notice.hidden=lang!=='en';
  document.dispatchEvent(new Event('toolya:estate-locale-change'));
 }
 observeEstateStatuses(()=>lang);
 apply(lang,false);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();