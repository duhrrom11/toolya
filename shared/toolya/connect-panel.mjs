/** Manual Toolya Connect reconciliation. Never automatically overwrites a local view. */
export function mountConnectPanel({controller,host,onReload,confirmReload=message=>window.confirm(message)}){
 if(!controller?.checkRemote||!controller?.load||!host?.append)throw TypeError('Connect requires a controller and host.');
 const root=document.createElement('section');
 root.id='toolya-connect-panel';root.setAttribute('aria-label','Toolya Connect');
 root.style.cssText='margin:12px 0;padding:12px;border:1px solid #cbd5e1;border-radius:12px;background:#f8fafc;color:#0f172a;font:14px system-ui';
 const title=document.createElement('strong');title.textContent='Toolya Connect';
 const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Cloud-Stand noch nicht geprüft.';
 const check=document.createElement('button');check.type='button';check.textContent='Cloud-Stand prüfen';
 const reload=document.createElement('button');reload.type='button';reload.textContent='Cloud-Stand bewusst laden';reload.hidden=true;
 for(const button of [check,reload])button.style.cssText='margin:4px;padding:8px;border:1px solid #64748b;border-radius:8px;background:white;color:#0f172a;cursor:pointer';
 root.append(title,status,check,reload);host.prepend(root);
 let busy=false,disposed=false,review=null;
 const lock=value=>{busy=value;check.disabled=value;reload.disabled=value;};
 check.addEventListener('click',async()=>{
  if(busy||disposed)return;lock(true);review=null;reload.hidden=true;
  try{
   const result=await controller.checkRemote();
   if(disposed)return;
   review=result;
   if(result.changed){
    status.textContent='Anderer Cloud-Datenstand erkannt. Deine Ansicht bleibt unverändert. Zum Laden ist eine ausdrückliche Bestätigung erforderlich.';
    reload.hidden=false;
   }else status.textContent='Cloud-Datenstand ist unverändert (Revision '+(result.remoteRevision??'neu')+').';
  }catch(error){if(!disposed)status.textContent='Cloud-Prüfung fehlgeschlagen. Bitte neu anmelden oder Seite neu laden.';}
  finally{if(!disposed)lock(false);}
 });
 reload.addEventListener('click',async()=>{
  if(busy||disposed||!review?.changed)return;
  lock(true);
  try{
   const accepted=await confirmReload('Cloud-Datenstand laden? Die bisherige Ansicht wird ersetzt. Nicht gespeicherte Eingaben gehen verloren. Es werden keine Cloud-Daten überschrieben.');
   if(accepted!==true||disposed)return;
   const fresh=await controller.checkRemote();
   if(!fresh.changed||fresh.remoteRevision!==review.remoteRevision||fresh.localRevision!==review.localRevision){
    review=null;reload.hidden=true;status.textContent='Cloud-Datenstand hat sich geändert. Bitte erneut prüfen.';return;
   }
   await controller.load();
   review=null;reload.hidden=true;status.textContent='Cloud-Datenstand nach Bestätigung geladen.';
   await onReload?.();
  }catch(error){if(!disposed)status.textContent='Cloud-Laden fehlgeschlagen. Bitte Seite neu laden.';}
  finally{if(!disposed)lock(false);}
 });
 return {dispose(){disposed=true;root.remove();}};
}
