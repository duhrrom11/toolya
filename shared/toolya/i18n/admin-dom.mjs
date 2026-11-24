import {adminText} from './admin-copy.mjs';
const original=new WeakMap(),attributes=new WeakMap(),implicitOptions=new WeakSet();
export function applyAdminLocale(document,lang){
 const nodes=document.querySelectorAll('h1,h2,h3,h4,p,button,label,option,summary,header a,main a,input,textarea');
 for(const el of nodes){
  if(el.closest('#summary,#finder-results,#results,.admin-metric,[data-private],[contenteditable]'))continue;
  // Imported records are private, except explicitly tagged application UI.
  if(el.closest('#rows,#healthReview')&&!el.hasAttribute('data-admin-copy')&&!el.hasAttribute('data-admin-aria-prefix'))continue;
  let record=attributes.get(el);if(!record){record=new Map();attributes.set(el,record)}
  for(const attr of ['aria-label','placeholder','title']){
   const current=el.getAttribute(attr),previous=record.get(attr);
   const source=previous?.rendered===current?previous.source:current;if(source===null)continue;
   const prefix=attr==='aria-label'?el.getAttribute('data-admin-aria-prefix'):null;
   const text=prefix&&source.startsWith(prefix)
    ?adminText(prefix,lang)+source.slice(prefix.length)
    :adminText(source,lang);
   record.set(attr,{source,rendered:text});
   if(el.getAttribute(attr)!==text)el.setAttribute(attr,text);
  }
  if(['state','healthStatus','result','progress','fileStatus','configuration','selection','pageLabel','ranking-diagnostic','tool-ranking'].includes(el.id))continue;
  for(const node of el.childNodes){
   if(node.nodeType!==3)continue;
   const previous=original.get(node),before=previous?.rendered===node.nodeValue?previous.source:node.nodeValue,source=before.trim(),translated=adminText(source,lang);
   if(el.tagName==='OPTION'&&lang==='en'&&source!==translated&&!el.hasAttribute('value')){el.setAttribute('value',source);implicitOptions.add(el)}
   if(el.tagName==='OPTION'&&lang==='de'&&implicitOptions.delete(el))el.removeAttribute('value');
   const next=source?before.replace(source,translated):before;
   original.set(node,{source:before,rendered:next});
   if(node.nodeValue!==next)node.nodeValue=next;
  }
 }
}