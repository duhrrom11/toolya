import '../../assets/toolya-consent.js?v=20261116-local-debug';
import {ToolyaBuddy} from './buddy.mjs';
import {unifyToolSettings} from './settings-unify.mjs?v=20261126-shared-settings';
import {readAppLocale} from './i18n/locale.mjs';
const ASSETS=new URL('../../assets/toolya/',import.meta.url).href;
const OPTIMIZED_OUTFITS=new URL('../../assets/toolya/optimized/outfits-q85.13c6fa20b3f66c088f00efe43d7eb47a7cc436ed59b6dc57c44f202169a0518f.webp',import.meta.url).href;
const atlasURL=file=>file==='outfits.webp'?OPTIMIZED_OUTFITS:ASSETS+file+'?v=20261115-alpha';
for(const file of ['tokens.css','buddy.css','platform.css','footer.css','header.css','settings-accordion.css']){const l=document.createElement('link');l.rel='stylesheet';l.href=new URL(file,import.meta.url).href+(file==='header.css'?'?v=20261126-account-header-v2':file==='settings-accordion.css'?'?v=20261126-shared-settings':'');document.head.append(l)}
export const EMOTIONS=['happy','proud','curious','thoughtful','surprised','concerned','sad','shy','cheeky','sleepy','laughing','grateful','motivated','puzzled','celebrating','affectionate'];
export const TOOLS={wishes:{role:0,name:'Geschenkexperte',greeting:'Hier ist Platz für große und kleine Wünsche.'},budget:{role:1,name:'Buchhalter',greeting:'Deine Ausgaben gut im Blick.'},housemates:{role:2,name:'WG-Organisator',greeting:'Ein guter Plan macht den Alltag leichter.'},moving:{role:3,name:'Umzugshelfer',greeting:'Damit beim Umzug nichts verloren geht.'},estate:{role:4,name:'Vorsorgebegleiter',greeting:'In Ruhe das Wichtige ordnen.',serious:true},car:{role:5,name:'Mechaniker',greeting:'Dein Fahrzeug gut organisiert.'},'pet-health':{role:6,name:'Tierbegleiter',greeting:'Alles Wichtige für deine tierischen Freunde.',serious:true},parking:{role:7,name:'Parkhelfer',greeting:'Parkplatz und Parkzeit im Blick.'},loans:{role:8,name:'Verleih-Organisator',greeting:'Behalte verliehene Gegenstände im Blick.'},plants:{role:9,name:'Gärtner',greeting:'Ein guter Tag für deine grünen Freunde.'},meters:{role:10,name:'Energiehelfer',greeting:'Zählerstände einfach im Blick.'},baking:{role:11,name:'Backhelfer',greeting:'Die passende Form für deine Backidee.'},home:{role:12,name:'Alltagsbegleiter',greeting:'Was möchtest du heute erledigen?'}};
const TOOL_SYMBOLS=['🎁','🧮','🏠','📦','🛡️','🔧','🐾','🅿️','📋','🪴','⚡','🧁','✨'];
const isAppRoute=/^\/(tools|dashboard|admin-stats-dashboard)(\/|$)/.test(location.pathname);
function platformLocale(){
 if(!isAppRoute)return document.documentElement.lang==='en'?'en':'de';
 const active=window.__toolyaUILocale||window.__toolyaWishesLocale||window.__toolyaEstateLocale||window.__toolyaDashboardLocale||window.__toolyaAdminLocale;
 if(active==='en'||active==='de')return active;
 return readAppLocale();
}
let englishHome=platformLocale()==='en';
const englishRoles=Object.freeze({"wishes":["Gift expert","Room for wishes big and small."],"budget":["Budget companion","Keep track of your spending."],"housemates":["Roommate organizer","A good plan makes daily life easier."],"moving":["Moving companion","Keep everything accounted for during your move."],"estate":["Estate companion","Organize what matters at your own pace."],"car":["Mechanic","Keep your vehicle organized."],"pet-health":["Pet companion","Everything important for your animal friends."],"parking":["Parking companion","Keep track of your parking spot and time."],"loans":["Lending organizer","Keep track of lent items."],"plants":["Gardener","A good day for your green friends."],"meters":["Energy companion","Keep track of your meter readings."],"baking":["Baking companion","Find the right pan for your baking idea."],"home":["Everyday companion","What would you like to do today?"]});
const homeCopy=(de,en)=>englishHome?en:de;
const parts=decodeURI(location.pathname).split('/').filter(Boolean);
export const tool=parts.includes('tools')?parts[parts.indexOf('tools')+1]:'home';
// Only explicit, unknown tool drafts may borrow an existing outfit. Canonical tools
// always keep their own configuration; this does not register or publish routes.
const draftOutfit = document.documentElement.dataset.toolyaDraft === 'true' && !TOOLS[tool] && tool !== 'home'
  ? document.querySelector('meta[name="toolya-draft-outfit"]')?.getAttribute('content') : null;
