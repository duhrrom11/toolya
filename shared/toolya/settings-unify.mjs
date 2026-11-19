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
   (node.querySelector?.('#closeSettingsBtn,[aria-label="Einstellungen schließen"]') &&
    !node.querySelector?.('input')) ||
   (node===children[0] &&
    (/^H[234]$/.test(node.tagName) && /einstellungen/i.test(node.textContent) ||
     node.querySelector?.('h2,h3,h4') && node.querySelector?.('button') &&
     /einstellungen/i.test(node.querySelector('h2,h3,h4').textContent) &&
     !node.querySelector('input')));
 const isFooter=node=>node.matches?.('.wishlist-settings-footer,.b3-hub-settings-footer,.dashboard-settings-close') ||
   (node.id==='cancelSettingsBtn' || (node.querySelector?.('#cancelSettingsBtn') && !node.querySelector?.('input'))) ||
   (node.matches?.('button') && /^(schließen|schliessen|✕|×)$/i.test(node.textContent.trim()));
 const candidates=children.filter(node=>
   !isAppearance(node)&&!isSupport(node)&&!isHeader(node)&&!isFooter(node) &&
   !node.matches?.('script,style') && !node.classList?.contains('toolya-settings-accordion'));
 if(!candidates.length){surface.dataset.toolyaAccordion='1';return false}
 const contentText=node=>(node.querySelector?.('h2,h3,h4,legend,summary')?.textContent||node.textContent||'').slice(0,180).toLowerCase();
 function identify(node){
  if(node.querySelector?.('.b3-backup-actions,[id*="backupActions"],[id="settingsBackupTitle"]'))return 'backup';
  if(node.querySelector?.('#settingsAccountTitle,#loginEmail,#auth-email,#cloudStatus,#settingsAuthFields,#cloud-status-box,#cloud-status-text'))return 'account';
  const text=contentText(node);
  if(/datensicherung|backup|daten sichern|wiederherstell/.test(text))return 'backup';
  if(/konto|anmeld|registrier|account|cloud-status/.test(text))return 'account';
  if(/ofen|profil|optionen|anzeige|einstellungen/.test(text))return 'extra';
  return null;
 }
 const items=candidates.map(node=>({node,kind:identify(node)}));
 // The account form is usually the first block; loose following blocks inherit its group.
 let current='account';
 for(const item of items){if(item.kind)current=item.kind;else item.kind=current}
 const labels={account:'Toolya-Konto',backup:'Datensicherung',extra:'Weitere Einstellungen'};
 const groups=new Map(),order=[];
 for(const {node,kind} of items){
  if(!groups.has(kind)){
   const details=document.createElement('details');
   details.className='ty-settings-group ty-unified-settings-group';
   details.dataset.settingsSection=kind;
   const summary=document.createElement('summary');summary.textContent=labels[kind];
   const body=document.createElement('div');body.className='ty-settings-content ty-unified-settings-content';
   details.append(summary,body);groups.set(kind,{details,body});order.push(kind);
  }
  groups.get(kind).body.append(node);
 }
 const anchor=children.find(node=>isAppearance(node)||isFooter(node)||isSupport(node));
 for(const kind of order)surface.insertBefore(groups.get(kind).details,anchor||null);
 surface.classList.add('ty-unified-settings-panel');
 surface.dataset.toolyaAccordion='1';
 return true;
}
