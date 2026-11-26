import {wishesText} from './wishes-copy.mjs?v=20261126-account-header-v2';
const sources=new WeakMap(),attrs=new WeakMap(),implicit=new WeakSet();
// Marked public editorial spans from #321 alongside older legacy copy;
// never translate arbitrary profile paragraphs or user-entered content.
const selector='h1,h2,h3,h4,button,label,option,summary,nav a,input,textarea,select,[data-wish-copy],[data-wish-owned-copy],p[data-wishes-copy],span[data-wishes-copy],[data-toolya-legacy-wishes] .hero .actions a,[data-toolya-legacy-wishes] #login a';
const excluded='[contenteditable],.ty-wishes-language,[data-user-content],[data-profile-card],.wishlist-result,.profile-card,.gift-card';
export function applyWishLocale(document,language){
 for(const el of document.querySelectorAll(selector)){
  if(el.closest(excluded)&&!el.hasAttribute('data-wish-owned-copy'))continue;
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
  // Textarea default text is form data, not application copy. Translate only its
  // fixed attributes; never rewrite the user's initial or restored value.
  if(el.tagName==='TEXTAREA')continue;
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