const draftContext = Object.hasOwn(TOOLS, draftOutfit || '') ? TOOLS[draftOutfit] : null;
const baseContext=TOOLS[tool]||draftContext||TOOLS.home;
const context={...baseContext};
function localizeContext(){const [name,greeting]=englishHome?(englishRoles[Object.hasOwn(TOOLS,tool)?tool:draftOutfit]||englishRoles.home):[baseContext.name,baseContext.greeting];context.name=name;context.greeting=greeting}
localizeContext();
const key='helferlein-toolya-preferences-v1';
const read=()=>{try{const p=JSON.parse(localStorage.getItem(key)||'{}');return p&&typeof p==='object'?p:{}}catch{return {}}};
export const buddy=new ToolyaBuddy({root:document.querySelector('main')||document.body,assetBase:ASSETS+'originals/',locale:englishHome?'en':'de'});
window.toolyaBuddy=buddy;
// Home notices must live outside the main/header stacking contexts so the full card stays visible.
if(document.body.classList.contains('b3-home'))document.body.append(buddy.host);
else (document.querySelector('main')||document.body).prepend(buddy.host);
const stockImage=buddy.image.bind(buddy);
const pixel='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
const cache=new Map(), frames=new Set();
let previousItem=null, sequence=0, currentEmotion='happy';
// The homepage hero is the LCP image. Keep the noncritical atlas out of its
// fetch/decode path; tool routes still load their own mascot immediately.
const homeHero=document.body.classList.contains('b3-home')&&document.querySelector('img.ty-hero-art');
const heroReady=homeHero?homeHero.decode().catch(()=>{}):null;
function preload(file){if(!cache.has(file)){const i=new Image();if(file==='outfits.webp')i.fetchPriority='low';const record={ready:false,failed:false,promise:null};record.promise=new Promise(resolve=>{i.onload=()=>{record.ready=true;resolve(true)};i.onerror=()=>{record.failed=true;resolve(false)};const start=()=>{i.src=atlasURL(file)};if(file==='outfits.webp'&&heroReady)heroReady.then(start);else start()});cache.set(file,record)}return cache.get(file)}
function cell(index){return {x:(index%8)*100/7,y:Math.floor(index/8)*100/3}}
function paint(record,file,index,alternate=index,animate=false){
 const a=cell(index),b=cell(alternate);record.frame.style.setProperty('--ty-a',a.x+'%');record.frame.style.setProperty('--ty-b',b.x+'%');record.frame.style.setProperty('--ty-y',a.y+'%');record.frame.style.backgroundPosition=a.x+'% '+a.y+'%';
 const loaded=preload(file);
 record.frame.hidden=!loaded.ready&&!loaded.failed;
 record.img.style.opacity=loaded.ready||loaded.failed?'0':'1';
 record.frame.style.backgroundImage=loaded.ready?`url("${atlasURL(file)}")`:'none';
 if(file==='outfits.webp')record.frame.style.mixBlendMode='normal';else record.frame.style.removeProperty('mix-blend-mode');
 if(record.epoch!==buddy.noticeEpoch){record.frame.classList.remove('ty-animated');void record.frame.offsetWidth;record.epoch=buddy.noticeEpoch;}
 record.frame.classList.toggle('ty-animated',loaded.ready&&animate);
 if(loaded.failed){
  // An unavailable atlas must never replace a tool outfit with the Wishlist gift artwork.
  record.frame.classList.add('ty-sprite-fallback');
  const symbol=TOOL_SYMBOLS[record.role]||TOOL_SYMBOLS[12];
  if(record.frame.textContent!==symbol)record.frame.textContent=symbol;
 }else{
  record.frame.classList.remove('ty-sprite-fallback');
  if(record.frame.textContent)record.frame.textContent='';
 }
 if(!loaded.ready&&!loaded.failed)loaded.promise.then(()=>{if(record.img.isConnected)refreshFrames()});
}
function attach(img,kind='outfit',role=context.role){
 if(img.dataset.toolyaSprite)return;img.dataset.toolyaSprite='true';const wrap=document.createElement('span');wrap.className='ty-sprite-wrap';img.before(wrap);wrap.append(img);const frame=document.createElement('span');frame.className='ty-frame';frame.hidden=true;frame.setAttribute('aria-hidden','true');wrap.append(frame);const r={img,frame,kind,role};frames.add(r);return r;
}
buddy.image=(img,type)=>{img.hidden=false;img.src=pixel;img.onerror=()=>{if(tool==='wishes')stockImage(img,type);else img.src=pixel}};
function refreshFrames(){
 syncToolHeroMascot();for(const r of frames){if(!r.img.isConnected){frames.delete(r);continue}const character=buddy.character==='purple'?1:0;if(r.kind==='dialog'){const index=EMOTIONS.indexOf(r.emotion||'concerned')*2;paint(r,'emotions-'+buddy.character+'.webp',index,index+1,false);}else if(r.kind==='notice'&&buddy.current&&buddy.current.type!=='welcome'){
 const index=EMOTIONS.indexOf(currentEmotion)*2,flip=sequence%2;paint(r,'emotions-'+buddy.character+'.webp',index+flip,index+1-flip,true);
 }else paint(r,'outfits.webp',r.role*2+character);}}
