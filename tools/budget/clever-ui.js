/* Toolya Clever sparen: simple, accessible household workflows.
   Reads verified Toolya cloud snapshot only; never accesses WG data. */
(function(){
'use strict';
const C=window.ToolyaBudgetCleverCore;
if(!C)return;
const $=id=>document.getElementById(id);
const e=(tag,parent,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;if(parent)parent.append(n);return n};
const text=(p,s,cls='')=>e('p',p,cls,String(s));
const section=(p,heading,subtitle)=>{const card=e('section',p,'cs-card');e('h3',card,'',heading);if(subtitle)text(card,subtitle,'cs-muted');return card};
const button=(p,label,fn,kind='')=>{const el=e('button',p,'cs-button '+kind,label);el.type='button';el.addEventListener('click',fn);return el};
const field=(p,label,type='text',value='',opts={})=>{const w=e('label',p,'cs-field');e('span',w,'cs-label',label);const x=e('input',w);x.type=type;x.value=value;if(opts.min!==undefined)x.min=opts.min;if(opts.max!==undefined)x.max=opts.max;if(opts.step!==undefined)x.step=opts.step;if(opts.placeholder)x.placeholder=opts.placeholder;x.autocomplete='off';return x};
const select=(p,label,items)=>{const w=e('label',p,'cs-field');e('span',w,'cs-label',label);const sel=e('select',w);for(const [val,name] of items){const opt=e('option',sel,'',name);opt.value=String(val)}return sel};
const date=new Date();
const safeArray=x=>Array.isArray(x)?x.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)): [];
const defaultState=()=>({weeklyBudget:null,shopping:[],annual:[],meals:[],repairs:[]});
const asState=s=>({weeklyBudget:s&&s.weeklyBudget!=null?Number(s.weeklyBudget):null,
 shopping:safeArray(s?.shopping).slice(0,150),annual:safeArray(s?.annual).slice(0,80),
 meals:safeArray(s?.meals).slice(0,60),repairs:safeArray(s?.repairs).slice(0,150)});
