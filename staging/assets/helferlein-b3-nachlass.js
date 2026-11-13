/* B3 design adapter for Digitaler Nachlass.
   Presentation and local UI preferences only. Never changes vault encryption,
   triggers, trustee data, browser vault payload, or remote records. */
(() => {
'use strict';
const THEME_KEY='helferlein_ui_theme_v1';
const LAYOUT_KEY='helferlein_ui_layout_nachlass_v1';
const tabs=[['vault','Tresor'],['deadman','Totmannschalter'],['trustees','Vertrauenspersonen'],['kit','Notfall-Kit']];
const media=window.matchMedia('(prefers-color-scheme: dark)');
const read=k=>{try{return localStorage.getItem(k)}catch{return null}};
const write=(k,v)=>{try{localStorage.setItem(k,v);return true}catch{return false}};
let theme=read(THEME_KEY)||'auto';if(!['auto','light','dark'].includes(theme))theme='auto';
const defaults=()=>tabs.map(([id],i)=>({id,order:i,size:'m'}));
function load(){
 try{
  const previous=JSON.parse(read(LAYOUT_KEY)||'null');
  if(!Array.isArray(previous))return defaults();
  const byId=new Map(previous.map(o=>[o?.id,o]));
  return defaults().map((d,i)=>{
   const p=byId.get(d.id)||{};
   return {id:d.id,order:Number.isInteger(p.order)&&p.order>=0&&p.order<10?p.order:i,
    size:['s','m','l'].includes(p.size)?p.size:'m'};
  }).sort((a,b)=>a.order-b.order).map((p,i)=>({...p,order:i}));
 }catch{return defaults()}
}
let layout=load(),draft=null;
const make=(tag,attributes={},label='')=>{
 const n=document.createElement(tag);
 for(const [key,value] of Object.entries(attributes))n.setAttribute(key,value);
 if(label)n.textContent=label;
 return n;
};
function applyTheme(){
 const dark=theme==='dark'||(theme==='auto'&&media.matches);
 document.body.classList.toggle('b3-dark',dark);
 document.body.classList.toggle('b3-light',!dark);
 document.documentElement.style.colorScheme=dark?'dark':'light';
 const choice=document.getElementById('b3-nachlass-theme');
 if(choice)choice.value=theme;
}
function applyLayout(items){
 for(const [index,entry] of items.entries()){
  const button=document.querySelector('.b3-vault-nav .tab-btn[data-tab="'+entry.id+'"]');
  const section=document.getElementById('section-'+entry.id);
  if(button)button.style.order=index;
  if(section)section.setAttribute('data-b3-size',entry.size);
 }
}
function renderEditor(){
 const host=document.getElementById('b3-nachlass-editor');
 if(!host||!draft)return;
 host.replaceChildren(make('h3',{},'Dashboard bearbeiten'),
 make('p',{class:'text-xs'},'Reihenfolge und Kartendichte anpassen. Sicherheitsrelevante Bereiche bleiben immer erreichbar.'));
 const items=make('div',{class:'b3-nachlass-editor-items'});
 draft.forEach((item,i)=>{
  const row=make('div',{class:'b3-nachlass-editor-row'});
  row.append(make('strong',{},tabs.find(t=>t[0]===item.id)?.[1]||item.id));
  const move=(delta)=>{
   const next=i+delta;if(next<0||next>=draft.length)return;
   [draft[i],draft[next]]=[draft[next],draft[i]];
   draft.forEach((x,index)=>x.order=index);applyLayout(draft);renderEditor();
  };
  const up=make('button',{type:'button','aria-label':item.id+' nach oben'},'↑');
  const down=make('button',{type:'button','aria-label':item.id+' nach unten'},'↓');
  up.disabled=i===0;down.disabled=i===draft.length-1;
  up.addEventListener('click',()=>move(-1));
  down.addEventListener('click',()=>move(1));row.append(up,down);
  const size=make('select',{'aria-label':'Kartendichte '+item.id});
  for(const [value,label] of [['s','Kompakt'],['m','Standard'],['l','Großzügig']])size.append(make('option',{value},label));
  size.value=item.size;size.addEventListener('change',()=>{item.size=size.value;applyLayout(draft)});
  row.append(size);items.append(row);
 });
 host.append(items);
 const commands=make('div',{class:'b3-nachlass-editor-actions'});
 const save=make('button',{type:'button'},'Speichern');
 save.addEventListener('click',()=>{
  if(!write(LAYOUT_KEY,JSON.stringify(draft))){alert('Dashboard-Einstellungen konnten nicht gespeichert werden.');return}
  layout=structuredClone(draft);draft=null;host.hidden=true;
 });
 const cancel=make('button',{type:'button'},'Abbrechen');
 cancel.addEventListener('click',()=>{draft=null;applyLayout(layout);host.hidden=true});
 const reset=make('button',{type:'button'},'Standardlayout');
 reset.addEventListener('click',()=>{draft=defaults();applyLayout(draft);renderEditor()});
 commands.append(save,cancel,reset);host.append(commands);
}
function init(){
 const body=document.body;
 body.classList.add('b3','b3-nachlass');
 document.getElementById('main-content')?.classList.add('b3-dashboard');
 const select=document.getElementById('b3-nachlass-theme');
 const editor=document.getElementById('b3-nachlass-editor');
 const edit=document.getElementById('b3-nachlass-edit');
 if(select){
  select.value=theme;
  select.addEventListener('change',()=>{
   theme=select.value;
   if(!write(THEME_KEY,theme))alert('Designmodus konnte nicht gespeichert werden.');
   applyTheme();
  });
 }
 if(edit&&editor){
  edit.addEventListener('click',()=>{
   draft=structuredClone(layout);editor.hidden=false;renderEditor();
   editor.scrollIntoView({block:'nearest',behavior:'smooth'});
  });
 }
 const more=document.getElementById('b3-nachlass-more');
 const sync=document.getElementById('manualSyncBtn');
 if(more&&sync)more.append(sync);
 document.getElementById('b3-nachlass-kit-action')?.addEventListener('click',()=>{
  more.open=false;window.switchTab?.('kit');
 });
 document.getElementById('b3-nachlass-settings')?.addEventListener('click',()=>{
  window.switchTab?.('settings');
 });
 // The original tab controller remains authoritative for all vault views.
 applyLayout(layout);applyTheme();
 media.addEventListener?.('change',applyTheme);
 window.addEventListener('storage',e=>{
  if(e.key===THEME_KEY){theme=['auto','light','dark'].includes(e.newValue)?e.newValue:'auto';applyTheme()}
  if(e.key===LAYOUT_KEY&&!draft){layout=load();applyLayout(layout)}
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
