/* Toolya Backstudio Pro: advanced, additive controls. No WG data access. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const proEn=()=>window.__toolyaUILocale==='en';
const proStatusPairs=new Map();
const proUi=(de,en)=>{
 if(typeof de==='string'&&typeof en==='string'&&de!==en){
  proStatusPairs.set(de,[de,en]);proStatusPairs.set(en,[de,en]);
 }
 return proEn()?en:de;
};
function localizeProLiveStatuses(){
 for(const id of ['bsp-ocr-status','bsp-memory-status','bsp-3d-status']){
  const el=$(id);if(!el)continue;
  const pair=proStatusPairs.get(el.textContent);
  if(pair)el.textContent=proEn()?pair[1]:pair[0];
 }
}
const proStaticCopy=new Map([["Deine Backform zum Drehen","Your interactive baking pan"],["Form drehen","Rotate pan"],["Wieder von vorn","Reset rotation"],["Drehe die Form, um sie von allen Seiten anzusehen.","Rotate the pan to view it from all sides."],["Hier erscheint deine drehbare Backform.","Your interactive baking pan appears here."],["Welche Form passt?","Which pan fits?"],["Vergleichsziel","Comparison target"],["Rezeptmenge und Teighöhe","Recipe quantity and cake height"],["Meine vorhandene Teigmenge","My available batter"],["Passende Formen finden","Find matching pans"],["Wähle eine Form, die zu deinem Teig passt.","Choose a pan that fits your batter."],["Diese Form nehmen","Use this pan"],["Beide nehmen","Use both pans"],["Rezept einlesen","Import a recipe"],["Kopiere dein Rezept hier hinein. Prüfe danach die Zutaten.","Paste your recipe here, then check the ingredients."],["Zutaten erkennen","Recognize ingredients"],["Mein Rezept prüfen","Check my recipe"],["Zutaten übernehmen","Apply ingredients"],["Nicht erkannte Zeilen bitte selbst prüfen.","Check unrecognized lines manually."],["Rezeptfoto einlesen","Read recipe photo"],["📷 Kamera öffnen","📷 Open camera"],["🖼️ Foto auswählen","🖼️ Choose photo"],["📷 Handykamera verwenden","📷 Use phone camera"],["📸 Foto aufnehmen","📸 Take photo"],["Abbrechen","Cancel"],["Foto besser lesbar machen","Improve photo readability"],["Foto erneut lesen","Read photo again"],["Bitte die erkannten Zutaten prüfen.","Check the recognized ingredients."],["Wähle Kamera oder Foto.","Choose camera or photo."],["Meine Torte","My layered cake"],["Creme außen (mm)","Outer frosting (mm)"],["Creme-Gewicht (g/ml)","Frosting density (g/ml)"],["Etwas Creme extra (%)","Extra frosting (%)"],["Creme zwischen den Böden (cm)","Filling between layers (cm)"],["Neu berechnen","Recalculate"],["Meine Backnotizen","My baking notes"],["Einträge suchen","Search notes"],["Nur Lieblinge","Favorites only"],["Backnotiz speichern","Save baking note"],["Notizen herunterladen","Download notes"],["Die Notizen bleiben auf deinem Gerät.","Notes stay on your device."],["Wie gut hat es geklappt? (1–5 Sterne)","How did it go? (1–5 stars)"]]);
const proOriginalText=new WeakMap();
function localizeProControls(){
 const root=$('toolya-backstudio');if(!root)return;
 // Live status nodes are localized from their last action's exact DE/EN pair.
 // Never cache their initial text as static copy: that would overwrite an error
 // or success status before localizeProLiveStatuses can reverse-translate it.
 for(const node of root.querySelectorAll('.bsp-panel h4,.bsp-panel .bsp-muted,.bsp-panel .bsp-actions > button,.bsp-panel > button,.bsp-panel label > span,#toolya-backstudio article > label > span,.bsp-panel option')){
  if(node.children.length)continue;
  const source=proOriginalText.get(node)??node.textContent;
  if(!proStaticCopy.has(source))continue;
  proOriginalText.set(node,source);
  node.textContent=window.__toolyaUILocale==='en'?proStaticCopy.get(source):source;
 }
 const input=$('bsp-recipe-text');if(input)input.placeholder=window.__toolyaUILocale==='en'?'Paste recipe or ingredient list here…':'Rezept oder Zutatenliste hier einfügen …';
 const canvas=$('bsp-3d');if(canvas)canvas.setAttribute('aria-label',window.__toolyaUILocale==='en'?'Interactive 3D pan. Rotate with mouse, touch or arrow keys.':'Interaktive 3D-Backform, mit Maus oder Touch drehen, mit Pfeiltasten drehen');
 const video=$('bsp-camera-video');if(video)video.setAttribute('aria-label',window.__toolyaUILocale==='en'?'Camera view for capturing your recipe':'Kamerabild zum Aufnehmen deines Rezepts');
 const img=$('bsp-photo-preview');if(img)img.alt=window.__toolyaUILocale==='en'?'Selected recipe photo':'Dein ausgewähltes Rezeptfoto';
}

const KEY='toolya_backstudio_v1';
const n=(id,d=0)=>{const v=Number($(id)?.value);return Number.isFinite(v)?v:d};
const txt=(tag,text,parent)=>{const x=document.createElement(tag);if(text!==null)x.textContent=String(text);parent.append(x);return x};
const fmt=(v,d=1)=>Number(v).toLocaleString(proEn()?'en-GB':'de-DE',{maximumFractionDigits:d});
const read=()=>{if(window.toolyaBackstudioState)return window.toolyaBackstudioState;try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch{return {}}};
const write=data=>{try{localStorage.setItem(KEY,JSON.stringify(data));return true}catch{return false}};
const circle=d=>Math.PI*d*d/4;
const shapeArea=(s,a,b)=>s==='rect'?a*b:circle(a);
const formArea=prefix=>{const s=$(prefix+'-shape')?.value;return s==='rect'?n(prefix+'-l',30)*n(prefix+'-w',10):circle(n(prefix+'-d',26))};
const actualTarget=()=>$('combinator-mode')?.value==='double'?circle(n('combo-d1',20))+circle(n('combo-d2',16)):formArea('target');
const sourceVolume=()=>formArea('orig')*Math.max(n('bs-original-height',4),.1)*10;
const desiredVolume=()=>actualTarget()*Math.max(n('bs-height',4),.1)*10;
const sourceFactor=()=>desiredVolume()/Math.max(sourceVolume(),1);
const amazon=(term)=>'https://www.amazon.de/s?k='+encodeURIComponent(term)+'&tag=duhrrom-21';
const cardOf=id=>$(id)?.closest('article');
function addField(parent,label,id,type='number',value=''){
 const w=txt('label',null,parent);txt('span',label,w);
 const input=txt('input',null,w);input.id=id;input.type=type;input.value=value;
 return input;
}
function action(parent,label,fn){const b=txt('button',label,parent);b.type='button';b.addEventListener('click',fn);return b}
function panel(host,title){const outer=txt('section',null,host);outer.className='bsp-panel';txt('h4',title,outer);return outer}
const state={three:null, scene:null, renderer:null, camera:null, object:null, bat:null, lastW:0, observer:null, rotX:-.24,rotY:.6, dragging:false};
function status(id,msg){if($(id))$(id).textContent=msg}
function init3D(){
 const parent=cardOf('bs-fillbar');if(!parent)return;
 const pane=panel(parent,'Deine Backform zum Drehen');
 const canvas=txt('div',null,pane);canvas.id='bsp-3d';canvas.tabIndex=0;canvas.setAttribute('aria-label','Interaktive 3D-Backform, mit Maus oder Touch drehen, mit Pfeiltasten drehen');canvas.setAttribute('role','img');
 const controls=txt('div',null,pane);controls.className='bsp-actions';
 action(controls,'Form drehen',async()=>{
  const msg=$('bsp-3d-status');status('bsp-3d-status',proUi('Backform wird geladen …','Loading the baking pan…'));
  try{
   const THREE=await import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js');
   state.three=THREE;
   const rect=canvas.getBoundingClientRect(),w=Math.max(220,Math.round(rect.width)),h=canvas.closest('#bsui-stage')?(window.innerWidth<711?320:window.innerWidth<981?335:385):260;
   if(state.renderer){state.renderer.dispose();state.renderer.domElement.remove()}
   state.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
   state.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
   state.renderer.setSize(w,h);
   canvas.replaceChildren(state.renderer.domElement);
   state.scene=new THREE.Scene();
   state.camera=new THREE.PerspectiveCamera(40,w/h,.1,100);
   state.camera.position.set(0,4.5,8);state.camera.lookAt(0,0,0);
   state.scene.add(new THREE.HemisphereLight(0xffffff,0xb4a3a0,2.5));
   const lamp=new THREE.DirectionalLight(0xffffff,3);lamp.position.set(2,6,5);state.scene.add(lamp);
   state.object=new THREE.Group();state.scene.add(state.object);
   redraw3D();status('bsp-3d-status',proUi('Drehe die Form mit dem Finger oder der Maus.','Rotate the pan using touch or mouse.'));
   if(state.observer)state.observer.disconnect();
   state.observer=new ResizeObserver(()=>{if(!state.renderer||!canvas.isConnected)return;const width=Math.max(180,canvas.clientWidth);if(width===state.lastW)return;state.lastW=width;const height=canvas.closest('#bsui-stage')?(window.innerWidth<711?320:window.innerWidth<981?335:385):260;state.renderer.setSize(width,height);state.camera.aspect=width/height;state.camera.updateProjectionMatrix();render3D()});
   state.observer.observe(canvas);
  }catch(e){status('bsp-3d-status',proUi('3D konnte nicht gestartet werden (WebGL oder externe Bibliothek nicht verfügbar). Die Füllhöhenanzeige bleibt nutzbar.','3D could not start (WebGL or external library unavailable). The fill-level indicator still works.'));}
 });
 action(controls,'Wieder von vorn',()=>{state.rotX=-.24;state.rotY=.6;render3D()});
 txt('p','Drehe die Form, um sie von allen Seiten anzusehen.',pane).className='bsp-muted';
 txt('p',proUi('Hier erscheint deine drehbare Backform.','Your interactive baking pan appears here.'),pane).id='bsp-3d-status';
 const dragStart={x:0,y:0};
 canvas.addEventListener('pointerdown',e=>{if(!state.object)return;state.dragging=true;dragStart.x=e.clientX;dragStart.y=e.clientY;canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!state.dragging)return;state.rotY+=(e.clientX-dragStart.x)*.01;state.rotX=Math.max(-1.25,Math.min(.8,state.rotX+(e.clientY-dragStart.y)*.01));dragStart.x=e.clientX;dragStart.y=e.clientY;render3D()});
 canvas.addEventListener('pointerup',()=>state.dragging=false);canvas.addEventListener('pointercancel',()=>state.dragging=false);
 canvas.addEventListener('keydown',e=>{const values={ArrowLeft:[0,-.12],ArrowRight:[0,.12],ArrowUp:[-.12,0],ArrowDown:[.12,0]};if(!values[e.key])return;e.preventDefault();state.rotX=Math.max(-1.25,Math.min(.8,state.rotX+values[e.key][0]));state.rotY+=values[e.key][1];render3D()});
 ['bs-volume','bs-form-height','bs-height','bs-maxfill','target-shape','target-d','target-l','target-w','combinator-mode','combo-d1','combo-d2'].forEach(id=>$(id)?.addEventListener('input',redraw3D));
}
function disposeGroup(group){if(!group)return;for(const obj of [...group.children]){group.remove(obj);obj.geometry?.dispose?.();if(Array.isArray(obj.material))obj.material.forEach(x=>x.dispose?.());else obj.material?.dispose?.()}}
function redraw3D(){
 if(!state.three||!state.object)return;
 const T=state.three,g=state.object;disposeGroup(g);
 const isRect=$('target-shape')?.value==='rect'&&$('combinator-mode')?.value!=='double';
 const isDouble=$('combinator-mode')?.value==='double';
 const fillRatio=Math.min(1,Math.max(0,n('bs-volume',1.5)*1000/Math.max(actualTarget()*n('bs-form-height',7)*10,1)));
 const height=2.5,wall=new T.MeshPhysicalMaterial({color:0x9ca3af,transparent:true,opacity:.3,roughness:.35,side:T.DoubleSide,depthWrite:false});
 const batter=new T.MeshStandardMaterial({color:fillRatio>.75?0xb45309:0xe9a54f,roughness:.72});
 const steel=new T.MeshStandardMaterial({color:0x64748b,metalness:.65,roughness:.3});
 function build(x,w,d,round){
  const pan=round?new T.CylinderGeometry(w/2,w/2,height,64,1,true):new T.BoxGeometry(w,height,d);
  const mesh=new T.Mesh(pan,wall);if(!round){const e=new T.EdgesGeometry(pan);const line=new T.LineSegments(e,new T.LineBasicMaterial({color:0x64748b}));line.position.x=x;g.add(line)}
  mesh.position.x=x;g.add(mesh);
  const base=new T.Mesh(round?new T.CylinderGeometry(w/2,w/2,.08,64):new T.BoxGeometry(w,.08,d),steel);base.position.set(x,-height/2,0);g.add(base);
  if(fillRatio>0){const fh=Math.max(.01,height*fillRatio),pour=new T.Mesh(round?new T.CylinderGeometry(w/2*.965,w/2*.965,fh,64):new T.BoxGeometry(w*.965,fh,d*.965),batter);pour.position.set(x,-height/2+fh/2,0);g.add(pour)}
 }
 if(isDouble){build(-1.6,2.35,2.35,true);build(1.55,1.8,1.8,true)}
 else if(isRect){const a=n('target-l',25),b=n('target-w',11),scale=3/Math.max(a,b,1);build(0,Math.max(.4,a*scale),Math.max(.4,b*scale),false)}
 else build(0,3.25,3.25,true);
 render3D();
 status('bsp-3d-status',proUi('3D-Ansicht: ca. ','3D view: approx. ')+fmt(fillRatio*100)+proUi(' % Füllung. Volumenschätzung setzt gerade Wände voraus.','% filled. Volume estimates assume straight pan walls.'));
}
function render3D(){if(!state.object||!state.renderer)return;state.object.rotation.set(state.rotX,state.rotY,0);state.renderer.render(state.scene,state.camera)}
function panSpecs(p){
 const h=n('bs-form-height',7),fraction=n('bs-maxfill',.7);
 if(p.shape==='round')return {area:circle(Number(p.a)),capacity:circle(Number(p.a))*h*10*fraction,label:proUi('Rund Ø ','Round Ø ')+p.a+' cm',shape:'round',a:Number(p.a)};
 if(p.shape==='rect')return {area:Number(p.a)*Number(p.b),capacity:Number(p.a)*Number(p.b)*h*10*fraction,label:proUi('Rechteck ','Rectangular ')+p.a+' × '+p.b+' cm',shape:'rect',a:Number(p.a),b:Number(p.b)};
 if(p.shape==='volume')return {area:null,capacity:Number(p.a)*fraction,label:proUi('Spezialform ','Special pan ')+p.a+' ml',shape:'volume',a:Number(p.a)};
 if(p.shape==='muffin')return {area:null,capacity:Number(p.a)*100*fraction,label:p.a+proUi(' Muffinmulden (je ca. 100 ml)',' muffin cups (approx. 100 ml each)'),shape:'muffin',a:Number(p.a)};
 return null;
}
function initFinder(){
 const host=cardOf('bs-garage-items');if(!host)return;
 const wrap=panel(host,'Welche Form passt?');
 const label=txt('label',null,wrap);txt('span','Vergleichsziel',label);
 const select=txt('select',null,label);select.id='bsp-compare-target';
 for(const [value,title] of [['recipe','Rezeptmenge und Teighöhe'],['mixed','Meine vorhandene Teigmenge']]){const o=txt('option',title,select);o.value=value}
 action(wrap,'Passende Formen finden',renderComparisons);
 txt('p','Wähle eine Form, die zu deinem Teig passt.',wrap).className='bsp-muted';
 txt('div',null,wrap).id='bsp-compare-results';
 $('bs-pan-save')?.addEventListener('click',()=>queueMicrotask(renderComparisons));
 ['bs-height','bs-volume','bs-maxfill','bs-form-height'].forEach(id=>$(id)?.addEventListener('change',renderComparisons));
}
function renderComparisons(){
 const host=$('bsp-compare-results');if(!host)return;host.replaceChildren();
 const pans=(read().pans||[]).map((p,i)=>({...panSpecs(p),p,i})).filter(p=>p.label&&Number.isFinite(p.capacity)&&p.capacity>0);
 if(!pans.length){txt('p',proUi('Trage zuerst deine Backformen ein.','Add your baking pans first.'),host);return}
 const want=$('bsp-compare-target')?.value==='mixed'?n('bs-volume',1.5)*1000:desiredVolume();
 const options=pans.map(p=>({pans:[p],capacity:p.capacity,area:p.area}));
 for(let i=0;i<pans.length;i++)for(let j=i;j<pans.length;j++)options.push({pans:[pans[i],pans[j]],capacity:pans[i].capacity+pans[j].capacity,area:pans[i].area!==null&&pans[j].area!==null?pans[i].area+pans[j].area:null});
 options.sort((a,b)=>{
  const score=x=>{const relative=(x.capacity-want)/Math.max(want,1);return (relative<0?Math.abs(relative)*2.5:relative)+.08*(x.pans.length-1)};
  return score(a)-score(b)
 });
 options.slice(0,6).forEach((option,i)=>{
  const row=txt('div',null,host);row.className='bsp-match';
  const label=option.pans.map(p=>p.label).join(' + ');
  const fill=want/option.capacity;
  txt('strong',(i===0?proUi('★ Empfehlung: ','★ Recommended: '):'')+label,row);
  txt('span',proUi('Füllbedarf ','Batter required ')+fmt(want,0)+proUi(' ml / Platz für Teig ',' ml / pan capacity ')+fmt(option.capacity,0)+' ml · '+fmt(fill*100)+proUi(' % der empfohlenen Füllgrenze','% of recommended fill limit')+(fill>1?proUi(' – diese Form ist zu klein!',' – this pan is too small!'):''),row);
  if(option.pans.length===1&&['round','rect'].includes(option.pans[0].shape)){
   action(row,proUi('Diese Form nehmen','Use this pan'),()=>{
    const p=option.pans[0];
    $('combinator-mode').value='single';window.toggleCombinator?.();
    $('target-shape').value=p.shape;window.updateShapeInputs?.('target');
    if(p.shape==='round')$('target-d').value=p.a;else{$('target-l').value=p.a;$('target-w').value=p.b}
    window.calculateAll?.();for(const id of ['target-d','target-l','target-w'])$(id)?.dispatchEvent(new Event('input',{bubbles:true}));
   });
  }else if(option.pans.length===2&&option.pans.every(p=>p.shape==='round')){
   action(row,proUi('Beide nehmen','Use both pans'),()=>{
    $('combinator-mode').value='double';window.toggleCombinator?.();
    $('combo-d1').value=option.pans[0].a;$('combo-d2').value=option.pans[1].a;window.calculateAll?.();$('combo-d1').dispatchEvent(new Event('input',{bubbles:true}));
   })
  }
 });
}
function parseNumber(x){
 const y=x.replace(/\s/g,'').replace(',','.');
 if(/^\d+\/\d+$/.test(y)){const [a,b]=y.split('/').map(Number);return b?a/b:NaN}
 if(/^\d+[½¼¾]$/.test(y))return Number(y.slice(0,-1))+({'½':.5,'¼':.25,'¾':.75}[y.slice(-1)]);
 if(['½','¼','¾'].includes(y))return {'½':.5,'¼':.25,'¾':.75}[y];
 return Number(y);
}
function normalizeRecipe(text){
 const items=[],warnings=[];const lines=text.replace(/\r/g,'').split('\n');
 const q='(?:\\d+(?:[.,]\\d+)?|\\d+\\/\\d+|\\d+[½¼¾]|[½¼¾])';
 const units='(?:kg|g|mg|ml|l|TL|EL|Pck\\.?|Paket|Stück|Stk\\.?|Eier?|Prise[n]?|Tasse[n]?)';
 const first=new RegExp('^('+q+')\\s*('+units+')?\\s+(.+)$','i');
 const last=new RegExp('^(.+?)\\s+('+q+')\\s*('+units+')\\s*$','i');
 for(const line of lines){
  const raw=line.trim().replace(/^[•*–\-]\s*/,'').replace(/^\d+[.)]\s*/,'');
  if(!raw||/^(zutaten|zubereitung|anleitung|für den teig|für die füllung)\s*:?$/i.test(raw))continue;
  let m=raw.match(first),name,unit,qty;
  if(m){qty=parseNumber(m[1]);unit=m[2]||'';name=m[3]}
  else{m=raw.match(last);if(m){name=m[1];qty=parseNumber(m[2]);unit=m[3]}}
  if(!m||!Number.isFinite(qty)||qty<0||!name){warnings.push(raw);continue}
  if(!unit && /^(?:ei|eier|stück|stk\.?|pck\.?)$/i.test(name.trim())){unit=name.trim();name='';}
  if(/^\s*[-–]\s*\d/.test(name))warnings.push(proUi('Mengenbereich bitte prüfen: ','Check quantity range: ')+raw);
  const standardizedUnit=/^(eier|ei)$/i.test(unit)?'Eier':/^(stk\.?|stück)$/i.test(unit)?'Stück':/^(paket|pck\.?)$/i.test(unit)?'Pck':unit;
  items.push({name:name.trim(),qty,unit:standardizedUnit,source:raw});
 }
 return {items,warnings};
}
function initRecipe(){
 const host=cardOf('bs-photo');if(!host)return;
 const oldOCR=$('bs-ocr');if(oldOCR){oldOCR.hidden=true;oldOCR.setAttribute('aria-hidden','true')}
 const preview=panel(host,'Rezept einlesen');
 txt('p','Kopiere dein Rezept hier hinein. Prüfe danach die Zutaten.',preview).className='bsp-muted';
 const input=txt('textarea',null,preview);input.id='bsp-recipe-text';input.rows=5;input.placeholder='Rezept oder Zutatenliste hier einfügen …';
 const controls=txt('div',null,preview);controls.className='bsp-actions';
 action(controls,'Zutaten erkennen',()=>reviewRecipe(input.value));
 action(controls,'Mein Rezept prüfen',()=>reviewRecipe($('recipe-input').value));
 action(controls,'Zutaten übernehmen',()=>applyReviewed()).id='bsp-apply';
 txt('div',null,preview).id='bsp-preview';
 txt('p','Nicht erkannte Zeilen bitte selbst prüfen.',preview).className='bsp-muted';
 const ocr=panel(host,'Rezeptfoto einlesen');
 const originalInput=$('bs-photo');
 if(!originalInput)return;
 // Keep the original file input and its legacy handler, but replace the confusing
 // browser-native picker with two clearly named user actions.
 originalInput.hidden=true;originalInput.style.display='none';
 const captureInput=txt('input',null,ocr);
 captureInput.type='file';captureInput.accept='image/*';captureInput.setAttribute('capture','environment');
 captureInput.id='bsp-camera-native';captureInput.hidden=true;captureInput.style.display='none';
 const choices=txt('div',null,ocr);choices.className='bsp-camera-actions bsp-actions';
 const cameraButton=action(choices,'📷 Kamera öffnen',openCamera);
 cameraButton.id='bsp-camera-open';
 action(choices,'🖼️ Foto auswählen',()=>originalInput.click()).id='bsp-photo-choose';
 const nativeButton=action(choices,'📷 Handykamera verwenden',()=>captureInput.click());
 nativeButton.id='bsp-camera-native-button';nativeButton.hidden=true;
 const cameraArea=txt('div',null,ocr);cameraArea.className='bsp-camera-preview';cameraArea.hidden=true;
 const video=txt('video',null,cameraArea);
 video.id='bsp-camera-video';video.autoplay=true;video.muted=true;video.playsInline=true;
 video.setAttribute('aria-label','Kamerabild zum Aufnehmen deines Rezepts');
 const cameraControls=txt('div',null,cameraArea);cameraControls.className='bsp-actions';
 action(cameraControls,'📸 Foto aufnehmen',takePhoto).id='bsp-camera-shutter';
 action(cameraControls,'Abbrechen',closeCamera);
 const thumbnail=txt('img',null,ocr);
 thumbnail.id='bsp-photo-preview';thumbnail.hidden=true;thumbnail.alt='Dein ausgewähltes Rezeptfoto';
 const opts=txt('label',null,ocr);
 const box=txt('input',null,opts);box.type='checkbox';box.checked=true;box.id='bsp-contrast';
 txt('span','Foto besser lesbar machen',opts);
 let cameraStream=null,photoFile=null,previewUrl=null;
 function closeCamera(){
  if(cameraStream){for(const track of cameraStream.getTracks())track.stop();cameraStream=null}
  video.pause();video.srcObject=null;cameraArea.hidden=true;
 }
 function showPhoto(file){
  if(!file)return;
  photoFile=file;
  if(previewUrl)URL.revokeObjectURL(previewUrl);
  previewUrl=URL.createObjectURL(file);
  thumbnail.src=previewUrl;thumbnail.hidden=false;
  status('bsp-ocr-status',proUi('Foto ausgewählt. Text wird gelesen …','Photo selected. Reading text…'));
  $('bsp-ocr-button')?.click();
 }
 originalInput.addEventListener('change',()=>{
  const file=originalInput.files?.[0];if(file){showPhoto(file);originalInput.value=''}
 });
 captureInput.addEventListener('change',()=>{
  const file=captureInput.files?.[0];if(file){showPhoto(file);captureInput.value=''}
 });
 async function openCamera(){
  if(cameraStream){closeCamera();return}
  if(!navigator.mediaDevices?.getUserMedia){
   nativeButton.hidden=false;
   status('bsp-ocr-status',proUi('Kamera nicht verfügbar. Tippe auf „Handykamera verwenden“.','Camera unavailable. Choose “Use phone camera”.'));
   return;
  }
  cameraButton.disabled=true;
  status('bsp-ocr-status',proUi('Bitte den Zugriff auf die Kamera erlauben.','Allow camera access.'));
  let stream;
  try{
   stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'}}});
   cameraStream=stream;
   video.srcObject=stream;cameraArea.hidden=false;
   await video.play();
   status('bsp-ocr-status',proUi('Halte dein Rezept vor die Kamera und tippe auf „Foto aufnehmen“.','Hold your recipe in front of the camera and choose “Take photo”.'));
  }catch(e){
   if(stream){for(const track of stream.getTracks())track.stop()}
   closeCamera();nativeButton.hidden=false;
   status('bsp-ocr-status',proUi('Kamera konnte nicht geöffnet werden. Versuche „Handykamera verwenden“.','Could not open the camera. Try “Use phone camera”.'));
  }finally{cameraButton.disabled=false}
 }
 function takePhoto(){
  if(!cameraStream||!video.videoWidth||!video.videoHeight){
   status('bsp-ocr-status',proUi('Das Kamerabild ist noch nicht bereit.','Camera preview is not ready yet.'));
   return;
  }
  const canvas=document.createElement('canvas');
  const ratio=Math.min(1,2200/Math.max(video.videoWidth,video.videoHeight));
  canvas.width=Math.max(1,Math.round(video.videoWidth*ratio));
  canvas.height=Math.max(1,Math.round(video.videoHeight*ratio));
  const context=canvas.getContext('2d');if(!context){status('bsp-ocr-status',proUi('Foto konnte nicht aufgenommen werden.','Could not take the photo.'));return}
  context.drawImage(video,0,0,canvas.width,canvas.height);
  canvas.toBlob(blob=>{
   if(!blob){status('bsp-ocr-status',proUi('Foto konnte nicht gespeichert werden.','Could not save the photo.'));return}
   const file=new File([blob],'rezeptfoto.jpg',{type:'image/jpeg',lastModified:Date.now()});
   closeCamera();showPhoto(file);
  },'image/jpeg',.9);
 }
 document.addEventListener('toolya:backstudio-view-change',event=>{if(event.detail!=='import')closeCamera()});
 window.addEventListener('pagehide',()=>{closeCamera();if(previewUrl)URL.revokeObjectURL(previewUrl)},{once:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)closeCamera()});
 // The OCR workflow remains review-first. Nothing is written to a recipe or
 // shopping list until the user explicitly clicks "Zutaten übernehmen".
 action(ocr,'Foto erneut lesen',async()=>{
  const file=photoFile||originalInput.files?.[0];
  if(!file)return status('bsp-ocr-status',proUi('Bitte ein Foto aufnehmen oder auswählen.','Take or select a photo first.'));
  if(!/^image\//.test(file.type)||file.size>20*1024*1024)return status('bsp-ocr-status',proUi('Bitte ein Foto bis 20 MB verwenden.','Use a photo no larger than 20 MB.'));
  const btn=$('bsp-ocr-button');btn.disabled=true;status('bsp-ocr-status',proUi('Rezept wird gelesen …','Reading recipe…'));
  try{
   if(!window.Tesseract){
    const script=document.createElement('script');
    script.src='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
    await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=reject;document.head.append(script)})
   }
   let img=file;
   if(box.checked){
    const bitmap=await createImageBitmap(file);
    try{
     const canvas=document.createElement('canvas'),ratio=Math.min(2,2400/Math.max(bitmap.width,bitmap.height));
     canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
     const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('Canvas unavailable');
     ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
     const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
     for(let i=0;i<pixels.data.length;i+=4){
      const gray=Math.min(255,Math.max(0,Math.round((.2126*pixels.data[i]+.7152*pixels.data[i+1]+.0722*pixels.data[i+2]-128)*1.55+128)));
      pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=gray
     }
     ctx.putImageData(pixels,0,0);img=canvas;
    }finally{bitmap.close()}
   }
   const result=await window.Tesseract.recognize(img,'deu+eng');
   input.value=result.data.text||'';reviewRecipe(input.value);
   status('bsp-ocr-status',proUi('Foto gelesen. Bitte Zutaten prüfen und dann übernehmen.','Photo read. Check ingredients before applying them.'));
  }catch(e){status('bsp-ocr-status',proUi('Foto konnte nicht gelesen werden. Bitte anderes Foto versuchen.','Could not read the photo. Try another one.'))}
  finally{btn.disabled=false}
 }).id='bsp-ocr-button';
 txt('p','Bitte die erkannten Zutaten prüfen.',ocr).className='bsp-muted';
 const cameraStatus=txt('p',proUi('Wähle Kamera oder Foto.','Choose camera or photo.'),ocr);
 cameraStatus.id='bsp-ocr-status';cameraStatus.setAttribute('role','status');cameraStatus.setAttribute('aria-live','polite');

}
let reviewed=[];
function reviewRecipe(source){
 const result=normalizeRecipe(source);reviewed=result.items;const host=$('bsp-preview');host.replaceChildren();
 if(!reviewed.length){txt('p',proUi('Keine eindeutig erkennbaren Mengen gefunden. Bitte Text bearbeiten.','No clearly recognized quantities found. Edit the recipe text.'),host);return}
 const table=txt('div',null,host);
 for(const item of reviewed){const row=txt('div',null,table);row.className='bsp-match';txt('span',(fmt(item.qty,2)+' '+item.unit+' '+item.name).trim(),row)}
 if(result.warnings.length){txt('p',proUi('Bitte manuell prüfen (','Check manually (')+result.warnings.length+proUi(' Zeilen):',' lines):'),host);for(const w of result.warnings.slice(0,30))txt('p',w,host)}

}
function applyReviewed(){
 if(!reviewed.length)return;
 $('recipe-input').value=reviewed.map(i=>(proEn()?String(i.qty):fmt(i.qty,2).replace(/\./g,''))+' '+i.unit+' '+i.name).join('\n');
 $('recipe-input').dispatchEvent(new Event('input',{bubbles:true}));
 window.calculateRecipe?.();
 status('bsp-ocr-status',proUi('Erkannte Zutaten übernommen. Bitte Mengen und Backformfaktor prüfen.','Recognized ingredients applied. Check quantities and the pan scaling factor.'));
}
function initCake(){
 const host=cardOf('bs-layers');if(!host)return;const pane=panel(host,'Meine Torte');
 addField(pane,'Creme außen (mm)','bsp-frost-thickness','number',3).min=1;
 addField(pane,'Creme-Gewicht (g/ml)','bsp-density','number',.9).min=.1;
 addField(pane,'Etwas Creme extra (%)','bsp-waste','number',15).min=0;
 addField(pane,'Creme zwischen den Böden (cm)','bsp-layer-height','number',.7).min=0;
 txt('div',null,pane).id='bsp-cake-output';
 action(pane,'Neu berechnen',updateCake);
 ['bs-layers','bs-filling','bs-height','target-d','target-shape','target-l','target-w','bsp-frost-thickness','bsp-density','bsp-waste','bsp-layer-height'].forEach(id=>$(id)?.addEventListener('input',updateCake));
 updateCake();
}
function updateCake(){
 const host=$('bsp-cake-output');if(!host)return;host.replaceChildren();
 const layers=Math.max(1,Math.min(20,Math.floor(n('bs-layers',3))));const gaps=layers-1;
 const coreHeight=Math.max(.1,n('bs-height',4)),fillingHeight=Math.max(0,n('bsp-layer-height',.7))*gaps;
 const total=coreHeight+fillingHeight,outerArea=actualTarget();
 const perimeter=$('target-shape')?.value==='rect'&&$('combinator-mode')?.value!=='double'?2*(n('target-l',25)+n('target-w',11)):Math.PI*n('target-d',20);
 const creamArea=outerArea+perimeter*total;
 const coverage=creamArea*Math.max(.1,n('bsp-frost-thickness',3))/10*Math.max(.1,n('bsp-density',.9));
 const waste=1+Math.max(0,n('bsp-waste',15))/100;
 const filling=gaps*Math.max(0,n('bs-filling',200));
 for(const t of [
  proUi('Böden: ','Layers: ')+layers+' × '+fmt(coreHeight/layers,2)+' cm',
  proUi('Füllungen: ','Fillings: ')+gaps+' × '+fmt(n('bs-filling',200),0)+' g = '+fmt(filling,0)+' g',
  proUi('Gesamthöhe mit Füllungen: ca. ','Total height with fillings: approx. ')+fmt(total,1)+' cm',
  proUi('Außencreme für Oberfläche und Rand: ca. ','Outer frosting for top and sides: approx. ')+fmt(coverage*waste,0)+proUi(' g (inklusive Reserve)',' g (including extra)'),
  proUi('Gesamtmenge Creme (außen + Füllungen): ca. ','Total frosting (outside + fillings): approx. ')+fmt((coverage+filling)*waste,0)+proUi(' g (wenn dieselbe Creme verwendet wird)',' g (if using the same frosting)'),
  proUi('Flächen- und Cremebedarf sind Näherungen. Bei zwei Formen wird ein gemeinsamer Umfang angenähert.','Areas and frosting quantities are estimates. Two pans are approximated with a combined perimeter.')
 ])txt('p',t,host)
}
function initMemory(){
 const host=cardOf('bs-logs');if(!host)return;
 // Both save buttons use the enhanced format; legacy saves must not truncate history.
 const legacySave=$('bs-log');if(legacySave)legacySave.onclick=saveExtendedLog;
 const pane=panel(host,'Meine Backnotizen');
 addField(pane,'Einträge suchen','bsp-memory-search','search','');
 const label=txt('label',null,pane);txt('span','Nur Lieblinge',label);const check=txt('input',null,label);check.id='bsp-favorites';check.type='checkbox';
 const controls=txt('div',null,pane);controls.className='bsp-actions';
 action(controls,'Backnotiz speichern',saveExtendedLog);
 action(controls,'Notizen herunterladen',exportMemory);
 const memoryStatus=txt('p','',pane);
 memoryStatus.id='bsp-memory-status';memoryStatus.setAttribute('role','status');memoryStatus.setAttribute('aria-live','polite');
 txt('p','Die Notizen bleiben auf deinem Gerät.',pane).className='bsp-muted';
 const gallery=txt('div',null,pane);gallery.id='bsp-memory-list';
 $('bsp-memory-search').addEventListener('input',renderMemory);check.addEventListener('change',renderMemory);
 // The existing legacy memory button remains valid; observe its local render updates.
 new MutationObserver(()=>queueMicrotask(renderMemory)).observe($('bs-logs'),{childList:true,subtree:false});
 renderMemory();
}
function saveExtendedLog(){
 const data=read(),minutes=n('bs-time',45);if(!Number.isFinite(minutes)||minutes<1||minutes>1440)return;
 const logs=Array.isArray(data.logs)?data.logs.slice():[];
 const id=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
 logs.push({id,date:new Date().toLocaleDateString('de-DE'),iso:new Date().toISOString(),name:($('recipe-name')?.value||'Mein Kuchen').slice(0,80),minutes,temperature:n('base-temp',180),shape:$('target-shape')?.value,diameter:n('target-d',20),height:n('bs-height',4),rating:Math.max(1,Math.min(5,n('bsp-rating',3))),favorite:false,note:($('bs-note')?.value||'').slice(0,250)});
 data.logs=logs.slice(-100);if(!write(data))return;
 renderMemory();window.toolyaBackstudioRenderLogs?.();
 status('bsp-memory-status',proUi('Backerfahrung gespeichert.','Baking notes saved.'));
}
function exportMemory(){
 const logs=(read().logs||[]).filter(x=>x&&typeof x==='object');
 const blob=new Blob([JSON.stringify({app:'Toolya Backstudio',version:1,exported:new Date().toISOString(),logs},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob);const a=txt('a','',document.body);a.href=url;a.download=proUi('toolya-backgedaechtnis.json','toolya-baking-notes.json');a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 status('bsp-memory-status',proUi('Notizen gespeichert.','Notes exported.'));
}
function renderMemory(){
 const host=$('bsp-memory-list');if(!host)return;host.replaceChildren();
 const data=read(),logs=Array.isArray(data.logs)?data.logs:[];const search=($('bsp-memory-search')?.value||'').trim().toLocaleLowerCase('de-DE'),favorites=!!$('bsp-favorites')?.checked;
 const selected=logs.map((x,index)=>({x,index})).filter(({x})=>x&&typeof x==='object'&&(!favorites||x.favorite)&&[x.name,x.note,x.date].join(' ').toLocaleLowerCase('de-DE').includes(search)).reverse().slice(0,50);
 if(!selected.length){txt('p',proUi('Keine Notizen gefunden.','No notes found.'),host);return}
 for(const {x,index} of selected){
  const row=txt('div',null,host);row.className='bsp-match';
  txt('strong',(x.favorite?'★ ':'')+(x.name||proUi('Backerfahrung','Baking note'))+' · '+(x.date||''),row);
  txt('span',[x.minutes&&x.minutes+' min',x.temperature&&x.temperature+' °C',x.rating&&x.rating+proUi('/5 Sterne','/5 stars'),x.shape&&proUi('Form: ','Pan: ')+({'round':proUi('Rund','Round'),'rect':proUi('Rechteck','Rectangular'),'volume':proUi('Spezialform','Special pan'),'muffin':proUi('Muffinmulden','Muffin cups')}[x.shape]||x.shape),x.note].filter(Boolean).join(' · '),row);
  action(row,x.favorite?proUi('★ Favorit','★ Favorite'):proUi('☆ Favorit','☆ Favorite'),()=>{const state=read();if(!Array.isArray(state.logs)||!state.logs[index])return;state.logs[index].favorite=!state.logs[index].favorite;if(write(state))renderMemory()});
  action(row,proUi('Löschen','Delete'),()=>{if(!confirm(proUi('Diese Notiz löschen?','Delete this note?')))return;const state=read();if(!Array.isArray(state.logs))return;state.logs.splice(index,1);if(write(state))renderMemory()})
 }
}
function init(){
 if(!$('toolya-backstudio'))return;
 const css=txt('style',null,document.head);css.textContent='#toolya-backstudio .bsp-panel{margin:14px 0 4px;padding:12px;border-radius:12px;background:#fff;border:1px solid #fdba74}#toolya-backstudio .bsp-panel h4{font-weight:750;font-size:1rem;margin:0 0 9px}#toolya-backstudio .bsp-muted{font-size:12px;color:#475569}#toolya-backstudio .bsp-actions{display:flex;flex-wrap:wrap;gap:5px}#toolya-backstudio #bsp-3d{height:260px;width:100%;border-radius:12px;background:radial-gradient(circle at 50% 30%,#fff7ed,#fde7ce);touch-action:none;overflow:hidden;outline-offset:3px}#toolya-backstudio #bsp-3d:focus-visible{outline:3px solid #c2410c}#toolya-backstudio .bsp-match{padding:9px 0;border-bottom:1px solid #fed7aa;display:flex;flex-direction:column;gap:5px}#toolya-backstudio .bsp-match span{font-size:12px}#toolya-backstudio .bsp-match button{align-self:flex-start}#toolya-backstudio #bsp-recipe-text{min-height:85px}#toolya-backstudio #bsp-apply{background:#047857}#toolya-backstudio .bsp-panel input[type=checkbox]{width:auto}';
 init3D();initFinder();initRecipe();initCake();initMemory();
  document.addEventListener('toolya:locale-change',()=>{
   localizeProControls();
   localizeProLiveStatuses();
   renderComparisons();updateCake();renderMemory();redraw3D();
  });
 // Default rating for extended notes (in the original memory card).
 const memory=cardOf('bs-logs');if(memory){const rating=txt('label',null,memory);txt('span','Wie gut hat es geklappt? (1–5 Sterne)',rating);const input=txt('input',null,rating);input.id='bsp-rating';input.type='number';input.min='1';input.max='5';input.value='3'}
  localizeProControls();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
