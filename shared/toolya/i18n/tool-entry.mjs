/* Opt-in language presentation for existing authenticated tools.
   Stays strictly outside business logic, data, auth gates and maskot state.
   Incomplete translation is explicitly disclosed: main tool forms are still German. */
import {normalizeLocale} from './locale.mjs';
import {applyToolInterfaceLocale} from './interface.mjs';
const key='toolya-locale-v1';
const SUPPORTED=Object.freeze({
 moving:{heading:'Moving box organizer',subtitle:'Track your boxes, contents and locations',guide:'/en/moving-boxes/',german:'/umzugskisten/'},
 housemates:{heading:'Roommate organizer',subtitle:'Split expenses and plan shared tasks',guide:'/en/roommate-organizer/',german:'/wg-organisator/'},
 plants:{heading:'Plant care tracker',subtitle:'Track watering, plant notes and photos',guide:'/en/plant-care/',german:'/pflanzenpflege/'},
 baking:{heading:'Cake pan and recipe calculator',subtitle:'Resize baking pans and ingredients',guide:'/en/cake-pan-calculator/',german:'/backform-rechner/'}
});
const name=location.pathname.match(/^\/tools\/(moving|housemates|plants|baking)\/index\.html$/)?.[1];
const settings=SUPPORTED[name];
function mountToolLanguage(){
 if(!settings)return;
 if(document.querySelector('.ty-tool-language'))return;
 let stored=null;
 try { stored=localStorage.getItem(key); } catch (_) { /* storage is optional */ }
 const query=new URLSearchParams(location.search);
 let selected=normalizeLocale(query.get('lang'))||normalizeLocale(stored)||'de';
 const header=document.querySelector('header.b3-header .b3-header-inner');
 const title=header?.querySelector('.b3-tool-title h1');
 const subtitle=header?.querySelector('.b3-tool-title p');
 const originalTitle=title?.textContent ?? '';
 const originalSubtitle=subtitle?.textContent ?? '';
 const originalDocTitle=document.title;
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
 const notice=document.createElement('p');
 notice.className='ty-tool-language-notice';
 notice.setAttribute('role','status');
 notice.lang='en';
 const guide=document.createElement('a');
 guide.href=settings.guide;
 guide.lang='en';
 guide.textContent='Read the English guide';
 notice.append('The English interface is being translated. Most forms, account dialogs and messages are still in German. ',guide);
 function apply(lang,persist){
   selected=lang;
   if(persist)try{localStorage.setItem(key,lang)}catch(_){}
   if(title)title.textContent=lang==='en'?settings.heading:originalTitle;
   if(subtitle)subtitle.textContent=lang==='en'?settings.subtitle:originalSubtitle;
   document.title=lang==='en'?settings.heading+' | Toolya':originalDocTitle;
   de.setAttribute('aria-pressed',String(lang==='de'));
   en.setAttribute('aria-pressed',String(lang==='en'));
   notice.hidden=lang!=='en';
   applyToolInterfaceLocale(document,name,lang);
   // Keep html[lang]=de while the main application is not fully translated.
 }
 if(header){
   const titleContainer=header.querySelector('.b3-tool-title');
   if (!titleContainer) return;
   titleContainer.append(switcher);
   header.after(notice);
   apply(selected,false);
 }
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mountToolLanguage,{once:true});
else mountToolLanguage();
