import {db} from './toolya-client.mjs';
import {wishesText} from '../../shared/toolya/i18n/wishes-copy.mjs';
const ui=value=>wishesText(value,globalThis.__toolyaWishesLocale==='en'?'en':'de');
const locale=()=>globalThis.__toolyaWishesLocale==='en'?'en-GB':'de-DE';
let renderedSnapshot=null;
const $=id=>document.getElementById(id),day=86400000;
function el(tag,value,cls){const e=document.createElement(tag);e.textContent=String(value);if(cls)e.className=cls;return e}
function card(root,title,body,cls){const box=el('article','','card '+(cls||''));box.append(el('h3',title),el('p',body));root.append(box);return box}
function date(value){if(!value)return null;const [y,m,d]=value.slice(0,10).split('-').map(Number);return Date.UTC(y,m-1,d)}
function label(ms){return new Date(ms).toLocaleDateString(locale(),{timeZone:'UTC',day:'2-digit',month:'2-digit',year:'numeric'})}
function nextOccasion(o,today){const base=date(o.occasion_date);if(base===null)return null;if(!o.repeats_yearly)return base>=today?base:null;const [y,m,d]=o.occasion_date.split('-').map(Number);let year=new Date(today).getUTCFullYear();for(let i=0;i<3;i++,year++){const last=new Date(Date.UTC(year,m,0)).getUTCDate(),ms=Date.UTC(year,m-1,Math.min(d,last));if(ms>=today)return ms}return null}
async function allRows(table,columns,uid,order){const rows=[];for(let start=0;start<20000;start+=500){const {data,error}=await db.from(table).select(columns).eq('user_id',uid).order(order,{ascending:true}).range(start,start+499);if(error)throw error;rows.push(...(data||[]));if((data||[]).length<500)return rows}throw new Error('Zu viele Datensätze für vollständige Cockpit-Auswertung')}
function metric(root,value,title){const box=el('article','','card');box.append(el('strong',value),el('span',title));root.append(box)}
function render(tasks,occasions,closings,events){
 for(const id of ['kpis','priorities','occasions','activity','history','tips'])$(id).replaceChildren();
 const now=new Date(),today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()),active=tasks.filter(t=>!t.archived_at),open=active.filter(t=>t.status!=='done'),done=active.filter(t=>t.status==='done');
 const due=open.filter(t=>date(t.due_date)!==null&&date(t.due_date)<=today).map(t=>({t,days:Math.round((date(t.due_date)-today)/day)})).sort((a,b)=>(a.days<0?0:1)-(b.days<0?0:1)||(Number(a.t.priority)||2)-(Number(b.t.priority)||2)||a.days-b.days);
 const upcoming=occasions.map(o=>({o,ms:nextOccasion(o,today)})).filter(x=>x.ms!==null).sort((a,b)=>a.ms-b.ms);
 const kpis=$('kpis');metric(kpis,open.length,ui("Offene Aufgaben"));metric(kpis,due.filter(x=>x.days<0).length,ui("Überfällig"));metric(kpis,due.filter(x=>x.days===0).length,ui("Heute fällig"));metric(kpis,upcoming.filter(x=>x.ms<=today+30*day).length,'Anlässe in 30 Tagen');
 const focus=$('priorities');if(!due.length)card(focus,ui("Heute gut aufgestellt"),ui("Keine offenen Aufgaben mit Fälligkeit bis heute."));
 for(const x of due.slice(0,6)){const box=card(focus,x.t.title,(x.days<0?ui("Seit ")+Math.abs(x.days)+ui(" Tagen überfällig"):ui("Heute fällig"))+ui(" · Priorität ")+({1:ui("hoch"),2:ui("mittel"),3:ui("niedrig")}[x.t.priority]||ui("mittel"))+ui(". Empfehlung: ")+(x.days<0?ui("Zuerst nachholen."):ui("Heute einplanen.")),x.days<0?'critical':'urgent');const a=el('a','Aufgabe bearbeiten');a.href='./gift-tasks.html';box.append(a)}
 const occ=$('occasions');if(!upcoming.length)card(occ,ui("Keine kommenden Anlässe"),ui("Du kannst in der Anlassverwaltung einen neuen Anlass anlegen."));
 for(const x of upcoming.slice(0,6)){const days=Math.round((x.ms-today)/day),lead=21,box=card(occ,x.o.title,label(x.ms)+' · '+(days===0?ui("Heute"):days+ui(" Tage verbleibend"))+(x.o.repeats_yearly?ui(" · jährlich"):'')+'. '+(days<=lead?ui("Empfehlung: Planung jetzt beginnen."):ui("Empfohlener Planungsstart: ")+label(x.ms-lead*day)+'.'));const a=el('a',ui("Anlass öffnen"));a.href='./occasions.html';box.append(a)}
 const total=active.length;$('progress').max=total||1;$('progress').value=done.length;$('progressText').textContent=done.length+ui(" von ")+total+ui(" aktuell nicht archivierten Aufgaben erledigt (")+(total?Math.round(done.length/total*100):0)+ui(" %). Dieser Wert beschreibt den aktuellen Stand, keine historische Erledigungsquote.");
 const completed=events.filter(e=>e.event_type==='completed'),moved=events.filter(e=>e.event_type==='due_date_changed');metric($('activity'),completed.length,ui("Protokollierte Erledigungsereignisse"));metric($('activity'),moved.length,ui("Protokollierte Terminverschiebungen"));
 const history=$('history');metric(history,closings.length,ui("Historische Jahresabschlüsse"));if(closings.length){const years=[...closings].sort((a,b)=>b.closing_year-a.closing_year);for(const c of years.slice(0,3)){const count=Number(c.gift_count)||0,gifted=Number(c.gifted_count)||0;card(history,ui("Abschluss ")+c.closing_year,gifted+ui(" von ")+count+ui(" Geschenken als verschenkt gespeichert")+(count?' ('+Math.round(100*gifted/count)+' %)':'')+ui(". Historischer Snapshot, nicht nachträglich verändert."))}}
 else card(history,ui("Noch keine Abschlüsse"),ui("Historische Erkenntnisse werden erst nach ausdrücklich gespeicherten Jahresabschlüssen angezeigt."));
 const tips=$('tips');if(due.some(x=>x.days<0))card(tips,ui("Überfälliges priorisieren"),due.filter(x=>x.days<0).length+ui(" offene Aufgaben sind überfällig. Bearbeite zunächst die am höchsten priorisierten."));
 if(upcoming.some(x=>x.ms<=today+21*day))card(tips,ui("Geschenkplanung beginnen"),ui("Mindestens ein Anlass liegt innerhalb der nächsten 21 Tage. Plane offene Aufgaben frühzeitig."));
 if(moved.length>completed.length&&events.length)card(tips,ui("Puffer prüfen"),moved.length+ui(" Terminverschiebungen gegenüber ")+completed.length+ui(" protokollierten Erledigungen. Ein früherer Start kann helfen."));
 if(closings.length)card(tips,ui("Aus vergangenen Jahren lernen"),ui("Für ")+closings.length+ui(" abgeschlossene Jahre liegen unveränderliche historische Snapshots vor. Details findest du in der Planungsassistenz."));
 if(!tips.children.length)card(tips,ui("Alles im Blick"),ui("Aktuell ergeben sich aus den gespeicherten Daten keine dringenden Empfehlungen."));
 $('content').hidden=false;$('status').textContent=ui("Privates Planungscockpit geladen. Keine Daten geändert.");
}
async function main(){const {data,error}=await db.auth.getUser();if(error||!data?.user){$('login').hidden=false;$('status').textContent='Bitte anmelden.';return}const uid=data.user.id;const [tasks,occasions,closings,events]=await Promise.all([allRows('wishlist_gift_tasks','id,title,due_date,status,priority,archived_at',uid,'created_at'),allRows('wishlist_occasions','id,title,occasion_date,repeats_yearly',uid,'occasion_date'),allRows('wishlist_gift_year_closings','closing_year,gift_count,gifted_count',uid,'closing_year'),allRows('wishlist_gift_task_events','id,event_type,occurred_at',uid,'id')]);renderedSnapshot={tasks,occasions,closings,events};render(tasks,occasions,closings,events)}
document.addEventListener('toolya:wishes-locale-change',()=>{if(renderedSnapshot)render(renderedSnapshot.tasks,renderedSnapshot.occasions,renderedSnapshot.closings,renderedSnapshot.events)});
main().catch(()=>{$('status').textContent=ui("Das Cockpit konnte nicht vollständig geladen werden. Bitte später erneut versuchen.")});