const id=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
let active='overview',busy=false,receiptItems=[],receiptEditing=false,initialized=false;
const bridge=()=>window.toolyaCleverBudget;
const snapshot=()=>{try{return bridge()?.snapshot()||null}catch{return null}};
const getState=()=>asState(snapshot()?.cleverSparen);
const entries=()=>C.validEntries(snapshot()?.entries);
const priceMap=()=>C.prices(entries());
const money=C.euro;
function setStatus(message,error=false){const el=$('cs-status');if(!el)return;el.textContent=message;el.dataset.error=String(error)}
async function save(change){
 if(busy)return;
 if(!snapshot())return setStatus('Bitte erst im Haushaltsbuch anmelden.',true);
 busy=true;const root=$('cs-root');root?.setAttribute('aria-busy','true');
 try{
  const next=getState();change(next);
  if(!await bridge().save({cleverSparen:next})){setStatus('Speichern nicht bestätigt. Bitte neu anmelden.',true);return}
  setStatus('Gespeichert.');
  render();
 }catch(err){setStatus('Konnte nicht gespeichert werden. Bitte noch einmal versuchen.',true)}
 finally{busy=false;root?.removeAttribute('aria-busy')}
}
function mount(){
 if(initialized)return;
 const root=$('cs-root');if(!root)return;
 initialized=true;root.classList.add('cs-shell');
 const hero=e('div',root,'cs-hero');
 const top=e('div',hero,'cs-hero-copy');e('span',top,'cs-eyebrow','💚 NEU IM HAUSHALTSBUCH');
 e('h2',top,'','Clever sparen');text(top,'Dein Geld im Blick. Ohne Rechnen.','cs-hero-subtitle');
 e('span',hero,'cs-hero-art','🧺');
 const tabs=e('nav',root,'cs-nav');tabs.setAttribute('aria-label','Clever-sparen-Bereiche');
 const items=[['overview','🏠 Überblick'],['shopping','🛒 Einkaufen'],['planning','📅 Planen'],['checking','🔎 Prüfen']];
 for(const [key,label] of items){
  const b=button(tabs,label,()=>{active=key;render()},'cs-tab');b.dataset.page=key;
  b.setAttribute('aria-controls','cs-panel');b.setAttribute('aria-pressed',key==='overview'?'true':'false')
 }
 const status=e('p',root,'cs-status');status.id='cs-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const panel=e('div',root,'cs-panel');panel.id='cs-panel';
 mountReceiptEditor();
 render();
}
function render(){
 const root=$('cs-root');if(!root||!initialized)return;
 root.querySelectorAll('.cs-tab').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.page===active)));
 const host=$('cs-panel');host.replaceChildren();
 const current=snapshot();
 if(!current){const c=section(host,'Bitte anmelden','Deine Zahlen erscheinen erst nach dem Laden deines Kontos.');return}
 const data=getState(),records=entries(),prices=priceMap();
 if(active==='shopping')renderShopping(host,data,prices);
 else if(active==='planning')renderPlanning(host,data,records);
 else if(active==='checking')renderChecking(host,data,records,prices);
 else renderOverview(host,data,records,prices);
}
function metric(parent,label,value,note=''){
 const card=e('div',parent,'cs-metric');text(card,label,'cs-metric-label');e('strong',card,'cs-metric-value',value);if(note)text(card,note,'cs-small');return card;
}
function renderOverview(host,data,records,prices){
 const w=C.weekly(records,data.weeklyBudget),trend=C.monthCompare(records),shop=C.listEstimate(data.shopping.filter(x=>x.done!==true),prices);
 const due=C.upcomingAnnual(data.annual)[0];
 const metrics=e('div',host,'cs-metrics');
 metric(metrics,'Diese Woche noch',w.remaining==null?'–':money(w.remaining),w.remaining==null?'Wochenbudget festlegen':'Nach bekannten Ausgaben');
 metric(metrics,'Nächster Einkauf',data.shopping.some(x=>x.done!==true)?money(shop.total):'–',data.shopping.some(x=>x.done!==true)?(shop.missing?shop.missing+' Preise fehlen':'Aus deinen Preisen'):'Einkaufsliste anlegen');
 metric(metrics,'Im Vergleich',trend.hasPrior?money(trend.difference):'–',trend.hasPrior?'Mehr (+) oder weniger (−)':'Noch zu wenig Buchungen');
 metric(metrics,'Jahreskosten',data.annual.length?money(data.annual.reduce((x,y)=>x+Number(y.amount||0),0)/12):'–',data.annual.length?'Monatlich zurücklegen':'Jahreskosten eintragen');
 const grid=e('div',host,'cs-grid-two');
 const week=section(grid,'Was kann ich diese Woche ausgeben?','So steht es um dein Wochenbudget.');
 if(w.remaining===null){
  text(week,'Lege zuerst dein Wochenbudget fest.','cs-soft');
  button(week,'Wochenbudget festlegen',()=>switchPage('planning'));
 }else{
  e('strong',week,'cs-big',money(w.spent)+' ausgegeben');
  const used=Math.max(0,Math.min(100,(w.spent+w.reserved)/w.limit*100));
  const bar=e('progress',week,'cs-budget-progress');bar.max=100;bar.value=used;
  bar.setAttribute('aria-label','Genutzter Anteil deines Wochenbudgets');
  text(week,'Noch übrig: '+money(w.remaining)+' · Rechnungen: '+money(w.reserved),'cs-muted');
  if(w.pending.length)for(const item of w.pending.slice(0,3))text(week,'Bald fällig: '+item.title+' · '+money(item.price),'cs-small');
  text(week,'Die Angaben sind nur ein Richtwert.','cs-small');
 }
 const tip=section(grid,'Dein Spartipp','Tipps aus deinen Ausgaben.');
 if(!trend.hasPrior)text(tip,'Mit zwei Monaten an Ausgaben kann Toolya dir erste Spartipps zeigen.','cs-soft');
 else{
  const rising=trend.categories.find(x=>x.now>x.previous&&x.previous>0);
  text(tip,rising?'Für '+rising.name+' hast du '+money(rising.now-rising.previous)+' mehr ausgegeben als im Vergleichszeitraum.':'Deine Ausgaben sind im Vergleich zum Vormonat nicht gestiegen.','cs-soft');
  button(tip,'Ausgaben vergleichen',()=>switchPage('checking'),'cs-outline');
 }
 const shortcuts=e('div',host,'cs-shortcuts');
 for(const [icon,label,page] of [['🧾','Preise merken','shopping'],['🥘','Essen berechnen','shopping'],['🎄','Jahreskosten','planning'],['🔎','Buchungen prüfen','checking']]){
  button(shortcuts,icon+'  '+label,()=>switchPage(page),'cs-shortcut');
 }
 if(due)text(host,'Nächster geplanter Termin: '+due.name+' am '+due.due+' ('+money(Number(due.amount))+').','cs-bottom-tip');
}
function switchPage(page){active=page;render();$('cs-root')?.scrollIntoView({behavior:'smooth',block:'start'})}
function itemRow(parent,item,onDelete){
 const row=e('div',parent,'cs-item');
 e('strong',row,'',item.name);
 e('span',row,'cs-small',item.unit?item.unit:'');
 if(onDelete)button(row,'Entfernen',onDelete,'cs-quiet');
 return row;
}
function renderShopping(host,data,priceMap){
 const grid=e('div',host,'cs-grid-two');
 const memory=section(grid,'Deine Preise','Preise aus deinen gespeicherten Kassenbons.');
 const history=C.priceSummary(priceMap).slice(0,30);
 if(!history.length)text(memory,'Noch keine Einzelpreise. Scanne einen Kassenbon und prüfe seine Artikel.','cs-soft');
 else{
  const search=field(memory,'Artikel suchen','search','',{placeholder:'Zum Beispiel Butter'});
  const list=e('div',memory,'cs-scroll');
  function draw(){list.replaceChildren();const matches=history.filter(x=>C.normal(x.name).includes(C.normal(search.value)));
   if(!matches.length)text(list,'Kein Artikel gefunden.','cs-muted');
   for(const p of matches.slice(0,16)){
    const row=e('div',list,'cs-price-row');
    const details=e('span',row);e('strong',details,'',p.name);text(details,(p.store||'Geschäft nicht angegeben')+' · '+p.date+' · je '+p.unit,'cs-small');
    const value=e('span',row,'cs-price-value',money(p.unitPrice));
    if(p.change!==null)text(value.parentElement,(p.change>0?'▲ +':p.change<0?'▼ ':'= ')+money(p.change)+' zum letzten Mal','cs-price-change');
   }
  }
  search.addEventListener('input',draw);draw();
 }
 const list=section(grid,'Dein nächster Einkauf','So viel kostet die Einkaufsliste ungefähr.');
 const form=e('form',list,'cs-inline');const name=field(form,'Artikel','text','',{placeholder:'z. B. Milch 1 l'}),quantity=field(form,'Anzahl','number','1',{min:0,step:0.25});
 const price=field(form,'Eigener Preis (optional)','number','',{min:0,step:0.01});
 const submit=e('button',form,'cs-button cs-primary','+ Zur Liste');submit.type='submit';
 form.addEventListener('submit',ev=>{
  ev.preventDefault();const nameValue=name.value.trim(),q=Number(quantity.value),own=price.value===''?null:Number(price.value);
  if(!nameValue||nameValue.length>100||!Number.isFinite(q)||q<=0||q>1000||own!==null&&(!Number.isFinite(own)||own<=0||own>100000))return setStatus('Bitte Artikel und Anzahl prüfen.',true);
  void save(s=>{if(s.shopping.length>=150)throw Error('limit');s.shopping.push({id:id(),name:nameValue,unit:'Stück',quantity:q,price:own})});
 });
 const pendingShopping=data.shopping.filter(item=>item.done!==true);
 const estimate=C.listEstimate(pendingShopping,priceMap);
 if(!data.shopping.length)text(list,'Deine Liste ist noch leer.','cs-soft');
 else for(const row of data.shopping){
  const item=e('div',list,'cs-item');
  const tick=e('input',item);tick.type='checkbox';tick.checked=row.done===true;tick.setAttribute('aria-label',row.name+' eingekauft');
  tick.addEventListener('change',()=>save(s=>{const match=s.shopping.find(x=>x.id===row.id);if(match)match.done=tick.checked}));
  const name=e('strong',item,'',row.name);if(row.done)name.className='cs-done';
  const estimate=C.listEstimate([row],priceMap).rows[0];
  text(item,'× '+row.quantity+' · '+(estimate.value===null?'Preis noch unbekannt':money(estimate.value)),'cs-item-value');
  button(item,'Entfernen',()=>save(s=>{s.shopping=s.shopping.filter(x=>x.id!==row.id)}),'cs-quiet');
 }
 e('strong',list,'cs-total','Bekannte Preise: '+money(estimate.total));
 if(estimate.missing)text(list,estimate.missing+' Artikel ohne Preis. Gesamtkosten können höher sein.','cs-warning');
 text(list,'Geschätzte Preise aus deinen Kassenbons.','cs-muted');
 const meal=section(host,'Was kostet unser Essen?','Wähle deine Zutaten aus der Preisliste.');
 const mealForm=e('form',meal,'cs-meal-form');
 const title=field(mealForm,'Gericht','text','',{placeholder:'z. B. Nudeln mit Soße'});
 const servings=field(mealForm,'Für wie viele Personen?','number','4',{min:1,step:1});
 const ingredients=e('div',mealForm,'cs-recipe-picker');
 e('h4',ingredients,'','Meine Zutaten');
 const ingredientForm=e('div',ingredients,'cs-inline');
 const ingredientName=field(ingredientForm,'Zutat','text','',{placeholder:'z. B. Nudeln 500g'});
 const datalist=e('datalist',ingredientForm);datalist.id='cs-price-suggestions';ingredientName.setAttribute('list',datalist.id);
 for(const p of C.priceSummary(priceMap).slice(0,180)){const option=e('option',datalist);option.value=p.name}
 const ingredientQty=field(ingredientForm,'Wie oft brauchst du es?','number','1',{min:0,step:.25});
 const selectedIngredients=[];const selectedHost=e('div',ingredients,'cs-recipe-selected');
 const drawSelected=()=>{selectedHost.replaceChildren();
  for(const [index,item] of selectedIngredients.entries()){
   const r=e('div',selectedHost,'cs-item');
   e('strong',r,'',item.name+' × '+item.quantity);
   button(r,'Entfernen',()=>{selectedIngredients.splice(index,1);drawSelected()},'cs-quiet');
  }
 };
 button(ingredientForm,'+ Zutat',()=>{
  const name=ingredientName.value.trim(),quantity=Number(ingredientQty.value);
  if(!name||!Number.isFinite(quantity)||quantity<=0||quantity>1000)return setStatus('Bitte Zutat und Anzahl eingeben.',true);
  if(selectedIngredients.length>=40)return setStatus('Maximal 40 Zutaten pro Gericht.',true);
  selectedIngredients.push({name:name.slice(0,100),quantity,unit:'Stück'});
  ingredientName.value='';ingredientQty.value='1';drawSelected();
 },'cs-outline');
 const saveMeal=e('button',mealForm,'cs-button cs-primary','Gericht speichern');saveMeal.type='submit';
 mealForm.addEventListener('submit',ev=>{
  ev.preventDefault();const name=title.value.trim(),n=Number(servings.value);
  if(!name||!selectedIngredients.length||!Number.isInteger(n)||n<1||n>60)return setStatus('Bitte Gericht, Personen und Zutaten prüfen.',true);
  void save(s=>{if(s.meals.length>=60)throw Error('limit');s.meals.push({id:id(),name:name.slice(0,80),servings:n,items:selectedIngredients.map(x=>({...x}))})});
 });
 if(!data.meals.length)text(meal,'Noch kein Gericht gespeichert.','cs-soft');
 for(const dish of data.meals){
  const cost=C.mealEstimate(dish,priceMap),row=e('div',meal,'cs-meal-row'),copy=e('div',row);
  e('strong',copy,'',dish.name);text(copy,Number(dish.servings)+' Personen · '+(cost.missing?cost.missing+' Preise fehlen':'Alle Preise bekannt'),'cs-small');
  e('strong',row,'',money(cost.total)+(cost.missing?' + ?':''));
  button(row,'Löschen',()=>save(s=>{s.meals=s.meals.filter(x=>x.id!==dish.id)}),'cs-quiet');
  if(!cost.missing)text(row,'Pro Person: '+money(cost.perServing),'cs-small');
 }
}
function renderPlanning(host,data,records){
 const grid=e('div',host,'cs-grid-two');
 const budget=section(grid,'Dein Geld bis Sonntag','So viel bleibt von deinem Wochenbudget übrig.');
 const weekly=C.weekly(records,data.weeklyBudget);
 const form=e('form',budget,'cs-inline');
 const weeklyField=field(form,'Mein Wochenbudget (€)','number',data.weeklyBudget??'',{min:0.01,step:1,placeholder:'z. B. 180'});
 const b=e('button',form,'cs-button cs-primary','Speichern');b.type='submit';
 form.addEventListener('submit',ev=>{ev.preventDefault();const n=Number(weeklyField.value);if(!Number.isFinite(n)||n<=0||n>1000000)return setStatus('Bitte einen Betrag über 0 € eingeben.',true);void save(s=>{s.weeklyBudget=n})});
 e('strong',budget,'cs-big',weekly.remaining===null?'–':money(weekly.remaining));
 text(budget,'Diese Woche ausgegeben: '+money(weekly.spent)+'. Bekannte Rechnungen: '+money(weekly.reserved)+'.','cs-muted');
 if(weekly.pending.length)for(const p of weekly.pending)text(budget,p.date+': '+p.title+' · '+money(p.price),'cs-small');
 text(budget,'Richtwert aus deinen Buchungen, kein Kontostand.','cs-muted');
 const afford=section(grid,'Kann ich mir das leisten?','Prüfe eine Anschaffung mit deinen vorhandenen Zahlen.');
 const cost=field(afford,'Was möchtest du ausgeben? (€)','number','',{min:.01,step:.01,placeholder:'z. B. 75'});
 const output=text(afford,'Betrag eingeben, um deinen Spielraum zu sehen.','cs-soft');
 cost.addEventListener('input',()=>{
  const price=Number(cost.value);if(!Number.isFinite(price)||price<=0){output.textContent='Bitte einen gültigen Preis eingeben.';return}
  const now=new Date(),start=C.monthStart(now),end=C.ISO(now);
  const earned=C.validEntries(records).filter(x=>x.date>=start&&x.date<=end&&!C.expense(x)).reduce((a,x)=>a+Number(x.price),0);
  const spent=C.period(records,start,end),balance=C.round(earned-spent-price);
  let message='Nach diesem Kauf blieben in deiner Monatsrechnung '+money(balance)+'.';
  if(weekly.remaining!=null)message+=' Vom Wochenbudget blieben '+money(weekly.remaining-price)+'.';
  output.textContent=message+' Kontostand und noch unbekannte Rechnungen sind nicht enthalten.';
 });
 const annual=section(host,'Fürs Jahr vorsorgen','Weihnachten, Versicherungen und andere Jahreskosten.');
 const annualForm=e('form',annual,'cs-annual-form');
 const name=field(annualForm,'Wofür?','text','',{placeholder:'z. B. Weihnachten'});
 const amount=field(annualForm,'Betrag (€)','number','',{min:0.01,step:.01});
 const month=select(annualForm,'In welchem Monat?',Array.from({length:12},(_,i)=>[i+1,new Date(2026,i,1).toLocaleString('de-DE',{month:'long'})]));
 const day=field(annualForm,'Am wievielten?','number','1',{min:1,max:31,step:1});
 const add=e('button',annualForm,'cs-button cs-primary','Eintragen');add.type='submit';
 annualForm.addEventListener('submit',ev=>{
  ev.preventDefault();const title=name.value.trim(),cost=Number(amount.value),d=Number(day.value);
  if(!title||!Number.isFinite(cost)||cost<=0||cost>10000000||!Number.isInteger(d)||d<1||d>31)return setStatus('Bitte alle Angaben prüfen.',true);
  void save(s=>{if(s.annual.length>=80)throw Error('limit');s.annual.push({id:id(),name:title.slice(0,90),amount:cost,month:Number(month.value),day:d})});
 });
 const items=C.upcomingAnnual(data.annual);
 if(!items.length)text(annual,'Noch keine Jahreskosten eingetragen.','cs-soft');
 else{
  const perMonth=items.reduce((s,i)=>s+Number(i.amount||0),0)/12;
  e('strong',annual,'cs-big',money(perMonth)+' / Monat');
  text(annual,'So viel könntest du jeden Monat zurücklegen.','cs-muted');
  for(const item of items){
   const row=e('div',annual,'cs-annual-row');
   const copy=e('div',row);e('strong',copy,'',item.name);text(copy,'Fällig: '+item.due+' · '+money(Number(item.amount)),'cs-small');
   button(row,'Kalender',()=>downloadReminder(item),'cs-outline');
   button(row,'Entfernen',()=>save(s=>{s.annual=s.annual.filter(x=>x.id!==item.id)}),'cs-quiet');
  }
 }
}
function downloadReminder(item){
 const date=item.due.replaceAll('-',''),next=new Date(item.due+'T12:00:00'),after=new Date(next.getFullYear(),next.getMonth(),next.getDate()+1),end=C.ISO(after).replaceAll('-','');
 const escapeText=x=>String(x).replaceAll('\\','\\\\').replaceAll('\n','\\n').replaceAll(',','\\,').replaceAll(';','\\;');
 const content=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Toolya//Haushaltsbuch//DE','BEGIN:VEVENT','UID:'+item.id+'@toolya.app','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+/,''),
  'DTSTART;VALUE=DATE:'+date,'DTEND;VALUE=DATE:'+end,'SUMMARY:'+escapeText(item.name),'DESCRIPTION:'+escapeText('Geplante Ausgabe: '+money(Number(item.amount))),'END:VEVENT','END:VCALENDAR'].join('\r\n');
 const blob=new Blob([content],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(blob),a=e('a',document.body);a.href=url;a.download='toolya-jahreskosten.ics';a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function renderChecking(host,data,records,priceMap){
 const grid=e('div',host,'cs-grid-two');
 const changes=C.monthCompare(records);
 const compare=section(grid,'Was ist teurer geworden?','So haben sich deine Ausgaben verändert.');
 if(!changes.hasPrior)text(compare,'Noch keine Buchungen aus dem Vormonat zum Vergleichen.','cs-soft');
 else{
  e('strong',compare,'cs-big',(changes.difference>0?'+':'')+money(changes.difference));
  text(compare,'Letzter Monat: '+money(changes.previous)+' · Dieser Monat: '+money(changes.current),'cs-muted');
  for(const cat of changes.categories.slice(0,6)){
   const row=e('div',compare,'cs-change-row');
   e('strong',row,'',cat.name);e('span',row,'',money(cat.now)+' / '+money(cat.previous));
  }
 }
 const tips=section(grid,'Deine Spartipps','Tipps aus deinen Ausgaben.');
 const rising=changes.hasPrior?changes.categories.filter(x=>x.previous>0&&x.now>x.previous).slice(0,3):[];
 if(!rising.length)text(tips,'Aktuell keine größeren Kostensteigerungen erkennbar. Mit mehr Buchungen werden die Tipps genauer.','cs-soft');
 for(const cat of rising)text(tips,'Bei '+cat.name+' wurden '+money(cat.now-cat.previous)+' mehr ausgegeben. Hier lohnt sich ein Blick auf einzelne Käufe.','cs-tip');
 const alerts=section(host,'Kassenbon prüfen','Doppelte Beträge und auffällige Kassenbons zum Nachprüfen.');
 const findings=C.duplicateAlerts(records);
 if(!findings.length)text(alerts,'Keine auffälligen Buchungen gefunden.','cs-soft');
 for(const a of findings.slice(0,15)){
  const row=e('div',alerts,'cs-alert');e('strong',row,'',a.label);text(row,a.text,'cs-small');
  button(row,'Buchungen ansehen',()=>{$('b3-history')?.scrollIntoView({behavior:'smooth'});},'cs-outline');
 }
 const repair=section(host,'Reparieren oder neu kaufen?','Nutze deine gespeicherten Gerätebelege.');
 const appliances=records.filter(r=>C.expense(r)&&(r.category==='Elektronik'||Number(r.warrantyMonths)>0)).slice(0,70);
 if(!appliances.length)text(repair,'Noch keine Gerätebelege vorhanden.','cs-soft');
 else{
  const pick=select(repair,'Mein Gerät',appliances.map(a=>[a.id,a.title+' · '+money(Number(a.price))]));
  const repairPrice=field(repair,'Was würde die Reparatur kosten? (€)','number','',{min:0,step:.01});
  const newPrice=field(repair,'Was kostet ein neues Gerät? (€)','number','',{min:0,step:.01});
  const result=text(repair,'Wähle dein Gerät und trage die Preise ein.','cs-soft');
  function calculate(){
   const row=appliances.find(a=>String(a.id)===pick.value);if(!row)return;
   const past=data.repairs.filter(x=>String(x.receiptId)===String(row.id)).reduce((a,x)=>a+Number(x.cost||0),0);
   const warranty=C.warranty(row);
   let msg='Bisherige Reparaturen: '+money(past)+'. ';
   if(warranty?.active)msg+='Die Garantie könnte noch gelten (bis '+warranty.until+'). Ansprüche zuerst prüfen. ';
   const r=Number(repairPrice.value),n=Number(newPrice.value);
   if(repairPrice.value!==''&&newPrice.value!==''&&Number.isFinite(r)&&r>=0&&Number.isFinite(n)&&n>0)
    msg+=r<n?'Reparieren ist nach diesen Preisen günstiger.':'Ein neues Gerät ist nach diesen Preisen nicht teurer als die Reparatur.';
   result.textContent=msg;
  }
  pick.addEventListener('change',calculate);repairPrice.addEventListener('input',calculate);newPrice.addEventListener('input',calculate);calculate();
  button(repair,'Reparaturkosten notieren',()=>{
   const cost=Number(repairPrice.value);
   if(!Number.isFinite(cost)||cost<=0||cost>100000)return setStatus('Bitte die Reparaturkosten eingeben.',true);
   void save(s=>{s.repairs.push({id:id(),receiptId:pick.value,date:C.ISO(new Date()),cost})});
  });
  if(data.repairs.length){
   const total=data.repairs.reduce((x,y)=>x+Number(y.cost||0),0);
   text(repair,'Gespeicherte Reparaturen insgesamt: '+money(total),'cs-muted');
  }
 }
 const priceChange=C.priceSummary(priceMap).filter(x=>x.change!==null&&x.change>0).slice(0,4);
 if(priceChange.length){
  const price=section(host,'Welche Lebensmittel sind teurer?','Vergleich mit deinen vorherigen Preisen.');
  for(const p of priceChange)text(price,p.name+': '+money(p.previous.unitPrice)+' → '+money(p.unitPrice),'cs-tip');
 }
}
// ----- Approved receipt line items, attached to the original booking only when saved. -----
function mountReceiptEditor(){
 const target=$('receiptPhotoInput')?.closest('.p-4');
 if(!target||$('cs-receipt-articles'))return;
 const box=e('div',null,'cs-receipt-editor');box.id='cs-receipt-articles';
 e('h3',box,'','Artikel auf deinem Kassenbon');
 text(box,'Prüfe die erkannten Preise. Nur bestätigte Artikel werden mit dem Beleg gespeichert.','cs-muted');
 const rows=e('div',box,'cs-receipt-rows');rows.id='cs-receipt-rows';
 const actions=e('div',box,'cs-inline-actions');
 button(actions,'+ Artikel eintragen',()=>{receiptItems.push({name:'',quantity:1,unit:'Stück',total:''});drawReceiptItems()});
 const total=e('p',box,'cs-small');total.id='cs-receipt-subtotal';
 target.after(box);
 window.toolyaCleverBudgetReceiptItems=()=>receiptItems.filter(item=>item.selected!==false&&String(item.name||'').trim().length>0&&Number(item.quantity)>0&&Number(item.total)>0)
  .slice(0,60).map(item=>({name:String(item.name).trim().slice(0,100),quantity:Number(item.quantity),unit:'Stück',total:C.round(Number(item.total))}));
 window.addEventListener('toolya:receipt-ocr',ev=>{
  const next=C.parser(ev.detail?.text||'');if(!next.length){setStatus('Keine Einzelpreise erkannt. Du kannst Artikel selbst eintragen.');return}
  receiptItems=next.map(x=>({...x,selected:true}));drawReceiptItems();
  setStatus(next.length+' Artikel erkannt. Bitte prüfen und dann den Beleg speichern.');
 });
 window.addEventListener('toolya:receipt-edit',ev=>{receiptItems=safeArray(ev.detail?.lineItems).map(x=>({...x,selected:true}));drawReceiptItems()});
 window.addEventListener('toolya:receipt-clear',()=>{receiptItems=[];drawReceiptItems()});
 drawReceiptItems();
}
function drawReceiptItems(){
 const host=$('cs-receipt-rows');if(!host)return;host.replaceChildren();
 if(!receiptItems.length)text(host,'Noch keine Artikel. Scanne einen Kassenbon oder trage Artikel selbst ein.','cs-muted');
 for(const [index,item] of receiptItems.entries()){
  const row=e('div',host,'cs-receipt-item');
  const check=e('input',row);check.type='checkbox';check.checked=item.selected!==false;check.setAttribute('aria-label','Artikel '+(index+1)+' übernehmen');
  check.addEventListener('change',()=>{item.selected=check.checked;receiptSubtotal()});
  const name=field(row,'Artikel','text',item.name||'',{placeholder:'z. B. Milch 1 l'});
  name.addEventListener('change',()=>{item.name=name.value.slice(0,100)});
  const quantity=field(row,'Anzahl','number',item.quantity||1,{min:0,step:.25});
  quantity.addEventListener('change',()=>{item.quantity=Number(quantity.value);receiptSubtotal()});
  const sum=field(row,'Preis gesamt (€)','number',item.total??'',{min:.01,step:.01});
  sum.addEventListener('change',()=>{item.total=Number(sum.value);receiptSubtotal()});
  button(row,'✕',()=>{receiptItems.splice(index,1);drawReceiptItems()},'cs-quiet').setAttribute('aria-label','Artikel entfernen');
 }
 receiptSubtotal();
}
function receiptSubtotal(){
 const items=window.toolyaCleverBudgetReceiptItems?.()||[];
 const sum=C.round(items.reduce((n,x)=>n+x.total,0));
 if($('cs-receipt-subtotal'))$('cs-receipt-subtotal').textContent=items.length?'Ausgewählte Artikel: '+money(sum)+' · Bitte Gesamtbetrag oben prüfen.':'';
}
window.addEventListener('toolya:budget-changed',()=>{if(!initialized)mount();else render()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
