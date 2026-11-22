/** One optional i18next singleton for the Toolya parking pilot.
 * Existing tool-entry handles the legacy fallback when the CDN is unavailable.
 * No user data, persistence or DOM mutation.
 */
import {registerLegacyCatalogues} from './i18next-legacy-resources.mjs';
export function initializeToolyaI18next(instance){
 if(!instance||typeof instance.init!=='function'||typeof instance.addResourceBundle!=='function')
  return null;
 if(instance.isInitialized){registerLegacyCatalogues(instance);return instance;}
 // initImmediate:false makes resources available before tool-entry mounts.
 const result=instance.init({
  lng:'de',fallbackLng:'de',supportedLngs:['de','en'],
  defaultNS:'account',ns:['account'],resources:{},
  initImmediate:false,keySeparator:false,nsSeparator:false,
  interpolation:{escapeValue:true}
 });
 if(result&&typeof result.catch==='function')result.catch(()=>{});
 if(!instance.isInitialized)return null;
 registerLegacyCatalogues(instance);
 return instance;
}
