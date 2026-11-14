(function(){
 'use strict';
 history.replaceState(null,'',location.pathname);
 const C=EstateCrypto,$=id=>document.getElementById(id);
 const API='https://yheogmeaosuigyaxkwth.supabase.co/functions/v1/estate-emergency';
 let busy=false,idle,countdownTimer,statusTimer,statusGeneration=0;
 const messages={notification_contact_missing:'Bitte den Besitzer, seinen Tresor einmal zu öffnen und online zu sichern. Danach können Alarmbestätigungen an deine hinterlegte E-Mail-Adresse gesendet werden.',invalid_keys:'Diese Schlüssel passen nicht zusammen oder sind nicht mehr gültig. Bitte prüfe beide Schlüssel und wende dich an den Besitzer.',two_keys_required:'Du brauchst noch den Schlüssel einer zweiten Vertrauensperson. Ein Schlüssel allein öffnet vor der Notfallfreigabe nicht.',notification_unavailable:'Die Alarm-E-Mail ist noch nicht eingerichtet. Es wurde kein Notfallalarm gestartet. Bitte versuche, die Person direkt zu erreichen.',cooldown:'Der Besitzer hat gerade Entwarnung gegeben. Bitte versuche zuerst, ihn persönlich zu erreichen.',rate_limited:'Zu viele Versuche. Bitte warte eine Minute und versuche es erneut.',invalid_request:'Bitte gib deinen vollständigen persönlichen Schlüssel ein.'};
 function message(text,error=false){$('message').hidden=false;$('message').textContent=text;$('message').classList.toggle('error',error);}
 function getKey(){const key=C.normalize($('first-key').value);if(!/^[a-f0-9]{64}$/.test(key))throw Error('invalid_request');return key;}
 async function request(action,values={}){const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json',apikey:'sb_publishable_PK20oOPzG3AB-bd95Ji9Tg_C-MIUgyv'},body:JSON.stringify({action,key:getKey(),...values}),cache:'no-store'});const result=await r.json();if(!r.ok||result.error)throw Error(result.error||'unavailable');return result;}
 async function run(fn){if(busy)return;busy=true;document.querySelectorAll('button').forEach(b=>{if(!b.closest('dialog'))b.disabled=true;});try{await fn();}catch(e){message(messages[e.message]||'Der Tresor konnte nicht geöffnet werden. Prüfe deine Verbindung und versuche es erneut.',true);}finally{busy=false;document.querySelectorAll('button').forEach(b=>b.disabled=false);}}
 function stopCountdown(){statusGeneration++;clearInterval(countdownTimer);clearTimeout(statusTimer);$('countdown').hidden=true;}
 function showStatus(s){stopCountdown();const text={normal:'Kein aktiver Notfallalarm. Zwei verschiedene Schlüssel sind erforderlich.',notifying:'Der Notfall wurde gemeldet. Die E-Mail wird noch zugestellt. Die 24-Stunden-Frist beginnt erst nach bestätigter Zustellung an den E-Mail-Dienst.',countdown:'Die 24-Stunden-Frist läuft. Der Zugang mit einem Schlüssel ist frühestens am '+new Date(s.deadline).toLocaleString('de-DE')+' möglich, wenn der Besitzer nicht vorher Entwarnung gibt.',released:'Die 24 Stunden sind abgelaufen. Du kannst den Tresor mit deinem persönlichen Schlüssel lesen.'};message(text[s.status]||text.normal);
  if(s.status==='countdown'){
   const remaining=Date.parse(s.deadline)-Date.parse(s.serverTime),began=performance.now();
   if(!Number.isFinite(remaining))return;
   const tick=()=>{const seconds=Math.max(0,Math.ceil((remaining-(performance.now()-began))/1000));const hours=Math.floor(seconds/3600),minutes=Math.floor(seconds%3600/60);$('countdown').hidden=false;$('countdown').textContent=seconds?'Verbleibende Zeit: '+String(hours).padStart(2,'0')+':'+String(minutes).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0'):'Die Frist ist abgelaufen. Bitte prüfe den aktuellen Alarmstatus.';};
   tick();countdownTimer=setInterval(tick,1000);

  }
  if(s.status==='countdown'||s.status==='notifying'){
   const generation=statusGeneration,observedKey=getKey();
   statusTimer=setTimeout(async()=>{if(busy||$('first-key').value===''||getKey()!==observedKey){stopCountdown();return;}try{const status=await request('trustee-status');if(generation===statusGeneration&&getKey()===observedKey)showStatus(status);}catch{if(generation!==statusGeneration)return;stopCountdown();message('Der aktuelle Alarmstatus konnte nicht geladen werden. Bitte wähle „Alarmstatus prüfen“.',true);}},30000);
  }
 }
 $('first-key').addEventListener('input',stopCountdown);
 function close(){stopCountdown();clearTimeout(idle);$('read-entries').replaceChildren();$('read-panel').hidden=true;$('access-panel').hidden=false;$('first-key').value='';$('second-key').value='';message('Der Tresor ist geschlossen.');}
 function activity(){clearTimeout(idle);if(!$('read-panel').hidden)idle=setTimeout(close,600000);}
 ['pointerdown','keydown'].forEach(e=>document.addEventListener(e,activity,{passive:true}));
 $('close-vault').onclick=close;
 $('open-form').onsubmit=e=>{e.preventDefault();run(async()=>{const first=getKey(),second=C.normalize($('second-key').value);if(second&&second===first)throw Error('invalid_keys');const result=await request('open',second?{secondKey:second}:{});const decoded=await C.openReplica(result,first);if(!Array.isArray(decoded.entries))throw Error('unavailable');const root=$('read-entries');root.replaceChildren();for(const entry of decoded.entries){const article=document.createElement('article');article.className='entry';const title=document.createElement('h3'),category=document.createElement('p'),content=document.createElement('pre');title.textContent=entry.title||'Unterlage';category.textContent=[entry.category,entry.partner].filter(Boolean).join(' · ');content.textContent=entry.content||'';article.append(title,category,content);root.append(article);}if(!decoded.entries.length)root.textContent='Im Tresor liegen noch keine Unterlagen.';stopCountdown();$('access-panel').hidden=true;$('read-panel').hidden=false;$('first-key').value='';$('second-key').value='';message('Der Tresor ist zum Lesen geöffnet.');activity();});};
 $('status-button').onclick=()=>run(async()=>showStatus(await request('trustee-status')));
 $('alarm-button').onclick=()=>run(async()=>{getKey();const dialog=$('alarm-confirm');dialog.returnValue='cancel';dialog.showModal();const yes=await new Promise(resolve=>dialog.addEventListener('close',()=>resolve(dialog.returnValue==='ok'),{once:true}));if(yes)showStatus(await request('alarm'));});
})();