const render=buddy.render.bind(buddy);buddy.render=(preserve=false)=>{render(preserve);if(buddy.current!==previousItem){previousItem=buddy.current;sequence++;const choices=context.serious?{welcome:['happy'],success:['proud','grateful'],tip:['thoughtful','curious'],warning:['concerned'],error:['concerned','sad'],'form-error':['concerned']}:{welcome:['happy'],success:['proud','celebrating','motivated','grateful'],tip:['curious','thoughtful','cheeky'],warning:['concerned','surprised'],error:['concerned','puzzled','sad'],'form-error':['puzzled','concerned']};const list=choices[buddy.current?.type]||['happy'];currentEmotion=buddy.current?.emotion||list[sequence%list.length];}refreshFrames()};
attach(buddy.host.querySelector('.tb-avatar'),'notice');
const tickle=buddy.tickle.bind(buddy);buddy.tickle=(now)=>{if([...document.querySelectorAll('dialog,[role=dialog],[role=alertdialog]')].some(d=>d.getClientRects().length>0))return false;const result=tickle(now);if(result){currentEmotion='laughing';refreshFrames()}return result};
export function notify(type,message,emotion){return buddy.show(type,message,EMOTIONS.includes(emotion)?emotion:null)}
window.toolyaNotice=notify;
window.addEventListener('toolya:notice',e=>{const d=e.detail;if(d&&typeof d.message==='string')notify(d.type,d.message,d.emotion)});
buddy.host.dataset.tool=tool;buddy.host.setAttribute('aria-label','Toolya · '+context.name);
if (!/^\/dashboard(?:\/|$)/.test(location.pathname)) {
const badge=document.createElement('span');badge.className='toolya-context';badge.textContent=context.name;badge.setAttribute('aria-hidden','true');buddy.host.prepend(badge);
const idle=document.createElement('button');idle.type='button';idle.className='toolya-idle';idle.setAttribute('aria-label','Toolya · '+context.name);const idleImage=document.createElement('img');idleImage.alt='';idleImage.width=84;idleImage.height=84;idleImage.src=pixel;const idleLabel=document.createElement('span');idleLabel.textContent='Toolya · '+context.name;idle.append(idleImage,idleLabel);buddy.host.prepend(idle);attach(idleImage);idle.onclick=()=>{const keyboard=document.activeElement===idle;if(buddy.tickle()&&keyboard)buddy.host.querySelector('.tb-avatar').focus({preventScroll:true})};
}
function apply(){const p=read();buddy.setCharacter(['turquoise','purple'].includes(p.character)?p.character:'turquoise');buddy.setMotion(['off','calm','normal','lively'].includes(p.motion)?p.motion:'normal');buddy.setQuiet(p.quiet===true);buddy.setTips(p.tips!==false);buddy.setHidden(p.hidden===true);refreshFrames()}
function persist(){try{localStorage.setItem(key,JSON.stringify({character:buddy.character,motion:buddy.motion,quiet:buddy.quiet,tips:buddy.tips,hidden:buddy.hidden}))}catch{}refreshFrames();mountDonation()}
apply();
const panel=document.createElement('fieldset');panel.className='tb-preferences toolya-preferences';const legend=document.createElement('legend');legend.textContent=homeCopy('Maskottchen',"Mascots");panel.append(legend);
function select(label,values,current,change){const l=document.createElement('label');l.textContent=label;const control=document.createElement('select');control.setAttribute('aria-label',label);for(const [value,text] of values){const o=document.createElement('option');o.value=value;o.textContent=text;control.append(o)}control.value=current;control.onchange=()=>{change(control.value);persist()};l.append(control);panel.append(l)}
select(homeCopy('Begleiter',"Companion"),[['turquoise',homeCopy('Türkis',"Turquoise")],['purple',homeCopy('Lila',"Purple")]],buddy.character,v=>buddy.setCharacter(v));select('Animation',[['off',homeCopy('Aus',"Off")],['calm',homeCopy('Ruhig',"Calm")],['normal','Normal'],['lively',homeCopy('Lebhaft',"Lively")]],buddy.motion,v=>buddy.setMotion(v));
for(const [label,property,method] of [[homeCopy('Ruhemodus',"Quiet mode"),'quiet','setQuiet'],[homeCopy('Tipps anzeigen',"Show tips"),'tips','setTips'],[homeCopy('Begleiter ausblenden',"Hide companion"),'hidden','setHidden']]){const l=document.createElement('label'),c=document.createElement('input');c.type='checkbox';c.checked=buddy[property];c.onchange=()=>{buddy[method](c.checked);persist()};l.append(c,document.createTextNode(label));panel.append(l)}
// Reuse each tool's settings surface. Pages without one get the same accessible
// settings entry, with preferences exclusively inside Darstellung.
let fallbackDialog=null,fallbackTrigger=null;
function mountPreferences(){
 const modal=document.querySelector('#settingsModal,#settings-modal');
 let surface=modal&&(modal.firstElementChild||modal);
 if(!surface){
  if(!fallbackDialog){
   fallbackDialog=document.createElement('dialog');fallbackDialog.id='toolya-display-settings';fallbackDialog.className='toolya-settings-dialog';fallbackDialog.setAttribute('aria-labelledby','toolya-settings-title');
   const title=document.createElement('h2');title.id='toolya-settings-title';title.textContent=homeCopy('Einstellungen',"Settings");
   const close=document.createElement('button');close.type='button';close.textContent=homeCopy('Schließen',"Close");close.setAttribute('aria-label',homeCopy('Einstellungen schließen',"Close settings"));close.onclick=()=>fallbackDialog.close();fallbackDialog.append(title,close);document.body.append(fallbackDialog);
   fallbackTrigger=document.createElement('button');fallbackTrigger.type='button';fallbackTrigger.className='toolya-settings-trigger helferlein-gear';const gear=document.createElement('span');gear.className='helferlein-gear-symbol';gear.setAttribute('aria-hidden','true');gear.textContent='⚙';fallbackTrigger.append(gear);fallbackTrigger.setAttribute('aria-label',homeCopy('Einstellungen öffnen',"Open settings"));fallbackTrigger.setAttribute('aria-haspopup','dialog');fallbackTrigger.setAttribute('aria-controls',fallbackDialog.id);fallbackTrigger.onclick=()=>fallbackDialog.showModal();
   const header=document.querySelector('body[data-toolya-info] .ty-info-controls')||document.querySelector('.wishlist-header-controls,header .row,header,nav');
   if(header)header.append(fallbackTrigger);else (document.querySelector('main')||document.body).prepend(fallbackTrigger);
  }
  surface=fallbackDialog;
 }
 // One accordion for all tools, matching Konto and Datensicherung.
 let appearance=surface.querySelector('.toolya-appearance');
 if(appearance&&appearance.tagName!=='DETAILS'){
  const replacement=document.createElement('details');replacement.className='ty-settings-group toolya-appearance';
  const summary=document.createElement('summary');summary.textContent=homeCopy('Maskottchen',"Mascots");replacement.append(summary);
  for(const child of [...appearance.children])if(!child.matches('h2,h3,h4'))replacement.append(child);
  appearance.replaceWith(replacement);appearance=replacement;
 }
 if(!appearance){
  appearance=document.createElement('details');appearance.className='ty-settings-group toolya-appearance';
  const summary=document.createElement('summary');summary.textContent=homeCopy('Maskottchen',"Mascots");appearance.append(summary);
  const close=surface.querySelector('.b3-hub-settings-footer,.dashboard-settings-close,.wishlist-settings-footer,#cancelSettingsBtn');
  const closeContainer=close?.closest('.b3-hub-settings-footer,.dashboard-settings-close,.wishlist-settings-footer')||(close?.id==='cancelSettingsBtn'?close.parentElement:close);
  if(closeContainer)closeContainer.before(appearance);else surface.append(appearance);
 }
 let content=appearance.querySelector('.ty-settings-content');
 if(!content){content=document.createElement('div');content.className='ty-settings-content';appearance.append(content)}
 if(!content.contains(panel)){content.append(panel);panel.onclick=e=>e.stopPropagation()}
 // The optional Ko-fi action is always the last setting, not part of the footer.
 let support=surface.querySelector('.ty-settings-kofi-button');
 if(!support){
  support=document.createElement('a');support.className='ty-settings-kofi-button';
  support.href='https://ko-fi.com/toolya';support.target='_blank';support.rel='noopener noreferrer';
  support.textContent=homeCopy('☕ Ko-fi ♥ Toolya unterstützen',"☕ Ko-fi ♥ Support Toolya");
  support.setAttribute('aria-label',homeCopy('Toolya freiwillig auf Ko-fi unterstützen (öffnet in neuem Tab)',"Support Toolya on Ko-fi (opens in a new tab)"));
 }
 if(surface.lastElementChild!==support)surface.append(support);
 // Convert legacy controls before adding the independent installation section.
 if(tool!=='home')unifyToolSettings(modal||fallbackDialog);
 if(!surface.querySelector('.ty-pwa-settings')){
  const install=document.createElement('details');
  install.className='ty-settings-group ty-pwa-settings';
  install.innerHTML=`<summary>${homeCopy("App installieren","Install app")}</summary>
   <div class="ty-settings-content ty-pwa-content">
    <div class="ty-pwa-lead">
     <img class="ty-pwa-icon" src="/android-chrome-192x192.png" width="56" height="56" alt="" loading="lazy">
     <div class="ty-pwa-copy">
      <span class="ty-pwa-kicker">${homeCopy("TOOLYA FÜR DEIN GERÄT","TOOLYA FOR YOUR DEVICE")}</span>
      <h3>${homeCopy("Immer griffbereit","Always within reach")}</h3>
      <p>${homeCopy("Starte Toolya direkt vom Startbildschirm – ganz ohne App-Store.","Launch Toolya directly from your home screen, without an app store.")}</p>
     </div>
    </div>
    <button type="button" class="ty-pwa-action" data-toolya-install>
     <span aria-hidden="true">↧</span> ${homeCopy("App installieren","Install app")}
    </button>
    <p class="ty-pwa-status" data-toolya-install-status role="status" aria-live="polite" hidden></p>
    <p class="ty-pwa-footnote">${homeCopy("Kostenlos · Direkt über deinen Browser","Free · Right in your browser")}</p>
   </div>`;
  // Keep the new accordion inside settings, before the existing close controls.
  const closeControl=surface.querySelector('.b3-hub-settings-footer,.dashboard-settings-close,.wishlist-settings-footer,#cancelSettingsBtn');
  let anchor=closeControl;
  while(anchor&&anchor.parentElement!==surface)anchor=anchor.parentElement;
  surface.insertBefore(install,anchor||support);
  document.dispatchEvent(new Event('toolya:pwa-settings-mounted'));
 }
 if(modal&&fallbackDialog){fallbackDialog.remove();fallbackTrigger.remove();fallbackDialog=null;fallbackTrigger=null}
}
mountPreferences();window.addEventListener('storage',e=>{if(e.key===key||e.key===null)apply()});
// Donation copy rotates on navigation, never claims a donation happened.
const donationCopy={en:["A coffee for my toolbox? ☕","My fluffy ears are working overtime!","They don't pay me in biscuits. Outrageous!","One little coffee and I'll jump for joy!","My spanners urgently need caffeine!","Support us? I'll wag my tail extra hard!","Psst… my piggy bank is still hungry!","I work for applause. Coffee would be nice too!","Coffee for the humans behind Toolya? Thank you!","A coffee makes this fluffy creature happy!","My toolbox is thirsty. So am I!","One espresso and my spanner dances salsa!","Warning: too much fluff may cause happiness!","I've scared away three bugs today!","Coffee in, creative ideas out!","My tail wags to the coffee machine's rhythm!","For biscuits I'd even wallpaper the moon!","One sip of coffee, a hundred new ideas!","My hard hat is full of good ideas!","Small, fluffy and in need of caffeine!","Help, my screwdriver wants a holiday!","Coffee makes Monday feel almost like Friday!","My ears can even hear the kettle boiling!","I found the bug. It was shy!","Coffee keeps my curly tail spinning!","A coffee for the hardworking pixel pushers?","My tools are singing the coffee anthem!","Without coffee my ideas are still in pyjamas!","A heart for fluff and working tools!","I promise no coffee will end up in the database!"],de:['Ein Käffchen für meinen Werkzeugkasten? ☕','Meine flauschigen Ohren arbeiten heute Überstunden!','Ich werde nicht mit Keksen bezahlt. Skandal!','Ein kleiner Kaffee und ich hüpfe vor Freude!','Meine Schraubenschlüssel brauchen dringend Koffein!','Unterstützt du uns? Ich wedle auch extra mit dem Schwanz!','Pssst … mein Sparschwein ist noch ziemlich hungrig!','Ich arbeite für Applaus. Aber Kaffee wäre auch toll!','Ein Kaffee für die Menschen hinter Toolya? Ich sage Danke!','Mit einem Käffchen machst du dieses Flauschwesen glücklich!', 'Mein Werkzeugkasten hat Durst. Ich natürlich auch!','Ein Espresso und mein Schraubenschlüssel tanzt Salsa!','Achtung: Zu viel Flausch kann gute Laune auslösen!','Ich habe heute schon drei Bugs erschreckt!','Kaffee rein, kreative Ideen raus!','Mein Schwanz wedelt im Takt der Kaffeemaschine!','Für Kekse würde ich sogar den Mond tapezieren!','Ein Schluck Kaffee, hundert neue Einfälle!','Mein Schutzhelm ist voll mit guten Ideen!','Ich bin klein, flauschig und ziemlich koffeinbedürftig!','Hilfe, mein Schraubenzieher verlangt Urlaub!','Ein Kaffee macht aus Montag fast schon Freitag!','Meine Ohren hören sogar das Kaffeewasser kochen!','Ich habe den Fehler gefunden. Er war schüchtern!','Mit Kaffee läuft sogar mein Ringelschwanz rund!','Ein Käffchen für die fleißigen Pixel-Schubser?','Mein Werkzeug singt schon die Kaffeehymne!','Ohne Kaffee sind meine Ideen noch im Schlafanzug!','Ein Herz für Flausch und funktionierende Tools!','Ich verspreche: Kein Kaffee landet in der Datenbank!']};
let donationLines=donationCopy[englishHome?'en':'de'];
let donationIndex=0;try{const n=Number(sessionStorage.getItem('toolya-donation-variant')||0);donationIndex=Number.isSafeInteger(n)&&n>=0?n%donationLines.length:0;sessionStorage.setItem('toolya-donation-variant',String((donationIndex+1)%donationLines.length))}catch{}
function donations(){for(const mark of document.querySelectorAll('.b3-hub-logo-mark,.b3-brand-mark')){if(mark.dataset.toolyaNav)continue;mark.dataset.toolyaNav='true';mark.classList.add('ty-nav-mascot');const img=document.createElement('img');img.alt='';img.src=pixel;img.width=40;img.height=40;mark.replaceChildren(img);attach(img);}for(const panel of document.querySelectorAll('.hl-alert-panel')){if(panel.dataset.toolyaDecorated)continue;panel.dataset.toolyaDecorated='true';const img=document.createElement('img');img.alt='';img.src=pixel;img.width=84;img.height=84;panel.prepend(img);const rec=attach(img,'dialog');rec.emotion=panel.querySelector('#hl-alert-message')?.textContent==='Gespeichert'?'proud':'concerned';}for(const img of document.querySelectorAll('.tb-dialog-avatar'))attach(img,'dialog');refreshFrames()}
function mountDonation(){const footer=document.querySelector('.toolya-signature-footer');if(!footer)return;let banner=document.querySelector('.ty-kofi-banner');if(!banner){banner=document.createElement('section');banner.className='ty-kofi-banner';banner.setAttribute('aria-label',homeCopy('Toolya auf Ko-fi unterstützen',"Support Toolya on Ko-fi"));const copy=document.createElement('div');copy.className='ty-kofi-copy';const title=document.createElement('h2');title.textContent=homeCopy('Toolya unterstützen',"Support Toolya");const line=document.createElement('p');line.className='ty-kofi-joke';line.textContent=donationLines[donationIndex];copy.append(title,line);const link=document.createElement('a');link.className='ty-kofi-action';link.href='https://ko-fi.com/toolya';link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',homeCopy('Toolya auf Ko-fi unterstützen',"Support Toolya on Ko-fi"));
const mini=document.createElement('img');mini.className='ty-kofi-button-mascot';mini.alt='';mini.width=48;mini.height=48;mini.loading='lazy';mini.src=pixel;
const buttonCopy=document.createElement('span');buttonCopy.className='ty-kofi-button-label';buttonCopy.textContent='☕ Ko-fi';
const hearts=document.createElement('span');hearts.className='ty-kofi-button-hearts';hearts.setAttribute('aria-hidden','true');
for(let i=0;i<3;i++){const heart=document.createElement('span');heart.textContent='♥';hearts.append(heart)}
link.append(mini,buttonCopy,hearts);banner.append(copy,link);banner.addEventListener('animationend',()=>{}, {once:true});}
if(footer.previousElementSibling!==banner)footer.before(banner);const mascot=banner.querySelector('.ty-kofi-button-mascot');if(mascot){if(mascot.getAttribute('src')!==pixel)mascot.src=pixel;attach(mascot,'outfit',context.role);refreshFrames()}for(const old of document.querySelectorAll('footer.toolya-support'))old.remove();for(const a of document.querySelectorAll('#settingsModal a[href="https://ko-fi.com/toolya"],#settings-modal a[href="https://ko-fi.com/toolya"],.toolya-settings-dialog a[href="https://ko-fi.com/toolya"]')){if(!a.classList.contains('ty-settings-kofi-button')&&/kaffee|spend|unterstütz/i.test(a.textContent))a.remove()}}
window.addEventListener('storage',event=>{if(event.key==='helferlein-toolya-preferences-v1')mountDonation()});
window.setInterval(()=>{const joke=document.querySelector('.ty-kofi-joke');if(!joke||document.hidden)return;donationIndex=(donationIndex+1)%donationLines.length;joke.textContent=donationLines[donationIndex]},9000);
let scheduled=false;const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;mountPreferences();donations()})});observer.observe(document.body,{childList:true,subtree:true});donations();
document.addEventListener('invalid',e=>{if(e.target.validationMessage)notify('form-error',e.target.validationMessage)},true);
// A small public, data-free way to inspect every approved emotion and outfit.
export function previewEmotion(emotion){if(!EMOTIONS.includes(emotion))return false;return notify('tip',homeCopy('Toolya zeigt: ','Toolya shows: ')+emotion,emotion)}
export function previewOutfit(role){if(!Number.isInteger(role)||role<0||role>15)return false;const target=buddy.host.querySelector('.toolya-idle img');for(const r of frames)if(r.img===target)r.role=role;buddy.dismiss();refreshFrames();return true}

