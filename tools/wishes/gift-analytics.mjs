import {db} from './toolya-client.mjs';
const $=id=>document.getElementById(id),money=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(n)||0);
let gifts=[],tasks=[],occasions=[],annualBudgets=[],closings=[],userId=null,selectedYear=new Date().getFullYear();
function el(tag,text,cls){const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e}
function yearOf(g){return Number(g.gift_year??g.created_at?.slice(0,4))}
function giftsIn(y){return gifts.filter(g=>yearOf(g)===y)}
function tasksIn(y){return tasks.filter(t=>t.checklist_year===y&&t.checklist_key)}
function summarize(y){const gs=giftsIn(y),ts=tasksIn(y),gifted=gs.filter(g=>g.status==='gifted').length,done=ts.filter(t=>t.status==='done').length;return{gifts:gs.length,gifted,spent:gs.reduce((n,g)=>n+Number(g.actual_amount||0),0),planned:gs.reduce((n,g)=>n+Number(g.planned_amount||0),0),tasks:ts.length,done}}
function render(){
 renderClosings();const year=Number($('year').value);selectedYear=year;const summary=summarize(year);
 $('gifts').textContent=summary.gifts;$('completion').textContent=(summary.gifts?Math.round(summary.gifted/summary.gifts*100):0)+' %';$('spent').textContent=money(summary.spent);
 const relevant=occasions.filter(o=>o.repeats_yearly||Number(o.occasion_date.slice(0,4))===year),budget=relevant.reduce((n,o)=>n+Number(annualBudgets.find(b=>b.occasion_id===o.id&&b.budget_year===year)?.budget_amount||0),0);
 const selectedClosing=closings.find(c=>c.closing_year===year);$('budget').textContent=money(selectedClosing?selectedClosing.budget_total:budget);
 const comparison=$('comparison');comparison.replaceChildren();const years=new Set([year,year-1,year-2,...closings.map(c=>c.closing_year),...gifts.map(yearOf),...tasks.filter(t=>t.checklist_year).map(t=>t.checklist_year)]);for(const y of [...years].filter(Number.isInteger).sort((a,b)=>b-a).slice(0,15)){
 const x=summarize(y),closed=closings.find(c=>c.closing_year===y),tr=document.createElement('tr');for(const value of [String(y)+(closed?' 🔒':''),closed?closed.gift_count:x.gifts,(closed?closed.gift_count:x.gifts)?Math.round((closed?closed.gifted_count:x.gifted)/(closed?closed.gift_count:x.gifts)*100)+' %':'–',money(closed?closed.actual_total:x.spent),money(closed?closed.planned_total:x.planned),x.tasks?x.done+'/'+x.tasks:'–'])tr.append(el('td',String(value)));comparison.append(tr)}
 const budgets=$('budgetDetails');budgets.replaceChildren();if(!relevant.length)budgets.append(el('p','Keine Anlässe für dieses Jahr vorhanden.','empty'));
 for(const o of relevant){const gs=giftsIn(year).filter(g=>g.occasion_id===o.id),planned=gs.reduce((n,g)=>n+Number(g.planned_amount||0),0),spent=gs.reduce((n,g)=>n+Number(g.actual_amount||0),0),historical=annualBudgets.find(b=>b.occasion_id===o.id&&b.budget_year===year),amount=historical?Number(historical.budget_amount):null,row=el('article','','row');
 row.append(el('strong',o.title),el('p','Jahresbudget: '+(amount===null?'nicht erfasst':money(amount))+' · Geplant: '+money(planned)+' · Erfasst: '+money(spent)+(amount>0&&Math.max(planned,spent)>amount?' · ⚠️ Budget überschritten':'')));
 const controls=el('div','','edit-controls'),input=document.createElement('input'),save=el('button','Jahresbudget speichern');input.type='number';input.min='0';input.max='9999999999.99';input.step='0.01';input.value=amount===null?'':String(amount);input.setAttribute('aria-label','Budget '+o.title+' '+year);
 save.addEventListener('click',async()=>{const n=Number(input.value);if(!input.value||!Number.isFinite(n)||n<0||n>9999999999.99){$('status').textContent='Bitte ein gültiges Budget eingeben.';return}save.disabled=true;const {data,error}=await db.from('wishlist_occasion_budget_years').upsert({user_id:userId,occasion_id:o.id,budget_year:year,budget_amount:n},{onConflict:'user_id,occasion_id,budget_year'}).select('id,occasion_id,budget_year,budget_amount').single();save.disabled=false;if(error){$('status').textContent='Budget konnte nicht gespeichert werden.';return}annualBudgets=annualBudgets.filter(b=>!(b.occasion_id===o.id&&b.budget_year===year));annualBudgets.push(data);render();$('status').textContent='Historisches Jahresbudget gespeichert.'});controls.append(input,save);row.append(controls);budgets.append(row)}

 renderGiftYearEditor(year);
 const completed=$('completed');completed.replaceChildren();let completedCount=0;
 for(const o of relevant){const ts=tasksIn(year).filter(t=>t.occasion_id===o.id),gs=giftsIn(year).filter(g=>g.occasion_id===o.id);
 const taskDone=ts.length>0&&ts.every(t=>t.status==='done'),giftDone=gs.length>0&&gs.every(g=>g.status==='gifted');
 if(!taskDone&&!giftDone)continue;completedCount++;
 const row=el('article','','row');row.append(el('strong',o.title+' · '+year),el('p',(taskDone?'✅ Checkliste abgeschlossen ('+ts.length+' Aufgaben)':'')+(taskDone&&giftDone?' · ':'')+(giftDone?'🎁 Alle '+gs.length+' Geschenke verschenkt':'')));const progress=document.createElement('progress');progress.className='meter';progress.max=ts.length||gs.length;progress.value=taskDone?ts.length:gs.filter(g=>g.status==='gifted').length;row.append(progress);completed.append(row)}
 if(!completedCount)completed.append(el('p','Für dieses Jahr sind noch keine vollständig erledigten Anlass-Checklisten oder Geschenkgruppen erfasst.','empty'));
}
function renderGiftYearEditor(year){
 const root=$('giftYearEditor');root.replaceChildren();const relevant=giftsIn(year);
 if(!relevant.length){root.append(el('p','Keine Geschenke für dieses Jahr zugeordnet.','empty'));return}
 for(const g of relevant.slice(0,80)){
 const row=el('div','','row');row.append(el('strong',g.title),el('p','Jahr: '+yearOf(g)+(g.gift_year_source==='inferred_created'?' · ⚠️ aus Erstellungsdatum geschätzt':' · bestätigt')));
 const controls=el('div','','edit-controls'),input=document.createElement('input');input.type='number';input.min='1900';input.max='2200';input.step='1';input.value=String(yearOf(g));input.setAttribute('aria-label','Geschenkjahr '+g.title);const button=el('button','Jahr speichern');
 button.addEventListener('click',async()=>{const y=Number(input.value);if(!Number.isInteger(y)||y<1900||y>2200){$('status').textContent='Ungültiges Geschenkjahr.';return}button.disabled=true;const {data,error}=await db.rpc('wishlist_set_gift_year',{p_plan_id:g.id,p_year:y});button.disabled=false;if(error||!data){$('status').textContent='Geschenkjahr konnte nicht gespeichert werden.';return}g.gift_year=y;g.gift_year_source='manual';if(![...$('year').options].some(o=>Number(o.value)===y)){const option=document.createElement('option');option.value=y;option.textContent=y;$('year').append(option)}$('year').value=String(y);render();$('status').textContent='Geschenkjahr gespeichert.'});controls.append(input,button);row.append(controls);root.append(row)}
 if(relevant.length>80)root.append(el('p','Es werden nur die ersten 80 Geschenke angezeigt. Weitere Geschenke sind über die Jahreszuordnung in der Datenbank vorhanden.','note'));
}

