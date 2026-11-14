/* Einheitlicher Settings-Einstieg – bestehende Auth- und Backup-Funktionen bleiben unverändert. */
(() => {
 'use strict';
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
   button.setAttribute('aria-label','Einstellungen öffnen');
   button.setAttribute('title','Einstellungen');
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
   if(heading && /cloud|konto/i.test(heading.textContent||''))heading.textContent='☁️ Mein Konto';
 }
 const hasBackup=Array.from(surface.querySelectorAll('button,label')).some(node=>
   /sicherung|backup|restore|wiederherstell/i.test((node.textContent||'').slice(0,100)));
 if(!hasBackup){
   const section=document.createElement('section');
   section.className='helferlein-common-section';
   const title=document.createElement('h3');title.textContent='💾 Daten sichern und wiederherstellen';
   const note=document.createElement('p');
   note.textContent='Für eine lokale Sicherung dieses Tools nutze seine Exportfunktion, falls vorhanden. Die Startseite bietet eine Sicherung ausgewählter Browserdaten.';
   const link=document.createElement('a');
   link.href=ROOT;link.textContent='Zur Toolya-Startseite';
   section.append(title,note,link);surface.append(section);
 }
 const hasTheme=surface.querySelector('[data-b3-theme],#b3-backform-theme,#b3-hub-theme');
 if(!hasTheme && !isEstate && !isWishlist){
   const section=document.createElement('section');section.className='helferlein-common-section';
   const heading=document.createElement('h3');heading.textContent='🎨 Darstellung';
   const label=document.createElement('label');label.textContent='Designmodus ';
   const select=document.createElement('select');select.setAttribute('aria-label','Designmodus');
   for(const [value,text] of [['auto','Automatisch'],['light','Hell'],['dark','Dunkel']]){
     const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);
   }
   const storageKey='helferlein_ui_theme_v1';
   const prefers=window.matchMedia('(prefers-color-scheme: dark)');
   const valid=value=>['auto','light','dark'].includes(value)?value:'auto';
   let value='auto';try{value=valid(localStorage.getItem(storageKey))}catch{}
   select.value=value;
   const update=()=>{
     const dark=value==='dark'||(value==='auto'&&prefers.matches);
     document.body.classList.toggle('b3-dark',dark);
     document.documentElement.style.colorScheme=dark?'dark':'light';
   };
   select.addEventListener('change',()=>{
     value=valid(select.value);
     try{localStorage.setItem(storageKey,value)}catch{select.value='auto';value='auto'}
     update();
   });
   prefers.addEventListener?.('change',update);
   label.append(select);section.append(heading,label);surface.append(section);
   update();
 }
})();