/** Migration bridge: existing reviewed DE/EN catalogues -> i18next resource shape.
 * This module is data-only. It does not alter any DOM, account, storage or routes.
 * Legacy translators remain active until each view has been explicitly migrated.
 */
import {DASHBOARD_COPY} from './dashboard-copy.mjs';
import {WISHES_COPY,WISHES_RUNTIME_COPY} from './wishes-copy.mjs';
import {ESTATE_COPY,ESTATE_RUNTIME_COPY} from './estate-copy.mjs';
import {ADMIN_COPY} from './admin-copy.mjs';

const sources=Object.freeze({
 dashboard:[DASHBOARD_COPY],
 wishes:[WISHES_COPY,WISHES_RUNTIME_COPY],
 estate:[ESTATE_COPY,ESTATE_RUNTIME_COPY],
 admin:[ADMIN_COPY]
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
