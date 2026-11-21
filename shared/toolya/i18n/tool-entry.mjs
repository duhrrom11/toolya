/* Opt-in language presentation for existing authenticated tools.
   Stays strictly outside business logic, data, auth gates and maskot state.
   Incomplete translation is explicitly disclosed; account and tool workflows still need end-to-end verification. */
import {normalizeLocale} from './locale.mjs';
import {applyToolInterfaceLocale,translateToolDialog,translateAccountStatus} from './interface.mjs';
const key='toolya-locale-v1';
const uiGlobal=typeof window === 'undefined' ? globalThis : window;
const SUPPORTED=Object.freeze({
 moving:{heading:'Moving box organizer',subtitle:'Track your boxes, contents and locations',guide:'/en/moving-boxes/',german:'/umzugskisten/'},
 housemates:{heading:'Roommate organizer',subtitle:'Split expenses and plan shared tasks',guide:'/en/roommate-organizer/',german:'/wg-organisator/'},
 plants:{heading:'Plant care tracker',subtitle:'Track watering, plant notes and photos',guide:'/en/plant-care/',german:'/pflanzenpflege/'},
 baking:{heading:'Cake pan and recipe calculator',subtitle:'Resize baking pans and ingredients',guide:'/en/cake-pan-calculator/',german:'/backform-rechner/'}
});
const name=location.pathname.match(/^\/tools\/(moving|housemates|plants|baking)\/(?:index\.html)?$/)?.[1];
const settings=SUPPORTED[name];
function mountToolLanguage(){
 if(!settings)return;
 if(document.querySelector('.ty-tool-language'))return;
 let stored=null;
 try { stored=localStorage.getItem(key); } catch (_) { /* storage is optional */ }
 const query=new URLSearchParams(location.search);
 let selected=normalizeLocale(query.get('lang'))||normalizeLocale(stored)||'de';
 const header=document.querySelector('header.b3-header');
 const originalHeadings=new WeakMap();
 const originalDocTitle=document.title;
 const authGuide=document.querySelector('.toolya-auth-status > a');
 const originalAuthGuideHref=authGuide?.getAttribute('href');
 const modalHelpGuide=document.querySelector('#helpModal > div > p > a');
 const originalModalHelpGuideHref=modalHelpGuide?.getAttribute('href');
 const switcher=document.createElement('nav');
 switcher.className='ty-tool-language';
 switcher.setAttribute('aria-label','Tool language selection / Sprachauswahl');
 const de=document.createElement('button'),en=document.createElement('button');
 for(const [button,lang,text] of [[de,'de','DE'],[en,'en','EN']]){
   button.type='button';button.textContent=text;button.lang=lang;
   button.dataset.toolLocale=lang;
   switcher.append(button);
   button.addEventListener('click',()=>apply(lang,true));
 }
 // Wrap native dialogs once. Preserve return values, user input, and unknown errors.
 // The wrapper only changes known application-authored German messages.
 const nativeDialogs={};
 for(const method of ['alert','confirm','prompt']){
   if(typeof uiGlobal[method]!=='function')continue;
   nativeDialogs[method]=uiGlobal[method].bind(uiGlobal);
   uiGlobal[method]=function(message,...args){
     return nativeDialogs[method](translateToolDialog(name,selected,message),...args);
   };
 }
 uiGlobal.toolyaUiText=(value)=>translateAccountStatus(selected,value);
 const accountStatusSelectors={
   moving:['#userInfo','#cloudStatus'],
   housemates:['#cloud-status-text','#header-user-email'],
   plants:['#cloud-status-text','#header-user-email'],
   baking:['#cloud-status-text']
 };
 function localizeVisibleAccountStatus(lang){
   for(const selector of accountStatusSelectors[name]||[]){
     const el=document.querySelector(selector);
     if(!el)continue;
     // Never flatten nested account controls or replace user-authored content.
     if(el.children.length || el.isContentEditable)continue;
     const original=el.textContent;
     const translated=translateAccountStatus(lang,original);
     if(original!==translated)el.textContent=translated;
   }
 }
 // Auth callbacks can update status after the initial locale application.
 // Observe only known status fields rather than the entire document.
 if(typeof MutationObserver!=='undefined'){
   const statusObserver=new MutationObserver(()=>localizeVisibleAccountStatus(selected));
   for(const selector of accountStatusSelectors[name]||[]){
     const el=document.querySelector(selector);
     if(el)statusObserver.observe(el,{childList:true,characterData:true,subtree:true});
   }
 }
 const notice=document.createElement('p');
 notice.className='ty-tool-language-notice';
 notice.setAttribute('role','status');
 notice.lang='en';
 const guide=document.createElement('a');
 guide.href=settings.guide;
 guide.lang='en';
 guide.textContent='Read the English guide';
 notice.append('The English interface is still being completed. Some features and account workflows may appear in German. ',guide);
 function syncHeader(lang){
   const hero=document.querySelector('.ty-tool-hero');
   const titleContainer=hero?.querySelector('.ty-tool-hero-copy') || header?.querySelector('.b3-tool-title');
   if(!titleContainer)return;
   const heading=titleContainer.querySelector('h1');
   const title=[...(heading?.childNodes||[])].find(node=>node.nodeType===3 && node.textContent.trim());
   const subtitle=titleContainer.querySelector('p');
   for(const [node,translation] of [[title,settings.heading],[subtitle,settings.subtitle]]){
     if(!node)continue;
     if(!originalHeadings.has(node))originalHeadings.set(node,node.textContent);
     node.textContent=lang==='en'?translation:originalHeadings.get(node);
   }
   for(const node of [heading,subtitle])if(node)node.lang=lang;
   if(switcher.parentElement!==titleContainer){
     titleContainer.append(switcher);
     (hero||header).after(notice);
   }
 }
 function apply(lang,persist){
   selected=lang;
   uiGlobal.__toolyaUILocale=lang; // presentation only; never changes saved data or units
   if(persist){
     try{localStorage.setItem(key,lang)}catch(_){}
     if(uiGlobal.history && location.href){
       const url=new URL(location.href);
       url.searchParams.set('lang',lang);
       uiGlobal.history.replaceState(uiGlobal.history.state,'',url);
     }
   }
   syncHeader(lang);
   document.title=lang==='en'?settings.heading+' | Toolya':originalDocTitle;
   de.setAttribute('aria-pressed',String(lang==='de'));
   en.setAttribute('aria-pressed',String(lang==='en'));
   notice.hidden=lang!=='en';
   document.querySelector('.toolya-auth-status')?.setAttribute('lang',lang);
   if(authGuide){
     // The sign-in gate must lead to the guide in the selected language.
     if(lang==='en')authGuide.setAttribute('href',settings.guide);
     else if(originalAuthGuideHref!==null)authGuide.setAttribute('href',originalAuthGuideHref);
     authGuide.lang=lang;
   }
   applyToolInterfaceLocale(document,name,lang);
   if(modalHelpGuide){
     // Keep tool help navigation in the same language; preserve the source link for DE.
     if(lang==='en')modalHelpGuide.setAttribute('href',settings.guide);
     else if(originalModalHelpGuideHref!==null)modalHelpGuide.setAttribute('href',originalModalHelpGuideHref);
     modalHelpGuide.lang=lang;
   }
   localizeVisibleAccountStatus(lang);
   document.dispatchEvent(new document.defaultView.Event('toolya:locale-change'));
   // Keep html[lang]=de while the main application is not fully translated.
 }
 // The B3 editor re-creates its controls whenever sections are reordered/reset.
 // Translate the new controls without reloading or touching stored layout choices.
 document.addEventListener('toolya:b3-editor-rendered',()=>applyToolInterfaceLocale(document,name,selected));
 document.addEventListener('toolya:tool-hero-ready',()=>syncHeader(selected),{once:true});
 if(name==='baking')document.addEventListener('toolya:backstudio-layout-ready',()=>apply(selected,false),{once:true});
 apply(selected,false);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mountToolLanguage,{once:true});
else mountToolLanguage();
