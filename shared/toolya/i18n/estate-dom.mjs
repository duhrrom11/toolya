import {estateText} from './estate-copy.mjs';
const originalTexts=new WeakMap(),attrs=new WeakMap(),implicitOptions=new WeakSet();
const selectors='h1,h2,h3,h4,button,label,summary,option,nav a,header a,main a,a.skip,p,[data-estate-copy]';
const exclude='#print-pages,[data-secret],[data-key],.estate-entry,.vault-record,.entry,.person,#read-entries,#estate-history,[contenteditable],[data-user-content]';
export function applyEstateLocale(document,lang){
 for(const el of document.querySelectorAll(selectors)){
  if(el.closest(exclude)&&!el.hasAttribute('data-estate-copy'))continue;
  let rec=attrs.get(el);if(!rec){rec=new Map();attrs.set(el,rec)}
  for(const attr of ['aria-label','placeholder','title']){
   const current=el.getAttribute(attr),previous=rec.get(attr);
   const before=previous?.rendered===current?previous.source:current;if(before===null)continue;
   const after=estateText(before,lang);
   rec.set(attr,{source:before,rendered:after});
   if(el.getAttribute(attr)!==after)el.setAttribute(attr,after);
  }
  for(const child of el.childNodes){
   if(child.nodeType!==3)continue;
   const previous=originalTexts.get(child);
   const text=previous?.rendered===child.nodeValue?previous.source:child.nodeValue,trimmed=text.trim();
   const converted=estateText(trimmed,lang);
   if(el.tagName==='OPTION'&&lang==='en'&&trimmed!==converted&&!el.hasAttribute('value')){el.setAttribute('value',trimmed);implicitOptions.add(el)}
   if(el.tagName==='OPTION'&&lang==='de'&&implicitOptions.delete(el))el.removeAttribute('value');
   const rendered=converted!==trimmed?text.replace(trimmed,converted):text;
   originalTexts.set(child,{source:text,rendered});
   if(child.nodeValue!==rendered)child.nodeValue=rendered;
  }
 }
}