/** Inline Toolya Connect for verified expense source tools. No standalone Connect area. */
export function mountExpenseConnect({host,saveSelector,costSelector,controller,client,userId,sourceTool,recordsKey}) {
  if (!host?.querySelector || !controller?.snapshot || !client?.rpc ||
      !client?.auth?.getUser || !userId ||
      !['parkplatz-merker-parkschein-timer','haustier-gesundheitspass'].includes(sourceTool))
    throw new TypeError('Cloud Connect is not configured.');
  const saveButton=host.querySelector(saveSelector);
  const costInput=host.querySelector(costSelector);
  if (!saveButton || !costInput) throw new TypeError('Expense form inputs not found.');
  const root=document.createElement('div');
  root.id='toolya-connect-expense';
  root.style.cssText='margin:10px 0;padding:12px;border:1px solid #cbd5e1;border-radius:12px;background:#f8fafc;color:#0f172a;font:14px system-ui';
  const label=document.createElement('label');
  label.style.cssText='display:flex;align-items:center;gap:8px';
  const check=document.createElement('input');
  check.type='checkbox';
  check.id='toolya-connect-expense-choice';
  check.style.cssText='width:18px;height:18px;accent-color:#007e9f';
  const words=document.createElement('span');
  words.textContent='Diese Ausgabe auch ins Haushaltsbuch übernehmen';
  label.append(check,words);
  const help=document.createElement('p');
  help.textContent='Optional · nur tatsächliche Kosten über 0 €. Ohne Fotos/Belege. Zahlungsart im Haushaltsbuch prüfen.';
  help.style.cssText='font-size:12px;margin:7px 0 0;color:#475569';
  const status=document.createElement('p');
  status.setAttribute('role','status');
  status.style.cssText='margin:7px 0 0';
  const retry=document.createElement('button');
  retry.type='button';
  retry.textContent='Übernahme erneut versuchen';
  retry.hidden=true;
  retry.style.cssText='margin:8px 0 0;padding:8px;border:1px solid #007e9f;border-radius:8px;background:white;color:#005b75';
  root.append(label,help,status,retry);
  saveButton.parentNode.insertBefore(root,saveButton);
  let disposed=false,busy=false,failedId=null;
  const syncEligibility=()=>{
    const amount=Number(String(costInput.value||'').replace(',','.'));
    const valid=String(costInput.value||'').trim()!=='' && Number.isFinite(amount) &&
      amount>0 && amount<=1000000 && Math.abs(amount*100-Math.round(amount*100))<1e-7;
    check.disabled=!valid||busy;
    if(!valid)check.checked=false;
  };
  costInput.addEventListener('input',syncEligibility);
  syncEligibility();
  retry.addEventListener('click',()=>{if(failedId!==null)void transfer(failedId);});
  async function transfer(id){
    if(disposed || busy || !controller.ready)return false;
    retry.hidden=true;
    const sourceId=String(id);
    let entry;
    try{entry=controller.snapshot()[recordsKey]?.find(item=>String(item?.id)===sourceId);}
    catch{status.textContent='Cloud-Datenstand nicht verfügbar. Bitte neu laden.';return false;}
    const cost=Number(entry?.cost);
    if(!Number.isSafeInteger(entry?.id)||entry.id<0||!Number.isFinite(cost)||
       cost<=0||cost>1000000||Math.abs(cost*100-Math.round(cost*100))>1e-7){
      status.textContent='Nur positive Ausgaben mit höchstens zwei Nachkommastellen können übernommen werden.';
      failedId=null;return false;
    }
    const title=String(entry.title||entry.desc||'Ausgabe');
    if(!window.confirm('Ausgabe ins Haushaltsbuch übernehmen?\n\n'+title+
       '\n'+cost.toFixed(2).replace('.',',')+' €\n\nOhne Foto/Beleg. Zahlungsart danach prüfen.')){
      status.textContent='Ausgabe gespeichert; Übernahme nicht ausgeführt.';
      failedId=sourceId;retry.hidden=false;return false;
    }
    busy=true;check.disabled=true;retry.disabled=true;
    status.textContent='Toolya Cloud prüft die Übertragung …';
    try{
      const {data:auth,error:authError}=await client.auth.getUser();
      if(authError||auth?.user?.id!==userId||auth.user.is_anonymous)throw Error('Konto gewechselt.');
      const {data:target,error:targetError}=await client.from('user_data')
        .select('revision').eq('user_id',userId).eq('tool','haushaltsbuch-kassenbon').maybeSingle();
      if(targetError)throw targetError;
      if(!Number.isSafeInteger(target?.revision))throw Error('Haushaltsbuch nicht initialisiert.');
      const {data,error}=await client.rpc('toolya_connect_expense_to_budget',{
        p_source_tool:sourceTool,p_source_id:sourceId,
        p_source_revision:controller.revision,p_target_revision:target.revision
      });
      if(error)throw error;
      const result=Array.isArray(data)&&data.length===1?data[0]:null;
      if(!result||!['imported','already_imported'].includes(result.status))
        throw Error('Cloud-Bestätigung unvollständig.');
      const {data:finalAuth,error:finalError}=await client.auth.getUser();
      if(finalError||finalAuth?.user?.id!==userId||finalAuth.user.is_anonymous)
        throw Error('Konto gewechselt; Ergebnis prüfen.');
      failedId=null;check.checked=false;retry.hidden=true;
      status.textContent=result.status==='already_imported'
        ? 'Bereits übernommen – keine Doppelbuchung erstellt.'
        : 'Im Haushaltsbuch bestätigt. Dort bitte die Zahlungsart prüfen.';
      return true;
    }catch(error){
      failedId=sourceId;retry.hidden=false;
      status.textContent='Ausgabe gespeichert, Übertragung nicht bestätigt. Cloud-Datenstand vor erneutem Versuch prüfen.';
      console.error('Toolya Connect',error);
      return false;
    }finally{
      busy=false;if(!disposed){syncEligibility();retry.disabled=false;}
    }
  }
  return Object.freeze({
    get selected(){return !disposed&&!check.disabled&&check.checked;},
    transfer,
    dispose(){disposed=true;costInput.removeEventListener('input',syncEligibility);root.remove();}
  });
}
