import {wishesText} from './wishes-copy.mjs';
const sources=new WeakMap(),attrs=new WeakMap(),implicit=new WeakSet();
// Paragraphs and spans are translated only when explicitly tagged as
// application-owned editorial copy; never touch arbitrary profiles or cards.
const selector='h1,h2,h3,h4,button,label,option,summary,nav a,input,textarea,select,p[data-wishes-copy],span[data-wishes-copy]';
const excluded='[contenteditable],.ty-wishes-language,[data-user-content],[data-profile-card],.wishlist-result,.profile-card,.gift-card';
export function applyWishLocale(document,language){
 for(const el of document.querySelectorAll(selector)){
  if(el.closest(excluded))continue;
  let originalAttrs=attrs.get(el);
  if(!originalAttrs){originalAttrs=new Map();attrs.set(el,originalAttrs)}
  for(const attr of ['aria-label','title','placeholder']){
   const current=el.getAttribute(attr);
   const previous=originalAttrs.get(attr);
   if(!previous||previous.rendered!==current)originalAttrs.set(attr,{source:current,rendered:current});
   const record=originalAttrs.get(attr);
   if(record.source===null)continue;
   const translation=wishesText(record.source,language);
   record.rendered=translation;
   if(current!==translation)el.setAttribute(attr,translation);
  }
  for(const node of el.childNodes){
   if(node.nodeType!==3)continue;
   const current=node.nodeValue,previous=sources.get(node);
   if(!previous||previous.rendered!==current)sources.set(node,{source:current,rendered:current});
   const record=sources.get(node),original=record.source;
   const key=original.trim();
   const translation=wishesText(key,language);
   if(el.tagName==='OPTION'&&translation!==key&&language==='en'&&!el.hasAttribute('value')){
    el.setAttribute('value',key);implicit.add(el);
   }
   if(el.tagName==='OPTION'&&language==='de'&&implicit.delete(el))el.removeAttribute('value');
   const target=key?original.replace(key,translation):original;
   record.rendered=target;
   if(node.nodeValue!==target)node.nodeValue=target;
  }
 }
}