// Only the authenticated Toolya owner can use the matching server-side RPC.
const SOURCES=[["Tiere in Not Saar e.V.","3JZYP8PDJ6L92"],["Katzenhilfe Karlsruhe – Station","2EZQOOKV7Z649"],["Katzenhilfe Karlsruhe – Kitten","4IQQDCD3Z0N5"],["Katzenhilfe Karlsruhe – Pflegestelle","21AJ0X3J4SBXA"],["Nothilfe für Polarhunde","D9GGXBHWFZAO"],["Tierheim Hattersheim","1TCZZ3CY0WIE0"],["Tierschutzverein HSK","2D0SQWYPQ1060"],["Tierheim Nordhausen","126ABVE56PATR"],["Pfotenliebe e.V.","10LQBISD9L6NB"],["Tierheim Wiesbaden","2R5URE8OWA57Q"],["Tierheim Hamm","1YDDRL1OK82S9"],["Tierheim Osterwald","2HEWYPRKJ59IB"],["Step by Paw e.V.","YWT7I5MFG0F1"],["Tierheim Hamlar / Donauwörth","1H4EVEMNMV5J2"],["TERRA MATER – Lustadt","2PNICO9WU49WH"],["TERRA MATER – Guben","4H40M6X12VVH"],["TERRA MATER – Reptilien","36I2570T7LMKN"],["Glückspfoten","1RSE4FN6B3HVP"],["Unsichtbar e.V. – Obdachlosenhilfe","1XU4GES7TPYWW"],["MARKUS – Obdachlosenhilfe","1JR2A1XU4OAJR"],["leyiiiN – Creator","2O9LJZF411Z52"],["Schneckentempo Laufpodcast","VKE5VXR1WEE6"]];
export function mountAmazonBulkImport({db,getUser,dashboard,refreshFeed}){
 const anchor=document.getElementById('createList');if(!anchor)return;
 const panel=document.createElement('section');panel.className='amazon-import';panel.hidden=true;
 const heading=document.createElement('h3');heading.textContent='🔐 Amazon-Sammelimport (Toolya-Admin)';
 const intro=document.createElement('p');intro.textContent='22 öffentlich geteilte Amazon.de-Links. Jede erfolgreich ausgelesene Wunschliste wird als eigene private Sammlung mit Quellenlink gespeichert. Bereits importierte Quellen werden übersprungen.';
 const start=document.createElement('button');start.type='button';start.textContent='22 Wunschlisten importieren';
 const stop=document.createElement('button');stop.type='button';stop.textContent='Nach aktueller Liste stoppen';stop.disabled=true;
 const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const details=document.createElement('ol');panel.append(heading,intro,start,stop,status,details);
 (anchor.closest('.list-create')||anchor).after(panel);
 let running=false,cancel=false,session=0;
 async function sync(){const {data:{user}}=await db.auth.getUser();panel.hidden=!(user&&user.id===getUser()?.id&&user.email?.toLowerCase()==='info@toolya.app');}
 db.auth.onAuthStateChange(()=>{session++;cancel=true;setTimeout(sync,0)});sync();
 stop.onclick=()=>{cancel=true;status.textContent='Stopp angefordert. Die aktuelle Liste wird noch abgeschlossen.'};
 start.onclick=async()=>{
  if(running)return;
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||!user||user.id!==getUser()?.id||user.email?.toLowerCase()!=='info@toolya.app'){status.textContent='Nur info@toolya.app darf diesen Import starten.';return}
  running=true;cancel=false;start.disabled=true;stop.disabled=false;details.replaceChildren();
  const owner=user.id,token=++session;let imported=0,skipped=0,failed=0;
  try{
   for(const [title,id] of SOURCES){
    if(cancel||token!==session||getUser()?.id!==owner)break;
    const row=document.createElement('li');row.textContent=title+': wird gelesen …';details.append(row);
    status.textContent=(imported+skipped+failed+1)+' / '+SOURCES.length+' · '+title;
    try{
     const url='https://www.amazon.de/hz/wishlist/ls/'+id;
     const {data:preview,error:readError}=await db.functions.invoke('amazon-scrape',{body:{url}});
     if(readError||preview?.error)throw Error(preview?.error||'Amazon-Abruf fehlgeschlagen');
     if(preview.kind!=='list'||!preview.complete||!preview.previewId||!preview.products?.length)throw Error('Liste nicht vollständig lesbar; nichts gespeichert');
     if(cancel||token!==session||getUser()?.id!==owner)break;
     const {data,error}=await db.rpc('toolya_amazon_bulk_import',{p_preview_id:preview.previewId,p_source_id:id,p_list_title:title.slice(0,80)});
     if(error)throw error;
     if(data?.skipped){skipped++;row.textContent=title+': bereits vorhanden – übersprungen';}
     else{imported++;row.textContent=title+': '+data.linked+' Produkte zugeordnet ('+data.inserted+' neue Wünsche)';}
    }catch(error){failed++;row.textContent=title+': '+(error.message||'Fehler')+' – nicht importiert';}
   }
   status.textContent='Abgeschlossen: '+imported+' Listen importiert, '+skipped+' bereits vorhanden, '+failed+' fehlgeschlagen.'+(cancel?' Vorzeitig gestoppt.':'');
   if(token===session&&getUser()?.id===owner){try{await dashboard.refresh();await refreshFeed()}catch{status.textContent+=' Bitte Seite neu laden.'}}
  }finally{running=false;start.disabled=false;stop.disabled=true;}
 };
}
