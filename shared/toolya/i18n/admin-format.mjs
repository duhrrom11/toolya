// Presentation only. Raw values stay in closures, never in editable fields.
export const adminFormatLocale=lang=>lang==='en'?'en-GB':'de-DE';
export function adminNumber(value,lang){return Number(value).toLocaleString(adminFormatLocale(lang))}
export function adminDate(value,lang){
 const date=new Date(value);
 return Number.isNaN(date.valueOf())?'':date.toLocaleDateString(adminFormatLocale(lang));
}
export function createAdminPresentation(document){
 const renderers=new WeakMap();
 function refresh(lang){
  for(const node of document.querySelectorAll('[data-admin-format]')){
   const render=renderers.get(node);if(render)render(lang);
  }
 }
 function bind(node,render,lang){
  node.setAttribute('data-admin-format','');renderers.set(node,render);render(lang);return node;
 }
 return {bind,refresh};
}
