import {db} from './toolya-client.mjs';
import {wishesText} from '../../shared/toolya/i18n/wishes-copy.mjs';
const ui=value=>wishesText(value,globalThis.__toolyaWishesLocale==='en'?'en':'de');
const locale=()=>globalThis.__toolyaWishesLocale==='en'?'en-GB':'de-DE';
const taskStatusLabel=value=>value==='open'?ui('Offen'):value==='in_progress'?ui('In Arbeit'):value==='done'?ui('Erledigt'):value||'—';
const $=id=>document.getElementById(id);
const day=86400000;let exportRows=null;
function el(tag,value,cls){const node=document.createElement(tag);node.textContent=String(value);if(cls)node.className=cls;return node}
function dateOnly(value){if(!value)return null;const [y,m,d]=value.slice(0,10).split('-').map(Number);return Date.UTC(y,m-1,d)}
function number(n,digits=0){return new Intl.NumberFormat(locale(),{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(n)}
function card(root,label,value,detail){const box=el('article','','card');box.append(el('strong',value),el('span',label));if(detail)box.append(el('p',detail,'muted'));root.append(box)}
async function load(userId){const rows=[];for(let start=0;start<20000;start+=500){const {data,error}=await db.from('wishlist_gift_task_events').select('id,task_title,event_type,old_status,new_status,old_due_date,new_due_date,occurred_at,occasion_id,occasion_title').eq('user_id',userId).order('id',{ascending:true}).range(start,start+499);if(error)throw error;rows.push(...(data||[]));if((data||[]).length<500)return rows}throw new Error('Bericht nicht vollständig: Ereignislimit erreicht')}
function weekStart(ms){const date=new Date(ms);return ms-((date.getUTCDay()+6)%7)*day}
function formatDate(ms){return new Date(ms).toLocaleDateString(locale(),{timeZone:'UTC'})}
function renderSuccess(rows){
 const months=$('months'),occasions=$('occasions'),recommendations=$('recommendations');months.replaceChildren();occasions.replaceChildren();recommendations.replaceChildren();
 const byMonth=new Map(),byOccasion=new Map();
 for(const e of rows){
  const month=e.occurred_at.slice(0,7),m=byMonth.get(month)||{done:0,moved:0,reopened:0};if(e.event_type==='completed')m.done++;if(e.event_type==='due_date_changed')m.moved++;if(e.event_type==='reopened')m.reopened++;byMonth.set(month,m);
  const key=e.occasion_id||'unassigned',o=byOccasion.get(key)||{title:e.occasion_title||ui('Historisch nicht zugeordnet'),done:0,moved:0,reopened:0};if(e.event_type==='completed')o.done++;if(e.event_type==='due_date_changed')o.moved++;if(e.event_type==='reopened')o.reopened++;byOccasion.set(key,o);
 }
 if(!byMonth.size)months.append(el('p',ui('Noch keine protokollierten Monate.')));
 for(const [month,m] of [...byMonth].sort((a,b)=>b[0].localeCompare(a[0])).slice(0,18)){const box=el('article','','card');box.append(el('h3',month),el('p',m.done+ui(' Erledigungen · ')+m.moved+ui(' Terminverschiebungen · ')+m.reopened+ui(' Wiedereröffnungen')));months.append(box)}
 if(!byOccasion.size)occasions.append(el('p',ui('Noch keine protokollierten Anlassdaten.')));
 for(const [key,o] of [...byOccasion].sort((a,b)=>b[1].done-a[1].done).slice(0,25)){const box=el('article','','card');box.append(el('h3',o.title),el('p',o.done+ui(' Erledigungen · ')+o.moved+ui(' Terminverschiebungen · ')+o.reopened+ui(' Wiedereröffnungen')));if(key==='unassigned')box.append(el('p',ui('Ohne im Ereignis gespeicherte Anlasszuordnung.'),'muted'));occasions.append(box)}
 const totalDone=rows.filter(e=>e.event_type==='completed').length,totalMoved=rows.filter(e=>e.event_type==='due_date_changed').length;
 if(!rows.length){recommendations.append(el('p',ui('Sobald echte Ereignisse vorliegen, erscheinen hier datengestützte Hinweise.')));return}
 if(totalMoved>totalDone)addRecommendation(ui('Planungsfenster prüfen'),ui('Es wurden ')+totalMoved+ui(' Terminverschiebungen und ')+totalDone+ui(' Erledigungen protokolliert. Frühere Starttermine können helfen.'));
 else addRecommendation(ui('Erledigungen sichtbar machen'),ui('Es wurden ')+totalDone+ui(' Erledigungsereignisse dokumentiert. Nutze die Monatsübersicht, um deine tatsächliche Aktivität zu vergleichen.'));
 if(byMonth.size<2)addRecommendation(ui('Mehr Verlauf sammeln'),ui('Für belastbare Monatstrends sind bislang weniger als zwei Monate mit protokollierten Ereignissen vorhanden.'));
 else{const series=[...byMonth].sort((a,b)=>a[0].localeCompare(b[0]));const latest=series.at(-1),prior=series.at(-2);addRecommendation(ui('Monate vergleichen'),latest[0]+': '+latest[1].done+ui(' Erledigungen; ')+prior[0]+': '+prior[1].done+ui('. Der Vergleich beschreibt Aktivität, keine Erfolgsquote aller Aufgaben.'))}
 function addRecommendation(title,body){const box=el('article','','card');box.append(el('h3',title),el('p',body));recommendations.append(box)}
}
$('exportEvents').addEventListener('click',()=>{
 if(!exportRows)return;
 if(!window.confirm(ui('Eigene protokollierte Aufgabenereignisse als JSON-Datei auf diesem Gerät speichern? Die Datei enthält private Aufgabentitel und Zeitpunkte.')))return;
 const payload={format:'helferlein-wishes-task-events-v1',exported_at:new Date().toISOString(),event_count:exportRows.length,events:exportRows};
 const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='helferlein-private-aufgabenereignisse-'+new Date().toISOString().slice(0,10)+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
function render(rows){
 for(const id of ['kpis','moves','weeks','events'])$(id).replaceChildren();
 exportRows=rows.map(e=>({...e}));$('exportEvents').disabled=false;renderSuccess(rows);
 const completed=rows.filter(e=>e.event_type==='completed'),moves=rows.filter(e=>e.event_type==='due_date_changed'),reopened=rows.filter(e=>e.event_type==='reopened');
 const first=rows.length?new Date(rows[0].occurred_at):null,last=rows.length?new Date(rows[rows.length-1].occurred_at):null;
 $('scope').textContent=rows.length?ui('Ereignisse vom ')+first.toLocaleString(locale())+ui(' bis ')+last.toLocaleString(locale())+ui('. Bericht erstellt am ')+new Date().toLocaleString(locale())+'.':ui('Noch keine Ereignisse seit Aktivierung des Protokolls. Es werden keine früheren Änderungen geschätzt.');
 const kpis=$('kpis');card(kpis,ui('Erledigungsereignisse'),number(completed.length),ui('Tatsächlich serverseitig protokolliert.'));card(kpis,ui('Terminverschiebungen'),number(moves.length));card(kpis,ui('Wiedereröffnungen'),number(reopened.length));card(kpis,ui('Protokollierte Ereignisse'),number(rows.length));
 const valid=moves.map(e=>({event:e,delta:e.old_due_date&&e.new_due_date?Math.round((dateOnly(e.new_due_date)-dateOnly(e.old_due_date))/day):null})),numeric=valid.filter(x=>x.delta!==null),average=numeric.length?numeric.reduce((s,x)=>s+x.delta,0)/numeric.length:null;
 const moveRoot=$('moves');card(moveRoot,ui('Durchschnittliche Verschiebung'),average===null?ui('Nicht berechenbar'):(average>0?'+':'')+number(average,1)+ui(' Tage'),numeric.length+ui(' von ')+moves.length+ui(' Ereignissen mit beiden Datumswerten.'));card(moveRoot,ui('Später geplant'),number(numeric.filter(x=>x.delta>0).length));card(moveRoot,ui('Früher geplant'),number(numeric.filter(x=>x.delta<0).length));card(moveRoot,ui('Unverändert / ohne Datumsvergleich'),number(moves.length-numeric.filter(x=>x.delta!==0).length));
 const weekRoot=$('weeks'),today=new Date(),utcToday=Date.UTC(today.getFullYear(),today.getMonth(),today.getDate()),thisWeek=weekStart(utcToday),counts=[];
 for(let offset=7;offset>=0;offset--){const start=thisWeek-offset*7*day,end=start+7*day,items=rows.filter(e=>{const at=Date.parse(e.occurred_at);return at>=start&&at<end}),done=items.filter(e=>e.event_type==='completed').length,shift=items.filter(e=>e.event_type==='due_date_changed').length;counts.push(done);const box=el('article','','card');box.append(el('strong',done+ui(' Erledigungen')),el('span',formatDate(start)+' – '+formatDate(end-day)),el('p',shift+ui(' Terminverschiebungen · ')+items.length+ui(' Ereignisse'),'muted'));weekRoot.append(box)}
 const max=Math.max(1,...counts);for(const [i,box] of [...weekRoot.children].entries()){const bar=document.createElement('progress');bar.className='bar';bar.max=max;bar.value=counts[i];bar.setAttribute('aria-label',ui('Erledigungsereignisse im Vergleich zum Maximum der acht Wochen'));box.append(bar)}
 const body=$('events');for(const e of [...rows].reverse().slice(0,200)){const tr=document.createElement('tr');const label={completed:ui('Erledigt'),reopened:ui('Wieder geöffnet'),status_changed:ui('Status geändert'),due_date_changed:ui('Termin verschoben')}[e.event_type]||ui('Änderung');const change=e.event_type==='due_date_changed'?(e.old_due_date||ui('ohne Datum'))+' → '+(e.new_due_date||ui('ohne Datum')):taskStatusLabel(e.old_status)+' → '+taskStatusLabel(e.new_status);for(const value of [new Date(e.occurred_at).toLocaleString(locale()),e.task_title,label,change])tr.append(el('td',value));body.append(tr)}
 if(rows.length>200)body.append(el('tr',ui('Chronik auf die 200 neuesten Ereignisse begrenzt; Kennzahlen berücksichtigen alle geladenen Ereignisse.')));
 $('report').hidden=false;$('status').textContent=ui('Privater Bericht bereit. Keine Produktivdaten geändert.');
}
$('printReport').addEventListener('click',()=>{if(!$('report').hidden)window.print()});
async function main(){const {data,error}=await db.auth.getUser();if(error||!data?.user){$('login').hidden=false;$('status').textContent='Bitte anmelden.';return}render(await load(data.user.id))}
main().catch(()=>{$('status').textContent=ui('Bericht konnte nicht vollständig geladen werden. Bitte später erneut versuchen.')});

// Re-render presentation copy only; the report's private event snapshot stays unchanged.
document.addEventListener('toolya:wishes-locale-change',()=>{if(exportRows)render(exportRows)});
