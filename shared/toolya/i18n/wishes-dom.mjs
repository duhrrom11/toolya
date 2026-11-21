import {wishesText} from './wishes-copy.mjs';
const sources=new WeakMap(),attrs=new WeakMap(),implicit=new WeakSet();
const selector='h1,h2,h3,h4,button,label,option,summary,nav a,input,textarea,select';
const excluded='[contenteditable],.ty-wishes-language,[data-user-content],[data-profile-card],.wishlist-result,.profile-card,.gift-card';
export function applyWishLocale(document,language){
 for(const el of document.querySelectorAll(selector)){
  if(el.closest(excluded))continue;
  let originalAttrs=attrs.get(el);
  if(!originalAttrs){originalAttrs=new Map();attrs.set(el,originalAttrs)}
  for(const attr of ['aria-label','title','placeholder']){
   if(!originalAttrs.has(attr))originalAttrs.set(attr,el.getAttribute(attr));
   const source=originalAttrs.get(attr);
   if(source===null)continue;
   const translation=wishesText(source,language);
   if(el.getAttribute(attr)!==translation)el.setAttribute(attr,translation);
  }
  for(const node of el.childNodes){
   if(node.nodeType!==3)continue;
   if(!sources.has(node))sources.set(node,node.nodeValue);
   const original=sources.get(node);
   const key=original.trim();
   const translation=wishesText(key,language);
   if(el.tagName==='OPTION'&&translation!==key&&language==='en'&&!el.hasAttribute('value')){
    el.setAttribute('value',key);implicit.add(el);
   }
   if(el.tagName==='OPTION'&&language==='de'&&implicit.delete(el))el.removeAttribute('value');
   const target=key?original.replace(key,translation):original;
   if(node.nodeValue!==target)node.nodeValue=target;
  }
 }
}