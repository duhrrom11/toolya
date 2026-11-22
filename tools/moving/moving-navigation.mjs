// Guided Toolya Moving navigation. Presentation only: does not modify inventory,
// cloud revisions, transport state, helper grants or permissions.
const main=document.getElementById('main-content');
const nav=document.getElementById('mv-journey');
const key='toolya-moving-navigation-v1';
const validModes=new Set(['moving','inventory']);
const validPhases=new Set(['preparation','transport','arrival']);
const text=(de,en)=>window.__toolyaUILocale==='en'?en:de;
const descriptions={
 preparation:{
  title:['Vorbereitung','Preparation'],
  description:['Umzug planen, Zielräume festlegen, Kisten erfassen und QR-Etiketten vorbereiten.','Plan the move, set up destination rooms, add boxes and prepare QR labels.']
 },
 transport:{
  title:['Umzugstag','Moving day'],
  description:['Helfer einladen, Kisten verladen, Ankunft dokumentieren und Vorfälle melden.','Invite helpers, load boxes, record arrivals and report problems.']
 },
 arrival:{
  title:['Einzug','Moving in'],
  description:['Angekommene Kisten auspacken, die ersten 72 Stunden planen und den Umzug abschließen.','Unpack boxes, plan the first 72 hours and finish the move.']
 }
};
let mode='inventory',phase='preparation',initialized=false;
function project(){
 try{return window.getData?.()?.moving?.projects?.some(p=>p.status==='active')===true;}
 catch{return false;}
}
function stored(){
 try{const x=JSON.parse(localStorage.getItem(key)||'null');return x&&typeof x==='object'?x:null;}
 catch{return null;}
}
function remember(){
 try{localStorage.setItem(key,JSON.stringify({mode,phase}));}catch{}
}
function setMode(next,options={}){
 if(!validModes.has(next))return false;
 mode=next;
 if(validPhases.has(options.phase))phase=options.phase;
 remember();render(options.focus||'');return true;
}
function render(focus='', notify=true){
 if(!nav||!main)return;
 const active=project();
 main.dataset.mvMode=mode;
 main.dataset.mvPhase=phase;
 main.dataset.mvProject=active?'active':'none';
 nav.hidden=false;
 nav.setAttribute('aria-label',text('Umzugskisten: Bereich und Umzugsphase wählen','Moving boxes: choose a section or phase'));
 const moving=mode==='moving';
 const phases=Object.entries(descriptions);
 const phaseNumber=phases.findIndex(([id])=>id===phase)+1;
 const qrButton=`<button type="button" data-mv-action="qr-labels">🖨️ ${text('QR-Etiketten drucken','Print QR labels')}</button>`;
 nav.innerHTML=`<div class="mv-journey-top"><div>
  <p class="mv-journey-eyebrow">${text('Toolya Umzugskisten','Toolya Moving Boxes')}</p>
  <h2>${text('Was möchtest du heute machen?','What would you like to do today?')}</h2>
  <p>${text('Wähle deinen Umzug oder verwalte dein Inventar unabhängig davon.','Plan your move or manage your inventory separately.')}</p>
 </div></div>
 <div class="mv-mode-choice" role="group" aria-label="${text('Bereich auswählen','Choose a section')}">
  <button type="button" data-mv-mode="moving" aria-pressed="${moving}" class="mv-mode-card"><span aria-hidden="true">🚚</span><span><strong>${text('Mein Umzug','My move')}</strong><small>${text('Planen, packen, transportieren und einziehen','Plan, pack, transport and move in')}</small></span></button>
  <button type="button" data-mv-mode="inventory" aria-pressed="${!moving}" class="mv-mode-card"><span aria-hidden="true">🗄️</span><span><strong>${text('Mein Inventar','My inventory')}</strong><small>${text('Standorte, Kisten, Gegenstände und Suche','Locations, boxes, items and search')}</small></span></button>
 </div>
 ${moving?`<div class="mv-phase-header"><h3>${text('Dein Umzug in drei Phasen','Your move in three phases')}</h3><p>${text('Du kannst jederzeit zwischen den Schritten wechseln.','You can switch between phases at any time.')}</p></div>
  <div class="mv-phase-steps" role="group" aria-label="${text('Umzugsphase','Moving phase')}">
   ${phases.map(([id,entry],index)=>`<button type="button" data-mv-phase="${id}" aria-current="${id===phase?'step':'false'}" class="mv-phase-step"><span class="mv-phase-number">${index+1}</span><span>${text(...entry.title)}</span></button>`).join('')}
  </div>
  <div class="mv-phase-intro" role="status"><strong>${phaseNumber}. ${text(...descriptions[phase].title)}</strong><p>${text(...descriptions[phase].description)}</p></div>
  ${active?'':`<p class="mv-phase-notice">${text('Lege zuerst einen Umzug an. Dein Inventar kannst du weiterhin unabhängig davon verwalten.','Create a move to get started. You can still manage your inventory separately.')}</p>`}
  <div class="mv-phase-tools">${phase==='preparation'
   ?`<button type="button" data-mv-action="inventory-create">📦 ${text('Kisten im Inventar erfassen','Add boxes to inventory')}</button>${qrButton}`
   :`${phase==='transport'?qrButton:''}<button type="button" data-mv-action="inventory-search">🔎 ${phase==='transport'?text('Kiste im Inventar finden','Find a box in inventory'):text('Inventar durchsuchen','Search inventory')}</button>`
  }</div>`
 :`<div class="mv-inventory-intro"><strong>${text('Dein Inventar','Your inventory')}</strong><p>${text('Standorte und Kisten erfassen, Gegenstände finden und Werte ansehen. Dafür ist kein Umzug erforderlich.','Add locations and boxes, find items and check their value. You can do this without creating a move.')}</p></div>`}`;
 if(notify)document.dispatchEvent(new CustomEvent('toolya:moving-navigation',{detail:{mode,phase,activeProject:active}}));
 if(focus){
   requestAnimationFrame(()=>{
     const target=focus==='create'?document.getElementById('b3-create'):focus==='search'?document.getElementById('b3-inventory'):focus==='stats'?document.getElementById('b3-stats'):null;
     if(target){target.scrollIntoView({behavior:'smooth',block:'start'});target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}
   });
 }
}
function initialize(){
 // Keep legacy element IDs and handlers intact; only move their containers.
 const sections=['b3-create','b3-inventory','b3-stats','b3-values'].map(id=>document.getElementById(id));
 if(sections.every(Boolean))main.append(...sections);
 if(initialized||!window.movingCloudReady||typeof window.getData!=='function')return;
 initialized=true;
 const last=stored();
 mode=validModes.has(last?.mode)?last.mode:(project()?'moving':'inventory');
 phase=validPhases.has(last?.phase)?last.phase:'preparation';
 render();
}
nav?.addEventListener('click',event=>{
 const button=event.target.closest('button');
 if(!button||!nav.contains(button))return;
 if(button.dataset.mvMode){setMode(button.dataset.mvMode);return;}
 if(button.dataset.mvPhase){setMode('moving',{phase:button.dataset.mvPhase});return;}
 if(button.dataset.mvAction==='inventory-create'){setMode('inventory',{focus:'create'});return;}
 if(button.dataset.mvAction==='inventory-search'){setMode('inventory',{focus:'search'});return;}
 if(button.dataset.mvAction==='qr-labels'){
   if(typeof window.exportQrLabelsPDF==='function')window.exportQrLabelsPDF();
   else window.alert(text('Der QR-Etiketten-Export ist gerade nicht verfügbar.','QR label export is currently unavailable.'));
 }
});
// Existing B3 shortcuts also work when their target panel is in the other mode.
document.addEventListener('click',event=>{
 const a=event.target.closest?.('a[href]');
 if(!a||!main)return;
 let url;try{url=new URL(a.href,location.href);}catch{return;}
 if(url.origin!==location.origin||url.pathname!==location.pathname)return;
 const focus={'#b3-create':'create','#b3-inventory':'search','#b3-stats':'stats','#b3-values':'stats'}[url.hash];
 if(!focus)return;
 event.preventDefault();
 setMode('inventory',{focus});
},true);
document.addEventListener('toolya:moving-ready',()=>{initialize();if(initialized)render();});
document.addEventListener('toolya:moving-saved',()=>{if(initialized)render();});
document.addEventListener('toolya:locale-change',()=>{if(initialized)render('',false);});
window.ToolyaMovingNavigation={open:setMode,get state(){return {mode,phase};}};
initialize();
