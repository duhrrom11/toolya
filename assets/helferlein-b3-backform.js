/* B3 Backform – UI-only adapter. No recipe, oven or account data changes. */
(()=>{
'use strict';
const T='helferlein_ui_theme_v1',L='helferlein_ui_layout_backform_v1';
const tabs=[['rechner','Rechner'],['finder','Formen-Finder'],['substanz','Ersatz & Zucker'],['tools','Extras & Kosten'],['rezepte','Gespeicherte Rezepte']];
const read=k=>{try{return localStorage.getItem(k)}catch{return null}};
const save=(k,v)=>{try{localStorage.setItem(k,v);return true}catch{return false}};
const clone=x=>JSON.parse(JSON.stringify(x));
const defaults=()=>tabs.map(([id],order)=>({id,order,size:'m'}));
let theme=['auto','light','dark'].includes(read(T))?read(T):'auto';
const media=window.matchMedia('(prefers-color-scheme: dark)');
function load(){
 try{
 const stored=JSON.parse(read(L)||'null');
 if(!Array.isArray(stored))return defaults();
 const lookup=new Map(stored.map(x=>[x?.id,x]));
 return defaults().map((x,i)=>{
 const z=lookup.get(x.id)||{};
 return {id:x.id,order:Number.isInteger(z.order)&&z.order>=0&&z.order<10?z.order:i,size:['s','m','l'].includes(z.size)?z.size:'m'};
 }).sort((a,b)=>a.order-b.order).map((x,i)=>({...x,order:i}));
 }catch{return defaults()}
}
let layout=load(),draft=null;
function node(tag,props={},label=''){
 const x=document.createElement(tag);
 for(const [key,value] of Object.entries(props))x.setAttribute(key,value);
 if(label)x.textContent=label;
 return x;
}
function applyTheme(){
 const dark=theme==='dark'||(theme==='auto'&&media.matches);
 document.body.classList.toggle('b3-dark',dark);
 document.body.classList.toggle('b3-light',!dark);
 document.documentElement.style.colorScheme=dark?'dark':'light';
 const sel=document.getElementById('b3-backform-theme');
 if(sel)sel.value=theme;
}
function paint(arr){
 for(const [index,x] of arr.entries()){
 const button=document.getElementById('btn-tab-'+x.id);
 if(button)button.style.order=String(index);
 document.getElementById('tab-'+x.id)?.setAttribute('data-b3-size',x.size);
 }
}
function editorRender(){
 const host=document.getElementById('b3-backform-editor');if(!host||!draft)return;
 host.replaceChildren(node('h3',{},'Dashboard bearbeiten'),node('p',{class:'text-xs'},'Werkzeuge sortieren und Abstände anpassen. Alle Berechnungen bleiben erreichbar.'));
 for(const [i,item] of draft.entries()){
 const row=node('div',{class:'b3-backform-editor-row'});
 row.append(node('strong',{},tabs.find(t=>t[0]===item.id)?.[1]||item.id));
 const move=(dir)=>{
 const j=i+dir;if(j<0||j>=draft.length)return;
 [draft[i],draft[j]]=[draft[j],draft[i]];
 draft.forEach((p,n)=>p.order=n);paint(draft);editorRender();
 };
 const up=node('button',{type:'button','aria-label':item.id+' nach oben'},'↑');
 const down=node('button',{type:'button','aria-label':item.id+' nach unten'},'↓');
 up.disabled=i===0;down.disabled=i===draft.length-1;
 up.addEventListener('click',()=>move(-1));down.addEventListener('click',()=>move(1));
 row.append(up,down);
 const density=node('select',{'aria-label':'Kartendichte '+item.id});
 for(const [value,label] of [['s','Kompakt'],['m','Standard'],['l','Großzügig']])density.append(node('option',{value},label));
 density.value=item.size;density.addEventListener('change',()=>{item.size=density.value;paint(draft)});
 row.append(density);host.append(row);
 }
 const actions=node('div',{class:'b3-backform-editor-actions'});
 const done=()=>{
 draft=null;host.hidden=true;
 document.getElementById('b3-backform-edit').disabled=false;
 };
 const btn=(label,handler)=>{
 const el=node('button',{type:'button'},label);el.addEventListener('click',handler);return el;
 };
 actions.append(
 btn('Speichern',()=>{if(!save(L,JSON.stringify(draft))){alert('Layout konnte nicht gespeichert werden.');return;}layout=clone(draft);done();}),
 btn('Abbrechen',()=>{paint(layout);done();}),
 btn('Standardlayout',()=>{draft=defaults();paint(draft);editorRender();})
 );
 host.append(actions);
}
function init(){
 document.body.classList.add('b3','b3-backform');
 document.getElementById('main-content')?.classList.add('b3-backform-main');
 const control=document.getElementById('b3-backform-theme');
 if(control){
 control.value=theme;
 control.addEventListener('change',()=>{theme=control.value;if(!save(T,theme))alert('Designmodus konnte nicht gespeichert werden.');applyTheme();});
 }
 const editor=document.getElementById('b3-backform-editor');
 const edit=document.getElementById('b3-backform-edit');
 if(editor&&edit){
 edit.addEventListener('click',()=>{draft=clone(layout);edit.disabled=true;editor.hidden=false;paint(draft);editorRender();editor.scrollIntoView({block:'nearest',behavior:'smooth'})});
 }
 // Original openTab() stays the only controller for recipe, finder and cost views.
 paint(layout);applyTheme();
 media.addEventListener?.('change',applyTheme);
 window.addEventListener('storage',e=>{
 if(e.key===T){theme=['auto','light','dark'].includes(e.newValue)?e.newValue:'auto';applyTheme()}
 if(e.key===L&&!draft){layout=load();paint(layout)}
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
