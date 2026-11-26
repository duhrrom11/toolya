import {readAppLocale} from './i18n/locale.mjs';
export const SETTINGS_SECTIONS=Object.freeze({
 account:Object.freeze({de:'Toolya-Konto',en:'Toolya account'}),
 backup:Object.freeze({de:'Datensicherung',en:'Backup'}),
 extra:Object.freeze({de:'Weitere Einstellungen',en:'More settings'}),
 help:Object.freeze({de:'Hilfe und Anleitung',en:'Help and guide'})
});
export function settingsLabel(kind,locale){return SETTINGS_SECTIONS[kind]?.[locale==='en'?'en':'de']||''}
export function createSettingsSection(doc,kind,locale='de'){
 if(!Object.hasOwn(SETTINGS_SECTIONS,kind))throw new Error('Unknown settings section');
 const details=doc.createElement('details');
 details.className='ty-settings-group ty-unified-settings-group';
 details.dataset.settingsSection=kind;
 const summary=doc.createElement('summary');summary.textContent=settingsLabel(kind,locale);
 const body=doc.createElement('div');body.className='ty-settings-content ty-unified-settings-content';
 details.append(summary,body);
 return {details,summary,body};
}
export function refreshSettingsSections(surface,locale){
 for(const details of surface.querySelectorAll('details[data-settings-section]')){
  const label=settingsLabel(details.dataset.settingsSection,locale);
  const summary=details.querySelector('summary');
  // Preserve any icons, nested controls and custom headings.
  if(label&&summary&&!summary.children.length&&Object.values(SETTINGS_SECTIONS[details.dataset.settingsSection]).includes(summary.textContent.trim())&&summary.textContent!==label)summary.textContent=label;
 }
}
// Reuse the home page's accessible <details> accordion across legacy tool dialogs.
// Move existing nodes instead of recreating them: IDs, listeners and each tool's data stay intact.
const prebuiltSurfaces=new WeakSet();
function normalizePrebuiltSections(surface){
 const sections=Array.from(surface.children).filter(node=>node.matches('details.ty-settings-group:not(.toolya-appearance):not(.ty-pwa-settings)'));
 if(!sections.length)return false;
 for(const details of sections){
  details.classList.add('ty-unified-settings-group');
  const body=Array.from(details.children).find(node=>node.matches('.ty-settings-content'));
  body?.classList.add('ty-unified-settings-content');
  const summary=Array.from(details.children).find(node=>node.matches('summary'));
  if(!details.dataset.settingsSection&&summary){
   const kind=Object.keys(SETTINGS_SECTIONS).find(key=>Object.values(SETTINGS_SECTIONS[key]).includes(summary.textContent.trim()));
   if(kind)details.dataset.settingsSection=kind;
  }
 }
 surface.classList.add('ty-unified-settings-panel');
 if(!prebuiltSurfaces.has(surface)){
  const refresh=()=>refreshSettingsSections(surface,(globalThis.__toolyaUILocale||globalThis.__toolyaWishesLocale||globalThis.__toolyaEstateLocale||globalThis.__toolyaDashboardLocale||readAppLocale())==='en'?'en':'de');
  for(const event of ['toolya:locale-change','toolya:wishes-locale-change','toolya:estate-locale-change','toolya:dashboard-locale-change'])document.addEventListener?.(event,refresh);
  prebuiltSurfaces.add(surface);
 }
 return true;
}
export function unifyToolSettings(modal) {
 if(!modal || document.body.classList.contains('b3-home'))return false;
 const surface=modal.firstElementChild?.matches?.('div') ? modal.firstElementChild : modal;
 if(surface.dataset.toolyaAccordion==='1'){normalizePrebuiltSections(surface);return true;}
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
   !node.matches?.('script,style,details.ty-settings-group') && !node.classList?.contains('toolya-settings-accordion'));
 if(!candidates.length){const normalized=normalizePrebuiltSections(surface);surface.dataset.toolyaAccordion='1';return normalized}
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
 const isEnglish=()=>{const active=globalThis.__toolyaUILocale||globalThis.__toolyaWishesLocale||globalThis.__toolyaEstateLocale||globalThis.__toolyaDashboardLocale;if(active)return active==='en';return readAppLocale()==='en'};
 const groups=new Map(),order=[];
 for(const {node,kind} of items){
  if(!groups.has(kind)){
   const group=createSettingsSection(document,kind,isEnglish()?'en':'de');
   groups.set(kind,group);order.push(kind);
  }
  groups.get(kind).body.append(node);
 }
 const anchor=children.find(node=>isAppearance(node)||isFooter(node)||isSupport(node));
 for(const kind of order)surface.insertBefore(groups.get(kind).details,anchor||null);
 const refresh=()=>refreshSettingsSections(surface,isEnglish()?'en':'de');
 for(const event of ['toolya:locale-change','toolya:wishes-locale-change','toolya:estate-locale-change','toolya:dashboard-locale-change'])document.addEventListener?.(event,refresh);
 surface.classList.add('ty-unified-settings-panel');
 surface.dataset.toolyaAccordion='1';
 return true;
}
