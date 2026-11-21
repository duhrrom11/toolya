import {dashboardText} from './dashboard-copy.mjs';
const excluded=new Set(['TASKS','REMINDERS','SHOPPING-ITEMS','FAVORITES','RECENT']);
const sourceText=new WeakMap(),sourceAttributes=new WeakMap();
const attributeNames=['aria-label','title','placeholder','alt'];
function suppressed(element){
 for(let p=element;p;p=p.parentElement)
  if(excluded.has(p.id?.toUpperCase())||['SCRIPT','STYLE','NOSCRIPT','TEXTAREA'].includes(p.tagName))return true;
 return false;
}
export function applyDashboardPageLocale(document,lang){
 const nodes=[document.body,...document.body.querySelectorAll('*')];
 for(const el of nodes){
  if(suppressed(el)||el.closest?.('.ty-dashboard-locale'))continue;
  for(const node of el.childNodes){
   if(node.nodeType!==3)continue;
   const initial=sourceText.has(node)?sourceText.get(node):node.nodeValue;
   if(!sourceText.has(node))sourceText.set(node,initial);
   const match=/^(\\s*)([\\s\\S]*?)(\\s*)$/.exec(initial);
   if(!match)continue;
   const converted=dashboardText(match[2],lang);
   const output=match[1]+converted+match[3];
   if(node.nodeValue!==output)node.nodeValue=output;
  }
  for(const attr of attributeNames){
   if(!el.hasAttribute?.(attr))continue;
   let attrs=sourceAttributes.get(el);
   if(!attrs){attrs=new Map();sourceAttributes.set(el,attrs)}
   if(!attrs.has(attr))attrs.set(attr,el.getAttribute(attr));
   const output=dashboardText(attrs.get(attr),lang);
   if(el.getAttribute(attr)!==output)el.setAttribute(attr,output);
  }
 }
}
