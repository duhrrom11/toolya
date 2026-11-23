/* Toolya Backstudio — Backatelier layout. Preserve existing calculation, data and user settings. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const text=(de,en)=>window.__toolyaUILocale==='en'?en:de;
const make=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};
function button(text,cls,action){const node=make('button',cls,text);node.type='button';node.addEventListener('click',action);return node}
const cleanNumber=(id,fallback)=>{const value=Number($(id)?.value);return Number.isFinite(value)&&value>0?value:fallback};
const atlas='../../assets/toolya/outfits.webp?v=20261115-alpha';

// Only the redesigned shell's fixed copy is localized. Never traverse recipe,
// shopping, pantry, notes or other user-controlled Backstudio content.
const shellCopy=new Map([
 ['Die passende Backform. Ganz einfach.','The right baking pan. Made simple.'],
 ['Backstudio-Navigation','Backstudio navigation'],
 ['Backstudio-Bereiche','Backstudio sections'],
 ['Türkiser Toolya-Bäcker im Back-Outfit','Turquoise Toolya baker in baking outfit'],
 ['Vier Schritte zum Backergebnis','Four steps to your baking result'],
 ['Einfach backen','Baking made easy'],
 ['Welche Backform brauchst du?','Which baking pan do you need?'],
 ['Form auswählen – wir rechnen für dich.','Choose a pan and we will do the maths.'],
 ['Kuchenhöhe ändern','Change cake height'],
 ['Trage dein Rezept ein. Hier siehst du die neuen Mengen.','Enter your recipe to see the adjusted quantities here.'],
 ['✎ Zutaten eingeben','✎ Enter ingredients'],
 ['♨ Backzeit und Ofen','♨ Baking time and oven'],
 ['So sieht deine Form aus','This is what your pan looks like'],
 ['Zum Drehen','Rotate to view'],
 ['Springform mit Kuchenteig','Springform pan with cake batter'],
 ['So voll wird deine Form.','This is how full your pan will be.'],
 ['Deine Rezeptmenge','Your recipe quantity'],
 ['Das passt','A good fit'],
 ['Diese Formen passen auch','These pans also fit'],
 ['Tippe eine Form an.','Select a pan.'],
 ['Meine eigenen Backformen','My own baking pans'],
 ['Meine Backformen','My baking pans'],
 ['Deine Backzeit & Mengen','Your baking time and quantities'],
 ['Noch mehr Backhelfer','More baking helpers'],
 ['← Zurück','← Back'],
 ['Rezept einlesen','Import recipe'],
 ['Meine Torte planen','Plan my cake'],
 ['Meine Backnotizen','My baking notes'],
 ['Meine Einkaufsliste','My shopping list'],
 ['Backform ändern','Change baking pan'],
 ['Formen finden','Find pans'],
 ['Rezeptfoto','Recipe photo'],
 ['Torte planen','Plan cake'],
 ['Backnotizen','Baking notes'],
 ['Einkaufsliste','Shopping list'],
 ['Form wählen','Choose pan'],
 ['Zutaten','Ingredients'],
 ['Ergebnis','Result'],
 ['Foto auswählen','Choose photo'],
 ['Böden & Creme','Layers & cream'],
 ['Meine Erfahrungen','My notes'],
 ['Was noch fehlt','What is still needed'],
 ['Backstudio-Schnellzugriff','Backstudio shortcuts']
]);
function localizeShell(shell,sub,side,stepper,header,quick,navButtons,views){
 const nodes=[sub,side,stepper,header,quick,
  ...navButtons.values(),...Object.values(views).map(item=>item.view),
  ...shell.querySelectorAll('.bsui-side-title,.bsui-side-nav,.bsui-section-eyebrow,.bsui-title,.bsui-subtitle,.bsui-recipe-details > summary,.bsui-empty,.bsui-stage-top,.bsui-stage-top strong,.bsui-stage-tag,.bsui-stage-pan img,.bsui-hero-status,.bsui-hero-status span,.bsui-hero-status strong,.bsui-recommend-detail > summary,.bsui-finder > h2,.bsui-return,.bsui-additional > summary,.bsui-step,.bsui-step span,.bsui-quick,.bsui-quick strong,.bsui-quick small,.bsui-nav span:last-child,.bsui-tool-head')];
 for(const node of new Set(nodes)){
  if(!node)continue;
  for(const attr of ['aria-label','alt']){
   const original=node.dataset[attr==='aria-label'?'bsuiOriginalAria':'bsuiOriginalAlt']||node.getAttribute(attr);
   if(!original)continue;
   node.dataset[attr==='aria-label'?'bsuiOriginalAria':'bsuiOriginalAlt']=original;
   node.setAttribute(attr,window.__toolyaUILocale==='en'?(shellCopy.get(original)||original):original);
  }
  for(const child of node.childNodes){
   if(child.nodeType!==3)continue;
   const original=child.__bsuiOriginalCopy??child.nodeValue;
   child.__bsuiOriginalCopy=original;
   const trimmed=original.trim(),translated=window.__toolyaUILocale==='en'?(shellCopy.get(trimmed)||trimmed):trimmed;
   if(shellCopy.has(trimmed))child.nodeValue=original.replace(trimmed,translated);
  }
 }
}
const navItems=[
 ['core','♧','Backform ändern'],
 ['finder','⚖','Formen finden'],
 ['import','▧','Rezeptfoto'],
 ['cake','♧','Torte planen'],
 ['memory','▤','Backnotizen'],
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
 const sub=document.querySelector('.b3-tool-title p');if(sub)sub.textContent='Die passende Backform. Ganz einfach.';
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
 const header=make('div','bsui-headerline');header.innerHTML='<div><p class="bsui-section-eyebrow">Einfach backen</p><h2 class="bsui-title">Welche Backform brauchst du?</h2><p class="bsui-subtitle">Form auswählen – wir rechnen für dich.</p></div>';content.append(header);
 const core=make('section','bsui-core');core.id='bsui-core';content.append(core);
 const grid=make('div','bsui-grid');core.append(grid);
 const left=make('div','bsui-left'),right=make('div','bsui-right');grid.append(left,right);
 const source=make('section','bsui-paper bsui-forms');source.id='bsui-source';left.append(source);
 source.append(shapeCard);shapeCard.classList.add('bsui-moved-card');
 // Preserve additional source controls without turning the home view into a long form.
 if(wish){const details=make('details','bsui-recipe-details');details.innerHTML='<summary>Kuchenhöhe ändern</summary>';details.append(wish);left.append(details)}
 const ingredientsWrap=make('section','bsui-paper bsui-ingredients');ingredientsWrap.id='bsui-ingredients';left.append(ingredientsWrap);
 ingredientsWrap.append(ingredients);
 const empty=make('p','bsui-empty','Trage dein Rezept ein. Hier siehst du die neuen Mengen.');
 empty.id='bsui-ingredients-empty';ingredientsWrap.append(empty);
 const recipeDetails=make('details','bsui-recipe-details');recipeDetails.id='bsui-recipe-details';recipeDetails.innerHTML='<summary>✎ Zutaten eingeben</summary>';recipeDetails.append(recipeCard);left.append(recipeDetails);
 recipeDetails.open=!$('recipe-input')?.value.trim();
 const conditionsDetails=make('details','bsui-recipe-details');conditionsDetails.innerHTML='<summary>♨ Backzeit und Ofen</summary>';conditionsDetails.append(conditionsCard);left.append(conditionsDetails);
 const stage=make('section','bsui-paper bsui-stage');stage.id='bsui-stage';right.append(stage);
 const stageTop=make('div','bsui-stage-top');stageTop.innerHTML='<strong>So sieht deine Form aus</strong><span class="bsui-stage-tag">Zum Drehen</span>';stage.append(stageTop);
 const screen=make('div','bsui-stage-screen');stage.append(screen);
 const fallback=make('div','bsui-stage-pan');fallback.innerHTML='<img src="./backstudio-pan.svg" alt="Springform mit Kuchenteig" loading="eager">';screen.append(fallback);
 const webgl=make('div','bsui-webgl');webgl.id='bsui-webgl';screen.append(webgl);
 const dims=make('div','bsui-stage-dims');dims.id='bsui-stage-dims';screen.append(dims);
 const heroStatus=make('div','bsui-hero-status');heroStatus.innerHTML='<span id="bsui-hero-description">So voll wird deine Form.</span><strong id="bsui-hero-factor">Deine Rezeptmenge</strong>';stage.append(heroStatus);
 const threePanel=[...fill.querySelectorAll('.bsp-panel')].find(n=>n.querySelector('#bsp-3d'));
 if(threePanel)webgl.append(threePanel);
 const recomm=make('section','bsui-paper bsui-finder');recomm.id='bsui-recommendations';right.append(recomm);
 recomm.innerHTML='<p class="bsui-section-eyebrow">Das passt</p><h2>Diese Formen passen auch</h2><p class="bsui-subtitle">Tippe eine Form an.</p>';
 const smartPanel=[...garage.querySelectorAll('.bsp-panel')].find(n=>n.querySelector('#bsp-compare-results'));
 const suggested=make('div','bsui-standard-recos');suggested.id='bsui-standard-recos';recomm.append(suggested);
 const customDetails=make('details','bsui-recommend-detail');customDetails.innerHTML='<summary>Meine eigenen Backformen</summary>';recomm.append(customDetails);
 if(smartPanel)customDetails.append(smartPanel);
 recomm.append(button('Meine Backformen','bsui-return',()=>showView('finder')));
 const metrics=make('section','bsui-paper bsui-metrics');metrics.id='bsui-metrics';right.append(metrics);
 metrics.innerHTML='<p class="bsui-section-eyebrow">Deine Backzeit & Mengen</p>';
 metrics.append(results);
 const quickwrap=make('div','bsui-quickwrap');core.append(quickwrap);
 const quick=make('nav','bsui-quicknav');quick.setAttribute('aria-label','Backstudio-Schnellzugriff');quickwrap.append(quick);
 const extras=make('details','bsui-additional');extras.innerHTML='<summary>Noch mehr Backhelfer</summary>';core.append(extras);
 extras.append(studio);
 // Existing bonus cards that are not rehomed are kept in the existing Backstudio grid.
 const supplemental=[...tab.children].filter(n=>n!==shell&&n!==studio&&n!==shapeCard&&n!==recipeCard&&n!==conditionsCard);
 for(const node of supplemental){if(node.classList.contains('b3-subview-link')||node.classList.contains('b3-workflow-intro')){node.remove();continue}studioGrid.append(node)}
 const views={};
 const createToolView=(key,title)=>{
  const view=make('section','bsui-tool-view');view.hidden=true;view.dataset.view=key;
  const head=make('div','bsui-tool-head');head.append(make('h2','',title));
  head.append(button('← Zurück','bsui-return',()=>showView('core')));view.append(head);
  const contents=make('div','bsui-tool-contents');view.append(contents);content.append(view);
  views[key]={view,contents};return contents;
 };
 const finderView=createToolView('finder','Meine Backformen');
 finderView.append(garage);if(special)finderView.append(special);
 const importerView=createToolView('import','Rezept einlesen');importerView.append(photo);
 const cakeView=createToolView('cake','Meine Torte planen');cakeView.append(layers);if(calendar)cakeView.append(calendar);
 const memoryView=createToolView('memory','Meine Backnotizen');memoryView.append(memory);
 const shoppingView=createToolView('shopping','Meine Einkaufsliste');shoppingView.append(shopping);if(pantry)shoppingView.append(pantry);if(exportCard)shoppingView.append(exportCard);
 const navButtons=new Map();
 let currentView='core';
 function showView(name){
  const mode=views[name]?name:'core';
  currentView=mode;
  document.dispatchEvent(new CustomEvent('toolya:backstudio-view-change',{detail:mode}));
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
  ['1','Form wählen','bsui-source','core'],
  ['2','Zutaten','bsui-ingredients','core'],
  ['3','Ergebnis','bsui-stage','core'],
  ['4','Einkaufsliste',null,'shopping']
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
  ['import','▧','Rezeptfoto','Foto auswählen'],
  ['cake','♧','Torte planen','Böden & Creme'],
  ['memory','▤','Backnotizen','Meine Erfahrungen'],
  ['shopping','🛒','Einkaufsliste','Was noch fehlt']
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
  if(mode==='double'){suggested.append(make('p','bsui-empty',text('Du hast zwei Formen gewählt.','You selected two pans.')));return}
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
   const optionLabel=make('strong','',text('◉ Runde Form: ', '◉ Round pan: ')+diameter+' cm');
   let advice=text('Fast gleich hoch.','Almost the same height.');
   if(i===0)advice=text('Ähnliche Größe','Similar size');
   else if(ratio>1.05)advice=text('Gleiche Teigmenge: Kuchen wird höher.','The same batter will make a taller cake.');
   else if(ratio<.95)advice=text('Gleiche Teigmenge: Kuchen wird flacher.','The same batter will make a shallower cake.');
   const info=make('span','',advice);
   if(i===0)info.className='bsui-option-best';
   row.append(optionLabel,info);suggested.append(row);
  }
 }
 function sync(){
  renderStandardRecommendations();
  const shape=$('target-shape')?.value||'round',double=$('combinator-mode')?.value==='double';
  const roundLabel=shape==='bundt'?text('Gugelhupf Ø ','Bundt Ø '):text('Rund Ø ','Round Ø ');
  let target=roundLabel+cleanNumber('target-d',20)+' cm';
  if(double)target=text('2 Formen Ø ','2 pans Ø ')+cleanNumber('combo-d1',20)+' / '+cleanNumber('combo-d2',16)+' cm';
  else if(shape==='rect')target=text('Rechteck ','Rectangular ')+cleanNumber('target-l',25)+' × '+cleanNumber('target-w',11)+' cm';
  dims.textContent=target;
  const factor=$('res-factor')?.textContent||'';
  const amount=Number(String(factor).replace(/[×\s]/g,'').replace(',','.'));
  const recipePercentage=Math.round(amount*100);
  $('bsui-hero-factor').textContent=Number.isFinite(amount)
   ?text(`Du brauchst ${recipePercentage} % des Rezepts.`,`Use ${recipePercentage}% of the recipe.`)
   :text('Mengen werden angepasst.','Adjusting the quantities.');
  const fillStatus=$('bs-filltext')?.textContent||'';
  const match=fillStatus.match(/(\d+(?:[,.]\d+)?)\s*%/);
  const percent=match?Number(match[1].replace(',','.')):null;
  let fill=text('Füllhöhe ansehen','See how full the pan is.');
  if(percent>75)fill=text('Achtung, die Form könnte zu voll sein!','The pan may be too full!');
  else if(percent!==null){
   const rounded=Math.round(percent);
   fill=text(`Die Form ist etwa ${rounded} % gefüllt.`,`The pan is about ${rounded}% full.`);
  }
  $('bsui-hero-description').textContent=fill;
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
 const orig3dOpen=[...webgl.querySelectorAll('button')].find(n=>/Form drehen|3D öffnen|Rotate pan|Open 3D/.test(n.textContent||''));
 if(orig3dOpen){
  orig3dOpen.textContent=text('↻ Form drehen','↻ Rotate pan');
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
 const repaintShell=()=>localizeShell(shell,sub,side,stepper,header,quick,navButtons,views);\n document.addEventListener('toolya:locale-change',repaintShell);\n document.addEventListener('toolya:locale-change',requestSync);\n repaintShell();
 sync();showView('core');
 document.dispatchEvent(new Event('toolya:backstudio-layout-ready'));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();