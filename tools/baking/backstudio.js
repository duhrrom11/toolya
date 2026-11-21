(function(){
'use strict';
const KEY='toolya_backstudio_v1', TAG='duhrrom-21';
const langEn=()=>window.__toolyaUILocale==='en';
const ui=(de,en)=>langEn()?en:de;
const el=id=>document.getElementById(id), number=(id,d=0)=>Number(el(id)?.value)||d, fmt=n=>Number(n).toLocaleString(langEn()?'en-GB':'de-DE',{maximumFractionDigits:1});
const safe=x=>String(x||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data;try{data=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{data={}}data=Object.assign({pans:[],logs:[],shopping:[],pantry:{}},data);for(const key of ['pans','logs','shopping'])if(!Array.isArray(data[key]))data[key]=[];if(!data.pantry||typeof data.pantry!=='object'||Array.isArray(data.pantry))data.pantry={};
// Share the same in-memory state with the additive pro controls to avoid overwriting newer entries.
window.toolyaBackstudioState=data;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch{message('Lokales Speichern fehlgeschlagen.')}};
const message=m=>el('bs-message').textContent=m;
const area=(s,a,b)=>s==='rect'?a*b:Math.PI*a*a/4;
const orig=()=>area(el('orig-shape').value,el('orig-shape').value==='rect'?number('orig-l',30):number('orig-d',26),number('orig-w',10));
const target=()=>el('combinator-mode').value==='double'?area('round',number('combo-d1',20))+area('round',number('combo-d2',16)):area(el('target-shape').value,el('target-shape').value==='rect'?number('target-l',25):number('target-d',20),number('target-w',11));
const factor=()=>target()/Math.max(orig(),1)*number('bs-height',4)/Math.max(number('bs-original-height',4),.1);
const parsed=()=>el('recipe-input').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map(s=>{const m=s.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|TL|EL|Pck\.?|Stück|Eier?|Prisen?)?\s*(.*)$/i);return m?{qty:Number(m[1].replace(',','.')),unit:m[2]||'',name:m[3]||m[2]||'Zutat'}:{name:s}});
const adjusted=i=>{const v=i.qty*factor(),u=i.unit||'';let result=v;if(el('bs-practical').checked){result=/^(kg|l)$/i.test(u)?Math.round(v*100)/100:/^(ei|eier|stück|pck\.?)$/i.test(u)?Math.round(v*2)/2:/^(tl|el)$/i.test(u)?Math.round(v*4)/4:/^(g|ml)$/i.test(u)?v>=100?Math.round(v/5)*5:Math.round(v):Math.round(v*10)/10;}return result.toLocaleString('de-DE',{maximumFractionDigits:/^(kg|l)$/i.test(u)?2:1})+' '+u+(i.name.toLowerCase()===u.toLowerCase()?'':' '+i.name)};
const amazon=q=>'https://www.amazon.de/s?k='+encodeURIComponent(q)+'&tag='+TAG;
const make=(tag,where,content)=>{const n=document.createElement(tag);if(content!==undefined)n.textContent=content;where.append(n);return n};
const pantryKey=i=>(i.unit+'|'+i.name).trim().toLocaleLowerCase('de-DE');
function missingIngredients(){
 return parsed().filter(i=>Number.isFinite(i.qty)&&i.qty>0).flatMap(i=>{
  const available=data.pantry[pantryKey(i)];
  if(available===undefined||available==='')return [];
  const need=i.qty*factor(),difference=need-Number(available);
  if(!Number.isFinite(difference)||difference<=.0001)return [];
  return [{title:fmt(Math.ceil(difference*10)/10)+' '+i.unit+' '+i.name,query:i.name}];
 });
}
function renderMissing(){
 const root=el('bs-missing');if(!root)return;root.replaceChildren();
 const missing=missingIngredients();
 if(!missing.length){make('p',root,ui('Noch keine fehlenden Zutaten ermittelt. Gib deine Vorräte ein; nicht erfasste Zutaten gelten als unbekannt.','No missing ingredients identified yet. Enter your pantry quantities; unlisted ingredients are treated as unknown.'));return}
 for(const item of missing)make('p',root,ui('Fehlt: ','Missing: ')+item.title);
}
function queue(items){
 const clean=items.filter(i=>i&&typeof i.title==='string'&&i.title.trim()).map(i=>({title:i.title.trim().slice(0,180),query:String(i.query||i.title).trim().slice(0,120)})).slice(0,50);
 if(!clean.length)return message(ui('Bitte zuerst Zutaten eingeben.','Enter ingredients first.'));
 const existing=new Set(data.shopping.map(i=>i.title.toLocaleLowerCase('de-DE')));
 let count=0;
 for(const item of clean){if(data.shopping.length>=150)break;if(existing.has(item.title.toLocaleLowerCase('de-DE')))continue;
  data.shopping.push({id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),title:item.title,query:item.query,done:false});
  existing.add(item.title.toLocaleLowerCase('de-DE'));count++;
 }
 save();renderShopping();message(count?count+ui(' Artikel zur Backstudio-Einkaufsliste hinzugefügt. Jeder Artikel hat einen Amazon-Suchbutton.',' items added to your Backstudio shopping list. Each item has an Amazon search button.'):ui('Diese Artikel stehen bereits auf deiner Einkaufsliste.','These items are already on your shopping list.'));
}
function renderShopping(){
 const root=el('bs-shopping-items');if(!root)return;root.setAttribute('data-user-content','');root.replaceChildren();
 if(!data.shopping.length){make('p',root,ui('Deine Einkaufsliste ist leer.','Your shopping list is empty.'));return}
 for(const item of data.shopping){
  const row=make('div',root);row.className='bs-row';
  const label=make('label',row);label.style.display='flex';label.style.alignItems='center';label.style.gap='7px';label.style.flex='1';
  const check=make('input',label);check.type='checkbox';check.checked=!!item.done;check.style.width='auto';check.setAttribute('aria-label',item.title+ui(' erledigt',' completed'));
  check.onchange=()=>{item.done=check.checked;save();renderShopping()};
  const name=make('span',label,item.title);if(item.done)name.style.textDecoration='line-through';
  const a=make('a',row,'🔎 Amazon · Anzeige');a.href=amazon(item.query||item.title);a.target='_blank';a.rel='noopener noreferrer sponsored';a.title='Anzeige – Amazon-Partnerlink mit Partner-ID';
  const del=make('button',row,'×');del.type='button';del.setAttribute('aria-label',item.title+ui(' entfernen',' remove'));del.onclick=()=>{data.shopping=data.shopping.filter(x=>x.id!==item.id);save();renderShopping()};
 }
}
function exportShopping(){
 if(!data.shopping.length)return message(ui('Die Backstudio-Einkaufsliste ist noch leer.','Your Backstudio shopping list is empty.'));
 const lines=[ui('Toolya Backstudio – Einkaufsliste','Toolya Backstudio – Shopping list'),ui('Erstellt: ','Created: ')+new Date().toLocaleString(langEn()?'en-GB':'de-DE'),'',
  ...data.shopping.map(x=>(x.done?'[x] ':'[ ] ')+x.title),'',ui('Amazon-Suchlinks auf toolya.app verwenden die Partner-ID ','Amazon search links on toolya.app use affiliate ID ')+TAG+'.'];
 const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'});
 const href=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=href;link.download=ui('toolya-backstudio-einkaufsliste.txt','toolya-backstudio-shopping-list.txt');document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(href),1000);
 message(ui('Backstudio-Einkaufsliste als Textdatei exportiert.','Backstudio shopping list exported as a text file.'));
}
function renderSchedule(){
 const host=el('bs-schedule');if(!host)return;
 const value=el('bs-serving').value;
 if(!value){host.textContent=ui('Wähle eine Uhrzeit für das Servieren.','Choose a serving date and time.');return}
 const serving=new Date(value);if(!Number.isFinite(serving.getTime())){host.textContent=ui('Bitte ein gültiges Datum wählen.','Choose a valid date.');return}
 const prep=Number(el('bs-prep').value),cool=Number(el('bs-cool').value),base=Number(el('base-time').value);
 if(![prep,cool,base].every(Number.isFinite)||prep<0||cool<0||base<=0||prep>1440||cool>1440||base>1440){
  host.textContent=ui('Bitte gültige Zeiten in Minuten eingeben (0–1440, Backzeit größer 0).','Enter valid times in minutes (0–1440; baking time must exceed 0).');return
 }
 const minutesBefore=prep+base+cool;
 const start=new Date(serving.getTime()-minutesBefore*60000);
 const oven=new Date(start.getTime()+prep*60000);
 const finish=new Date(oven.getTime()+base*60000);
 const local=d=>d.toLocaleString(langEn()?'en-GB':'de-DE',{dateStyle:'short',timeStyle:'short'});
 host.replaceChildren();
 for(const [label,date] of [[ui('Vorbereitung beginnen','Start preparation'),start],[ui('Backen beginnen','Start baking'),oven],[ui('Backen voraussichtlich fertig','Estimated baking completion'),finish],[ui('Servieren','Serve'),serving]]){
  const p=make('p',host);make('strong',p,label+': ');make('span',p,local(date))
 }
 make('p',host,ui('Planung auf Basis der Rezept-Backzeit und deiner Vorbereitungs- und Abkühlzeiten. Garprobe und echte Backdauer haben Vorrang.','Schedule based on recipe baking time, preparation and cooling. Check doneness and actual baking time before serving.'));
}
function renderGarage(){
 const root=el('bs-garage-items');root.replaceChildren();const ideal=orig()*number('bs-original-height',4)/number('bs-height',4);
 const pans=data.pans.map((p,index)=>({p,index,score:Math.abs((p.shape==='volume'?p.a/(number('bs-height',4)*10):p.shape==='muffin'?p.a*38:area(p.shape,p.a,p.b))-ideal)/Math.max(ideal,1)})).sort((a,b)=>a.score-b.score);
 if(!pans.length)make('p',root,ui('Noch keine eigenen Formen gespeichert.','No pans saved yet.'));
 for(const row of pans){const div=make('div',root);div.className='bs-row';const p=row.p;
 make('span',div,(row===pans[0]?'★ ':'')+(p.shape==='round'?'Rund Ø '+p.a:p.shape==='rect'?'Eckig '+p.a+' × '+p.b:p.shape==='volume'?'Spezial '+p.a+' ml':'Muffins '+p.a)+' · Abweichung '+fmt(row.score*100)+' %');
 const use=make('button',div,ui('Wählen','Select'));use.type='button';use.onclick=()=>{if(p.shape==='volume'||p.shape==='muffin'){el('bs-special').value=p.shape==='volume'?p.a:p.a*100;update();return message('Volumen in den Spezialformen-Rechner übernommen.')}el('combinator-mode').value='single';window.toggleCombinator();el('target-shape').value=p.shape;window.updateShapeInputs('target');if(p.shape==='round')el('target-d').value=p.a;else{el('target-l').value=p.a;el('target-w').value=p.b}window.calculateAll();update()};
 const del=make('button',div,'×');del.type='button';del.setAttribute('aria-label',ui('Form entfernen','Remove pan'));del.onclick=()=>{data.pans.splice(row.index,1);save();renderGarage()};
 }
}
function renderPantry(){
 const root=el('bs-pantry');root.replaceChildren();
 for(const i of parsed().filter(x=>x.qty>0)){
  const key=pantryKey(i),label=make('label',root,i.name+' ('+fmt(i.qty*factor())+' '+i.unit+ui(' für deine Form benötigt)',' needed for your pan')+')');
  const input=make('input',label);input.type='number';input.min='0';input.step='any';input.placeholder=ui('Mein Vorrat (','In my pantry (')+i.unit+')';input.dataset.original=i.qty;
  input.dataset.pantryKey=key;input.value=data.pantry[key]??'';
  input.addEventListener('input',()=>{
   if(input.value===''||!Number.isFinite(Number(input.value))||Number(input.value)<0)delete data.pantry[key];
   else data.pantry[key]=Number(input.value);
   save();update();
  });
 }
}
function update(){
 if(!(orig()>0&&target()>0))return;
 const f=factor(),h=number('bs-height',4),ph=number('bs-form-height',7),liters=number('bs-volume',1.5),fill=liters*1000/Math.max(target()*ph*10,1),percent=fill*100;
 el('bs-fillbar').style.height=Math.max(0,Math.min(percent,100))+'%';
 el('bs-fillbar').style.background=percent>75?'#ea580c':'#0d9488';
 el('bs-filltext').textContent=fmt(percent)+' % rechnerische Füllhöhe · '+(percent>75?'Achtung, mögliche Überfüllung!':'Füllhöhe auf Grundlage gerader Wände geschätzt.');
 el('bs-ratio').textContent='Umrechnungsfaktor mit Wunschhöhe: ×'+fmt(f);
 const box=el('bs-scaled');box.setAttribute('data-user-content','');box.replaceChildren();
 for(const i of parsed()){const row=make('div',box);row.className='bs-row';make('span',row,i.qty===undefined?i.name:adjusted(i));
 if(i.qty===undefined)continue;
 const btn=make('button',row,'🛒');btn.title=ui('Zur Einkaufsliste','Add to shopping list');btn.type='button';btn.onclick=()=>queue([{title:adjusted(i),query:i.name}]);
 const a=make('a',row,'Amazon ↗ · Anzeige');a.href=amazon(i.name);a.target='_blank';a.rel='noopener noreferrer sponsored';a.title='Anzeige – Amazon-Partnerlink';
 }
 const remaining=liters*1000-target()*ph*10*number('bs-maxfill',.7);
 el('bs-leftover').textContent=remaining>0?'Ca. '+fmt(remaining)+' ml mehr Teig als die eingestellte empfohlene Füllgrenze. Das entspricht ungefähr '+fmt(remaining/100)+' Muffinförmchen à 100 ml.':'Teigmenge liegt innerhalb der eingestellten Füllgrenze (rechnerische Näherung).';
 const minutes=number('base-time',45),mat=el('bs-material').value,kind=el('bs-dough').value;
 const center=Math.max(5,minutes+(Math.sqrt(h/number('bs-original-height',4))-1)*minutes*.35+(mat==='glass'?5:mat==='dark'?-3:0));
 el('bs-oven').textContent='Ab ca. '+fmt(Math.max(5,center-12))+'–'+fmt(center+12)+' Minuten prüfen · '+(kind==='cheese'?'Wackelprobe':kind==='yeast'?'Klopfprobe':'Stäbchenprobe')+'. Unverbindliche Schätzung, Ofen und Rezept sind entscheidend.';
 const n=number('bs-layers',3);el('bs-layers-result').textContent=n+' Böden à ca. '+fmt(h/n)+' cm · '+fmt((n-1)*number('bs-filling',200))+' g Füllung für '+(n-1)+' Schichten.';
 el('bs-special-result').textContent='Volumenfaktor gegenüber Original (bei gleicher Füllhöhe): ×'+fmt(number('bs-special',1500)/(orig()*number('bs-original-height',4)*10));
 const portions=[...el('bs-pantry').querySelectorAll('input')].filter(i=>i.value!==''&&Number(i.value)>=0).map(i=>Number(i.value)/Number(i.dataset.original));
 el('bs-pantry-result').textContent=portions.length?'Dein Vorrat ermöglicht maximal ×'+fmt(Math.min(...portions))+' des ursprünglichen Rezepts.':'Vorratsmenge für mindestens eine Zutat eintragen.';
 renderMissing();
 const heightWarning=el('bs-height-warning');if(heightWarning)heightWarning.textContent=h>ph*number('bs-maxfill',.7)?'Achtung: Die gewünschte Teighöhe ist größer als die eingestellte Füllgrenze der Backform.':'Wunschhöhe innerhalb der eingestellten Füllgrenze (bei geraden Wänden).';
}
function logs(){const root=el('bs-logs');root.replaceChildren();data.logs.slice(-12).reverse().forEach(x=>make('p',root,x.date+' · '+x.name+' · '+x.minutes+' Min. · '+x.note))}
window.toolyaBackstudioRenderLogs=logs;
function init(){
 const root=el('tab-rechner');if(!root)return;
 const host=document.createElement('section');host.id='toolya-backstudio';
 host.innerHTML='<h2>🍰 Toolya Backstudio</h2><p>Alles für deinen Kuchen auf einen Blick.</p><div class="bs-grid">'+
 '<article><h3>1 · Meine Backformen</h3><label>Typ<select id="bs-pan-shape"><option value="round">Rund</option><option value="rect">Rechteck</option><option value="volume">Spezialform (ml)</option><option value="muffin">Muffinmulden</option></select></label><label>Durchmesser / Länge / ml / Anzahl<input id="bs-pan-a" type="number" min="1" value="24"></label><label>Breite bei Rechteck<input id="bs-pan-b" type="number" min="1" value="12"></label><button id="bs-pan-save">Form speichern</button><div id="bs-garage-items"></div></article>'+
 '<article><h3>2 · Wie voll wird die Form?</h3><div class="bs-tank" role="img" aria-label="Schematischer Füllstand"><div id="bs-fillbar"></div></div><label>Teigmenge (Liter)<input id="bs-volume" type="number" min=".1" step=".1" value="1.5"></label><label>Höhe der Form (cm)<input id="bs-form-height" type="number" min="1" value="7"></label><label>Wie voll darf die Form sein?<select id="bs-maxfill"><option value=".6">60 %</option><option value=".7" selected>70 %</option><option value=".75">75 %</option></select></label><p id="bs-filltext"></p></article>'+
 '<article><h3>3 · Zutaten</h3><label><input id="bs-practical" type="checkbox" checked> Mengen einfach runden</label><p id="bs-ratio"></p><div id="bs-scaled"></div><button id="bs-shopping-all">Zutaten auf die Einkaufsliste</button><p class="bs-hint">Mit Amazon-Suche bei jeder Zutat (Anzeige).</p></article>'+
 '<article><h3>4 · Backzeit</h3><label>Teig<select id="bs-dough"><option value="sponge">Rührteig / Biskuit</option><option value="yeast">Hefeteig</option><option value="cheese">Käsekuchen</option></select></label><label>Material<select id="bs-material"><option value="metal">Helles Metall</option><option value="dark">Dunkles Metall</option><option value="glass">Glas / Keramik</option></select></label><p id="bs-oven"></p></article>'+
 '<article><h3>5 · Rezeptfoto</h3><p>Füge ein Rezept ein oder wähle ein Foto.</p><input id="bs-photo" type="file" accept="image/*"><button id="bs-ocr">Foto auslesen</button><button id="bs-refresh">Text analysieren</button><p class="bs-hint">Foto wird im Browser gelesen. Bitte Zutaten prüfen.</p></article>'+
 '<article><h3>6 · Teig übrig?</h3><p id="bs-leftover"></p></article>'+
 '<article><h3>7 · Torte stapeln</h3><label>Böden<input id="bs-layers" type="number" min="1" max="12" value="3"></label><label>Füllung pro Schicht (g)<input id="bs-filling" type="number" min="0" value="200"></label><p id="bs-layers-result"></p></article>'+
 '<article><h3>8 · Besondere Formen</h3><p>Fülle die Form mit Wasser und miss die Menge.</p><label>Wassermenge in der Form (ml)<input id="bs-special" type="number" min="1" value="1500"></label><p id="bs-special-result"></p></article>'+
 '<article><h3>9 · Mein Vorrat</h3><div id="bs-pantry"></div><p id="bs-pantry-result"></p><div id="bs-missing" aria-live="polite"></div><button id="bs-add-missing" type="button">Fehlende Zutaten einkaufen</button><p class="bs-hint">Trage ein, was du zu Hause hast.</p></article>'+
 '<article><h3>10 · Kuchenhöhe</h3><label>Bisherige Kuchenhöhe (cm)<input id="bs-original-height" type="number" min=".5" step=".5" value="4"></label><label>So hoch soll er werden (cm)<input id="bs-height" type="number" min=".5" step=".5" value="4"></label><p id="bs-height-warning" role="status"></p></article>'+
 '<article><h3>11 · Meine Einkaufsliste</h3><p>Nur für deine Backzutaten. Bei jedem Artikel kannst du auf Amazon suchen (Anzeige).</p><label>Weitere Zutat<input id="bs-shopping-custom" type="text" maxlength="180" placeholder="z. B. Vanillezucker"></label><button id="bs-shopping-add">Artikel hinzufügen</button><div id="bs-shopping-items"></div><p class="bs-hint">Deine Liste bleibt auf diesem Gerät.</p></article>'+
 '<article><h3>12 · Meine Backnotizen</h3><label>Notiz<textarea id="bs-note" rows="2"></textarea></label><label>So lange hat es gedauert<input id="bs-time" type="number" min="1" value="45"></label><button id="bs-log">Backzeit merken</button><div id="bs-logs"></div><p class="bs-hint">Deine Notizen bleiben auf diesem Gerät.</p></article>'+
 '<article><h3>13 · Wann fange ich an?</h3><label>Wann soll der Kuchen serviert werden?<input id="bs-serving" type="datetime-local"></label><label>Vorbereitung (Min.)<input id="bs-prep" type="number" min="0" max="1440" value="25"></label><label>Abkühlen / Ruhen (Min.)<input id="bs-cool" type="number" min="0" max="1440" value="60"></label><div id="bs-schedule" aria-live="polite"></div><p class="bs-hint">Die Zeiten sind nur Richtwerte.</p></article>'+
 '<article><h3>14 · Liste speichern</h3><p>Nimm deine Einkaufsliste als Datei mit.</p><button id="bs-shopping-export" type="button">Liste herunterladen</button><p class="bs-hint">Amazon-Suche findest du direkt in der Liste (Anzeige).</p></article>'+
 '</div><p id="bs-message" role="status" aria-live="polite">Bereit.</p>';
 root.append(host);
 const css=document.createElement('style');css.textContent='#toolya-backstudio{margin-top:25px;background:white;padding:22px;border:1px solid #fed7aa;border-radius:18px}#toolya-backstudio h2{font-weight:800;font-size:1.4rem}#toolya-backstudio h3{font-weight:700;margin-bottom:8px}#toolya-backstudio .bs-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;margin-top:12px}#toolya-backstudio article{padding:15px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;min-width:0}#toolya-backstudio label{display:grid;gap:3px;font-size:13px;margin:8px 0}#toolya-backstudio input:not([type=checkbox]),#toolya-backstudio select,#toolya-backstudio textarea{width:100%;padding:7px;border:1px solid #94a3b8;border-radius:8px;background:white}#toolya-backstudio button{background:#c2410c;color:white;border-radius:8px;padding:7px 10px;font-size:12px;margin:3px;cursor:pointer}#toolya-backstudio a{color:#9a3412;text-decoration:underline;font-size:12px}#toolya-backstudio p{font-size:13px;margin:7px 0}#toolya-backstudio .bs-row{display:flex;flex-wrap:wrap;align-items:center;gap:4px;padding:5px 0;border-bottom:1px solid #fed7aa}#toolya-backstudio .bs-row span{flex:1;min-width:100px;font-size:12px}#toolya-backstudio .bs-tank{width:100px;height:140px;border:6px solid #94a3b8;border-radius:12px;position:relative;overflow:hidden;margin:auto}#bs-fillbar{position:absolute;bottom:0;left:0;width:100%;background:#0d9488}#toolya-backstudio .bs-hint{font-size:11px;color:#64748b}#bs-message{background:#ffedd5;padding:10px;border-radius:8px}';document.head.append(css);
 el('bs-pan-save').onclick=()=>{const shape=el('bs-pan-shape').value,a=number('bs-pan-a'),b=number('bs-pan-b');if(!(a>0)||shape==='rect'&&!(b>0)||data.pans.length>=40)return message('Gültige Maße eingeben (max. 40 Formen).');data.pans.push({shape,a,b});save();renderGarage()};
 el('bs-shopping-all').onclick=()=>queue(parsed().filter(x=>x.qty!==undefined).map(i=>({title:adjusted(i),query:i.name})));
 el('bs-add-missing').onclick=()=>queue(missingIngredients());
 el('bs-shopping-add').onclick=()=>{const input=el('bs-shopping-custom'),title=input.value.trim();if(!title)return message(ui('Bitte einen Artikel eingeben.','Enter an item.'));queue([{title,query:title}]);input.value=''};
 el('bs-shopping-export').onclick=exportShopping;
 ['bs-serving','bs-prep','bs-cool','base-time'].forEach(id=>el(id)?.addEventListener('input',renderSchedule));

 el('bs-refresh').onclick=()=>{renderPantry();update();message(ui('Rezept neu analysiert.','Recipe analysed again.'))};
 el('bs-log').onclick=()=>{const n=number('bs-time');if(n<1||n>3000)return message(ui('Ungültige Backzeit.','Invalid baking time.'));data.logs.push({date:new Date().toLocaleDateString('de-DE'),name:(el('recipe-name').value||'Mein Kuchen').slice(0,80),minutes:n,note:el('bs-note').value.slice(0,250)});data.logs=data.logs.slice(-30);save();logs();message(ui('Backerfahrung lokal gespeichert.','Baking notes saved on this device.'))};
 el('bs-ocr').onclick=async()=>{const file=el('bs-photo').files?.[0];if(!file)return message(ui('Bitte Foto auswählen.','Select a photo.'));if(file.size>8*1024*1024)return message(ui('Foto darf maximal 8 MB groß sein.','Photo must be 8 MB or smaller.'));const btn=el('bs-ocr');btn.disabled=true;message(ui('Foto wird lokal analysiert …','Analysing the photo on your device…'));try{if(!window.Tesseract){const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=reject;document.head.append(script)})}const r=await window.Tesseract.recognize(file,'deu');el('recipe-input').value=r.data.text;renderPantry();update();message(ui('Erkanntes Rezept unbedingt prüfen.','Check the recognised recipe carefully.'))}catch{message(ui('Foto-Erkennung nicht verfügbar; Text bitte einfügen.','Photo recognition unavailable; paste the recipe text instead.'))}finally{btn.disabled=false}};
 ['bs-height','bs-original-height','bs-volume','bs-form-height','bs-maxfill','bs-dough','bs-material','bs-layers','bs-filling','bs-special','bs-practical'].forEach(id=>el(id).addEventListener('input',()=>{renderPantry();renderGarage();update()}));
 ['orig-shape','orig-d','orig-l','orig-w','target-shape','target-d','target-l','target-w','combo-d1','combo-d2','base-time','recipe-input'].forEach(id=>el(id)?.addEventListener('input',()=>{renderGarage();renderPantry();update()}));
 renderGarage();renderPantry();renderShopping();logs();update();renderSchedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();