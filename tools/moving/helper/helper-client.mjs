const endpoint='https://yheogmeaosuigyaxkwth.supabase.co/functions/v1/moving-helper';
const apikey='sb_publishable_PK20oOPzG3AB-bd95Ji9Tg_C-MIUgyv';
const hash=new URLSearchParams(location.hash.replace(/^#/,''));
const token=hash.get('t')||'';
let selected=hash.get('a')||'',data=null,busy=false,error='',notice='',media=null,scanner=false;
const app=document.getElementById('helper-app');
const states=['planned','packed','loaded','arrived','unpacked'];
const names={planned:'Geplant',packed:'Gepackt',loaded:'Verladen',arrived:'Angekommen',unpacked:'Ausgepackt'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function call(action,more={}){
 const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','apikey':apikey},body:JSON.stringify({action,token,...more}),cache:'no-store',referrerPolicy:'no-referrer'});
 const body=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(body.error||'Dienst vorübergehend nicht erreichbar');
 return body;
}
async function refresh(){
 if(!token){data=null;render();return;}
 busy=true;error='';render();
 try{data=await call('view');if(selected&&!data.boxes.some(b=>b.assignmentId===selected))selected='';}
 catch(e){data=null;error=e.message;}
 finally{busy=false;render();}
}
function render(){
 if(!app)return;
 if(!token){app.innerHTML='<h2>Kein Helferlink vorhanden</h2><p>Bitte den persönlichen Link von der umziehenden Person öffnen. Ohne gültige Freigabe werden keine Kistendaten angezeigt.</p>';return;}
 let h='<h2>Transportstatus</h2>';
 if(error)h+='<p role="alert" class="error">'+esc(error)+'</p>';
 if(notice)h+='<p role="status" class="notice">'+esc(notice)+'</p>';
 if(!data){app.innerHTML=h+'<p>Der Helferlink ist ungültig, abgelaufen oder konnte nicht geprüft werden.</p><button type="button" data-act="refresh" '+(busy?'disabled':'')+'>Erneut laden</button>';return;}
 h+='<p class="muted">'+esc(data.projectName)+' · Zugriff für '+esc(data.helperLabel)+'. Du siehst ausschließlich Kistennamen, Zielräume und Transportstände.</p>';
 const arrived=data.boxes.filter(x=>['arrived','unpacked'].includes(x.status)).length;
 h+='<div class="stats"><span><strong>'+data.boxes.length+'</strong> Kisten</span><span><strong>'+arrived+'</strong> angekommen</span><span><strong>'+data.boxes.filter(x=>x.status==='unpacked').length+'</strong> ausgepackt</span></div>';
 h+='<div class="toolbar"><button data-act="refresh" class="secondary" '+(busy?'disabled':'')+'>↻ Aktualisieren</button><button data-act="scan" '+(busy?'disabled':'')+'>QR-Code scannen</button></div>';
 if(scanner)h+='<div class="scan"><video id="mv-camera" autoplay muted playsinline aria-label="Kamera zum QR-Code scannen"></video><button class="secondary" data-act="stop">Scanner schließen</button></div>';
 h+='<label>Kiste auswählen<select id="mv-select"><option value="">Alle Kisten</option>'+data.boxes.map(x=>'<option value="'+esc(x.assignmentId)+'" '+(selected===x.assignmentId?'selected':'')+'>'+esc(x.label)+' – '+esc(x.room||'ohne Zielraum')+'</option>').join('')+'</select></label>';
 const show=selected?data.boxes.filter(x=>x.assignmentId===selected):data.boxes;
 h+='<div class="box-list">'+(show.length?show.map(x=>{
   const n=states.indexOf(x.status);
   return '<article class="box '+(selected===x.assignmentId?'active':'')+'"><div class="box-top"><div><strong>'+esc(x.label)+'</strong><small>Zielraum: '+esc(x.room||'Nicht zugewiesen')+' · Priorität: '+esc(x.priority)+'</small></div><small>Version '+Number(x.version)+'</small></div><div class="status"><button data-id="'+esc(x.assignmentId)+'" data-status="'+esc(states[n-1]||'')+'" '+(n<=0||busy?'disabled':'')+' aria-label="Vorheriger Status">‹</button><span>'+esc(names[x.status]||'Unbekannt')+'</span><button data-id="'+esc(x.assignmentId)+'" data-status="'+esc(states[n+1]||'')+'" '+(n>=states.length-1||busy?'disabled':'')+' aria-label="Nächster Status">›</button></div></article>';
 }).join(''):'<p class="muted">Keine Kisten für diese Auswahl.</p>')+'</div>';
 app.innerHTML=h;
 if(scanner)void startCamera();
}
async function change(id,status){
 const row=data?.boxes?.find(x=>x.assignmentId===id);
 if(!row||busy||!states.includes(status))return;
 busy=true;error='';notice='';render();
 try{
  const out=await call('transition',{assignmentId:id,expectedVersion:row.version,status,requestId:crypto.randomUUID()});
  const updated=data.boxes.find(x=>x.assignmentId===id);if(updated){updated.status=out.status;updated.version=out.version;}
  notice='Status gespeichert';
 }catch(e){error=e.message+' Bitte aktualisieren.';try{data=await call('view');}catch{}}
 finally{busy=false;render();}
}
function stopCamera(){
 if(media){for(const track of media.getTracks())track.stop();media=null;}
 scanner=false;
}
async function startCamera(){
 if(!scanner||media)return;
 const video=document.getElementById('mv-camera');if(!video)return;
 if(!('BarcodeDetector' in window)||!navigator.mediaDevices?.getUserMedia){error='QR-Scanner in diesem Browser nicht unterstützt. Bitte die Kiste aus der Liste auswählen.';scanner=false;render();return;}
 try{
  const detector=new BarcodeDetector({formats:['qr_code']});
  media=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
  video.srcObject=media;await video.play();
  const scan=async()=>{if(!scanner||!media)return;try{
   const found=await detector.detect(video);
   for(const v of found){const code=new URL(v.rawValue,location.href);if(code.origin!==location.origin||!code.pathname.endsWith('/tools/moving/helper/index.html'))continue;const h=new URLSearchParams(code.hash.slice(1));const a=h.get('a');if(h.get('t')===token&&data?.boxes.some(x=>x.assignmentId===a)){selected=a;notice='Kiste erkannt';stopCamera();render();return;}}
  }catch{}if(scanner)requestAnimationFrame(scan);};
  requestAnimationFrame(scan);
 }catch{stopCamera();error='Kamera nicht verfügbar. Bitte eine Kiste auswählen.';render();}
}
app?.addEventListener('change',e=>{if(e.target.id==='mv-select'){selected=e.target.value;notice='';render();}});
app?.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.act==='refresh'){notice='';await refresh();return;}
 if(b.dataset.act==='stop'){stopCamera();render();return;}
 if(b.dataset.act==='scan'){scanner=true;error='';render();return;}
 if(b.dataset.id)await change(b.dataset.id,b.dataset.status);
});
window.addEventListener('pagehide',stopCamera);
void refresh();
