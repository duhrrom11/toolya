// Guided Toolya Moving navigation. Presentation only: does not modify inventory,
// cloud revisions, transport state, helper grants or permissions.
const main=document.getElementById('main-content');
const nav=document.getElementById('mv-journey');
const key='toolya-moving-navigation-v1';
const validModes=new Set(['moving','inventory']);
const validPhases=new Set(['preparation','transport','arrival']);
const descriptions={
 preparation:{title:'1. Vorbereitung',description:'Umzug planen, Zielräume festlegen, Kisten erfassen und QR-Etiketten vorbereiten.'},
 transport:{title:'2. Umzugstag',description:'Helfer einladen, Kisten verladen, Ankunft dokumentieren und Vorfälle melden.'},
 arrival:{title:'3. Einzug',description:'Angekommene Kisten auspacken, die ersten 72 Stunden planen und den Umzug abschließen.'}
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
function phaseName(){return descriptions[phase]?.title||descriptions.preparation.title;}
function render(focus=''){
 if(!nav||!main)return;
 const active=project();
 main.dataset.mvMode=mode;
 main.dataset.mvPhase=phase;
 main.dataset.mvProject=active?'active':'none';
 nav.hidden=false;
 const moving=mode==='moving';
 nav.innerHTML='<div class="mv-journey-top"><div><p class="mv-journey-eyebrow">Toolya Umzugskisten</p><h2>Was möchtest du heute machen?</h2><p>Wähle deinen Umzug oder verwalte dein Inventar unabhängig davon.</p></div></div>'
 +'<div class="mv-mode-choice" role="group" aria-label="Bereich auswählen">'
 +'<button type="button" data-mv-mode="moving" aria-pressed="'+moving+'" class="mv-mode-card"><span aria-hidden="true">🚚</span><span><strong>Mein Umzug</strong><small>Planen, packen, transportieren und einziehen</small></span></button>'
 +'<button type="button" data-mv-mode="inventory" aria-pressed="'+(!moving)+'" class="mv-mode-card"><span aria-hidden="true">🗄️</span><span><strong>Mein Inventar</strong><small>Standorte, Kisten, Gegenstände und Suche</small></span></button>'
 +'</div>'
 +(moving?'<div class="mv-phase-header"><h3>Dein Umzug in drei Phasen</h3><p>Du kannst jederzeit zwischen den Schritten wechseln.</p></div>'
 +'<div class="mv-phase-steps" role="group" aria-label="Umzugsphase">'
 +Object.entries(descriptions).map(([id,d],i)=>'<button type="button" data-mv-phase="'+id+'" aria-current="'+(id===phase?'step':'false')+'" class="mv-phase-step"><span class="mv-phase-number">'+(i+1)+'</span><span>'+d.title.slice(3)+'</span></button>').join('')
 +'</div>'
 +'<div class="mv-phase-intro" role="status"><strong>'+phaseName()+'</strong><p>'+descriptions[phase].description+'</p></div>'
 +(!active?'<p class="mv-phase-notice">Beginne mit „Neuen Umzug planen“. Du kannst dein Inventar weiterhin unabhängig verwalten.</p>':'')
 +'<div class="mv-phase-tools">'+(phase==='preparation'
  ?'<button type="button" data-mv-action="inventory-create">📦 Kisten im Inventar erfassen</button><button type="button" data-mv-action="qr-labels">🖨️ QR-Etiketten drucken</button>'
  :phase==='transport'
  ?'<button type="button" data-mv-action="qr-labels">🖨️ QR-Etiketten drucken</button><button type="button" data-mv-action="inventory-search">🔎 Kiste im Inventar finden</button>'
  :'<button type="button" data-mv-action="inventory-search">🔎 Inventar durchsuchen</button>')+'</div>'
 :'<div class="mv-inventory-intro"><strong>Dein Inventar</strong><p>Standorte und Kisten erfassen, Gegenstände finden und Werte ansehen. Dafür ist kein Umzug erforderlich.</p></div>');
 document.dispatchEvent(new CustomEvent('toolya:moving-navigation',{detail:{mode,phase,activeProject:active}}));
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
   else window.alert('Der QR-Etiketten-Export ist gerade nicht verfügbar.');
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
window.ToolyaMovingNavigation={open:setMode,get state(){return {mode,phase};}};
initialize();
