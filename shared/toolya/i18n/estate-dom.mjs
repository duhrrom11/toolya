import {estateText} from './estate-copy.mjs';
const originalTexts=new WeakMap(),attrs=new WeakMap();
const selectors='h1,h2,h3,h4,button,label,summary,option,nav a,p';
const exclude='#print-pages,[data-secret],[data-key],.estate-entry,.vault-record,[contenteditable]';
export function applyEstateLocale(document,lang){
 for(const el of document.querySelectorAll(selectors)){
  if(el.closest(exclude))continue;
  let rec=attrs.get(el);if(!rec){rec=new Map();attrs.set(el,rec)}
  for(const attr of ['aria-label','placeholder','title']){
   if(!rec.has(attr))rec.set(attr,el.getAttribute(attr));
   const before=rec.get(attr);if(before===null)continue;
   const after=estateText(before,lang);
   if(el.getAttribute(attr)!==after)el.setAttribute(attr,after);
  }
  for(const child of el.childNodes){
   if(child.nodeType!==3)continue;
   if(!originalTexts.has(child))originalTexts.set(child,child.nodeValue);
   const text=originalTexts.get(child),trimmed=text.trim();
   const converted=estateText(trimmed,lang);
   if(converted!==trimmed)child.nodeValue=text.replace(trimmed,converted);
   else if(child.nodeValue!==text)child.nodeValue=text;
  }
 }
}