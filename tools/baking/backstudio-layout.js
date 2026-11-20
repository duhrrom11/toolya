/* Toolya Backstudio — Backatelier layout. Preserve existing calculation, data and user settings. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const make=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};
function button(text,cls,action){const node=make('button',cls,text);node.type='button';node.addEventListener('click',action);return node}
const cleanNumber=(id,fallback)=>{const value=Number($(id)?.value);return Number.isFinite(value)&&value>0?value:fallback};
const atlas='../../assets/toolya/outfits.webp?v=20261115-alpha';
const navItems=[
 ['core','♧','Umrechner'],
 ['finder','⚖','Formenvergleich'],
 ['import','▧','Rezept importieren'],
 ['cake','♧','Tortenplaner'],
 ['memory','▤','Backgedächtnis'],
 ['shopping','🛒','Einkaufsliste']
];
function init(){
 const tab=$('tab-rechner'),studio=$('toolya-backstudio'),results=$('b3-baking-results');
 if(!tab||!studio||!results||$('bsui-app'))return;
 const studioGrid=studio.querySelector(':scope > .bs-grid');
 if(!studioGrid)return;
 const originalCards=[...tab.children].filter(n=>n.classList.contains('bg-white')&&n.querySelector('h2'));
 const shapeCard=originalCards.find(n=>n.querySelector('#orig-shape'));
 const recipeCard=originalCards.find(n=>n.querySelector('#recipe-input'));
 const conditionsCard=originalCards.find(n=>n.querySelector('#base-time'));
 if(!shapeCard||!recipeCard||!conditionsCard)return;
 const articles=[...studioGrid.children].filter(n=>n.tagName==='ARTICLE');
 const pick=id=>articles.find(n=>n.querySelector('#'+id));
 const ingredients=pick('bs-scaled'),fill=pick('bs-fillbar'),garage=pick('bs-garage-items');
 const special=pick('bs-special'),photo=pick('bs-photo'),layers=pick('bs-layers');
 const memory=pick('bs-logs'),shopping=pick('bs-shopping-items'),exportCard=pick('bs-shopping-export');
 const pantry=pick('bs-pantry'),calendar=pick('bs-serving'),wish=pick('bs-height');
 if(![ingredients,fill,garage,photo,layers,memory,shopping].every(Boolean))return;
 document.body.classList.add('bsui-redesign');
 const title=document.querySelector('.b3-tool-title h1');if(title)title.textContent='Backstudio';
 const sub=document.querySelector('.b3-tool-title p');if(sub)sub.textContent='Dein Backatelier für Rezepte, Formen und perfekte Kuchen';
 // Preserve the original main tab as the single source of truth for all existing event handlers.
 const shell=make('div');shell.id='bsui-app';tab.append(shell);
 const side=make('aside','bsui-side');side.setAttribute('aria-label','Backstudio-Navigation');shell.append(side);
 const sideTitle=make('div','bsui-side-title');sideTitle.innerHTML='<span aria-hidden="true">🍰</span><span>Backstudio</span>';side.append(sideTitle);
 const sideNav=make('nav','bsui-side-nav');sideNav.setAttribute('aria-label','Backstudio-Bereiche');side.append(sideNav);
 const mascots=make('div','bsui-side-art');const baker=make('span','bsui-sprite bsui-baker');baker.setAttribute('role','img');baker.setAttribute('aria-label','Türkiser Toolya-Bäcker im Back-Outfit');mascots.append(baker);side.append(mascots);
 // Outfit atlas role 11: turquoise at cell 22, purple at cell 23.
 baker.style.backgroundImage='url("'+atlas+'")';
 const content=make('div','bsui-content');shell.append(content);
 const stepper=make('nav','bsui-stepper');stepper.setAttribute('aria-label','Vier Schritte zum Backergebnis');content.append(stepper);
 const header=make('div','bsui-headerline');header.innerHTML='<div><p class="bsui-section-eyebrow">Dein Backatelier</p><h2 class="bsui-title">Backform-Umrechner</h2><p class="bsui-subtitle">Rezept anpassen, passende Formen entdecken und entspannt backen.</p></div>';content.append(header);
 const core=make('section','bsui-core');core.id='bsui-core';content.append(core);
 const grid=make('div','bsui-grid');core.append(grid);
 const left=make('div','bsui-left'),right=make('div','bsui-right');grid.append(left,right);
 const source=make('section','bsui-paper bsui-forms');source.id='bsui-source';left.append(source);
 source.append(shapeCard);shapeCard.classList.add('bsui-moved-card');
 // Preserve additional source controls without turning the home view into a long form.
 if(wish){const details=make('details','bsui-recipe-details');details.innerHTML='<summary>Wunschhöhe und Originalhöhe einstellen</summary>';details.append(wish);left.append(details)}
 const ingredientsWrap=make('section','bsui-paper bsui-ingredients');ingredientsWrap.id='bsui-ingredients';left.append(ingredientsWrap);
 ingredientsWrap.append(ingredients);
 const empty=make('p','bsui-empty','Gib oben ein Rezept ein oder importiere ein Rezeptfoto. Die angepassten Zutaten erscheinen dann hier.');
 empty.id='bsui-ingredients-empty';ingredientsWrap.append(empty);
 const recipeDetails=make('details','bsui-recipe-details');recipeDetails.id='bsui-recipe-details';recipeDetails.innerHTML='<summary>✎ Rezept und Zutaten eingeben oder bearbeiten</summary>';recipeDetails.append(recipeCard);left.append(recipeDetails);
 recipeDetails.open=!$('recipe-input')?.value.trim();
 const conditionsDetails=make('details','bsui-recipe-details');conditionsDetails.innerHTML='<summary>♨ Backtemperatur, Ofen und Backbedingungen</summary>';conditionsDetails.append(conditionsCard);left.append(conditionsDetails);
 const stage=make('section','bsui-paper bsui-stage');stage.id='bsui-stage';right.append(stage);
 const stageTop=make('div','bsui-stage-top');stageTop.innerHTML='<strong>3D-Backformen-Vorschau</strong><span class="bsui-stage-tag">360° · Interaktiv</span>';stage.append(stageTop);
 const screen=make('div','bsui-stage-screen');stage.append(screen);
 const fallback=make('div','bsui-stage-pan');fallback.innerHTML='<img src="./backstudio-pan.svg" alt="Illustrierte Springform mit Kuchenteig als Fallback für die drehbare 3D-Ansicht" loading="eager">';screen.append(fallback);
 const webgl=make('div','bsui-webgl');webgl.id='bsui-webgl';screen.append(webgl);
 const dims=make('div','bsui-stage-dims');dims.id='bsui-stage-dims';screen.append(dims);
 const heroStatus=make('div','bsui-hero-status');heroStatus.innerHTML='<span id="bsui-hero-description">Form und Rezept lassen sich links verändern.</span><strong id="bsui-hero-factor">Mengen werden angepasst</strong>';stage.append(heroStatus);
 const threePanel=[...fill.querySelectorAll('.bsp-panel')].find(n=>n.querySelector('#bsp-3d'));
 if(threePanel)webgl.append(threePanel);
 const recomm=make('section','bsui-paper bsui-finder');recomm.id='bsui-recommendations';right.append(recomm);
 recomm.innerHTML='<p class="bsui-section-eyebrow">Clever vergleichen</p><h2>Passende Backformen</h2><p class="bsui-subtitle">Empfehlungen aus deinen gespeicherten Formen.</p>';
 const smartPanel=[...garage.querySelectorAll('.bsp-panel')].find(n=>n.querySelector('#bsp-compare-results'));
 const suggested=make('div','bsui-standard-recos');suggested.id='bsui-standard-recos';recomm.append(suggested);
 const customDetails=make('details','bsui-recommend-detail');customDetails.innerHTML='<summary>Meine gespeicherten Backformen vergleichen</summary>';recomm.append(customDetails);
 if(smartPanel)customDetails.append(smartPanel);
 recomm.append(button('Eigene Formen verwalten','bsui-return',()=>showView('finder')));
 const metrics=make('section','bsui-paper bsui-metrics');metrics.id='bsui-metrics';right.append(metrics);
 metrics.innerHTML='<p class="bsui-section-eyebrow">Dein Ergebnis</p>';
 metrics.append(results);
 const quickwrap=make('div','bsui-quickwrap');core.append(quickwrap);
 const quick=make('nav','bsui-quicknav');quick.setAttribute('aria-label','Backstudio-Schnellzugriff');quickwrap.append(quick);
 const extras=make('details','bsui-additional');extras.innerHTML='<summary>Weitere Backhelfer: Füllstand, Restteig, Vorräte, Backzeit und mehr</summary>';core.append(extras);
 extras.append(studio);
 // Existing bonus cards that are not rehomed are kept in the existing Backstudio grid.
 const supplemental=[...tab.children].filter(n=>n!==shell&&n!==studio&&n!==shapeCard&&n!==recipeCard&&n!==conditionsCard);
 for(const node of supplemental){if(node.classList.contains('b3-subview-link')||node.classList.contains('b3-workflow-intro')){node.remove();continue}studioGrid.append(node)}
 const views={};
 const createToolView=(key,title)=>{
  const view=make('section','bsui-tool-view');view.hidden=true;view.dataset.view=key;
  const head=make('div','bsui-tool-head');head.append(make('h2','',title));
  head.append(button('← Zurück zum Umrechner','bsui-return',()=>showView('core')));view.append(head);
  const contents=make('div','bsui-tool-contents');view.append(contents);content.append(view);
  views[key]={view,contents};return contents;
 };
 const finderView=createToolView('finder','Deine Formen und Empfehlungen');
 finderView.append(garage);if(special)finderView.append(special);
 const importerView=createToolView('import','Rezept per Text oder Foto importieren');importerView.append(photo);
 const cakeView=createToolView('cake','Torten und Schichten planen');cakeView.append(layers);if(calendar)cakeView.append(calendar);
 const memoryView=createToolView('memory','Dein persönliches Backgedächtnis');memoryView.append(memory);
 const shoppingView=createToolView('shopping','Deine Backstudio-Einkaufsliste');shoppingView.append(shopping);if(pantry)shoppingView.append(pantry);if(exportCard)shoppingView.append(exportCard);
 const navButtons=new Map();
 let currentView='core';
 function showView(name){
  const mode=views[name]?name:'core';
  currentView=mode;
  core.hidden=mode!=='core';
  for(const [key,{view}] of Object.entries(views))view.hidden=key!==mode;
  if(smartPanel)(mode==='finder'?finderView:customDetails).append(smartPanel);
  navButtons.forEach((node,key)=>{if(key===mode)node.setAttribute('aria-current','page');else node.removeAttribute('aria-current')});
  for(const b of stepper.querySelectorAll('button')){if(mode==='core'&&b.dataset.step==='1')b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')}
  if(mode==='core')sync();
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  shell.scrollIntoView?.({behavior:reduced?'instant':'smooth',block:'start'});
 }
 for(const [key,icon,label] of navItems){
  const b=button('', 'bsui-nav',()=>showView(key));
  b.innerHTML='<span class="bsui-nav-symbol" aria-hidden="true">'+icon+'</span><span></span>';
  b.lastElementChild.textContent=label;
  b.dataset.view=key;navButtons.set(key,b);sideNav.append(b);
 }
 const steps=[
  ['1','Rezept & Form','bsui-source','core'],
  ['2','Umrechnen','bsui-ingredients','core'],
  ['3','Ergebnis','bsui-stage','core'],
  ['4','Einkaufen & Speichern',null,'shopping']
 ];
 function jumpStep(num,target,view){
  showView(view);
  for(const b of stepper.querySelectorAll('button')){if(b.dataset.step===num)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')}
  if(target){const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;$(target)?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'})}
 }
 for(const [num,label,target,view] of steps){
  const b=button('', 'bsui-step',()=>jumpStep(num,target,view));b.dataset.step=num;
  const number=make('span','bsui-step-number',num),words=make('span','',label);b.append(number,words);stepper.append(b)
 }
 const shortcuts=[
  ['import','▧','Rezept-Foto','Foto auslesen und Zutaten prüfen'],
  ['cake','♧','Tortenplaner','Böden, Füllung und Creme'],
  ['memory','▤','Backgedächtnis','Erfahrungen und Favoriten'],
  ['shopping','🛒','Einkaufsliste','Separat von der WG']
 ];
 for(const [key,icon,label,description] of shortcuts){
  const b=button('','bsui-quick',()=>showView(key));
  const symbol=make('span','bsui-quick-symbol',icon),body=make('span');
  body.append(make('strong','',label),make('small','',description));b.append(symbol,body);quick.append(b)
 }
// Baker and baker-girl use their corresponding Toolya outfit-atlas cells.
 const girlWrap=make('div','bsui-girl-side');girlWrap.setAttribute('aria-hidden','true');
 const girl=make('span','bsui-sprite bsui-baker-girl');girl.style.backgroundImage='url("'+atlas+'")';girlWrap.append(girl);
 recomm.append(girlWrap);
 function renderStandardRecommendations(){
  suggested.replaceChildren();
  const mode=$('combinator-mode')?.value;
  if(mode==='double'){suggested.append(make('p','bsui-empty','Du verwendest zwei Zielformen. Speichere deine Formen, um weitere Kombinationen zu vergleichen.'));return}
  const shape=$('target-shape')?.value,area=shape==='rect'?cleanNumber('target-l',25)*cleanNumber('target-w',11):Math.PI*Math.pow(cleanNumber('target-d',20)/2,2);
  const d=Math.max(8,Math.round(Math.sqrt(4*area/Math.PI)));
  const options=[d,Math.max(8,d-2),d+2].filter((x,i,a)=>a.indexOf(x)===i);
  for(const [i,diameter] of options.entries()){
   const row=button('','bsui-match-option',()=>{
    $('combinator-mode').value='single';window.toggleCombinator?.();$('target-shape').value='round';
    window.updateShapeInputs?.('target');$('target-d').value=diameter;window.calculateAll?.();
    $('target-d').dispatchEvent(new Event('input',{bubbles:true}));
   });
   const ratio=area/(Math.PI*Math.pow(diameter/2,2));
   const optionLabel=make('strong','', '◉ Rund Ø '+diameter+' cm');
   const info=make('span','',i===0?'Nächstliegende Standardgröße':'Teigfüllung relativ zur aktuellen Form: '+Math.round(ratio*100)+' %');
   if(i===0)info.className='bsui-option-best';
   row.append(optionLabel,info);suggested.append(row);
  }
 }
 function sync(){
  renderStandardRecommendations();
  const shape=$('target-shape')?.value||'round',double=$('combinator-mode')?.value==='double';
  const target=double?'2 Formen Ø '+cleanNumber('combo-d1',20)+' / '+cleanNumber('combo-d2',16)+' cm':
   shape==='rect'?'Rechteck '+cleanNumber('target-l',25)+' × '+cleanNumber('target-w',11)+' cm':
   shape==='bundt'?'Gugelhupf Ø '+cleanNumber('target-d',20)+' cm':'Rund Ø '+cleanNumber('target-d',20)+' cm';
  dims.textContent=target;
  const factor=$('res-factor')?.textContent||'';
  $('bsui-hero-factor').textContent='Umrechnungsfaktor: '+factor;
  const fillStatus=$('bs-filltext')?.textContent||'';
  $('bsui-hero-description').textContent=fillStatus.length>120?fillStatus.slice(0,117)+'…':fillStatus||'Backform und Füllhöhe prüfen.';
  const count=ingredients.querySelector('#bs-scaled')?.children.length||0;
  empty.hidden=count>0;
 }
 let rafPending=false;
 const requestSync=()=>{if(rafPending)return;rafPending=true;requestAnimationFrame(()=>{rafPending=false;sync()})};
 ['target-shape','target-d','target-l','target-w','combinator-mode','combo-d1','combo-d2','orig-d','orig-l','orig-w','bs-volume','bs-form-height','bs-height','recipe-input','base-time'].forEach(id=>{
  $(id)?.addEventListener('input',requestSync);$(id)?.addEventListener('change',requestSync)
 });
 const scaled=$('bs-scaled');if(scaled)new MutationObserver(requestSync).observe(scaled,{childList:true});
 const webglBox=$('bsp-3d');if(webglBox)new MutationObserver(()=>{
  stage.classList.toggle('bsui-webgl-ready',!!webglBox.querySelector('canvas'));
 }).observe(webglBox,{childList:true});
 // Allow users to opt into WebGL; an accessible image fallback is visible without network.
 const orig3dOpen=[...webgl.querySelectorAll('button')].find(n=>/3D öffnen/.test(n.textContent||''));
 if(orig3dOpen){
  orig3dOpen.textContent='↻ 3D-Modell aktivieren';
  // Start the interactive view when it first enters the viewport; data-saver users can launch it manually.
  if('IntersectionObserver' in window&&!window.navigator?.connection?.saveData){
   const observer=new IntersectionObserver(entries=>{
    if(!entries.some(e=>e.isIntersecting))return;
    observer.disconnect();orig3dOpen.click();
   },{rootMargin:'0px 0px 180px 0px'});
   observer.observe(stage);
  }
 }
 // Pro UI uses 260px fixed camera; the redesigned stage uses 385px (patched in pro script).
 // Keep existing message observable for accessibility while showing a concise status at the top.
 const existingMessage=$('bs-message');if(existingMessage){existingMessage.setAttribute('aria-live','polite');existingMessage.classList.add('bsui-site-message');header.after(existingMessage)}
 if($('recipe-input')?.value.trim())recipeDetails.open=false;
 sync();showView('core');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();