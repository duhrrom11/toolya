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
 // Only fixed, app-owned message containers. Content cards, private notes and
 // account identifiers must not be modified by the status translator.
 const statusSelectors=["#homeSettingsStatus","#homeLayoutStatus","#homeCompareStatus","#homeBackupStatus","#homeCheckpointViewStatus","#homeCheckpointFavoriteStatus","#homeCheckpointStatus","#homeCheckpointCompareStatus","#homeHistoryStatus","#homeGiftStatus","#bulkStatus","#bulkProgressText",'#listsStatus','#editListFeedback','#status','#count','#taskStatus','#checklistStatus','#rolloverStatus',
  '#giftStatus','#filterStatus','#productSearchStatus','#searchStatus','#detailStatus',
  '#profileStatus','#settingsAuthMessage','#settingsAccountStatus','#settingsStatus',
  '#notice','#reactionStatus','#actionStatus','#budgetSaveFeedback','#giftFormFeedback',
  '#taskActionStatus','#closingStatus','#reviewStatus','#wishExtrasImportFeedback','#wishExtrasCloudFeedback','#backupPreviewStatus','#peopleSearchCount','#profileFeedInfo','#giftFinderStatus','#wishSaveFeedback','#wishlistAuthStatus','#feedCount','#hiddenWishInfo','#hiddenProfileInfo','#exportProgress','[data-wish-runtime-status]'];
 // Do not select progress bars, counters, wish cards, user descriptions or
 // account identity fields. Status translations must be exact/prefix matched.
 const statusSources=new WeakMap();
 function translateLiveStatuses(){
  for(const selector of statusSelectors){
   for(const node of document.querySelectorAll(selector)){
    if(node.children.length||node.isContentEditable)continue;
    const before=node.textContent,previous=statusSources.get(node),source=previous?.rendered===before?previous.source:before,after=wishesText(source,active);
    statusSources.set(node,{source,rendered:after});
    if(before!==after)node.textContent=after;
   }
  }
 }
 let scheduled=false;
 function updateVisibleCopy(){
  scheduled=false;
  applyWishLocale(document,active);
  translateLiveStatuses();
 }
 function scheduleUpdate(){
  if(scheduled)return;
  scheduled=true;
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(updateVisibleCopy);
  else queueMicrotask(updateVisibleCopy);
 }
 if(typeof MutationObserver==='function'){
  const observer=new MutationObserver(scheduleUpdate);
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});
 }

 for(const lang of ['de','en']){
  const button=document.createElement('button');button.type='button';button.lang=lang;button.textContent=lang.toUpperCase();
  button.dataset.wishesLocale=lang;
  button.addEventListener('click',()=>apply(lang,true));nav.append(button);
 }
 // Legacy Wishes replaces the old header with a shared shell. Its original
 // header is display:none, so putting the locale controls inside it makes
 // the actual DE/EN buttons inaccessible (including to keyboard users).
 if(document.body.classList.contains('wishlist-redesign')){
  const place=()=>{const actions=document.querySelector('.ty-tool-hero-actions');if(actions){if(nav.parentElement!==actions)actions.prepend(nav);}else if(nav.parentElement!==document.body)header.before(nav);};
  header.after(notice);place();document.addEventListener('toolya:tool-hero-ready',place);
 }
 else if(header.matches('body[data-toolya-legacy-wishes] > header'))header.after(nav,notice);
 else{header.append(nav);header.after(notice)}
 function apply(lang,persist){
  active=lang;globalThis.__toolyaWishesLocale=lang;
  if(persist){
   try{localStorage.setItem(key,lang)}catch{}
   const url=new URL(location.href);url.searchParams.set('lang',lang);
   history.replaceState(history.state,'',url.pathname+url.search+url.hash);
  }
  updateVisibleCopy();
  const translatedTitle=wishesText(initialTitle,'en');
  const userTitle=document.querySelector('#title[data-user-content],#name[data-user-content]');
  if(userTitle)document.title=userTitle.textContent+' · Toolya Wishes';
  else document.title=lang==='de'?initialTitle:
   translatedTitle!==initialTitle?translatedTitle:
   wishesText(initialTitle.replace(' · Toolya Wishes',''),'en')+' · Toolya Wishes';
  document.documentElement.lang=lang;
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