document.addEventListener('visibilitychange',()=>{buddy.host.toggleAttribute('data-page-hidden',document.hidden)});

/* Shared, mascot-aware Toolya footer for all platform pages. */
function mountFooter(){
 if(document.querySelector('.toolya-signature-footer'))return;
 const old=document.querySelector('footer.b3-footer') || (/\/(?:privacy|legal)\.html$/.test(location.pathname)?document.querySelector('body > footer:not(.toolya-support)'):null),support=document.querySelector('footer.toolya-support');
 const footer=document.createElement('footer');footer.className='toolya-signature-footer';footer.setAttribute('aria-label',homeCopy('Toolya Seitenabschluss',"Toolya footer"));
 const inner=document.createElement('div');inner.className='ty-footer-inner';
 const brand=document.createElement('div');brand.className='ty-footer-brand';
 const logo=document.createElement('a');logo.className='ty-footer-wordmark';logo.href=new URL(englishHome?'../../en/':'../../',import.meta.url).href;logo.setAttribute('aria-label',homeCopy('Toolya Startseite',"Toolya home"));logo.textContent='Toolya';
 
 brand.append(logo);const caption=document.createElement('small');caption.textContent='© '+new Date().getFullYear()+homeCopy(' Toolya · Dein smarter Tool-Begleiter',' Toolya · Your smart tool companion');brand.append(caption);
 const links=document.createElement('nav');links.className='ty-footer-links';links.setAttribute('aria-label',homeCopy('Footer-Navigation',"Footer navigation"));
 for(const [label,path] of (englishHome?[['Home','en/'],['Tools','en/#toolDiscovery'],['Privacy','en/privacy.html'],['Legal notice','en/legal.html']]:[['Startseite','index.html'],['Tools','index.html#toolDiscovery'],['Datenschutz','privacy.html'],['Impressum','legal.html']])){
  const a=document.createElement('a');a.href=new URL('../../'+path,import.meta.url).href;a.textContent=label;links.append(a);
 }
 const top=document.createElement('button');top.className='ty-footer-top';top.type='button';top.textContent=homeCopy('↑ Nach oben',"↑ Back to top");top.addEventListener('click',()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
 const consentLink=document.getElementById('toolya-consent-settings');if(consentLink)links.append(consentLink);
 inner.append(brand,links,top);footer.append(inner);
 if(old)old.replaceWith(footer);else if(support)support.before(footer);else document.body.append(footer);
 mountDonation();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountFooter,{once:true});else mountFooter();




/* Thematic tool headers: retain original settings handlers and tool-specific navigation. */
function syncToolHeroMascot(){
 const hero=document.querySelector('.ty-tool-hero');if(!hero)return;
 const character=read().character==='purple'?'purple':'turquoise';
 hero.dataset.character=character;
}
function mountToolHero(){
 if(tool==='home'||(!TOOLS[tool]&&!draftContext)||document.querySelector('.ty-tool-hero'))return;
 const old=document.querySelector('header.b3-header,header.wishlist-header,header');
 if(!old)return;
 const heading=old.querySelector('h1');
 const title=heading?.textContent?.trim()||document.title.split('|')[0].trim();
 const description=old.querySelector('.b3-tool-title p')?.textContent?.trim()||context.greeting;
 const icon=old.querySelector('.b3-tool-icon')?.textContent?.trim()||'';
 const hero=document.createElement('section');hero.className='ty-tool-hero';hero.dataset.tool=tool;hero.setAttribute('aria-label',homeCopy('Toolya Themen-Header','Toolya tool header'));
 const inner=document.createElement('div');inner.className='ty-tool-hero-inner';
 const copy=document.createElement('div');copy.className='ty-tool-hero-copy';
 const top=document.createElement('div');top.className='ty-tool-hero-top';
 const logo=document.createElement('a');logo.className='ty-tool-wordmark';logo.href=new URL(englishHome?'../../en/':'../../',import.meta.url).href;logo.setAttribute('aria-label',homeCopy('Toolya Startseite',"Toolya home"));
 const mark=document.createElement('span');mark.className='b3-hub-logo-mark';mark.textContent='✳';mark.setAttribute('aria-hidden','true');logo.append(mark,document.createTextNode(' Toolya'));
 const actions=document.createElement('div');actions.className='ty-tool-hero-actions';
 const account=old.querySelector('#userInfo.b3-auth-status');
 if(account){actions.append(account);hero.dataset.hasAccount='true';}
 const originalSettings=old.querySelector('.b3-settings-trigger,[aria-label="Einstellungen öffnen"],[aria-label="Open settings"]');
 if(originalSettings){
  // Preserve each tool's existing settings handler and modal; only normalize its icon.
  if(!originalSettings.querySelector('.helferlein-gear-symbol,.ty-tool-hero-settings-symbol')){
   const icon=document.createElement('span');icon.className='ty-tool-hero-settings-symbol';icon.setAttribute('aria-hidden','true');icon.textContent='⚙';
   // Move existing content rather than discarding nested controls/listeners.
   // The button keeps its original click handler and accessibility attributes.
   if(originalSettings.textContent.trim()==='⚙' || !originalSettings.children.length){
    originalSettings.replaceChildren(icon);
   }else{
    while(originalSettings.firstChild)icon.append(originalSettings.firstChild);
    originalSettings.append(icon);
   }
  }
  actions.append(originalSettings);
 }
 else {
  const trigger=document.createElement('button');trigger.type='button';trigger.className='ty-tool-hero-settings';trigger.setAttribute('aria-label',homeCopy('Einstellungen öffnen',"Open settings"));
  const icon=document.createElement('span');icon.className='ty-tool-hero-settings-symbol';icon.setAttribute('aria-hidden','true');icon.textContent='⚙';trigger.append(icon);
  trigger.addEventListener('click',()=>{const existing=document.querySelector('.toolya-preferences');const modal=existing?.closest('dialog,[role=dialog],#settingsModal,#settings-modal');const opener=document.querySelector('[aria-label="Einstellungen öffnen"]:not(.ty-tool-hero-settings),[aria-label="Open settings"]:not(.ty-tool-hero-settings)');if(opener)opener.click();else if(modal?.showModal)modal.showModal();else if(modal)modal.classList.remove('hidden');});
  actions.append(trigger);
 }
 top.append(logo,actions);
 const h=document.createElement('h1');const symbol=document.createElement('span');symbol.className='ty-tool-hero-icon';symbol.textContent=icon;symbol.setAttribute('aria-hidden','true');h.append(symbol,document.createTextNode(title));
 const p=document.createElement('p');p.textContent=description;
 copy.append(top,h,p);
 const img=document.createElement('img');img.className='ty-tool-hero-mascot';img.alt=homeCopy('Dein ausgewählter Toolya-Begleiter','Your selected Toolya companion');img.width=185;img.height=190;img.src=pixel;img.decoding='async';img.setAttribute('role','button');img.setAttribute('tabindex','0');img.setAttribute('aria-label',homeCopy('Toolya-Maskottchen kitzeln','Tickle Toolya mascot'));img.addEventListener('click',()=>buddy.tickle());img.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.repeat){e.preventDefault();if(buddy.tickle())buddy.host.querySelector('.tb-avatar')?.focus({preventScroll:true});}});
 inner.append(copy,img);attach(img,'outfit',context.role);hero.append(inner);
 old.before(hero);
 if(old.matches('.b3-header')){old.classList.add('ty-tool-original-header');heading?.setAttribute('aria-hidden','true');}
 else {if(heading){heading.hidden=true;}const oldBack=old.previousElementSibling;if(oldBack?.tagName==='A'&&oldBack.getAttribute('href')?.includes('index.html'))oldBack.hidden=true;}
 refreshFrames();
 document.dispatchEvent(new Event('toolya:tool-hero-ready'));
}
function finalizeToolSettingsAndHeader(){
 // Some tool dialogs are inserted after the initial preference pass.
 // Normalize against the final DOM tree and keep the conversion idempotent.
 if(tool!=='home')unifyToolSettings(document.querySelector('#settingsModal,#settings-modal')||fallbackDialog);
 mountToolHero();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',finalizeToolSettingsAndHeader,{once:true});else finalizeToolSettingsAndHeader();
window.addEventListener('storage',e=>{if(e.key===key||e.key===null)refreshFrames()});

// Refresh only platform-owned presentation nodes; never replace forms, inputs or user content.
const platformCopy=Object.freeze({"Maskottchen":"Mascots","Begleiter":"Companion","Türkis":"Turquoise","Lila":"Purple","Aus":"Off","Ruhig":"Calm","Lebhaft":"Lively","Ruhemodus":"Quiet mode","Tipps anzeigen":"Show tips","Begleiter ausblenden":"Hide companion","Einstellungen":"Settings","Schließen":"Close","Einstellungen schließen":"Close settings","Einstellungen öffnen":"Open settings","☕ Ko-fi ♥ Toolya unterstützen":"☕ Ko-fi ♥ Support Toolya","Toolya freiwillig auf Ko-fi unterstützen (öffnet in neuem Tab)":"Support Toolya on Ko-fi (opens in a new tab)","App installieren":"Install app","TOOLYA FÜR DEIN GERÄT":"TOOLYA FOR YOUR DEVICE","Immer griffbereit":"Always within reach","Starte Toolya direkt vom Startbildschirm – ganz ohne App-Store.":"Launch Toolya directly from your home screen, without an app store.","Kostenlos · Direkt über deinen Browser":"Free · Right in your browser","Toolya auf Ko-fi unterstützen":"Support Toolya on Ko-fi","Toolya unterstützen":"Support Toolya","Toolya zeigt: ":"Toolya shows: ","Toolya Seitenabschluss":"Toolya footer","Toolya Startseite":"Toolya home"," Toolya · Dein smarter Tool-Begleiter":" Toolya · Your smart tool companion","Footer-Navigation":"Footer navigation","↑ Nach oben":"↑ Back to top","Toolya Themen-Header":"Toolya tool header","Dein ausgewählter Toolya-Begleiter":"Your selected Toolya companion","Toolya-Maskottchen kitzeln":"Tickle Toolya mascot","Animation":"Animation"});
const platformReverse=Object.freeze(Object.fromEntries(Object.entries(platformCopy).map(([de,en])=>[en,de])));
function refreshPlatformLanguage(){
 const next=platformLocale()==='en';
 if(next===englishHome)return;
 englishHome=next;localizeContext();buddy.setLocale(next?'en':'de');
 const table=next?platformCopy:platformReverse;
 const translate=value=>Object.hasOwn(table,value)?table[value]:value;
 const roots=document.querySelectorAll('.toolya-preferences,.toolya-appearance,.ty-pwa-settings,.ty-settings-kofi-button,.toolya-signature-footer,.ty-kofi-banner,#toolya-display-settings,.toolya-settings-trigger,.ty-tool-wordmark,.ty-tool-hero-settings,.ty-tool-hero-mascot,.ty-tool-hero');
 for(const root of roots){
  const nodes=root.matches('.ty-tool-hero')?[root]:[root,...root.querySelectorAll('*')];
  for(const node of nodes){
   if(node.matches('[data-toolya-install-status],input,textarea,script,style'))continue;
   for(const attr of ['aria-label','title','alt'])if(node.hasAttribute(attr)){const old=node.getAttribute(attr),copy=translate(old);if(old!==copy)node.setAttribute(attr,copy)}
   for(const child of node.childNodes){if(child.nodeType!==3)continue;const old=child.nodeValue;const trimmed=old.trim();const copy=translate(trimmed);if(copy!==trimmed)child.nodeValue=old.replace(trimmed,copy)}
  }
 }
 const label='Toolya · '+context.name;buddy.host.setAttribute('aria-label',label);
 const badge=buddy.host.querySelector('.toolya-context');if(badge)badge.textContent=context.name;
 const idle=buddy.host.querySelector('.toolya-idle');if(idle){idle.setAttribute('aria-label',label);const text=idle.querySelector(':scope > span:not(.ty-sprite-wrap)');if(text)text.textContent=label}
 for(const logo of document.querySelectorAll('.ty-footer-wordmark,.ty-tool-wordmark'))logo.href=new URL(next?'../../en/':'../../',import.meta.url).href;
 const links=document.querySelector('.ty-footer-links');if(links){const labels=next?[['Home','en/'],['Tools','en/#toolDiscovery'],['Privacy','en/privacy.html'],['Legal notice','en/legal.html']]:[['Startseite','index.html'],['Tools','index.html#toolDiscovery'],['Datenschutz','privacy.html'],['Impressum','legal.html']];[...links.querySelectorAll('a')].filter(a=>a.id!=='toolya-consent-settings').slice(0,4).forEach((a,i)=>{a.textContent=labels[i][0];a.href=new URL('../../'+labels[i][1],import.meta.url).href})}
 const caption=document.querySelector('.ty-footer-brand small');if(caption)caption.textContent='© '+new Date().getFullYear()+homeCopy(' Toolya · Dein smarter Tool-Begleiter',' Toolya · Your smart tool companion');
 donationLines=donationCopy[next?'en':'de'];donationIndex%=donationLines.length;const joke=document.querySelector('.ty-kofi-joke');if(joke)joke.textContent=donationLines[donationIndex];
 document.dispatchEvent(new Event('toolya:pwa-settings-mounted'));
}
for(const event of ['toolya:locale-change','toolya:wishes-locale-change','toolya:estate-locale-change','toolya:dashboard-locale-change','toolya:admin-locale-change'])document.addEventListener(event,refreshPlatformLanguage);
refreshPlatformLanguage();
