/* Reversible dashboard interface display. Never touches forms, user-authored
   task/shopping content, account sessions, saved keys, or selected mascots. */
import {dashboardText,dashboardLocale} from './dashboard-copy.mjs';
import {applyDashboardPageLocale} from './dashboard-dom.mjs';
const key='toolya-locale-v1';
const dynamicSelectors=['#userInfo','#cloudStatus','#loginMessage','#sync-status','#sync-detail','#shopping-status','#watering-connect-status','#notice'];
function mount(){
 const nav=document.querySelector('.b3-hub-nav');
 if(!nav||document.querySelector('.ty-dashboard-locale'))return;
 const group=document.createElement('span');
 group.className='ty-dashboard-locale';
 group.setAttribute('role','group');
 group.setAttribute('aria-label','Sprachauswahl / Language');
 const buttons=['de','en'].map(lang=>{
  const b=document.createElement('button');b.type='button';b.lang=lang;b.textContent=lang.toUpperCase();
  b.dataset.dashboardLocale=lang;b.addEventListener('click',()=>apply(lang,true));group.append(b);return b;
 });
 nav.append(group);
 const guide=document.querySelector('a[href="/toolya-dashboard/"]');
 const originals=new Map();
 const nodes=dynamicSelectors.map(s=>document.querySelector(s)).filter(Boolean);
 for(const el of nodes) originals.set(el,el.textContent);
 const [de,en]=buttons;
 function translateDynamic(){
  const lang=dashboardLocale();
  for(const el of nodes){
   if(el.children.length)continue;
   const txt=el.textContent;
   const translated=dashboardText(txt,lang);
   if(txt!==translated)el.textContent=translated;
  }
 }
 function apply(lang,persist){
  globalThis.__toolyaDashboardLocale=lang;
  if(persist){
   try{localStorage.setItem(key,lang)}catch{}
   const url=new URL(location.href);url.searchParams.set('lang',lang);
   history.replaceState(history.state,'',url.pathname+url.search+url.hash);
  }
  applyDashboardPageLocale(document,lang);
  // English presentation is still only partly verified; avoid pretending all
  // dynamically generated third-party messages have an English document language.
  document.documentElement.dataset.dashboardLocale=lang;
  for(const b of [de,en])b.setAttribute('aria-pressed',String(b.dataset.dashboardLocale===lang));
  if(guide){
   guide.href=lang==='en'?'/en/toolya-dashboard/':'/toolya-dashboard/';
   guide.lang=lang;
  }
  document.title=lang==='en'?'My dashboard | Toolya':'Mein Dashboard | Toolya';
  translateDynamic();
  document.dispatchEvent(new Event('toolya:dashboard-locale-change'));
 }
 if(typeof MutationObserver==='function'){
  const observer=new MutationObserver(translateDynamic);
  for(const el of nodes)observer.observe(el,{characterData:true,childList:true,subtree:true});
 }
 apply(dashboardLocale(),false);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
