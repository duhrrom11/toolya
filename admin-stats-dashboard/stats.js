/* Admin statistics: never request provider APIs or secrets from the browser. */
(()=>{'use strict';
const URL='https://yheogmeaosuigyaxkwth.supabase.co', KEY='sb_publishable_PK20oOPzG3AB-bd95Ji9Tg_C-MIUgyv';
const endpoint=URL+'/functions/v1/admin-stats';
const $=id=>document.getElementById(id);
const client=window.supabase?.createClient(URL,KEY);
const state=$('state'),panel=$('panel');
const show=(msg)=>{state.textContent=msg;state.hidden=false;panel.hidden=true};
const tile=(title,value,detail)=>{const e=document.createElement('article');e.className='tile';const h=document.createElement('h3');h.textContent=title;const v=document.createElement('strong');v.textContent=value;const p=document.createElement('p');p.className='meta';p.textContent=detail;e.append(h,v,p);return e};
async function load(){
 if(!client){show('Die Anmeldung konnte nicht geladen werden.');return}
 show('Administratorzugriff wird geprüft …');
 try{
  const {data:{session},error}=await client.auth.getSession();
  if(error||!session){show('Bitte zuerst im Toolya-Dashboard anmelden.');return}
  const response=await fetch(endpoint+'?days='+encodeURIComponent($('period').value),{headers:{Authorization:'Bearer '+session.access_token,apikey:KEY},cache:'no-store'});
  if(response.status===401||response.status===403){show('Zugriff verweigert: Dieses Konto ist nicht als Statistik-Administrator freigeschaltet.');return}
  if(!response.ok){show('Statistikdienst noch nicht verfügbar (HTTP '+response.status+').');return}
  const payload=await response.json();
  if(!payload||!Array.isArray(payload.sources)||!Array.isArray(payload.metrics))throw Error('Ungültiges Datenformat');
  $('summary').replaceChildren(...payload.metrics.map(m=>tile(m.label,String(m.value),m.detail||'')));
  $('sources').replaceChildren(...payload.sources.map(s=>{const e=tile(s.label,s.status==='connected'?'Verbunden':s.status==='error'?'Fehler':'Nicht verbunden',s.detail||'Noch keine verifizierten Daten');return e}));
  panel.hidden=false;state.hidden=true;
 }catch{show('Statistikdienst nicht erreichbar. Es werden keine Schätzwerte angezeigt.')}
}
$('refresh').addEventListener('click',load);$('period').addEventListener('change',load);
load();
})();