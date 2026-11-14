/* B3 Toolya homepage UI: category filters and global theme only.
   Never writes, queries or changes tool data, Supabase data, authentication or backups. */
(()=>{
'use strict';
const THEME_KEY='helferlein_ui_theme_v1';
const allowed=['auto','light','dark'];
const prefersDark=window.matchMedia('(prefers-color-scheme: dark)');
const getTheme=()=>{try{const stored=localStorage.getItem(THEME_KEY);return allowed.includes(stored)?stored:'auto'}catch{return 'auto'}};
let theme=getTheme();
function applyTheme(){
 const dark=theme==='dark'||(theme==='auto'&&prefersDark.matches);
 document.body.classList.toggle('b3-dark',dark);
 document.documentElement.style.colorScheme=dark?'dark':'light';
 const selector=document.getElementById('b3-hub-theme');
 if(selector)selector.value=theme;
}
function refreshCount(){
 const cards=[...document.querySelectorAll('#toolsGrid .tool-card')];
 const visible=cards.filter(c=>c.style.display!=='none').length;
 const counter=document.getElementById('b3-result-count');
 if(counter)counter.textContent=visible+' von '+cards.length+' Tools';
}
function init(){
 document.body.classList.add('b3-home');
 const picker=document.getElementById('b3-hub-theme');
 if(picker){
  picker.value=theme;
  picker.addEventListener('change',()=>{
   theme=allowed.includes(picker.value)?picker.value:'auto';
   try{localStorage.setItem(THEME_KEY,theme)}catch{console.warn('Designmodus konnte nicht gespeichert werden.')}
   applyTheme();
  });
 }
 const filters=[...document.querySelectorAll('[data-b3-category-filter]')];
 filters.forEach(btn=>btn.addEventListener('click',()=>{
  filters.forEach(other=>other.setAttribute('aria-pressed',String(other===btn)));
  if(typeof window.filterTools==='function')window.filterTools();
  refreshCount();
 }));
 const categoryList=document.querySelector('.b3-categories');
 if(categoryList)categoryList.setAttribute('aria-label','Tool-Kategorien');
 const allFilter=filters.find(btn=>btn.getAttribute('data-b3-category-filter')==='alle');
 const reset=()=>{
  if(allFilter)filters.forEach(btn=>btn.setAttribute('aria-pressed',String(btn===allFilter)));
  window.filterTools?.();refreshCount();
 };
 const empty=document.getElementById('searchEmptyState');
 if(empty&&!document.getElementById('b3-reset-filters')){
  const resetButton=document.createElement('button');
  resetButton.type='button';resetButton.id='b3-reset-filters';
  resetButton.textContent='Alle Kategorien anzeigen';
  resetButton.className='b3-reset-filters';
  resetButton.addEventListener('click',reset);
  empty.appendChild(document.createTextNode(' '));empty.appendChild(resetButton);
 }
 if(allFilter)allFilter.textContent='Alle '+document.querySelectorAll('#toolsGrid .tool-card').length;
 if(empty)empty.setAttribute('aria-live','polite');
 applyTheme();
 if(typeof window.filterTools==='function')window.filterTools();
 refreshCount();
 prefersDark.addEventListener?.('change',applyTheme);
 window.addEventListener('storage',event=>{
  if(event.key===THEME_KEY){theme=allowed.includes(event.newValue)?event.newValue:'auto';applyTheme()}
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
