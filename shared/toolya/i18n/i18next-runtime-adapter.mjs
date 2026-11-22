/** Safe, opt-in i18next adapter for existing Toolya translation catalogues.
 * Only app-authored exact messages and approved prefixes are translated.
 * No DOM observers, user-data rewriting, authentication or storage access.
 */
import {I18N_LEGACY_TOOL_CATALOGUES as legacy} from './interface.mjs';
import {registerLegacyCatalogues} from './i18next-legacy-resources.mjs';

const safeTool=/^[a-z0-9_-]+$/i;
export function createToolyaI18nextAdapter(i18next){
 if(!i18next||typeof i18next.t!=='function'||typeof i18next.addResourceBundle!=='function')
  throw new TypeError('An initialized i18next instance is required');
 registerLegacyCatalogues(i18next);
 const translateExact=(locale,namespace,value)=>{
  if(typeof value!=='string'||!['de','en'].includes(locale))return value;
  const bundle=i18next.getResourceBundle?.(locale,namespace);
  if(!bundle||!Object.hasOwn(bundle,value))return value;
  // Explicit language/namespace and exact key; no interpolation of arbitrary values.
  return i18next.t(value,{lng:locale,ns:namespace,keySeparator:false,nsSeparator:false,interpolation:{skipOnVariables:true},defaultValue:value});
 };
 const translateTool=(tool,locale,value)=>{
  if(typeof tool!=='string'||!safeTool.test(tool))return value;
  return translateExact(locale,'tool_'+tool,value);
 };
 const translateAccount=(locale,value)=>translateExact(locale,'account',value);
 // Prefixes may contain sensitive, user-authored suffixes. Only the fixed
 // application-owned prefix is translated; the suffix is left byte-for-byte.
 const translatePrefix=(tool,locale,value,kind='runtime')=>{
  if(typeof value!=='string'||!['de','en'].includes(locale)||!safeTool.test(tool))return value;
  const pairs=kind==='dialog'
   ? Object.entries({...legacy.sharedDialogPrefixes,...(legacy.dialogPrefixes[tool]||{})})
   : (legacy.runtimePrefixes[tool]||[]);
  for(const [de,en] of pairs){
   const source=locale==='en'?de:en,target=locale==='en'?en:de;
   if(value.startsWith(source))return target+value.slice(source.length);
  }
  return value;
 };
 return Object.freeze({translateExact,translateTool,translateAccount,translatePrefix});
}
