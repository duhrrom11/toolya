/** Inline, opt-in Toolya Connect: Autokosten → Haushaltsbuch. No separate Connect section. */
export function mountCarBudgetConnect({host,controller,client,userId}) {
  if (!host?.querySelector || !controller?.snapshot || !client?.rpc || !client?.auth?.getUser || !userId)
    throw new TypeError('Connect requires verified Cloud dependencies and the expense form.');
  const saveButton = host.querySelector('[onclick="saveEvent()"]');
  if (!saveButton) throw new TypeError('Connect requires the Autokosten expense form.');
  const root = document.createElement('div');
  root.id = 'toolya-connect-car-budget';
  root.style.cssText = 'padding:12px;margin:10px 0;border:1px solid #cbd5e1;border-radius:12px;background:#f8fafc;color:#0f172a;font:14px system-ui';
  const label = document.createElement('label');
  label.style.cssText = 'display:flex;align-items:center;gap:9px;cursor:pointer';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = 'toolya-connect-budget-choice';
  checkbox.style.cssText = 'width:18px;height:18px;accent-color:#007e9f';
  const labelText = document.createElement('span');
  labelText.textContent = 'Diese Ausgabe auch ins Haushaltsbuch übernehmen';
  label.append(checkbox,labelText);
  const help = document.createElement('p');
  help.textContent = 'Optional · nach dem Speichern mit Bestätigung. Belege werden nicht übertragen; Zahlungsart im Haushaltsbuch prüfen.';
  help.style.cssText = 'margin:7px 0 0;font-size:12px;color:#475569';
  const status = document.createElement('p');
  status.setAttribute('role','status');
  status.style.cssText = 'margin:7px 0 0';
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = 'Übernahme erneut versuchen';
  retry.hidden = true;
  retry.style.cssText = 'margin-top:8px;padding:8px 12px;border:1px solid #007e9f;border-radius:8px;background:white;color:#005b75;cursor:pointer';
  root.append(label,help,status,retry);
  saveButton.parentNode.insertBefore(root,saveButton);
  let busy=false,disposed=false,lastFailedId=null;
  retry.addEventListener('click', () => {
    if (!busy && lastFailedId !== null) void transferEvent(lastFailedId);
  });
  async function transferEvent(id) {
    if (busy || disposed || !controller.ready) return false;
    retry.hidden=true;
    const selected=String(id);
    let event;
    try {
      event=controller.snapshot().events?.find(item=>String(item?.id)===selected);
    } catch(error) {
      status.textContent='Cloud-Datenstand nicht verfügbar. Bitte neu laden.';
      return false;
    }
    const price=Number(event?.cost);
    if (!Number.isSafeInteger(event?.id) || event.id<0 || !Number.isFinite(price) ||
        price<=0 || Math.abs(Math.round(price*100)-price*100)>1e-7) {
      status.textContent='Nur positive Ausgaben mit gültigem Centbetrag können übernommen werden.';
      lastFailedId=null;
      return false;
    }
    const accepted=window.confirm('Ausgabe auch ins Haushaltsbuch übertragen?\n\n'+
      String(event.title)+'\n'+price.toFixed(2).replace('.',',')+' € · '+String(event.date)+
      '\n\nBelege werden nicht übertragen. Zahlungsart anschließend prüfen.');
    if (!accepted) {
      status.textContent='Ausgabe gespeichert; Übernahme ins Haushaltsbuch abgebrochen.';
      lastFailedId=selected;
      retry.hidden=false;
      return false;
    }
    busy=true;checkbox.disabled=true;status.textContent='Übertragung wird von Toolya Cloud geprüft …';
    try {
      const {data:auth,error:authError}=await client.auth.getUser();
      if (authError || auth?.user?.id!==userId || auth.user.is_anonymous)
        throw new Error('Konto gewechselt oder Anmeldung ungültig.');
      const target=await client.from('user_data').select('revision')
        .eq('user_id',userId).eq('tool','haushaltsbuch-kassenbon').maybeSingle();
      if (target.error) throw target.error;
      if (!Number.isSafeInteger(target.data?.revision))
        throw new Error('Haushaltsbuch muss zuerst in der Cloud eingerichtet werden.');
      const result=await client.rpc('toolya_connect_car_to_budget',{
        p_source_id:selected,p_source_revision:controller.revision,p_target_revision:target.data.revision
      });
      if (result.error) throw result.error;
      const record=Array.isArray(result.data)&&result.data.length===1?result.data[0]:null;
      if (!record || !['imported','already_imported'].includes(record.status))
        throw new Error('Cloud-Transfer wurde nicht eindeutig bestätigt.');
      const {data:recheck,error:recheckError}=await client.auth.getUser();
      if (recheckError || recheck?.user?.id!==userId || recheck.user.is_anonymous)
        throw new Error('Konto nach Transfer gewechselt.');
      status.textContent=record.status==='already_imported'
        ? 'Bereits übertragen – keine Doppelbuchung erstellt.'
        : 'Übertragung in Toolya Cloud bestätigt. Zahlungsart im Haushaltsbuch prüfen.';
      checkbox.checked=false;
      lastFailedId=null;
      retry.hidden=true;
      return true;
    } catch(error) {
      status.textContent='Ausgabe gespeichert, aber keine bestätigte Übertragung. Cloud-Datenstand beider Tools prüfen, bevor du erneut überträgst.';
      lastFailedId=selected;
      retry.hidden=false;
      console.error('Toolya Connect',error);
      return false;
    } finally {
      busy=false;
      if (!disposed) checkbox.disabled=false;
    }
  }
  return Object.freeze({
    get selected(){return !disposed && checkbox.checked;},
    transferEvent,
    dispose(){disposed=true;root.remove();}
  });
}
