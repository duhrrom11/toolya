(function(){
 'use strict';
 const pref='helferlein_ui_theme_v1',media=matchMedia('(prefers-color-scheme:dark)');
 let choice='auto';try{choice=localStorage.getItem(pref)||'auto';}catch{}
 function apply(){document.documentElement.dataset.theme=choice==='dark'||(choice==='auto'&&media.matches)?'dark':'light';}
 apply();media.addEventListener('change',apply);
 document.addEventListener('DOMContentLoaded',()=>{const select=document.getElementById('estate-theme');if(!select)return;select.value=choice;select.addEventListener('change',()=>{choice=select.value;try{localStorage.setItem(pref,choice);}catch{}apply();});});
})();
