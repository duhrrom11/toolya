/* B3 Toolya homepage UI: category filters and global theme only.
   Never writes, queries or changes tool data, Supabase data, authentication or backups. */
(()=>{
'use strict';
const english=document.documentElement.lang==='en';
function applyTheme(){
 document.body.classList.remove('b3-dark');
 document.documentElement.style.colorScheme='light';
}
function refreshCount(){
 const cards=[...document.querySelectorAll('#toolsGrid .tool-card')];
 const visible=cards.filter(c=>c.style.display!=='none').length;
 const counter=document.getElementById('b3-result-count');
 if(counter)counter.textContent=visible+(english?' of ':' von ')+cards.length+(english?' tools':' Tools');
}
function init(){
 document.body.classList.add('b3-home');
 const filters=[...document.querySelectorAll('[data-b3-category-filter]')];
 filters.forEach(btn=>btn.addEventListener('click',()=>{
  filters.forEach(other=>other.setAttribute('aria-pressed',String(other===btn)));
  if(typeof window.filterTools==='function')window.filterTools();
  refreshCount();
 }));
 const categoryList=document.querySelector('.b3-categories');
 if(categoryList)categoryList.setAttribute('aria-label',(english?'Tool categories':'Tool-Kategorien'));
 const search=document.getElementById('toolSearch');
 search?.addEventListener('input',()=>{window.filterTools?.();refreshCount();});
 const allFilter=filters.find(btn=>btn.getAttribute('data-b3-category-filter')==='alle');
 const reset=()=>{
  if(search)search.value='';
  if(allFilter)filters.forEach(btn=>btn.setAttribute('aria-pressed',String(btn===allFilter)));
  window.filterTools?.();refreshCount();
 };
 const empty=document.getElementById('searchEmptyState');
 if(empty&&!document.getElementById('b3-reset-filters')){
  const resetButton=document.createElement('button');
  resetButton.type='button';resetButton.id='b3-reset-filters';
  resetButton.textContent=(english?'Clear filters':'Filter zurücksetzen');
  resetButton.className='b3-reset-filters';
  resetButton.addEventListener('click',reset);
  empty.appendChild(document.createTextNode(' '));empty.appendChild(resetButton);
 }
 if(allFilter)allFilter.textContent=(english?'All ':'Alle ')+document.querySelectorAll('#toolsGrid .tool-card').length;
 if(empty)empty.setAttribute('aria-live','polite');
 applyTheme();
 if(typeof window.filterTools==='function')window.filterTools();
 refreshCount();


}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
