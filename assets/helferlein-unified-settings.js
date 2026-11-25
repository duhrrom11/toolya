/* Einheitlicher Settings-Einstieg – bestehende Auth- und Backup-Funktionen bleiben unverändert. */
(() => {
 'use strict';
 const labels=Object.freeze({"Einstellungen":"Settings","Einstellungen und Sicherungen":"Settings and backups","✕ Schließen":"✕ Close","Einstellungen schließen":"Close settings","⚙️ Einstellungen":"⚙️ Settings","Einstellungen öffnen":"Open settings","☁️ Mein Konto":"☁️ My account","💾 Daten sichern und wiederherstellen":"💾 Back up and restore data","Für eine lokale Sicherung dieses Tools nutze seine Exportfunktion, falls vorhanden. Die Startseite bietet eine Sicherung ausgewählter Browserdaten.":"To back up this tool locally, use its export function if available. The home page offers a backup of selected browser data.","Zur Toolya-Startseite":"Go to Toolya home"});
 function locale(){const w=typeof window==='undefined'?global:window;const active=w.__toolyaUILocale||w.__toolyaWishesLocale||w.__toolyaEstateLocale||w.__toolyaDashboardLocale;if(active==='de'||active==='en')return active;try{const q=new URLSearchParams(w.location.search).get('lang');return q==='de'||q==='en'?q:w.location.pathname.startsWith('/en/')?'en':w.localStorage.getItem('toolya-locale-v1')==='en'?'en':'de'}catch{return 'de'}}
 const bindings=[];
 function paint(node,source,attr){const text=locale()==='en'&&Object.hasOwn(labels,source)?labels[source]:source;if(attr)node.setAttribute(attr,text);else node.textContent=text;}
 function bindCopy(node,source,attr=null){bindings.push([node,source,attr]);paint(node,source,attr)}
 for(const event of ['toolya:locale-change','toolya:wishes-locale-change','toolya:estate-locale-change','toolya:dashboard-locale-change'])document.addEventListener(event,()=>{for(const args of bindings)paint(...args)});

 const ROOT='../../index.html';
 const modal=document.getElementById('settingsModal')||document.getElementById('settings-modal');
 const current=document.querySelector('.b3-settings-trigger');
 const wishlist=document.querySelector('.wishlist-header-controls');
 const estate=document.querySelector('body > header .row');
 const isEstate=location.pathname.includes('/digitaler-nachlass/');
 const isWishlist=location.pathname.includes('/wishlist/');
 function decorate(button){
   if(!button)return;
   button.classList.add('helferlein-gear');
   bindCopy(button,'Einstellungen öffnen','aria-label');
   bindCopy(button,'Einstellungen','title');
   // Keep the original click handler exactly as implemented by the tool.
   button.replaceChildren();
   const symbol=document.createElement('span');
   symbol.className='helferlein-gear-symbol';
   symbol.setAttribute('aria-hidden','true');
   symbol.textContent='⚙';
   button.append(symbol);
 }
 if(current){decorate(current)}
 else if(isWishlist && wishlist){
   const button=document.createElement('button');
   button.type='button';button.id='helferlein-unified-settings';
   wishlist.prepend(button);decorate(button);
   button.addEventListener('click',()=>{
     const auth=document.getElementById('wishlistAuthMenu');
     if(auth){auth.open=true;auth.querySelector('summary')?.focus()}
     const settings=document.getElementById('homeGiftSettings');
     // The existing dashboard settings remain separate and keep their saved values.
     if(settings)settings.open=true;
   });
 }else if(isEstate && estate){
   const button=document.createElement('button');
   button.type='button';button.id='helferlein-unified-settings';
   estate.prepend(button);decorate(button);
   button.addEventListener('click',()=>{
     document.querySelector('nav button[data-tab="settings"]')?.click();
     document.querySelector('#settings summary')?.focus();
   });
 }
 // Common sections complement existing settings; do not replace or interfere with
 // account credentials, cloud migration, local backup, or tool-specific options.
 if(!modal)return;
 const surface=modal.firstElementChild||modal;
 const account=surface.querySelector('#cloudStatus,#cloud-status-text,#cloud-status-box,#header-user-email,#userInfo');
 if(account){
   const heading=account.closest('.space-y-3')?.parentElement?.querySelector('h3');
   if(heading && /cloud|konto/i.test(heading.textContent||''))bindCopy(heading,'☁️ Mein Konto');
 }
 const hasBackup=Array.from(surface.querySelectorAll('button,label')).some(node=>
   /sicherung|backup|restore|wiederherstell/i.test((node.textContent||'').slice(0,100)));
 if(!hasBackup){
   const section=document.createElement('section');
   section.className='helferlein-common-section';
   const title=document.createElement('h3');bindCopy(title,'💾 Daten sichern und wiederherstellen');
   const note=document.createElement('p');
   bindCopy(note,'Für eine lokale Sicherung dieses Tools nutze seine Exportfunktion, falls vorhanden. Die Startseite bietet eine Sicherung ausgewählter Browserdaten.');
   const link=document.createElement('a');
   link.href=ROOT;bindCopy(link,'Zur Toolya-Startseite');
   section.append(title,note,link);surface.append(section);
 }
 document.body.classList.remove('b3-dark');
 document.documentElement.style.colorScheme='light';
})();