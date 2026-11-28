import {parseCents,decimalCents,legacyCents} from './budget-domain.mjs';
import {validatePlanning,forecast,payPeriod,openingCarryover,reserveMonthly,assignOccurrence,assignBill} from './budget-planning.mjs';
export function mountPlanning(root,api){
 const en=()=>window.__toolyaUILocale==='en',t=(de,english)=>en()?english:de;
 const el=(tag,txt)=>{const n=document.createElement(tag);if(txt!=null)n.textContent=txt;return n;};
 const money=c=>new Intl.NumberFormat(en()?'en-GB':'de-DE',{style:'currency',currency:'EUR'}).format(c/100);
 const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
 const details=el('details');details.className='border rounded-xl p-3 space-y-3';
 const heading=el('summary','Finanzplanung');heading.dataset.toolEn='Financial planning';details.append(heading);
 const body=el('div'),status=el('p');body.className='space-y-4';status.setAttribute('role','status');details.append(body,status);root.append(details);
 let busy=false;
 function render(){
  body.replaceChildren();if(!details.open)return;
  try{
   const ctx=api.context(),p=validatePlanning(api.planning()),entries=api.entries(),now=today();
   const field=(label,node)=>{const l=el('label');l.className='block space-y-1';node.className='w-full border rounded-lg p-2';l.append(el('span',label),node);return l;};
   const input=(type,value='')=>{const n=el('input');n.type=type;n.value=value;return n;};
   const select=options=>{const n=el('select');for(const [v,label] of options){const o=el('option',label);o.value=v;n.append(o);}return n;};
   const euroInput=c=>{const n=input('text',c==null?'':decimalCents(c).replace('.',en()?'.':','));n.inputMode='decimal';return n;};
   const cents=n=>parseCents(n.value,en()?'en':'de');
   const button=(de,english,fn)=>{const n=el('button',t(de,english));n.type='button';n.className='border rounded-lg p-2';n.addEventListener('click',fn);return n;};
   const run=async fn=>{if(busy||!api.sameContext(ctx))return;busy=true;try{await fn();status.textContent=t('Gespeichert.','Saved.');render();}catch{status.textContent=t('Nicht gespeichert. Eingaben oder Datenstand prüfen.','Not saved. Check entries or data version.');}finally{busy=false;}};
   const save=transform=>run(()=>api.savePlanning(ctx,transform));
   const section=(de,english)=>{const n=el('section');n.className='border rounded-lg p-3 space-y-2';n.append(el('h4',t(de,english)));body.append(n);return n;};
   const upsert=(list,row)=>[...list.filter(x=>x.id!==row.id),row];
   const remove=(key,id)=>{if(confirm(t('Planungseintrag löschen? Buchungen bleiben erhalten.','Delete planning item? Transactions are retained.')))save(s=>({...s,[key]:s[key].filter(x=>x.id!==id)}));};
   const settings=section('Zahltag und Monatsübertrag','Payday and carryover'),payday=input('number',String(p.payday)),carry=input('checkbox');payday.min=1;payday.max=31;carry.checked=p.carryover;
   settings.append(field(t('Zahltag (1–31)','Payday (1–31)'),payday),field(t('Bisherigen Saldo übertragen','Carry forward previous balance'),carry),button('Einstellungen speichern','Save settings',()=>save(s=>({...s,payday:Number(payday.value),carryover:carry.checked}))));
   const period=payPeriod(now,p.payday),overview=section('Prognose für den Abrechnungszeitraum','Forecast for the pay period');
   const from=input('date',period.start),to=input('date',period.end),report=el('div');report.className='space-y-2';
   overview.append(field(t('Von','From'),from),field(t('Bis','To'),to),report);
   function drawForecast(){
    report.replaceChildren();
    try{
     const opening=openingCarryover(entries,p,from.value),f=forecast(entries,p,from.value,to.value,opening);
     for(const [label,value] of [[t('Übertrag','Opening balance'),opening],[t('Tatsächlicher Saldo','Actual balance'),f.actual.balance],[t('Erwartete Einnahmen','Expected income'),f.expectedIncome],[t('Erwartete Ausgaben','Expected expenses'),f.expectedExpense],[t('Rücklagenbedarf (monatlich)','Reserve requirement (monthly)'),f.reserve],[t('Prognostizierter verfügbarer Betrag','Projected available balance'),f.projected]])report.append(el('p',label+': '+money(value)));
     for(const o of f.pending){const row=el('div');row.className='border-t pt-2';row.append(el('p',o.date+' · '+o.title+' · '+money(o.direction==='income'?o.cents:-o.cents)));
      const candidates=entries.filter(r=>{try{return r.transferId==null&&r.refundOf==null&&!r.planOccurrence&&legacyCents(r.price)===o.cents&&(r.entryType==='einnahme'||r.category==='Einnahme')===(o.direction==='income');}catch{return false;}});
      if(candidates.length){const picker=select(candidates.map(r=>[String(r.id),r.date+' · '+r.title]));row.append(field(t('Vorhandene Zahlung','Existing payment'),picker),button('Zahlung zuordnen','Match payment',()=>{if(!confirm(t('Diese Zahlung zuordnen?','Match this payment?')))return;if(o.planId)run(()=>api.apply(ctx,items=>({entries:assignOccurrence(items,api.planning(),o.key,Number(picker.value)),changed:1})));else save(s=>assignBill(api.entries(),s,o.key.slice(5),Number(picker.value)));}));}
      report.append(row);
     }
    }catch{report.append(el('p',t('Zeitraum oder Beträge prüfen.','Check period or amounts.')));}
   }
   from.addEventListener('change',drawForecast);to.addEventListener('change',drawForecast);drawForecast();
   const recurring=section('Wiederkehrende Zahlungen und Verträge','Recurring payments and contracts');
   const planPicker=select([['',t('Neu','New')],...p.plans.map(x=>[x.id,x.title])]),planEditor=el('div');recurring.append(field(t('Zahlungsplan','Payment schedule'),planPicker),planEditor);
   function editPlan(){
    planEditor.replaceChildren();const old=p.plans.find(x=>x.id===planPicker.value);
    const title=input('text',old?.title||''),start=input('date',old?.start||now),end=input('date',old?.end||''),amount=euroInput(old?.cents),cancel=input('date',old?.cancelBy||'');
    const interval=select([['weekly',t('Wöchentlich','Weekly')],['monthly',t('Monatlich','Monthly')],['quarterly',t('Quartalsweise','Quarterly')],['yearly',t('Jährlich','Yearly')]]);interval.value=old?.interval||'monthly';
    const direction=select([['expense',t('Ausgabe','Expense')],['income',t('Einnahme','Income')]]);direction.value=old?.direction||'expense';
    const changes=(old?.changes||[]).map(x=>({...x})),changeRows=el('div'),changeDate=input('date',now),changeAmount=euroInput();
    function drawChanges(){changeRows.replaceChildren();for(const c of changes){const row=el('div');row.append(el('span',c.date+' · '+money(c.cents)+' '),button('Entfernen','Remove',()=>{changes.splice(changes.indexOf(c),1);drawChanges();}));changeRows.append(row);}}
    planEditor.append(field(t('Name','Name'),title),field(t('Erste Fälligkeit','First due date'),start),field(t('Enddatum (optional)','End date (optional)'),end),field(t('Intervall','Interval'),interval),field(t('Richtung','Direction'),direction),field(t('Betrag in EUR','Amount in EUR'),amount),field(t('Kündigen bis (optional)','Cancel by (optional)'),cancel),el('h5',t('Preisänderungen','Price changes')),changeRows,field(t('Gültig ab','Effective from'),changeDate),field(t('Neuer Betrag','New amount'),changeAmount),button('Preisänderung hinzufügen','Add price change',()=>{try{const c=cents(changeAmount);if(c<=0||!changeDate.value)throw Error();const i=changes.findIndex(x=>x.date===changeDate.value);if(i>=0)changes.splice(i,1);changes.push({date:changeDate.value,cents:c});drawChanges();}catch{status.textContent=t('Betrag oder Datum ungültig.','Invalid amount or date.');}}),button('Zahlungsplan speichern','Save schedule',()=>save(s=>({...s,plans:upsert(s.plans,{id:old?.id||crypto.randomUUID(),title:title.value,start:start.value,end:end.value||null,interval:interval.value,direction:direction.value,cents:cents(amount),changes,cancelBy:cancel.value||null})}))));
    drawChanges();if(old){planEditor.append(button('Zahlungsplan löschen','Delete schedule',()=>remove('plans',old.id)));if(old.cancelBy)planEditor.append(el('p',t('Kündigungsfrist: ','Cancellation deadline: ')+old.cancelBy+(old.cancelBy<now?t(' (verstrichen)',' (passed)'):'')));}
   }
   planPicker.addEventListener('change',editPlan);editPlan();
   const bills=section('Rechnungen','Bills'),billPicker=select([['',t('Neu','New')],...p.bills.map(x=>[x.id,x.title])]),billEditor=el('div');bills.append(field(t('Rechnung','Bill'),billPicker),billEditor);
   function editBill(){
    billEditor.replaceChildren();const old=p.bills.find(x=>x.id===billPicker.value),title=input('text',old?.title||''),due=input('date',old?.due||now),amount=euroInput(old?.cents);
    billEditor.append(field(t('Name','Name'),title),field(t('Fälligkeit','Due date'),due),field(t('Betrag in EUR','Amount in EUR'),amount),button('Rechnung speichern','Save bill',()=>save(s=>({...s,bills:upsert(s.bills,{id:old?.id||crypto.randomUUID(),title:title.value,due:due.value,cents:cents(amount),paidBookingId:old?.paidBookingId??null})}))));
    if(old){billEditor.append(el('p',old.paidBookingId!=null?t('Zahlung zugeordnet','Payment assigned'):old.due<now?t('Überfällig','Overdue'):t('Offen','Outstanding')),button('Rechnung löschen','Delete bill',()=>remove('bills',old.id)));if(old.paidBookingId!=null)billEditor.append(button('Zahlungszuordnung lösen','Unlink payment',()=>save(s=>({...s,bills:s.bills.map(x=>x.id===old.id?{...x,paidBookingId:null}:x)}))));}
   }
   billPicker.addEventListener('change',editBill);editBill();
   const reserves=section('Rücklagen','Reserves'),reservePicker=select([['',t('Neu','New')],...p.reserves.map(x=>[x.id,x.title])]),reserveEditor=el('div');reserves.append(field(t('Rücklage','Reserve'),reservePicker),reserveEditor);
   function editReserve(){
    reserveEditor.replaceChildren();const old=p.reserves.find(x=>x.id===reservePicker.value),title=input('text',old?.title||''),due=input('date',old?.due||now),target=euroInput(old?.target),saved=euroInput(old?.saved??0);
    reserveEditor.append(field(t('Name','Name'),title),field(t('Zieltermin','Target date'),due),field(t('Zielbetrag','Target amount'),target),field(t('Bereits zurückgelegt','Already reserved'),saved),button('Rücklage speichern','Save reserve',()=>save(s=>({...s,reserves:upsert(s.reserves,{id:old?.id||crypto.randomUUID(),title:title.value,due:due.value,target:cents(target),saved:cents(saved)})}))));
    if(old)reserveEditor.append(el('p',t('Monatlicher Bedarf: ','Monthly requirement: ')+money(reserveMonthly(old,now))),button('Rücklage löschen','Delete reserve',()=>remove('reserves',old.id)));
   }
   reservePicker.addEventListener('change',editReserve);editReserve();
  }catch{status.textContent=t('Cloud nicht bereit.','Cloud not ready.');}
 }
 details.addEventListener('toggle',render);document.addEventListener('toolya:locale-change',render);
 return {render};
}
