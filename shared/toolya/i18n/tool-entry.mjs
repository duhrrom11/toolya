/* Opt-in language presentation for existing authenticated tools.
   Stays strictly outside business logic, data, auth gates and maskot state.
   Incomplete translation is explicitly disclosed; account and tool workflows still need end-to-end verification. */
import {normalizeLocale} from './locale.mjs';
import {createToolyaI18nextAdapter} from './i18next-runtime-adapter.mjs';
import {initializeToolyaI18next} from './i18next-singleton.mjs';
import {applyToolInterfaceLocale,translateToolDialog,translateAccountStatus,translateToolRuntimeStatus} from './interface.mjs';
const key='toolya-locale-v1';
const uiGlobal=typeof window === 'undefined' ? globalThis : window;
const SUPPORTED=Object.freeze({
 moving:{heading:'Moving box organizer',subtitle:'Track your boxes, contents and locations',guide:'/en/moving-boxes/',german:'/umzugskisten/'},
 housemates:{heading:'Roommate organizer',subtitle:'Split expenses and plan shared tasks',guide:'/en/roommate-organizer/',german:'/wg-organisator/'},
 plants:{heading:'Plant care tracker',subtitle:'Track watering, plant notes and photos',guide:'/en/plant-care/',german:'/pflanzenpflege/'},
 baking:{heading:'Cake pan and recipe calculator',subtitle:'Resize baking pans and ingredients',guide:'/en/cake-pan-calculator/',german:'/backform-rechner/'},
 "budget":{"heading":"Household budget and receipt scanner","subtitle":"Track income, spending, budgets and scanned receipts","guide":"/en/household-budget/","german":"/haushaltsbuch/"},
 "car":{"heading":"Vehicle cost tracker","subtitle":"Track vehicle expenses, maintenance and tyres","guide":"/en/vehicle-costs/","german":"/autokosten/"},
 "loans":{"heading":"Lent item tracker","subtitle":"Track borrowed items, contacts and return dates","guide":"/en/lent-items/","german":"/verliehene-dinge/"},
 "meters":{"heading":"Meter reading tracker","subtitle":"Record electricity, water and gas readings","guide":"/en/meter-readings/","german":"/zaehlerstaende/"},
 "parking":{"heading":"Parking spot saver","subtitle":"Record your parking space, time and fees","guide":"/en/parking-spot/","german":"/parkplatz-merker/"},
 "pet-health":{"heading":"Pet health diary","subtitle":"Track pets, vaccinations and vet visits","guide":"/en/pet-health/","german":"/tiergesundheit/"}
});
const name=location.pathname.match(/^\/tools\/(moving|housemates|plants|baking|budget|car|loans|meters|parking|pet-health)\/(?:index\.html)?$/)?.[1];
const settings=SUPPORTED[name];
function mountToolLanguage(){
 if(!settings)return;
 if(document.querySelector('.ty-tool-language'))return;
 let stored=null;
 try { stored=localStorage.getItem(key); } catch (_) { /* storage is optional */ }
 const query=new URLSearchParams(location.search);
 let selected=normalizeLocale(query.get('lang'))||normalizeLocale(stored)||'de';
 // Pilot: use an existing i18next singleton only when it has been initialized.
 // Do not initialize a second runtime or change any tool/account data.
 let i18nextAdapter=null;
 if((['parking','moving','housemates','plants','baking'].includes(name)) && initializeToolyaI18next(uiGlobal.i18next)){
   try{i18nextAdapter=createToolyaI18nextAdapter(uiGlobal.i18next);}catch(_){/* legacy fallback */}
 }
 const localizeDialog=(message)=>{
   if(!i18nextAdapter||selected!=='en')return translateToolDialog(name,selected,message);
   const exact=i18nextAdapter.translateTool(name,selected,message);
   if(exact!==message)return exact;
   const prefixed=i18nextAdapter.translatePrefix(name,selected,message,'dialog');
   return prefixed!==message?prefixed:translateToolDialog(name,selected,message);
 };
 const localizeStatus=(message)=>{
   if(!i18nextAdapter||selected!=='en')return translateToolRuntimeStatus(name,selected,message);
   const exact=i18nextAdapter.translateTool(name,selected,message);
   if(exact!==message)return exact;
   const prefixed=i18nextAdapter.translatePrefix(name,selected,message);
   return prefixed!==message?prefixed:translateToolRuntimeStatus(name,selected,message);
 };
 const header=document.querySelector('header.b3-header');
 const originalHeadings=new WeakMap();
 const originalDocTitle=document.title;
 const descriptionMeta=document.querySelector('meta[name="description"]');
 const originalDescription=descriptionMeta?.getAttribute('content');
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
   button.setAttribute('aria-label',lang==='de'?'Deutsch auswählen':'Select English');
   button.setAttribute('title',lang==='de'?'Deutsch auswählen':'Select English');
   switcher.append(button);
   button.addEventListener('click',()=>apply(lang,true));
 }
 // B3 layouts may reconstruct tool headings. Event delegation also handles
 // cloned language controls, whose direct event listeners are not retained.
 document.addEventListener('click',event=>{
   const button=event.target?.closest?.('.ty-tool-language [data-tool-locale]');
   if(!button || button===de || button===en)return;
   const code=button.dataset.toolLocale;
   if(code==='de'||code==='en')apply(code,true);
 },true);
 // Wrap native dialogs once. Preserve return values, user input, and unknown errors.
 // The wrapper only changes known application-authored German messages.
 const nativeDialogs={};
 for(const method of ['alert','confirm','prompt']){
   if(typeof uiGlobal[method]!=='function')continue;
   nativeDialogs[method]=uiGlobal[method].bind(uiGlobal);
   uiGlobal[method]=function(message,...args){
     return nativeDialogs[method](localizeDialog(message),...args);
   };
 }
 uiGlobal.toolyaUiText=(value)=>translateAccountStatus(selected,value);
 const accountStatusSelectors={
   moving:['#userInfo','#cloudStatus'],
   housemates:['#cloud-status-text','#header-user-email'],
   plants:['#cloud-status-text','#header-user-email'],
   baking:['#cloud-status-text'],
   'budget':['#cloud-status-text','#header-user-email','#userInfo','#cloudStatus'],
   'car':['#cloud-status-text','#header-user-email','#userInfo','#cloudStatus'],
   'loans':['#cloud-status-text','#header-user-email','#userInfo','#cloudStatus'],
   'meters':['#cloud-status-text','#header-user-email','#userInfo','#cloudStatus'],
   'parking':['#cloud-status-text','#header-user-email','#userInfo','#cloudStatus'],
   'pet-health':['#cloud-status-text','#header-user-email','#userInfo','#cloudStatus']
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
 // Observe only known, application-owned status nodes. Never observe user
 // records, shopping items, receipt descriptions or arbitrary new elements.
 const runtimeStatusSelectors={
  housemates:['#setup-status'],
  budget:['#ocrStatus','#saveBtn','#formTitle','#categoryChartSummary'],
  parking:['#timerStatus','#timerDisplay','#statGps']
 };
 const runtimeNodes=[];
 const observedRuntimeNodes=new WeakSet();
 const runtimeObserver=typeof MutationObserver!=='undefined'
  ?new MutationObserver(localizeRuntimeStatus):null;
 function attachRuntimeNodes(){
  for(const selector of runtimeStatusSelectors[name]||[]){
   const el=document.querySelector(selector);
   if(!el||observedRuntimeNodes.has(el))continue;
   observedRuntimeNodes.add(el);
   runtimeNodes.push(el);
   runtimeObserver?.observe(el,{childList:true,characterData:true,subtree:true});
  }
 }
 function localizeRuntimeStatus(){
  attachRuntimeNodes();
  for(const el of runtimeNodes){
   if(!el.isConnected||el.children.length||el.isContentEditable)continue;
   const before=el.textContent,after=localizeStatus(before);
   if(before!==after)el.textContent=after;
  }
 }
 attachRuntimeNodes();
 // The roommate setup panel is inserted after initialization. Observe its
 // insertion only until its status node is found; do not watch user content.
 if(name==='housemates'&&runtimeObserver&&document.body&&!document.querySelector('#setup-status')){
  const setupObserver=new MutationObserver(()=>{
   if(!document.querySelector('#setup-status'))return;
   setupObserver.disconnect();
   localizeRuntimeStatus();
  });
  setupObserver.observe(document.body,{childList:true,subtree:true});
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
   // Localize search/browser summaries without altering canonical URLs or stored content.
   if(descriptionMeta && originalDescription!==null)
     descriptionMeta.setAttribute('content',lang==='en'?settings.subtitle+'.':originalDescription);
   switcher.setAttribute('aria-label',lang==='en'?'Choose interface language':'Sprache der Oberfläche wählen');
   de.setAttribute('aria-pressed',String(lang==='de'));
   en.setAttribute('aria-pressed',String(lang==='en'));
   // Keep reconstructed controls in sync with the active locale.
   for(const button of document.querySelectorAll('.ty-tool-language [data-tool-locale]')){
     const code=button.dataset.toolLocale;
     button.setAttribute('aria-pressed',String(code===lang));
     if(code==='de'||code==='en'){
       const label=code==='de'
         ?(lang==='en'?'Switch to German':'Deutsch auswählen')
         :(lang==='en'?'English selected':'Englisch auswählen');
       button.setAttribute('aria-label',label);
       button.setAttribute('title',label);
     }
   }
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
   localizeRuntimeStatus();
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
