import {db} from './toolya-client.mjs';
import {wishesText} from '../../shared/toolya/i18n/wishes-copy.mjs';
const ui=text=>wishesText(text,globalThis.__toolyaWishesLocale==='en'?'en':'de');
const locale=()=>globalThis.__toolyaWishesLocale==='en'?'en-GB':'de-DE';
const $=id=>document.getElementById(id);
const euro=n=>new Intl.NumberFormat(locale(),{style:'currency',currency:'EUR'}).format(Number(n)||0);
const day=86400000;let weekOffset=0,calendarEvents=[],weeklyTasks=[],occasionNames=new Map();
function el(tag,text,cls){const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e}
function nextDate(o,now){const [y,m,d]=o.occasion_date.split('-').map(Number);let date=Date.UTC(y,m-1,d);if(!o.repeats_yearly)return date>=now?date:null;let year=new Date(now).getUTCFullYear();for(let i=0;i<3;i++,year++){const last=new Date(Date.UTC(year,m,0)).getUTCDate();date=Date.UTC(year,m-1,Math.min(d,last));if(date>=now)return date}return null}
function median(values){const a=[...values].sort((x,y)=>x-y);return a.length?(a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2):null}
function addCard(root,title,lines){const box=el('article','','card');box.append(el('h3',title));for(const line of lines)box.append(el('p',line));root.append(box);return box}
async function allRows(table,columns,userId,order){let rows=[];for(let start=0;start<20000;start+=500){let q=db.from(table).select(columns).eq('user_id',userId).order(order,{ascending:true}).range(start,start+499);const {data,error}=await q;if(error)throw error;rows.push(...(data||[]));if((data||[]).length<500)return rows}throw new Error(ui('Zu viele Datensätze für eine vollständige Auswertung'))}
let taskBusy=false,taskUserId=null,taskEvents=[],assistantReady=false,localePending=false,checklistBusy=0,planningSnapshot=null;
function refreshTaskDisplay(){renderTaskEvents();renderWeeklyTasks();renderDaily();renderOccasionPlanning()}
async function changeTask(task,field,newValue,button){
 if(taskBusy)return;
 const oldValue=task[field];if(oldValue===newValue)return;
 const confirmation=ui('Aufgabe „')+task.title+(field==='status'?ui('“ wirklich als erledigt markieren?'):ui('“ wirklich auf ')+newValue+ui(' verschieben?'));
 if(!window.confirm(confirmation))return;
 taskBusy=true;button.disabled=true;$('taskActionStatus').textContent=ui("Änderung wird gespeichert …");
 try{
  let query=db.from('wishlist_gift_tasks').update({[field]:newValue,updated_at:new Date().toISOString()}).eq('id',task.id).eq('user_id',taskUserId);
  query=oldValue===null?query.is(field,null):query.eq(field,oldValue);
  const {data,error}=await query.select('id,'+field);
  if(error)throw error;
  if(!data||data.length!==1)throw new Error(ui("Aufgabe wurde zwischenzeitlich verändert. Bitte Seite neu laden."));
  task[field]=data[0][field];
  $('taskActionStatus').textContent=ui("Änderung gespeichert: ")+task.title+'.';
  await loadTaskEvents();renderWeeklyTasks();renderDaily();renderWeek();
 }catch(e){$('taskActionStatus').textContent=ui("Speichern fehlgeschlagen: ")+(e.message||ui("Unbekannter Fehler"))}
 finally{taskBusy=false;button.disabled=false;if(localePending&&!checklistBusy){localePending=false;refreshTaskDisplay()}}
}
function utcDate(value){if(!value)return null;const [y,m,d]=value.split('-').map(Number);return Date.UTC(y,m-1,d)}
function taskRank(task,today){
 const due=utcDate(task.due_date),days=due===null?null:Math.round((due-today)/day);
 const priority=Number(task.priority)||2;
 const urgency=days===null?4:days<0?0:days<=1?1:days<=3?2:days<=7?3:5;
 return{days,urgency,priority,score:urgency*10+priority};
}
function renderTaskEvents(){
 const summary=$('activitySummary'),trend=$('activityTrend'),list=$('activityList');summary.replaceChildren();trend.replaceChildren();list.replaceChildren();
 const completed=taskEvents.filter(e=>e.event_type==='completed'),rescheduled=taskEvents.filter(e=>e.event_type==='due_date_changed'),reopened=taskEvents.filter(e=>e.event_type==='reopened');
 for(const [label,count] of [[ui("Erledigungen protokolliert"),completed.length],[ui("Terminverschiebungen"),rescheduled.length],[ui("Wieder geöffnet"),reopened.length]]){const card=el('div','','review-kpi');card.append(el('strong',String(count)),el('span',label));summary.append(card)}
 const now=new Date(),today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()),start=today-((now.getDay()+6)%7)*day;
 for(let w=5;w>=0;w--){const weekStart=start-w*7*day,weekEnd=weekStart+7*day,count=completed.filter(e=>{const at=Date.parse(e.occurred_at);return at>=weekStart&&at<weekEnd}).length;
 const card=el('article','','card');card.append(el('h3',new Date(weekStart).toLocaleDateString(locale(),{timeZone:'UTC'})+' – '+new Date(weekEnd-day).toLocaleDateString(locale(),{timeZone:'UTC'})),el('p',count+ui(' tatsächlich protokollierte Erledigungen')));trend.append(card)}
 if(!taskEvents.length){list.append(el('p',ui("Noch keine protokollierten Aufgabenänderungen seit Aktivierung.")));return}
 for(const e of taskEvents.slice(0,35)){const card=el('article','','card'),label=e.event_type==='completed'?ui("✓ Erledigt"):e.event_type==='reopened'?ui("↩ Wieder geöffnet"):e.event_type==='due_date_changed'?ui("📅 Fälligkeit verschoben"):ui("🔄 Status geändert");
 card.append(el('h3',label+' · '+e.task_title),el('p',new Date(e.occurred_at).toLocaleString(locale())));
 if(e.event_type==='due_date_changed')card.append(el('p',(e.old_due_date||ui("Ohne Datum"))+' → '+(e.new_due_date||ui("Ohne Datum"))));
 else card.append(el('p',(e.old_status||'—')+' → '+(e.new_status||'—')));
 list.append(card)}
}
async function loadTaskEvents(){taskEvents=await allRows('wishlist_gift_task_events','id,task_id,task_title,event_type,old_status,new_status,old_due_date,new_due_date,occurred_at',taskUserId,'id');taskEvents.reverse();renderTaskEvents()}
function renderDaily(){
 const now=new Date(),today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()),todayTasks=weeklyTasks.filter(t=>!t.archived_at&&utcDate(t.due_date)===today),done=todayTasks.filter(t=>t.status==='done').length;
 const active=weeklyTasks.filter(t=>!t.archived_at&&t.status!=='done'&&t.due_date&&utcDate(t.due_date)<=today).map(t=>({task:t,...taskRank(t,today)})).sort((a,b)=>a.score-b.score||a.days-b.days);
 const summary=$('dailySummary');summary.replaceChildren();
 for(const [label,value] of [[ui("Heute fällig"),todayTasks.length],[ui("Heute fällige erledigt"),done],[ui("Offen/überfällig"),active.length]]){const card=el('div','','review-kpi');card.append(el('strong',String(value)),el('span',label));summary.append(card)}
 $('dailyProgress').max=todayTasks.length||1;$('dailyProgress').value=done;$('dailyProgressText').textContent=done+ui(" von ")+todayTasks.length+ui(" heute fälligen Aufgaben erledigt (")+(todayTasks.length?Math.round(100*done/todayTasks.length):0)+ui(" %). Der Wert beschreibt den aktuellen Status, nicht den Zeitpunkt der Erledigung.");
 const focus=$('dailyFocus');focus.replaceChildren();
 if(!active.length)focus.append(el('p',ui("Keine offenen Aufgaben mit Fälligkeit bis heute.")));
 for(const x of active.slice(0,8)){const t=x.task,box=el('article','','card '+(x.days<0?'priority-critical':'priority-high'));box.append(el('h3',t.title),el('p',x.days<0?ui("Seit ")+Math.abs(x.days)+ui(" Tagen überfällig"):ui("Heute fällig")),el('p',ui("Begründung: ")+(x.days<0?ui("Fälligkeit überschritten"):ui("Heute zu erledigen"))+ui("; Priorität ")+({1:ui("hoch"),2:ui("mittel"),3:ui("niedrig")}[x.priority]||ui("mittel"))+'.','hint'));
 const actions=el('div','','task-actions'),finish=el('button',ui("✓ Erledigen")),tomorrow=el('button',ui("Auf morgen verschieben"));finish.type=tomorrow.type='button';finish.addEventListener('click',()=>changeTask(t,'status','done',finish));tomorrow.addEventListener('click',()=>changeTask(t,'due_date',new Date(today+day).toISOString().slice(0,10),tomorrow));actions.append(finish,tomorrow);box.append(actions);focus.append(box)}
 const doneRoot=$('dailyDone');doneRoot.replaceChildren();
 const finished=weeklyTasks.filter(t=>!t.archived_at&&t.status==='done').sort((a,b)=>String(b.due_date||'').localeCompare(String(a.due_date||'')));
 if(!finished.length)doneRoot.append(el('p',ui("Noch keine erledigten Aufgaben.")));
 for(const t of finished.slice(0,12)){const box=el('article','','card');box.append(el('h3','✓ '+t.title),el('p',ui("Fälligkeitsdatum: ")+(t.due_date||ui("nicht erfasst"))+ui(" · Anlass: ")+(occasionNames.get(t.occasion_id)||ui("ohne Zuordnung"))));doneRoot.append(box)}
 const trend=$('dailyTrend');trend.replaceChildren();
 for(let offset=3;offset>=0;offset--){const end=today-((new Date(today).getUTCDay()+6)%7)*day-offset*7*day+6*day,start=end-6*day,week=weeklyTasks.filter(t=>!t.archived_at&&t.due_date&&utcDate(t.due_date)>=start&&utcDate(t.due_date)<=end),count=week.filter(t=>t.status==='done').length;
 const card=el('article','','card');card.append(el('h3',new Date(start).toLocaleDateString(locale(),{timeZone:'UTC'})+' – '+new Date(end).toLocaleDateString(locale(),{timeZone:'UTC'})),el('p',count+ui(" von ")+week.length+ui(" Aufgaben aktuell erledigt")));const bar=document.createElement('progress');bar.max=week.length||1;bar.value=count;bar.style.width='100%';card.append(bar);trend.append(card)}
 trend.append(el('p',ui("Hinweis: Die Wochenwerte beruhen auf dem aktuellen Aufgabenstatus und dem Fälligkeitsdatum. Ohne historische Statusänderungs-Snapshots lässt sich nicht rekonstruieren, wann eine Aufgabe tatsächlich erledigt wurde."),'hint'));
}
function renderWeeklyTasks(){
 const now=new Date(),today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()),start=today-((now.getDay()+6)%7)*day,end=start+6*day;
 const active=weeklyTasks.filter(t=>t.status!=='done'&&!t.archived_at);
 const ordered=active.map(t=>({task:t,...taskRank(t,today)})).filter(x=>x.days!==null&&x.days<=Math.round((end-today)/day)).sort((a,b)=>a.score-b.score||(a.days??999)-(b.days??999)||String(a.task.title).localeCompare(String(b.task.title)));
 const top=ordered.slice(0,5),rest=ordered.slice(5);
 const summary=$('weeklySummary');summary.replaceChildren();
 const weekTasks=weeklyTasks.filter(t=>!t.archived_at&&t.due_date&&utcDate(t.due_date)>=start&&utcDate(t.due_date)<=end);const completed=weekTasks.filter(t=>t.status==='done').length;const progress=$('weeklyProgress');progress.max=weekTasks.length||1;progress.value=completed;$('weeklyProgressText').textContent=completed+ui(" von ")+weekTasks.length+ui(" für diese Kalenderwoche fälligen Aufgaben erledigt (")+(weekTasks.length?Math.round(completed/weekTasks.length*100):0)+ui(" %). Überfällige Aufgaben werden gesondert priorisiert.");
 const metrics=[[ui("Überfällig"),ordered.filter(x=>x.days<0).length],[ui("Bis Sonntag fällig"),ordered.filter(x=>x.days>=0).length],[ui("Hohe Priorität"),ordered.filter(x=>x.priority===1).length],[ui("Empfohlen zuerst"),top.length]];
 for(const [label,value] of metrics){const card=el('div','','review-kpi');card.append(el('strong',String(value)),el('span',label));summary.append(card)}
 const render=(root,entries)=>{root.replaceChildren();if(!entries.length){root.append(el('p',ui("Keine offenen Aufgaben in dieser Gruppe.")));return}
 for(const x of entries){const t=x.task,box=el('article','','card '+(x.days<0?'priority-critical':x.days<=1?'priority-high':'priority-normal')),label=x.days<0?ui("Seit ")+Math.abs(x.days)+ui(" Tagen überfällig"):x.days===0?ui("Heute fällig"):x.days===1?ui("Morgen fällig"):ui("In ")+x.days+ui(" Tagen fällig");
 box.append(el('h3',t.title),el('p','⏰ '+label+' · '+(t.due_date||ui("ohne Datum"))),el('p',ui("Priorität: ")+({1:ui("hoch"),2:ui("mittel"),3:ui("niedrig")}[x.priority]||ui("mittel"))+ui(" · Status: ")+(t.status==='in_progress'?ui("in Arbeit"):ui("offen"))));
 if(t.occasion_id&&occasionNames.has(t.occasion_id))box.append(el('p','🎁 '+occasionNames.get(t.occasion_id)));
 box.append(el('p',ui("Empfehlung: ")+(x.days<0?ui("Zuerst nachholen, da die Fälligkeit überschritten ist."):x.days<=1?ui("Zeitnah bearbeiten, da die Fälligkeit unmittelbar bevorsteht."):ui("In dieser Woche einplanen."))+(x.priority===1?ui(" Zusätzlich als hohe Priorität markiert."):''),'hint'));
 const actions=el('div','','task-actions');const done=el('button',ui("✓ Erledigt markieren"));done.type='button';done.addEventListener('click',()=>changeTask(t,'status','done',done));actions.append(done);
 const labelDate=el('label',ui("Neues Fälligkeitsdatum")),dateInput=document.createElement('input');dateInput.type='date';dateInput.value=t.due_date||'';dateInput.min='1900-01-01';dateInput.max='2200-12-31';labelDate.append(dateInput);actions.append(labelDate);
 const move=el('button',ui("Datum bestätigt verschieben"));move.type='button';move.addEventListener('click',()=>{if(!dateInput.value||!/^\\d{4}-\\d{2}-\\d{2}$/.test(dateInput.value)){ $('taskActionStatus').textContent=ui("Bitte gültiges Datum auswählen.");return}changeTask(t,'due_date',dateInput.value,move)});actions.append(move);box.append(actions);
 const link=el('a',ui("Aufgabenverwaltung öffnen"));link.href='./gift-tasks.html';box.append(link);root.append(box)}};
 render($('weeklyPriority'),top);render($('weeklyRemaining'),rest);
}
function dateLabel(ms){return new Date(ms).toLocaleDateString(locale(),{timeZone:'UTC',day:'2-digit',month:'2-digit'})}
function renderWeek(){
 const now=new Date(),today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()),dow=(new Date(today).getUTCDay()+6)%7,start=today-dow*day+weekOffset*7*day,end=start+6*day;
 $('weekLabel').textContent=dateLabel(start)+' – '+dateLabel(end)+' · '+new Date(start).getUTCFullYear();
 const root=$('planningWeek');root.replaceChildren();
 for(let i=0;i<7;i++){const current=start+i*day,box=el('article','','week-day');box.append(el('strong',(locale()==='en-GB'?['Mon','Tue','Wed','Thu','Fri','Sat','Sun']:['Mo','Di','Mi','Do','Fr','Sa','So'])[i]+' '+dateLabel(current)));
 for(const e of calendarEvents.filter(e=>e.date===current))box.append(el('span',e.label,'week-event'));root.append(box)}
}
$('weekPrev').addEventListener('click',()=>{weekOffset--;renderWeek()});
$('weekNext').addEventListener('click',()=>{weekOffset++;renderWeek()});
$('weekToday').addEventListener('click',()=>{weekOffset=0;renderWeek()});
function renderOccasionPlanning(){
 if(!planningSnapshot)return;
 const {closings,occasions}=planningSnapshot;
 const root=$('occasionCards'),tips=$('globalTips');
 const savedControls=new Map([...root.querySelectorAll('[data-occasion-id]')].map(card=>[card.dataset.occasionId,{template:card.querySelector('select')?.value,confirmed:card.querySelector('input[type=checkbox]')?.checked}]));
 root.replaceChildren();tips.replaceChildren();calendarEvents=[];
 const nowDate=new Date(),today=Date.UTC(nowDate.getFullYear(),nowDate.getMonth(),nowDate.getDate());
 $('evidence').textContent=closings.length+ui(" gespeicherte historische Jahresabschlüsse. Die Empfehlungen verwenden ausschließlich deren unveränderliche Geschenk-, Budget- und Aufgaben-Snapshots. Aktuelle Anlässe liefern nur Namen und zukünftige Termine.");
 const upcoming=occasions.map(o=>({...o,next:nextDate(o,today)})).filter(o=>o.next!==null).sort((a,b)=>a.next-b.next).slice(0,40);
 if(!upcoming.length)root.append(el('p',ui("Noch keine kommenden Anlässe erfasst.")));
 for(const o of upcoming){
 const days=Math.round((o.next-today)/day),history=[];
 for(const c of closings){const gifts=Array.isArray(c.gifts_snapshot)?c.gifts_snapshot.filter(g=>g.occasion_id===o.id):[],budgets=Array.isArray(c.budgets_snapshot)?c.budgets_snapshot:[],budget=budgets.find(b=>b.occasion_id===o.id);
 if(!gifts.length&&!budget)continue;history.push({year:c.closing_year,gifts,budget:budget?.budget_amount??null,spent:gifts.reduce((n,g)=>n+Number(g.actual_amount||0),0),tasks:Array.isArray(c.tasks_snapshot)?c.tasks_snapshot.filter(t=>t.occasion_id===o.id):null})}
 const lines=['📅 '+new Date(o.next).toLocaleDateString(locale(),{timeZone:'UTC'})+ui(" · noch ")+days+ui(" Tage")];
 const budgetValues=history.map(h=>h.budget).filter(v=>v!==null).map(Number),spentValues=history.filter(h=>h.gifts.length).map(h=>h.spent);
 const suggestion=median(budgetValues.length?budgetValues:spentValues);
 if(suggestion!==null){lines.push(ui("💶 Unverbindlicher Budgetrichtwert: ")+euro(suggestion)+ui(" (Median aus ")+(budgetValues.length?ui("gespeicherten Anlassbudgets"):ui("historisch erfassten Geschenkausgaben"))+ui(" in ")+(budgetValues.length?budgetValues.length:spentValues.length)+ui(" Abschlussjahr(en))."));lines.push(ui("Aktuelles Budget: ")+euro(o.budget_amount)+ui(" – Änderungen nur über die Anlassverwaltung."))}
 else lines.push(ui("💶 Noch kein belastbarer historischer Budgetrichtwert für diesen Anlass."));
 const historicalTasks=history.flatMap(h=>h.tasks||[]),hasShipping=historicalTasks.some(t=>/versand|liefer|bestell|shipping/i.test(t.title||''));
 const lead=hasShipping?28:21;const startDate=o.next-lead*day;calendarEvents.push({date:o.next,label:'🎁 '+o.title+ui(" · Anlass")},{date:startDate,label:'📝 '+o.title+ui(" · Planungsstart")});lines.push(ui("✅ Checklistenempfehlung: ")+(hasShipping?ui("Versand-Checkliste (ca. 28 Tage Vorlauf)"):ui("Standard-Checkliste (ca. 21 Tage Vorlauf)"))+ui(". Begründung: ")+(hasShipping?ui("In historischen Aufgaben gab es Versand- oder Bestellschritte."):ui("Keine historischen Versandaufgaben belegt; Standardvorlauf als allgemeine Planungsregel.")));
 if(days<=lead)lines.push(ui("⏰ Frühzeitiger Hinweis: Der empfohlene Planungsbeginn ist erreicht")+(days<7?ui(" – Anlass in weniger als sieben Tagen."):'.'));
 else lines.push(ui("🗓️ Empfohlener Planungsbeginn in etwa ")+(days-lead)+ui(" Tagen."));
 const incomplete=history.filter(h=>h.gifts.length&&h.gifts.some(g=>g.status!=='gifted')).length;
 if(incomplete)lines.push(ui("📌 Historische Beobachtung: In ")+incomplete+ui(" Abschlussjahr(en) waren Geschenke dieses Anlasses noch nicht als verschenkt markiert."));
 if(history.length)lines.push(ui("Datengrundlage: ")+history.map(h=>h.year).join(', ')+'.');else lines.push(ui("Keine Anlasshistorie: Checklisten-Vorlauf ist eine allgemeine Empfehlung, keine historische Erkenntnis."));
 const card=addCard(root,o.title,lines);card.dataset.occasionId=String(o.id);
 const label=el('label',ui("Checkliste auswählen")),select=document.createElement('select');for(const [value,name] of [['standard',ui("Standard (21 Tage)")],['shipping',ui("Versand (28 Tage)")],['last_minute',ui("Kurzfristig (5 Tage)")]]){const option=document.createElement('option');option.value=value;option.textContent=name;select.append(option)}select.value=savedControls.get(String(o.id))?.template||(hasShipping?'shipping':'standard');label.append(select);card.append(label);
 const confirmLabel=el('label','','confirm'),check=document.createElement('input');check.type='checkbox';check.checked=Boolean(savedControls.get(String(o.id))?.confirmed);confirmLabel.append(check,el('span',ui("Ich bestätige die Erstellung dieser Checkliste für ")+new Date(o.next).getUTCFullYear()+ui(". Bereits vorhandene Aufgaben bleiben erhalten.")));card.append(confirmLabel);
 const button=el('button',ui("Ausgewählte Checkliste übernehmen")),feedback=el('p','','feedback');card.append(button,feedback);
 button.addEventListener('click',async()=>{if(!check.checked){feedback.textContent=ui("Bitte zuerst die Übernahme ausdrücklich bestätigen.");return}if(!window.confirm(ui("Checkliste für „")+o.title+ui("“ im Jahr ")+new Date(o.next).getUTCFullYear()+ui(" jetzt erstellen?")))return;button.disabled=true;checklistBusy++;feedback.textContent=ui("Übernahme läuft …");try{const {data,error}=await db.rpc('wishlist_create_occasion_checklist_year',{p_occasion_id:o.id,p_template:select.value,p_year:new Date(o.next).getUTCFullYear()});if(error){feedback.textContent=ui("Übernahme fehlgeschlagen. Bitte Anmeldung und Anlass prüfen.");return}feedback.textContent=ui("Übernahme abgeschlossen: ")+Number(data||0)+ui(" neue Aufgaben erstellt. Vorhandene Aufgaben wurden nicht verändert.");check.checked=false}catch{feedback.textContent=ui("Übernahme fehlgeschlagen. Bitte Anmeldung und Anlass prüfen.")}finally{button.disabled=false;checklistBusy--;if(localePending&&!checklistBusy&&!taskBusy){localePending=false;refreshTaskDisplay()}}});
 }
 const tips=$('globalTips');
 if(!closings.length)addCard(tips,ui("Mit dem ersten Jahresabschluss starten"),[ui("Historische Budgetvorschläge werden erst möglich, wenn ein Jahresabschluss gespeichert wurde. Bis dahin bleiben allgemeine Checklistenregeln verfügbar.")]);
 else{
 const yearsWithTasks=closings.filter(c=>c.task_count!==null),unfinished=yearsWithTasks.filter(c=>c.task_count>0&&c.task_done_count<c.task_count);
 if(unfinished.length)addCard(tips,ui("Checklisten frühzeitig starten"),[ui("In ")+unfinished.length+ui(" von ")+yearsWithTasks.length+ui(" Abschlüssen mit Aufgabenhistorie waren Checklisten nicht vollständig erledigt. Empfehlung: Aufgaben rechtzeitig vor dem Anlass erstellen.")]);
 const budgeted=closings.filter(c=>Array.isArray(c.budgets_snapshot)&&c.budgets_snapshot.length);
 if(!budgeted.length)addCard(tips,ui("Historische Budgets aufbauen"),[ui("In den gespeicherten Abschlüssen fehlen ausdrücklich erfasste Anlassbudgets. Budgetrichtwerte können dann nur auf tatsächlich erfassten Geschenkausgaben beruhen.")]);
 else addCard(tips,ui("Budgethistorie nutzen"),[ui("In ")+budgeted.length+ui(" abgeschlossenen Jahren wurden Anlassbudgets gespeichert. Diese Daten ermöglichen nachvollziehbare Richtwerte für wiederkehrende Anlässe.")]);
 }
 renderWeek();
}
async function main(){
 const {data,error}=await db.auth.getUser(),user=data?.user;if(error||!user){$('login').hidden=false;$('status').textContent='Bitte anmelden.';return}
 const [closings,occasions,tasks]=await Promise.all([
 allRows('wishlist_gift_year_closings','closing_year,gift_count,gifted_count,actual_total,budget_total,gifts_snapshot,budgets_snapshot,tasks_snapshot,task_count,task_done_count',user.id,'closing_year'),
 allRows('wishlist_occasions','id,title,occasion_date,repeats_yearly,reminder_days,budget_amount',user.id,'occasion_date'),
 allRows('wishlist_gift_tasks','id,title,occasion_id,due_date,status,priority,archived_at,checklist_year',user.id,'created_at')
 ]);
 taskUserId=user.id;await loadTaskEvents();weeklyTasks=tasks;occasionNames=new Map(occasions.map(o=>[o.id,o.title]));renderWeeklyTasks();renderDaily();
 planningSnapshot={closings,occasions};renderOccasionPlanning();
 assistantReady=true;$('content').hidden=false;$('status').textContent='Private Planungsvorschläge geladen. Keine Daten wurden geändert.';
}
main().catch(()=>{$('status').textContent='Die privaten Planungsvorschläge konnten nicht vollständig geladen werden. Bitte später erneut versuchen.'});

// Repaint read-only task summaries after DE/EN changes; defer while an update is pending.
document.addEventListener('toolya:wishes-locale-change',()=>{if(!assistantReady)return;if(taskBusy||checklistBusy){localePending=true;return}refreshTaskDisplay()});
