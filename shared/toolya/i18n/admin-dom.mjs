import {adminText} from './admin-copy.mjs';
const original=new WeakMap(),attributes=new WeakMap(),implicitOptions=new WeakSet();
export function applyAdminLocale(document,lang){
 const nodes=document.querySelectorAll('h1,h2,h3,h4,p,button,label,option,summary,header a,input,textarea');
 for(const el of nodes){
  if(el.closest('#summary,#finder-results,#results,.admin-metric,[data-private],[contenteditable]'))continue;
  let record=attributes.get(el);if(!record){record=new Map();attributes.set(el,record)}
  for(const attr of ['aria-label','placeholder','title']){
   if(!record.has(attr))record.set(attr,el.getAttribute(attr));
   const source=record.get(attr);if(source===null)continue;
   const text=adminText(source,lang);
   if(el.getAttribute(attr)!==text)el.setAttribute(attr,text);
  }
  if(el.id==='state'||el.id==='healthStatus')continue;
  for(const node of el.childNodes){
   if(node.nodeType!==3)continue;
   if(!original.has(node))original.set(node,node.nodeValue);
   const before=original.get(node),source=before.trim(),translated=adminText(source,lang);
   if(el.tagName==='OPTION'&&lang==='en'&&source!==translated&&!el.hasAttribute('value')){el.setAttribute('value',source);implicitOptions.add(el)}
   if(el.tagName==='OPTION'&&lang==='de'&&implicitOptions.delete(el))el.removeAttribute('value');
   const next=source?before.replace(source,translated):before;
   if(node.nodeValue!==next)node.nodeValue=next;
  }
 }
}