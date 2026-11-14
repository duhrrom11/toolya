const db=window.supabase.createClient('https://yheogmeaosuigyaxkwth.supabase.co','sb_publishable_PK20oOPzG3AB-bd95Ji9Tg_C-MIUgyv');
const $=id=>document.getElementById(id);
let user=null,items=[],editing=null,filter='all';
const today=()=>{const d=new Date();return Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())};
const parse=s=>{const [y,m,d]=s.split('-').map(Number);return {y,m,d}};
const validDay=(y,m,d)=>new Date(Date.UTC(y,m-1,d)).getUTCMonth()===m-1;
function occurrence(item){
 const {y,m,d}=parse(item.occasion_date);const base=Date.UTC(y,m-1,d);
 if(!item.repeats_yearly)return base;
 const now=new Date(today());let year=now.getUTCFullYear();
 function forYear(yr){return Date.UTC(yr,m-1,m===2&&d===29&&!validDay(yr,2,29)?28:d)}
 let next=forYear(year);if(next<today())next=forYear(++year);
 return next;
}
const daysUntil=item=>Math.round((occurrence(item)-today())/86400000);
const format=timestamp=>new Intl.DateTimeFormat('de-DE',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(timestamp));
const reminder=item=>{const days=daysUntil(item);return days>=0&&days<=item.reminder_days};
function reset(){editing=null;$('form').reset();$('repeat').checked=true;$('remind').value='14';$('formTitle').textContent='➕ Anlass hinzufügen';$('save').textContent='Anlass speichern';$('cancel').hidden=true}
function render(){
 const active=items.map(item=>({...item,next:occurrence(item),days:daysUntil(item)})).filter(item=>item.days>=0).sort((a,b)=>a.next-b.next||a.title.localeCompare(b.title,'de'));
 $('countAll').textContent=items.length;
 $('countSoon').textContent=active.filter(x=>x.days<=30).length;
 $('countDue').textContent=active.filter(reminder).length;
 document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));
 const rows=active.filter(x=>filter==='all'||(filter==='soon'?x.days<=30:reminder(x)));
 const root=$('events');root.replaceChildren();
 if(!rows.length){const p=document.createElement('p');p.className='empty';p.textContent=filter==='due'?'Aktuell keine anstehenden Erinnerungen.':filter==='soon'?'In den nächsten 30 Tagen stehen keine Anlässe an.':'Noch keine kommenden Anlässe. Lege deinen ersten Termin an.';root.append(p)}
 for(const item of rows){
  const card=document.createElement('article');card.className='event';
  const main=document.createElement('div'),badge=document.createElement('span');badge.className='badge';badge.textContent=reminder(item)?'🔔 Erinnerung aktiv':item.repeats_yearly?'🔁 Jährlich':'📅 Einmalig';
  const title=document.createElement('h3');title.textContent=item.title+(item.person_name?' · '+item.person_name:'');
  const time=document.createElement('time');time.dateTime=new Date(item.next).toISOString().slice(0,10);time.textContent=format(item.next)+' · '+(item.days===0?'Heute':item.days===1?'Morgen':'in '+item.days+' Tagen');
  main.append(badge,title,time);
  if(item.notes){const p=document.createElement('p');p.textContent=item.notes;main.append(p)}
  const controls=document.createElement('div'),edit=document.createElement('button'),remove=document.createElement('button');
  edit.type='button';edit.textContent='✏️ Bearbeiten';edit.addEventListener('click',()=>{editing=item.id;$('title').value=item.title;$('person').value=item.person_name||'';$('date').value=item.occasion_date;$('repeat').checked=item.repeats_yearly;$('remind').value=String(item.reminder_days);$('notes').value=item.notes||'';$('formTitle').textContent='✏️ Anlass bearbeiten';$('save').textContent='Änderungen speichern';$('cancel').hidden=false;$('form').scrollIntoView({behavior:'smooth',block:'start'});$('title').focus()});
  remove.type='button';remove.textContent='🗑️ Löschen';remove.addEventListener('click',async()=>{if(!confirm('Diesen Anlass dauerhaft löschen?'))return;remove.disabled=true;const {error}=await db.from('wishlist_occasions').delete().eq('id',item.id).eq('user_id',user.id);if(error){$('status').textContent='Löschen fehlgeschlagen.';remove.disabled=false}else{items=items.filter(x=>x.id!==item.id);if(editing===item.id)reset();render();$('status').textContent='Anlass gelöscht.'}});
  controls.append(edit,remove);card.append(main,controls);root.append(card);
 }
}
async function load(){
 const {data,error}=await db.auth.getUser();user=data?.user;
 if(error||!user){$('login').hidden=false;$('status').textContent='Bitte anmelden.';return}
 $('content').hidden=false;
 const {data:rows,error:loadError}=await db.from('wishlist_occasions').select('id,title,person_name,occasion_date,repeats_yearly,reminder_days,notes').eq('user_id',user.id).order('occasion_date',{ascending:true}).limit(1000);
 if(loadError)throw loadError;items=rows||[];render();$('status').textContent=items.length===1000?'Die ersten 1000 Anlässe wurden geladen.':'Deine privaten Anlässe sind aktuell.';
}
$('form').addEventListener('submit',async event=>{
 event.preventDefault();if(!user)return;
 const title=$('title').value.trim(),date=$('date').value;
 if(!title||!date){$('status').textContent='Bitte Titel und Datum angeben.';return}
 const payload={title,person_name:$('person').value.trim()||null,occasion_date:date,repeats_yearly:$('repeat').checked,reminder_days:Number($('remind').value),notes:$('notes').value.trim()||null,updated_at:new Date().toISOString()};
 $('save').disabled=true;
 try{
  const result=editing?await db.from('wishlist_occasions').update(payload).eq('id',editing).eq('user_id',user.id).select('id,title,person_name,occasion_date,repeats_yearly,reminder_days,notes').single():await db.from('wishlist_occasions').insert({...payload,user_id:user.id}).select('id,title,person_name,occasion_date,repeats_yearly,reminder_days,notes').single();
  if(result.error)throw result.error;
  items=items.filter(x=>x.id!==result.data.id);items.push(result.data);reset();render();$('status').textContent='Anlass dauerhaft gespeichert.';
 }catch{$('status').textContent='Speichern fehlgeschlagen. Bitte Angaben prüfen.'}
 finally{$('save').disabled=false}
});
$('cancel').addEventListener('click',reset);
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;render()}));
load().catch(()=>{$('status').textContent='Anlässe konnten nicht geladen werden. Bitte später erneut versuchen.'});
