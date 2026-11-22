/** Migration bridge: existing reviewed DE/EN catalogues -> i18next resource shape.
 * This module is data-only. It does not alter any DOM, account, storage or routes.
 * Legacy translators remain active until each view has been explicitly migrated.
 */
import {DASHBOARD_COPY} from './dashboard-copy.mjs';
import {MARKETING_COPY} from './marketing-copy.mjs';
import {WISHES_COPY,WISHES_RUNTIME_COPY} from './wishes-copy.mjs';
import {ESTATE_COPY,ESTATE_RUNTIME_COPY} from './estate-copy.mjs';
import {ADMIN_COPY} from './admin-copy.mjs';
import {I18N_LEGACY_TOOL_CATALOGUES as toolCopy} from './interface.mjs';

const sources=Object.freeze({
 dashboard:[DASHBOARD_COPY],
 marketing:[MARKETING_COPY],
 wishes:[WISHES_COPY,WISHES_RUNTIME_COPY],
 estate:[ESTATE_COPY,ESTATE_RUNTIME_COPY],
 admin:[ADMIN_COPY],
 account:[toolCopy.accountStatus]
});
function toResource(tables,locale){
 const result=Object.create(null);
 for(const table of tables)for(const [de,en] of Object.entries(table)){
   if(typeof de!=='string'||typeof en!=='string')continue;
   // Exact German source strings remain stable translation keys.
   // Do not interpolate source strings or feed user-provided values here.
   if(!Object.hasOwn(result,de))result[de]=locale==='en'?en:de;
 }
 return result;
}
export function createLegacyI18nextResources(){
 const de=Object.create(null),en=Object.create(null);
 for(const [namespace,tables] of Object.entries(sources)){
   de[namespace]=toResource(tables,'de');
   en[namespace]=toResource(tables,'en');
 }
 const tools=new Set([...Object.keys(toolCopy.selectors),...Object.keys(toolCopy.dialogs),...Object.keys(toolCopy.additionalDialogs),...Object.keys(toolCopy.runtimeStatus)]);
 for(const tool of tools){
  const ns='tool_'+tool.replace(/[^a-z0-9_-]/gi,'_');
  const tables=[toolCopy.dialogs[tool]||{},toolCopy.additionalDialogs[tool]||{},toolCopy.runtimeStatus[tool]||{}];
  de[ns]=toResource(tables,'de');en[ns]=toResource(tables,'en');
  // Selector mappings are stored as metadata, not translated source strings.
  const selectorEntries=Object.create(null);
  for(const [selector,translated,attribute,attributeTranslation] of toolCopy.selectors[tool]||[]){
   if(typeof selector!=='string'||!selector)continue;
   const value=attribute?attributeTranslation:translated;
   if(typeof value==='string'&&value)selectorEntries[selector+(attribute?'@'+attribute:'')]=value;
  }
  en[ns+'_selectors']=selectorEntries;
  de[ns+'_selectors']=Object.create(null);
 }
 return {de,en};
}
export const LEGACY_I18NEXT_RESOURCES=createLegacyI18nextResources();
/** Attach to an already initialized i18next instance; no duplicate runtime. */
export function registerLegacyCatalogues(i18next){
 if(!i18next||typeof i18next.addResourceBundle!=='function')throw new TypeError('Expected i18next instance');
 for(const locale of ['de','en'])for(const [namespace,entries] of Object.entries(LEGACY_I18NEXT_RESOURCES[locale]))
   i18next.addResourceBundle(locale,namespace,entries,true,false);
 return i18next;
}
