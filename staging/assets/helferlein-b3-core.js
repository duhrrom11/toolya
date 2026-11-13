/* Helferlein B3 shared dashboard shell – isolated UI preferences, no tool database writes. */
(() => {
'use strict';
const config=window.HELFERLEIN_B3;
if(!config || !config.key || !Array.isArray(config.panels))return;
const THEME_KEY='helferlein_ui_theme_v1';
const LAYOUT_KEY='helferlein_ui_layout_'+config.key+'_v1';
const defaultLayout=()=>config.panels.map((p,i)=>({id:p.id,visible:true,size:p.size||'l',order:i}));
const read=k=>{try{return localStorage.getItem(k)}catch{return null}};
const write=(k,v)=>{try{localStorage.setItem(k,v);return true}catch{return false}};
const clone=x=>JSON.parse(JSON.stringify(x));
const validTheme=v=>['auto','light','dark'].includes(v)?v:'auto';
const media=window.matchMedia('(prefers-color-scheme:dark)');
let theme=validTheme(read(THEME_KEY));
function load(){
 try{
  const stored=JSON.parse(read(LAYOUT_KEY)||'null');
  if(!Array.isArray(stored))return defaultLayout();
  const byId=new Map(stored.map(p=>[p?.id,p]));
  return defaultLayout().map((d,i)=>{
    const s=byId.get(d.id)||{},spec=config.panels[i];
    return {id:d.id,visible:spec.locked?true:s.visible!==false,size:['s','m','l'].includes(s.size)?s.size:d.size,order:Number.isInteger(s.order)&&s.order>=0&&s.order<100?s.order:i};
  }).sort((a,b)=>a.order-b.order).map((p,i)=>({...p,order:i}));
 }catch{return defaultLayout()}
}
let layout=load(),draft=null;
const el=(tag,attrs={},content='')=>{
 const node=document.createElement(tag);
 for(const [k,v] of Object.entries(attrs))node.setAttribute(k,v);
 if(content)node.textContent=content;
 return node;
};
const btn=(label,fn,light=false)=>{
 const b=el('button',{type:'button',class:'b3-action'+(light?' b3-outline':'')},label);
 b.addEventListener('click',fn);return b;
};
function applyTheme(){
 const dark=theme==='dark'||(theme==='auto'&&media.matches);
 document.body.classList.toggle('b3-dark',dark);
 document.documentElement.style.colorScheme=dark?'dark':'light';
 document.querySelectorAll('[data-b3-theme]').forEach(e=>e.value=theme);
}
function paint(items){
 items.forEach((item,i)=>{
  const node=document.querySelector('[data-b3-panel="'+item.id+'"]');
  if(!node)return;
  const locked=!!config.panels.find(p=>p.id===item.id)?.locked;
  node.dataset.b3Hidden=String(!locked&&!item.visible);
  node.dataset.b3Size=item.size;
  node.style.setProperty('--b3-order',String(i));
 });
}
function closeEditor(host,restore=false){
 if(restore)paint(layout);
 draft=null;host.replaceChildren();host.hidden=true;
 const toggle=document.getElementById('b3-edit-open');if(toggle)toggle.disabled=false;
}
function editorRender(host){
 host.replaceChildren(el('h2',{},'Dashboard bearbeiten'));
 host.append(el('p',{class:'text-sm'},'Bereiche sortieren, ein-/ausblenden oder in S / M / L darstellen.'));
 const rows=el('div',{class:'b3-editor-list'});
 draft.forEach((entry,i)=>{
  const spec=config.panels.find(p=>p.id===entry.id);
  const row=el('div',{class:'b3-editor-row'});row.append(el('strong',{},spec.name));
  const move=(delta)=>{
    const j=i+delta;if(j<0||j>=draft.length)return;
    [draft[i],draft[j]]=[draft[j],draft[i]];draft.forEach((p,k)=>p.order=k);
    paint(draft);editorRender(host);
  };
  const up=btn('↑',()=>move(-1),true),down=btn('↓',()=>move(1),true);
  up.disabled=i===0;down.disabled=i===draft.length-1;
  up.setAttribute('aria-label',spec.name+' nach oben');
  down.setAttribute('aria-label',spec.name+' nach unten');row.append(up,down);
  const vis=el('label');const check=el('input',{type:'checkbox','aria-label':spec.name+' sichtbar'});
  check.checked=entry.visible;check.disabled=!!spec.locked;
  check.addEventListener('change',()=>{entry.visible=check.checked;paint(draft)});
  vis.append(check,document.createTextNode('Sichtbar'));row.append(vis);
  const select=el('select',{'aria-label':'Kartengröße '+spec.name});
  for(const size of ['s','m','l'])select.append(el('option',{value:size},size.toUpperCase()));
  select.value=entry.size;
  select.addEventListener('change',()=>{entry.size=select.value;paint(draft)});
  row.append(select);rows.append(row);
 });
 host.append(rows);
 const commands=el('div',{class:'flex flex-wrap gap-2'});
 commands.append(btn('Speichern',()=>{
  if(!write(LAYOUT_KEY,JSON.stringify(draft))){alert('Layout konnte nicht gespeichert werden.');return}
  layout=clone(draft);closeEditor(host);
 }),btn('Abbrechen',()=>closeEditor(host,true),true),btn('Standardlayout',()=>{
  draft=defaultLayout();paint(draft);editorRender(host);
 },true));
 host.append(commands);
}
function init(){
 const main=document.getElementById('main-content');
 const modal=document.getElementById('settingsModal');
 if(!main||!modal)return;
 document.body.classList.add('b3','b3-'+config.key);
 main.classList.add('b3-dashboard');
 applyTheme();
 for(const panel of config.panels)if(!main.querySelector('[data-b3-panel="'+panel.id+'"]')){console.warn('B3: missing panel '+panel.id);return}
 const shell=el('div',{class:'b3-shell'});
 const nav=el('nav',{class:'b3-nav','aria-label':config.name+' Navigation'});
 const navLinks=el('div',{class:'b3-nav-links'});
 for(const [icon,label,url] of config.navigation){
  navLinks.append(el('a',{href:url},icon+' '+label));
 }
 nav.append(navLinks);
 const more=el('details',{class:'b3-more'});
 more.append(el('summary',{},'☷ Weitere Tools'));
 const content=el('div',{class:'b3-more-content'});
 for(const action of config.extra){
  const b=btn(action.label,()=>{
   more.open=false;
   const fn=window[action.handler];
   if(typeof fn==='function')fn();
  },true);
  b.className='b3-more-item';
  content.append(b);
 }
 more.append(content);nav.append(more);
 main.parentElement.insertBefore(shell,main);
 shell.append(nav,main);
 const surface=modal.firstElementChild;
 const prefs=el('section',{class:'b3-preferences','aria-label':'Darstellung und Dashboard'});
 prefs.append(el('h4',{},'Darstellung & Dashboard'));
 const label=el('label',{},'Designmodus');
 const select=el('select',{'data-b3-theme':'true','aria-label':'Globaler Designmodus',class:'b3-theme-select'});
 [['auto','Automatisch'],['light','Hell'],['dark','Dunkel']].forEach(([id,text])=>select.append(el('option',{value:id},text)));
 select.value=theme;
 select.addEventListener('change',()=>{
  theme=validTheme(select.value);
  if(!write(THEME_KEY,theme))alert('Designmodus konnte nicht gespeichert werden');
  applyTheme();
 });
 label.append(select);prefs.append(label);
 const editor=el('section',{id:'b3-editor',class:'b3-editor','aria-label':'Dashboard bearbeiten'});
 editor.hidden=true;
 const edit=btn('✎ Dashboard bearbeiten',()=>{
  draft=clone(layout);editor.hidden=false;edit.disabled=true;editorRender(editor);paint(draft);
  if(typeof window.closeSettings==='function')window.closeSettings();
  else modal.classList.add('hidden');
  editor.scrollIntoView({block:'start',behavior:'smooth'});
 },true);
 edit.id='b3-edit-open';prefs.append(edit);
 if(config.helpId){
  prefs.append(btn('❔ Hilfe & Anleitung',()=>{
   const help=document.getElementById(config.helpId);
   if(help?.classList.contains('hidden')&&typeof window[config.helpToggle]==='function')window[config.helpToggle]();
   if(help?.closest('#settingsModal')){
     help?.scrollIntoView({block:'nearest',behavior:'smooth'});
   }else{
     if(typeof window.closeSettings==='function')window.closeSettings();
     else modal.classList.add('hidden');
     help?.scrollIntoView({block:'start',behavior:'smooth'});
   }
  },true));
 }
 if(surface)surface.append(prefs);
 const footer=el('div',{class:'b3-settings-footer'});
 footer.append(el('a',{href:'https://ko-fi.com/duhrrom',target:'_blank',rel:'noopener noreferrer',class:'b3-kofi-link'},'☕ Kaffee spendieren'));
 footer.append(el('a',{href:'../../index.html',class:'b3-home-link'},'↗ Entdecke mehr Helferlein'));
 if(surface)surface.append(footer);
 main.prepend(editor);paint(layout);
 media.addEventListener?.('change',applyTheme);
 window.addEventListener('storage',event=>{
  if(event.key===THEME_KEY){theme=validTheme(event.newValue);applyTheme()}
  if(event.key===LAYOUT_KEY&&!draft){layout=load();paint(layout)}
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
