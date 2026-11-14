/* Accessible settings windows for the estate manager and gift dashboard. */
(() => {
 'use strict';
 function modalFor(section, opener, label, isEstate) {
  if (!section || !opener || !document.body || !('showModal' in document.createElement('dialog'))) return;
  const dialog=document.createElement('dialog');
  dialog.className='hl-settings-dialog';
  dialog.setAttribute('aria-label',label);
  const header=document.createElement('div');
  header.className='hl-settings-dialog-header';
  const title=document.createElement('h2');title.textContent=label;
  const close=document.createElement('button');close.type='button';close.textContent='✕ Schließen';close.setAttribute('aria-label','Einstellungen schließen');
  header.append(title,close);
  dialog.append(header,section);
  document.body.append(dialog);
  let oldFocus=null;
  function open(){oldFocus=document.activeElement;if(isEstate)section.classList.remove('hidden');if(section.tagName==='DETAILS')section.open=true;dialog.showModal();close.focus();}
  function shut(){dialog.close();}
  close.addEventListener('click',shut);
  dialog.addEventListener('click',event=>{if(event.target===dialog)shut();});
  dialog.addEventListener('close',()=>{if(isEstate)section.classList.add('hidden');if(oldFocus?.isConnected)oldFocus.focus?.();});
  opener.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();open();},true);
  if(isEstate){
   // A settings view must not replace the currently visible dashboard tab.
   for(const button of document.querySelectorAll('[data-tab="settings"]')){
    button.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();open();},true);
   }
  }
 }
 function init(){
  if(document.getElementById('section-settings')&&document.getElementById('b3-nachlass-settings')){
   modalFor(document.getElementById('section-settings'),document.getElementById('b3-nachlass-settings'),'Einstellungen',true);
  }
  const tools=document.getElementById('homeDashboardTools');
  if(tools&&document.getElementById('homeGiftStart')){
   const button=document.createElement('button');
   button.type='button';button.className='hl-settings-launch';
   button.textContent='⚙️ Einstellungen';
   tools.parentNode.insertBefore(button,tools);
   modalFor(tools,button,'Einstellungen und Sicherungen',false);
  }
 }
 const css=document.createElement('style');
 css.textContent=`
.hl-settings-dialog{position:fixed;inset:0;margin:auto;width:min(92vw,760px);max-width:760px;max-height:88dvh;box-sizing:border-box;overflow-y:auto;border:1px solid #b6b9ce;border-radius:18px;padding:0 20px 24px;background:#151c33;color:#f5f6ff;box-shadow:0 28px 90px #0008}
.hl-settings-dialog::backdrop{background:#070d1bc9;backdrop-filter:blur(3px)}
.hl-settings-dialog-header{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 0;margin-bottom:16px;background:#151c33;border-bottom:1px solid #495371}
.hl-settings-dialog-header h2{font-size:1.2rem;font-weight:750;margin:0;color:#f5f6ff}
.hl-settings-dialog-header button,.hl-settings-launch{border:0;border-radius:10px;background:#5a4caf;color:#fff;padding:10px 15px;cursor:pointer;font:inherit;font-weight:700}
.hl-settings-dialog #section-settings{display:block!important;max-width:none!important;width:100%!important;margin:0!important}
.hl-settings-dialog #section-settings>div{max-width:100%}
.hl-settings-dialog #homeDashboardTools{display:block!important;width:100%;max-width:100%;margin:0}
.hl-settings-dialog #homeDashboardTools>summary{display:none}
.hl-settings-dialog .home-dashboard-tool-group{max-width:100%}
.hl-settings-launch{margin:14px 0}
@media(max-width:600px){.hl-settings-dialog{width:96vw;max-height:92dvh;padding:0 12px 16px}.hl-settings-dialog-header{padding:12px 0}}
`;
 (document.head||document.documentElement).append(css);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