function reviewData(c){
 const gifts=Array.isArray(c.gifts_snapshot)?c.gifts_snapshot:[],budgets=Array.isArray(c.budgets_snapshot)?c.budgets_snapshot:[],tasks=Array.isArray(c.tasks_snapshot)?c.tasks_snapshot:null;
 const occasionIds=new Set([...gifts.map(g=>g.occasion_id),...(tasks||[]).map(t=>t.occasion_id),...budgets.map(b=>b.occasion_id)].filter(Boolean));
 const occasionsSummary=[...occasionIds].map(id=>{
  const gs=gifts.filter(g=>g.occasion_id===id),ts=(tasks||[]).filter(t=>t.occasion_id===id),b=budgets.find(x=>x.occasion_id===id);
  const gifted=gs.filter(g=>g.status==='gifted').length,done=ts.filter(t=>t.status==='done').length;
  return{occasion_id:id,title:b?.occasion_title||'Anlass ohne gespeicherten Namen',gift_count:gs.length,gifted_count:gifted,task_count:tasks===null?null:ts.length,task_done_count:tasks===null?null:done,budget_amount:b?.budget_amount??null,completed:(gs.length>0&&gifted===gs.length)||(ts.length>0&&done===ts.length)}
 }).sort((a,b)=>Number(b.completed)-Number(a.completed)||b.gifted_count-a.gifted_count||a.title.localeCompare(b.title));
 return{year:c.closing_year,closed_at:c.closed_at,gift_count:c.gift_count,gifted_count:c.gifted_count,planned_total:c.planned_total,actual_total:c.actual_total,budget_total:c.budget_total,task_count:c.task_count,task_done_count:c.task_done_count,gifts,budgets,tasks,occasions:occasionsSummary};
}
function renderInsights(){
 const summary=$('insightsSummary'),trends=$('insightsTrends'),budgetsRoot=$('insightsBudgets'),occasionsRoot=$('insightsOccasions'),tips=$('insightsRecommendations');
 for(const e of [summary,trends,budgetsRoot,occasionsRoot,tips])e.replaceChildren();
 const years=[...closings].sort((a,b)=>a.closing_year-b.closing_year);
 if(!years.length){summary.append(el('p','Noch keine historischen Jahresabschlüsse. Erkenntnisse entstehen erst aus gespeicherten Abschlusswerten.','empty'));return}
 const budgetYears=years.filter(c=>Array.isArray(c.budgets_snapshot)&&c.budgets_snapshot.length>0);
 const budgetOnTrack=budgetYears.filter(c=>Number(c.actual_total)<=Number(c.budget_total)).length;
 const giftRate=c=>c.gift_count?Math.round(100*c.gifted_count/c.gift_count):null;
 const taskRate=c=>c.task_count===null||c.task_count===0?null:Math.round(100*c.task_done_count/c.task_count);
 const cards=[['Abgeschlossene Jahre',years.length],['Geschenkquote',years.filter(c=>c.gift_count>0).length?Math.round(100*years.reduce((n,c)=>n+c.gifted_count,0)/years.reduce((n,c)=>n+c.gift_count,0))+' %':'Keine Geschenke'],['Jahre innerhalb erfasster Budgets',budgetYears.length?budgetOnTrack+'/'+budgetYears.length+' (Teilbudgets möglich)':'Keine Budgetdaten'],['Historische Ausgaben',money(years.reduce((n,c)=>n+Number(c.actual_total),0))]];
 for(const [label,value] of cards){const card=el('div','','review-kpi');card.append(el('strong',String(value)),el('span',label));summary.append(card)}
 for(const c of years){const row=el('article','','chronicle-card');row.append(el('strong',String(c.closing_year)),el('p','Verschenkt: '+(giftRate(c)===null?'nicht auswertbar':giftRate(c)+' %')+' · Aufgaben: '+(taskRate(c)===null?'nicht auswertbar':taskRate(c)+' %')+' · Ausgaben: '+money(c.actual_total)));trends.append(row)}
 if(years.length>=2){const first=years[0],last=years.at(-1),delta=Number(last.actual_total)-Number(first.actual_total);trends.append(el('p','Ausgabenentwicklung zwischen '+first.closing_year+' und '+last.closing_year+': '+(delta>=0?'+':'')+money(delta)+'. Diese Werte sind Momentaufnahmen, keine Preisprognose.','note'))}
 if(!budgetYears.length)budgetsRoot.append(el('p','Keine Jahresabschlüsse mit ausdrücklich gespeicherten Anlassbudgets.','empty'));
 for(const c of years){const items=Array.isArray(c.budgets_snapshot)?c.budgets_snapshot:[];if(!items.length)continue;
 const row=el('article','','row'),budget=Number(c.budget_total),actual=Number(c.actual_total),diff=budget-actual;
 row.append(el('strong',c.closing_year+' · '+(diff>=0?'Innerhalb der erfassten Budgets':'Erfasste Budgets überschritten')),el('p','Gespeicherte Anlassbudgets: '+money(budget)+' · Ausgaben: '+money(actual)+' · Differenz: '+money(diff)+' · Nur erfasste Budgets berücksichtigt'));budgetsRoot.append(row)}
 const byId=new Map();
 for(const c of years){const gs=Array.isArray(c.gifts_snapshot)?c.gifts_snapshot:[],ts=Array.isArray(c.tasks_snapshot)?c.tasks_snapshot:null,bs=Array.isArray(c.budgets_snapshot)?c.budgets_snapshot:[];
 const ids=new Set([...gs.map(g=>g.occasion_id),...(ts||[]).map(t=>t.occasion_id),...bs.map(b=>b.occasion_id)].filter(Boolean));
 for(const id of ids){const g=gs.filter(x=>x.occasion_id===id),t=ts===null?null:ts.filter(x=>x.occasion_id===id),b=bs.find(x=>x.occasion_id===id);
 const hasEvidence=g.length>0||(t!==null&&t.length>0),complete=hasEvidence&&(!g.length||g.every(x=>x.status==='gifted'))&&(t===null||!t.length||t.every(x=>x.status==='done'));
 const item=byId.get(id)||{name:'Anlass ohne gespeicherten Namen',years:0,completed:0,unknownTasks:0};if(b?.occasion_title)item.name=b.occasion_title;item.years++;if(complete)item.completed++;if(t===null)item.unknownTasks++;byId.set(id,item)}}
 const reliable=[...byId.values()].filter(x=>x.years>=2).sort((a,b)=>b.completed/b.years-a.completed/a.years||b.years-a.years);
 if(!reliable.length)occasionsRoot.append(el('p','Für zuverlässige Anlassvergleiche werden mindestens zwei gespeicherte Jahresabschlüsse je Anlass benötigt.','empty'));
 for(const o of reliable){const row=el('article','','row');row.append(el('strong',o.name),el('p',o.completed+'/'+o.years+' Jahresabschlüsse vollständig abgeschlossen'+(o.unknownTasks?' · '+o.unknownTasks+' ohne Aufgabenhistorie':'')));occasionsRoot.append(row)}
 const recommendations=[];
 if(years.length<2)recommendations.push(['Mehrjährige Entwicklung','Es liegt erst ein gespeicherter Jahresabschluss vor. Ein Trendvergleich benötigt mindestens zwei Jahre.']);
 if(budgetYears.length===0)recommendations.push(['Budgethistorie ergänzen','Keiner der gespeicherten Abschlüsse enthält Anlassbudgets. Erfasse Jahresbudgets vor zukünftigen Abschlüssen.']);
 else if(budgetYears.some(c=>Number(c.actual_total)>Number(c.budget_total)))recommendations.push(['Budgetplanung überprüfen',budgetYears.filter(c=>Number(c.actual_total)>Number(c.budget_total)).length+' von '+budgetYears.length+' Abschlüssen überschreiten die Summe der erfassten Anlassbudgets (unvollständige Budgeterfassung möglich). Prüfe die Ausgaben und Budgets der betreffenden Jahre.']);
 if(years.some(c=>c.task_count===null))recommendations.push(['Aufgabenhistorie berücksichtigen','Ältere Jahresabschlüsse enthalten teilweise keine Aufgaben-Snapshots. Vergleiche Aufgabenquoten nur dort, wo historische Werte vorliegen.']);
 if(years.some(c=>c.gift_count>0&&c.gifted_count<c.gift_count))recommendations.push(['Offene Geschenkgruppen prüfen','In '+years.filter(c=>c.gift_count>0&&c.gifted_count<c.gift_count).length+' abgeschlossenen Jahren waren nicht alle Geschenke als verschenkt markiert. Nutze frühzeitig Checklisten für zukünftige Jahre.']);
 if(!recommendations.length)recommendations.push(['Gute historische Datenbasis','Die vorhandenen Abschlusswerte zeigen keine Auffälligkeit nach den einfachen Prüfregeln. Behalte deine Jahresabschlüsse und Budgets bei.']);
 for(const [heading,reason] of recommendations){const box=el('article','','story-highlight');box.append(el('strong',heading),el('p','Begründung: '+reason));tips.append(box)}
}
function renderGiftStory(){
 const overview=$('storyOverview'),chart=$('storyChart'),occasionsRoot=$('storyOccasions');overview.replaceChildren();chart.replaceChildren();occasionsRoot.replaceChildren();
 const years=[...closings].sort((a,b)=>a.closing_year-b.closing_year);
 if(!years.length){overview.append(el('p','Noch keine abgeschlossenen Jahre. Die Erfolgsgeschichte beginnt mit deinem ersten Jahresabschluss.','empty'));return}
 const totalGifts=years.reduce((n,c)=>n+Number(c.gift_count||0),0),totalGifted=years.reduce((n,c)=>n+Number(c.gifted_count||0),0),totalSpent=years.reduce((n,c)=>n+Number(c.actual_total||0),0);
 const headline=el('div','','story-highlight');headline.append(el('strong',years.length+' abgeschlossene Jahre · '+totalGifted+'/'+totalGifts+' Geschenke verschenkt'),el('p','Historisch erfasste Ausgaben: '+money(totalSpent)+' · Zeitraum '+years[0].closing_year+'–'+years.at(-1).closing_year));overview.append(headline);
 for(const c of years){const row=el('div','','story-year');row.append(el('strong',String(c.closing_year)));const bars=el('div','','story-bars'),giftRate=c.gift_count?Math.round(c.gifted_count/c.gift_count*100):0;const giftBar=el('div','','story-bar'),giftFill=document.createElement('span');giftFill.style.width=giftRate+'%';giftBar.append(giftFill);bars.append(el('span','Geschenke '+giftRate+' %','story-legend'),giftBar);
 if(c.task_count!==null){const taskRate=c.task_count?Math.round(c.task_done_count/c.task_count*100):0,taskBar=el('div','','story-bar tasks'),fill=document.createElement('span');fill.style.width=taskRate+'%';taskBar.append(fill);bars.append(el('span','Aufgaben '+taskRate+' %','story-legend'),taskBar)}else bars.append(el('span','Aufgaben: kein historischer Snapshot','story-legend'));
 row.append(bars);chart.append(row)}
 const byOccasion=new Map();
 for(const c of years){const gs=Array.isArray(c.gifts_snapshot)?c.gifts_snapshot:[],ts=Array.isArray(c.tasks_snapshot)?c.tasks_snapshot:null,bs=Array.isArray(c.budgets_snapshot)?c.budgets_snapshot:[];
 const ids=new Set([...gs.map(g=>g.occasion_id),...(ts||[]).map(t=>t.occasion_id),...bs.map(b=>b.occasion_id)].filter(Boolean));
 for(const id of ids){const gifts=gs.filter(g=>g.occasion_id===id),tasks=ts===null?null:ts.filter(t=>t.occasion_id===id),budget=bs.find(b=>b.occasion_id===id),existing=byOccasion.get(id)||{title:budget?.occasion_title||'Anlass ohne gespeicherten Namen',entries:[]};if(budget?.occasion_title)existing.title=budget.occasion_title;
 existing.entries.push({year:c.closing_year,gift_count:gifts.length,gifted_count:gifts.filter(g=>g.status==='gifted').length,task_count:tasks===null?null:tasks.length,task_done_count:tasks===null?null:tasks.filter(t=>t.status==='done').length,spent:gifts.reduce((n,g)=>n+Number(g.actual_amount||0),0),budget:budget?.budget_amount??null});byOccasion.set(id,existing)}}
 const repeated=[...byOccasion.values()].filter(o=>o.entries.length>=2).sort((a,b)=>b.entries.length-a.entries.length||a.title.localeCompare(b.title));
 if(!repeated.length){occasionsRoot.append(el('p','Noch keine Anlässe mit Daten aus mindestens zwei abgeschlossenen Jahren.','empty'));return}
 for(const o of repeated){const section=el('section','','story-highlight'),title=el('strong',o.title+' · '+o.entries.length+' Jahre'),wrap=el('div','','story-table'),table=document.createElement('table'),thead=document.createElement('thead'),header=document.createElement('tr');for(const h of ['Jahr','Geschenke','Aufgaben','Ausgaben','Jahresbudget'])header.append(el('th',h));thead.append(header);table.append(thead);const tbody=document.createElement('tbody');
 for(const entry of o.entries.sort((a,b)=>a.year-b.year)){const tr=document.createElement('tr');for(const v of [entry.year,entry.gifted_count+'/'+entry.gift_count,entry.task_count===null?'Nicht erfasst':entry.task_done_count+'/'+entry.task_count,money(entry.spent),entry.budget===null?'Nicht erfasst':money(entry.budget)])tr.append(el('td',String(v)));tbody.append(tr)}table.append(tbody);wrap.append(table);section.append(title,wrap);occasionsRoot.append(section)}
}
function renderReview(){
 const root=$('annualReview'),select=$('reviewYear');root.replaceChildren();
 const existing=select.value;select.replaceChildren();
 for(const c of [...closings].sort((a,b)=>b.closing_year-a.closing_year)){const o=document.createElement('option');o.value=c.closing_year;o.textContent=String(c.closing_year);select.append(o)}
 if([...select.options].some(o=>o.value===existing))select.value=existing;
 const c=closings.find(c=>c.closing_year===Number(select.value));$('exportYearJson').disabled=!c;$('printYearReview').disabled=!c;
 if(!c){root.append(el('p','Erstelle zuerst einen Jahresabschluss, um einen unveränderlichen Rückblick zu erhalten.','empty'));return}
 const d=reviewData(c),title=el('h3','Mein Geschenk-Jahr '+d.year),stamp=el('p','Abschluss vom '+new Date(d.closed_at).toLocaleDateString('de-DE'),'note');root.append(title,stamp);
 const grid=el('div','','review-grid');
 for(const [label,value] of [['Geschenke verschenkt',d.gifted_count+'/'+d.gift_count],['Ausgaben',money(d.actual_total)],['Gespeicherte Budgets',money(d.budget_total)],['Geplante Beträge',money(d.planned_total)],['Aufgaben erledigt',d.task_count===null?'Nicht erfasst':d.task_done_count+'/'+d.task_count],['Abgeschlossene Anlässe',d.occasions.filter(o=>o.completed).length]]){const card=el('div','','review-kpi');card.append(el('strong',String(value)),el('span',label));grid.append(card)}root.append(grid);
 root.append(el('h3','🏅 Meilensteine'));const milestones=el('ul','','review-milestones');
 if(d.gift_count>0&&d.gifted_count===d.gift_count)milestones.append(el('li','Alle '+d.gift_count+' Geschenke als verschenkt abgeschlossen.'));
 if(d.task_count>0&&d.task_done_count===d.task_count)milestones.append(el('li','Alle '+d.task_count+' Jahres-Checklistenaufgaben erledigt.'));
 if(d.occasions.some(o=>o.completed))milestones.append(el('li',d.occasions.filter(o=>o.completed).length+' Anlässe mit vollständig abgeschlossenen Geschenkgruppen oder Checklisten.'));
 if(d.budgets.length)milestones.append(el('li',d.budgets.length+' Anlassbudgets historisch gesichert.'));
 if(!milestones.children.length)milestones.append(el('li','Jahresabschluss gespeichert. Noch keine weiteren messbaren Meilensteine.'));
 root.append(milestones,el('h3','🎂 Erfolgreich abgeschlossene Anlässe'));
 const completed=d.occasions.filter(o=>o.completed);
 if(!completed.length)root.append(el('p','Keine vollständig abgeschlossenen Anlassgruppen im gespeicherten Stand.','empty'));
 for(const o of completed){const card=el('article','','review-occasion');card.append(el('strong',o.title),el('p','Geschenke: '+o.gifted_count+'/'+o.gift_count+' · Aufgaben: '+(o.task_count===null?'nicht historisch erfasst':o.task_done_count+'/'+o.task_count)+(o.budget_amount===null?'':' · Jahresbudget: '+money(o.budget_amount))));root.append(card)}
 if(d.tasks===null)root.append(el('p','Dieser ältere Jahresabschluss enthält keinen historischen Aufgaben-Snapshot.','note'));
}
$('reviewYear').addEventListener('change',renderReview);
$('exportYearJson').addEventListener('click',()=>{
 const c=closings.find(c=>c.closing_year===Number($('reviewYear').value));if(!c)return;
 const payload={schema_version:1,exported_at:new Date().toISOString(),report:reviewData(c)};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='helferlein-geschenk-jahresrueckblick-'+c.closing_year+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);$('reviewStatus').textContent='Privater JSON-Bericht lokal erstellt. Bewahre die Datei sicher auf.';
});
$('printYearReview').addEventListener('click',()=>{if(closings.some(c=>c.closing_year===Number($('reviewYear').value)))window.print()});
function renderChronicle(){
 const root=$('yearChronicle');root.replaceChildren();const ordered=[...closings].sort((a,b)=>a.closing_year-b.closing_year);
 if(!ordered.length){root.append(el('p','Noch keine gespeicherten Jahresabschlüsse. Erstelle einen Abschluss, um die Chronik zu beginnen.','empty'));return}
 let previous=null;
 for(const c of ordered){const box=el('article','','chronicle-card'),giftRate=c.gift_count?Math.round(c.gifted_count/c.gift_count*100):0;
 box.append(el('strong','🔒 '+c.closing_year),el('p','Geschenke: '+c.gifted_count+'/'+c.gift_count+' verschenkt ('+giftRate+' %) · Ausgaben: '+money(c.actual_total)));
 if(c.task_count===null){box.append(el('p','Aufgaben-Snapshot für diesen älteren Abschluss nicht vorhanden.','note'))}
 else{const taskRate=c.task_count?Math.round(c.task_done_count/c.task_count*100):0;box.append(el('p','Aufgaben: '+c.task_done_count+'/'+c.task_count+' erledigt ('+taskRate+' %)'));const progress=document.createElement('progress');progress.max=c.task_count||1;progress.value=c.task_done_count||0;progress.setAttribute('aria-label','Aufgabenfortschritt '+c.closing_year);box.append(progress)}
 if(previous){const delta=Number(c.actual_total)-Number(previous.actual_total);box.append(el('p','Gegenüber dem vorherigen Abschluss '+previous.closing_year+': '+(delta>=0?'+':'')+money(delta)+' Ausgaben'+(previous.task_count!==null&&c.task_count!==null?' · Aufgabenquote '+((c.task_count?Math.round(c.task_done_count/c.task_count*100):0)-(previous.task_count?Math.round(previous.task_done_count/previous.task_count*100):0))+' Prozentpunkte':'')))}
 root.append(box);previous=c}
}
function renderClosings(){renderChronicle();renderReview();renderGiftStory();renderInsights();
 const root=$('closedYears');root.replaceChildren();const year=Number($('year').value),closed=closings.find(c=>c.closing_year===year);
 $('closeYear').disabled=Boolean(closed);$('closingConfirm').disabled=Boolean(closed);
 for(const c of closings){const box=el('div','','year-summary row');box.append(el('strong','🔒 '+c.closing_year+' · abgeschlossen am '+new Date(c.closed_at).toLocaleDateString('de-DE')),el('p',c.gift_count+' Geschenke · '+c.gifted_count+' verschenkt · Ausgaben: '+money(c.actual_total)+' · Geplant: '+money(c.planned_total)+' · Jahresbudgets: '+money(c.budget_total)+(c.task_count===null?' · Aufgabenhistorie nicht vorhanden':' · Aufgaben: '+c.task_done_count+'/'+c.task_count)));
 const details=document.createElement('details'),summary=el('summary','Gespeicherte Abschlussdetails anzeigen');details.append(summary);const giftList=el('div');for(const g of c.gifts_snapshot||[])giftList.append(el('p',g.title+' · '+g.status+' · '+money(g.actual_amount)+' erfasst'));details.append(giftList);const budgetList=el('div');for(const b of c.budgets_snapshot||[])budgetList.append(el('p',b.occasion_title+' · '+money(b.budget_amount)));details.append(budgetList);if(Array.isArray(c.tasks_snapshot)){const taskList=el('div');taskList.append(el('strong','Historische Aufgaben'));for(const t of c.tasks_snapshot)taskList.append(el('p',t.title+' · '+t.status+' · '+(t.due_date||'ohne Termin')));details.append(taskList)}box.append(details);root.append(box)}
 if(!closings.length)root.append(el('p','Noch keine historischen Jahresabschlüsse gespeichert.','empty'));
}
$('closeYear').addEventListener('click',async()=>{
 const year=Number($('year').value);
 if(!$('closingConfirm').checked){$('closingStatus').textContent='Bitte die Bestätigung aktivieren.';return}
 if(!confirm('Jahr '+year+' jetzt endgültig abschließen? Der gespeicherte Abschluss kann nicht geändert oder gelöscht werden.'))return;
 $('closeYear').disabled=true;
 try{const {data,error}=await db.rpc('wishlist_close_gift_year',{p_year:year,p_confirm:true});if(error)throw error;
 const {data:rows,error:readError}=await db.from('wishlist_gift_year_closings').select('id,closing_year,closed_at,gift_count,gifted_count,planned_total,actual_total,budget_total,gifts_snapshot,budgets_snapshot,tasks_snapshot,task_count,task_done_count').eq('id',data).single();if(readError)throw readError;
 closings.push(rows);$('closingConfirm').checked=false;render();$('closingStatus').textContent='Jahr '+year+' unveränderlich abgeschlossen.';
 }catch{$('closingStatus').textContent='Jahresabschluss konnte nicht gespeichert oder geladen werden.'}finally{$('closeYear').disabled=closings.some(c=>c.closing_year===year)}
});
async function main(){
 const {data,error}=await db.auth.getUser();const user=data?.user;if(error||!user){$('login').hidden=false;$('status').textContent='Bitte anmelden.';return}
 userId=user.id;const [g,t,o,b,c]=await Promise.all([
 db.from('wishlist_gift_plans').select('id,title,occasion_id,created_at,gift_year,gift_year_source,status,planned_amount,actual_amount').eq('user_id',user.id).order('created_at',{ascending:false}).limit(5000),
 db.from('wishlist_gift_tasks').select('id,occasion_id,checklist_year,checklist_key,status').eq('user_id',user.id).limit(5000),
 db.from('wishlist_occasions').select('id,title,occasion_date,repeats_yearly,budget_amount').eq('user_id',user.id).limit(2000),
 db.from('wishlist_occasion_budget_years').select('id,occasion_id,budget_year,budget_amount').eq('user_id',user.id).limit(5000),
 db.from('wishlist_gift_year_closings').select('id,closing_year,closed_at,gift_count,gifted_count,planned_total,actual_total,budget_total,gifts_snapshot,budgets_snapshot').eq('user_id',user.id).order('closing_year',{ascending:false}).limit(200)
 ]);if(g.error||t.error||o.error||b.error||c.error)throw g.error||t.error||o.error||b.error||c.error;
 gifts=g.data||[];tasks=t.data||[];occasions=o.data||[];annualBudgets=b.data||[];closings=c.data||[];
 const years=new Set([selectedYear,selectedYear-1,selectedYear-2,...gifts.map(yearOf),...closings.map(c=>c.closing_year),...tasks.map(t=>t.checklist_year).filter(Boolean)]);for(const y of [...years].filter(Number.isInteger).sort((a,b)=>b-a)){const option=document.createElement('option');option.value=y;option.textContent=y;$('year').append(option)}
 $('year').value=String(selectedYear);$('year').addEventListener('change',render);$('content').hidden=false;render();$('status').textContent='Deine private Jahresstatistik ist geladen.';
}
main().catch(()=>{$('status').textContent='Statistik konnte nicht geladen werden.'});
