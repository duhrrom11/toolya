import {wishesText} from '../../shared/toolya/i18n/wishes-copy.mjs';
import {readAppLocale} from '../../shared/toolya/i18n/locale.mjs';
export const language=()=>globalThis.__toolyaWishesLocale||readAppLocale();
export const locale=()=>language()==='en'?'en-GB':'de-DE';
export const ui=value=>wishesText(value,language());
export const money=value=>new Intl.NumberFormat(locale(),{style:'currency',currency:'EUR'}).format(Number(value));
export const dateLabel=(value,options)=>new Date(value).toLocaleDateString(locale(),options);
export const stampLabel=value=>new Date(value).toLocaleString(locale());
export const timeLabel=value=>new Date(value).toLocaleTimeString(locale(),{hour:'2-digit',minute:'2-digit'});
const bindings=new WeakMap();
export function bindDisplay(node,render,attribute=null){
 const paint=()=>{const value=render();if(attribute)node.setAttribute(attribute,value);else node.textContent=value};
 let props=bindings.get(node);
 if(!props){props=new Map();bindings.set(node,props)}
 props.set(attribute,paint);
 node.setAttribute('data-wish-format-display','');
 // Own the complete text/attribute frame; do not let generic copy touch names.
 node.setAttribute('data-user-content','');
 paint();return node;
}
if(typeof document!=='undefined')document.addEventListener('toolya:wishes-locale-change',()=>{
 for(const node of document.querySelectorAll('[data-wish-format-display]'))for(const paint of bindings.get(node)?.values()||[])paint();
});
