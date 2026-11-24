// Reuse the home page's accessible <details> accordion across legacy tool dialogs.
// Move existing nodes instead of recreating them: IDs, listeners and each tool's data stay intact.
export function unifyToolSettings(modal) {
 if(!modal || document.body.classList.contains('b3-home'))return false;
 const surface=modal.firstElementChild?.matches?.('div') ? modal.firstElementChild : modal;
 if(surface.dataset.toolyaAccordion==='1')return true;
 const children=[...surface.children];
 const isAppearance=node=>node.matches?.('.toolya-appearance,details.toolya-appearance');
 const isSupport=node=>node.matches?.('.ty-settings-kofi-button');
 const isHeader=node=>node.matches?.('.wishlist-settings-heading') ||
   (node.querySelector?.('#closeSettingsBtn,[aria-label="Einstellungen schließen"],[aria-label="Close settings"]') &&
    !node.querySelector?.('input')) ||
   (node===children[0] &&
    (/^H[234]$/.test(node.tagName) && /einstellungen|settings/i.test(node.textContent) ||
     node.querySelector?.('h2,h3,h4') && node.querySelector?.('button') &&
     /einstellungen|settings/i.test(node.querySelector('h2,h3,h4').textContent) &&
     !node.querySelector('input')));
 const isFooter=node=>node.matches?.('.wishlist-settings-footer,.b3-hub-settings-footer,.dashboard-settings-close') ||
   (node.id==='cancelSettingsBtn' || (node.querySelector?.('#cancelSettingsBtn') && !node.querySelector?.('input'))) ||
   (node.matches?.('button') && /^(schließen|schliessen|close|✕|×)$/i.test(node.textContent.trim()));
 const candidates=children.filter(node=>
   !isAppearance(node)&&!isSupport(node)&&!isHeader(node)&&!isFooter(node) &&
   !node.matches?.('script,style') && !node.classList?.contains('toolya-settings-accordion'));
 if(!candidates.length){surface.dataset.toolyaAccordion='1';return false}
 const contentText=node=>(node.querySelector?.('h2,h3,h4,legend,summary')?.textContent||node.textContent||'').slice(0,180).toLowerCase();
 function identify(node){
  if(node.querySelector?.('.b3-backup-actions,[id*="backupActions"],[id="settingsBackupTitle"]'))return 'backup';
  if(node.querySelector?.('#settingsAccountTitle,#loginEmail,#auth-email,#cloudStatus,#settingsAuthFields,#cloud-status-box,#cloud-status-text'))return 'account';
  if(node.matches('.b3-preferences,#b3-backform-preferences'))return 'extra';
  if(node.querySelector?.('#helpToggleBtn'))return 'help';
  const text=contentText(node);
  if(/datensicherung|backup|daten sichern|wiederherstell|restore/.test(text))return 'backup';
  if(/konto|anmeld|registrier|account|cloud-status/.test(text))return 'account';
  if(/ofen|profil|optionen|anzeige|einstellungen|options|display|settings|oven|profile/.test(text))return 'extra';
  return null;
 }
 const items=candidates.map(node=>({node,kind:identify(node)}));
 // The account form is usually the first block; loose following blocks inherit its group.
 let current='account';
 for(const item of items){if(item.kind)current=item.kind;else item.kind=current}
 const labels={account:'Toolya-Konto',backup:'Datensicherung',extra:'Weitere Einstellungen',help:'Hilfe und Anleitung'};
 const enLabels={account:'Toolya account',backup:'Backup',extra:'More settings',help:'Help and guide'};
 const isEnglish=()=>{const active=window.__toolyaUILocale||window.__toolyaWishesLocale||window.__toolyaEstateLocale||window.__toolyaDashboardLocale;if(active)return active==='en';try{return (new URLSearchParams(location.search).get('lang')||localStorage.getItem('toolya-locale-v1'))==='en'}catch{return document.documentElement.lang==='en'}};
 const groups=new Map(),order=[];
 for(const {node,kind} of items){
  if(!groups.has(kind)){
   const details=document.createElement('details');
   details.className='ty-settings-group ty-unified-settings-group';
   details.dataset.settingsSection=kind;
   const summary=document.createElement('summary');summary.textContent=(isEnglish()?enLabels:labels)[kind];
   const body=document.createElement('div');body.className='ty-settings-content ty-unified-settings-content';
   details.append(summary,body);groups.set(kind,{details,body});order.push(kind);
  }
  groups.get(kind).body.append(node);
 }
 const anchor=children.find(node=>isAppearance(node)||isFooter(node)||isSupport(node));
 for(const kind of order)surface.insertBefore(groups.get(kind).details,anchor||null);
 const refresh=()=>{for(const [kind,{details}] of groups){const summary=details.querySelector('summary');if(summary)summary.textContent=(isEnglish()?enLabels:labels)[kind]}};
 for(const event of ['toolya:locale-change','toolya:wishes-locale-change','toolya:estate-locale-change','toolya:dashboard-locale-change'])document.addEventListener(event,refresh);
 surface.classList.add('ty-unified-settings-panel');
 surface.dataset.toolyaAccordion='1';
 return true;
}
