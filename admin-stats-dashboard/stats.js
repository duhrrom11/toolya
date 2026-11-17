/* Admin statistics: never request provider APIs or secrets from the browser. */
(()=>{'use strict';
const URL='https://yheogmeaosuigyaxkwth.supabase.co', KEY='sb_publishable_PK20oOPzG3AB-bd95Ji9Tg_C-MIUgyv';
const endpoint=URL+'/functions/v1/admin-stats';
const $=id=>document.getElementById(id);
const client=window.supabase?.createClient(URL,KEY);
const state=$('state'),panel=$('panel');
const show=(msg)=>{state.textContent=msg;state.hidden=false;panel.hidden=true};
const tile=(title,value,detail)=>{const e=document.createElement('article');e.className='tile';const h=document.createElement('h3');h.textContent=title;const v=document.createElement('strong');v.textContent=value;const p=document.createElement('p');p.className='meta';p.textContent=detail;e.append(h,v,p);return e};
const renderSeo=(host,series)=>{host.replaceChildren();const points=Array.isArray(series?.points)?series.points.filter(p=>/^\d{4}-\d{2}-\d{2}$/.test(p.date)&&Number.isFinite(p.clicks)&&Number.isFinite(p.impressions)&&p.clicks>=0&&p.impressions>=0).sort((a,b)=>a.date.localeCompare(b.date)):[];
 if(!points.length){const message=series?.status==='unavailable'?'Tagesdaten konnten nicht abgerufen werden. Die Gesamtkennzahlen bleiben verfügbar.':series?.status==='empty'?'Die API lieferte für diesen Zeitraum keine auswertbaren Tageswerte.':'Keine Tagesdaten verfügbar oder Datenquelle nicht verbunden.';const info=document.createElement('p');info.textContent=message;host.append(info);if(series?.detail){const diagnostic=document.createElement('p');diagnostic.className='footnote';diagnostic.textContent=series.detail;host.append(diagnostic)}return}
 const legend=document.createElement('p');legend.className='seo-legend';legend.textContent='Klicks und Impressionen · getrennte Skalen';host.append(legend);
 for(const [key,label,color] of [['clicks','Klicks','#087a8b'],['impressions','Impressionen','#d97706']]){
  const heading=document.createElement('h4');heading.textContent=label;host.append(heading);
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 640 160');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('role','img');svg.setAttribute('aria-label',label+' vom '+points[0].date+' bis '+points[points.length-1].date);
  const max=Math.max(1,...points.map(p=>p[key]));const minTime=Date.parse(points[0].date+'T00:00:00Z'),maxTime=Date.parse(points[points.length-1].date+'T00:00:00Z');
  const coords=points.map((p,i)=>{const x=maxTime===minTime?320:12+(Date.parse(p.date+'T00:00:00Z')-minTime)/(maxTime-minTime)*616;return [x,145-p[key]/max*130]});
  const poly=document.createElementNS('http://www.w3.org/2000/svg','polyline');poly.setAttribute('points',coords.map(v=>v.join(',')).join(' '));poly.setAttribute('fill','none');poly.setAttribute('stroke',color);poly.setAttribute('stroke-width','3');poly.setAttribute('stroke-linecap','round');poly.setAttribute('stroke-linejoin','round');svg.append(poly);
  for(let i=0;i<points.length;i++){const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');dot.setAttribute('cx',coords[i][0]);dot.setAttribute('cy',coords[i][1]);dot.setAttribute('r','3');dot.setAttribute('fill',color);const title=document.createElementNS('http://www.w3.org/2000/svg','title');title.textContent=points[i].date+': '+points[i][key].toLocaleString('de-DE')+' '+label;dot.append(title);svg.append(dot)}
  host.append(svg);const dates=document.createElement('p');dates.className='seo-dates';dates.textContent=points[0].date+' – '+points[points.length-1].date+' · Maximum '+max.toLocaleString('de-DE');host.append(dates);
 }
};
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
  const metrics=payload.metrics;
  const seo=Array.isArray(payload.seoTrends)?payload.seoTrends:[];
  renderSeo($('seo-google'),seo.find(x=>x.source==='google'));
  renderSeo($('seo-bing'),seo.find(x=>x.source==='bing'));
  $('seo').hidden=false;
  const diagnostic=metrics.find(m=>m.label==='Tool-Ranking-Diagnose');
  const eventCount=metrics.find(m=>m.label==='GA4-Tool-Open-Gesamt');
  const diagnosis=diagnostic?.detail||'Ranking-Diagnose derzeit nicht verfügbar.';
  $('ranking-diagnostic').textContent=diagnosis+(eventCount?' · GA4 meldet '+Number(eventCount.value).toLocaleString('de-DE')+' tool_open-Ereignisse im gewählten Zeitraum.':diagnosis.includes('noch keine tool_open-Daten')?' · Exakte Ereignisabfrage derzeit nicht verfügbar.':'');
  const toolStarts=metrics.filter(m=>m.label.startsWith('Tool-Start: '));
  const pages=metrics.filter(m=>m.label.startsWith('Seite: '));
  const events=metrics.filter(m=>m.label.startsWith('Ereignis: '));
  const daily=metrics.filter(m=>/^Tag: \d{8}$/.test(m.label)).sort((a,b)=>a.label.localeCompare(b.label));
  $('summary').replaceChildren(...metrics.filter(m=>m.label!=='Tool-Ranking-Diagnose'&&!m.label.startsWith('Seite: ')&&!m.label.startsWith('Tool-Start: ')&&!m.label.startsWith('Ereignis: ')&&!m.label.startsWith('Tag: ')).map(m=>tile(m.label,Number(m.value).toLocaleString('de-DE'),m.detail||'')));
  const bars=(id,items,prefix)=>{const host=$(id);host.replaceChildren();if(!items.length){host.textContent='Noch keine erfassten Daten für diesen Zeitraum.';return}
   const max=Math.max(1,...items.map(m=>Number(m.value)));
   for(const m of items){const row=document.createElement('div');row.className='bar-row';const label=document.createElement('span');label.textContent=m.label.slice(prefix.length);const value=document.createElement('strong');value.textContent=Number(m.value).toLocaleString('de-DE');const track=document.createElement('div');track.className='bar-track';const fill=document.createElement('div');fill.className='bar-fill';fill.style.width=Math.max(0,Math.min(100,Number(m.value)/max*100))+'%';track.append(fill);row.append(label,value,track);host.append(row)}
  };
  bars('tool-ranking',toolStarts,'Tool-Start: ');
  if(!toolStarts.length)$('tool-ranking').textContent='Noch keine auswertbaren Tool-Starts. Prüfe die GA4-Dimension tool_name; neue Daten erscheinen erst nach der Registrierung und Verarbeitung.';
  bars('pages',pages,'Seite: ');bars('events',events,'Ereignis: ');
  const trend=$('trend');trend.replaceChildren();
  if(daily.length){const max=Math.max(1,...daily.map(m=>Number(m.value)));for(const m of daily){const col=document.createElement('div');col.className='chart-col';const bar=document.createElement('div');bar.className='chart-bar';bar.style.height=Math.max(2,Number(m.value)/max*100)+'%';const date=m.label.slice(5);col.title=date.slice(6,8)+'.'+date.slice(4,6)+'.'+date.slice(0,4)+': '+m.value+' Seitenaufrufe';col.setAttribute('aria-label',col.title);col.append(bar);trend.append(col)}}
  else trend.textContent='Noch keine Tageswerte verfügbar.';
  $('analytics').hidden=false;
  $('sources').replaceChildren(...payload.sources.map(s=>{const e=tile(s.label,s.status==='connected'?'Verbunden':s.status==='error'?'Fehler':'Nicht verbunden',s.detail||'Noch keine verifizierten Daten');return e}));
  panel.hidden=false;state.hidden=true;
 }catch{show('Statistikdienst nicht erreichbar. Es werden keine Schätzwerte angezeigt.')}
}
$('refresh').addEventListener('click',load);$('period').addEventListener('change',load);
load();
})();