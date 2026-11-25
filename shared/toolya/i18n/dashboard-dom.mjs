import {dashboardText} from './dashboard-copy.mjs';
const excluded=new Set(['TASKS','REMINDERS','SHOPPING-ITEMS','FAVORITES','RECENT','WATERING-CONNECT-PLANT','USERINFO','CLOUDSTATUS','LOGINMESSAGE','SYNC-STATUS','SYNC-DETAIL','SHOPPING-STATUS','WATERING-CONNECT-STATUS','NOTICE']);
const sourceText=new WeakMap(),sourceAttributes=new WeakMap();
const attributeNames=['aria-label','title','placeholder','alt'];
function suppressed(element){
 for(let p=element;p;p=p.parentElement)
  if(p.hasAttribute?.('data-user-content')||excluded.has(p.id?.toUpperCase())||['SCRIPT','STYLE','NOSCRIPT','TEXTAREA'].includes(p.tagName))return true;
 return false;
}
export function applyDashboardPageLocale(document,lang,translate=dashboardText){
 const nodes=[document.body,...document.body.querySelectorAll('*')];
 for(const el of nodes){
  if(suppressed(el)||el.closest?.('.ty-dashboard-locale'))continue;
  for(const node of el.childNodes){
   if(node.nodeType!==3)continue;
   const previous=sourceText.get(node);
   const initial=previous?.rendered===node.nodeValue?previous.source:node.nodeValue;
   const match=/^(\s*)([\s\S]*?)(\s*)$/.exec(initial);
   if(!match)continue;
   const converted=translate(match[2],lang);
   const output=match[1]+converted+match[3];
   sourceText.set(node,{source:initial,rendered:output});
   if(node.nodeValue!==output)node.nodeValue=output;
  }
  for(const attr of attributeNames){
   if(!el.hasAttribute?.(attr))continue;
   let attrs=sourceAttributes.get(el);
   if(!attrs){attrs=new Map();sourceAttributes.set(el,attrs)}
   const current=el.getAttribute(attr),previous=attrs.get(attr);
   const source=previous?.rendered===current?previous.source:current;
   const output=translate(source,lang);
   attrs.set(attr,{source,rendered:output});
   if(el.getAttribute(attr)!==output)el.setAttribute(attr,output);
  }
 }
}
