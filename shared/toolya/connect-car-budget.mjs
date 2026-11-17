/** Explicit, server-authoritative Toolya Connect: Autokosten -> Haushaltsbuch. */
export function mountCarBudgetConnect({host,controller,client,userId}) {
  if (!host || !controller?.snapshot || !client?.rpc || !client?.auth?.getUser || !userId)
    throw new TypeError('Connect requires verified Cloud dependencies.');
  const root = document.createElement('section');
  root.id = 'toolya-connect-car-budget';
  root.setAttribute('aria-label', 'Toolya Connect');
  root.style.cssText = 'margin:20px 0;padding:16px;border:1px solid #cbd5e1;border-radius:16px;background:#f8fafc;color:#0f172a;font:14px system-ui';
  const heading = document.createElement('h3');
  heading.textContent = 'Toolya Connect · Autokosten → Haushaltsbuch';
  heading.style.cssText = 'font-weight:700;font-size:16px;margin-bottom:8px';
  const info = document.createElement('p');
  info.textContent = 'Übertrage eine bestehende, positive Ausgabe einmalig in dein Haushaltsbuch. Es werden keine Belege übertragen. Die Zahlungsart wird zunächst als Bargeld eingetragen und muss anschließend geprüft werden.';
  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Autokosten-Eintrag auswählen');
  select.style.cssText = 'display:block;width:100%;padding:10px;margin:12px 0;border:1px solid #94a3b8;border-radius:8px;background:white;color:#0f172a';
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Ausgabe verbindlich übertragen';
  button.style.cssText = 'padding:10px 14px;background:#007e9f;color:white;border-radius:9px;cursor:pointer';
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  status.style.cssText = 'margin-top:10px';
  root.append(heading,info,select,button,status);
  host.append(root);
  let busy = false, disposed = false;
  function refresh() {
    select.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Ausgabe auswählen';
    select.append(placeholder);
    try {
      for (const event of controller.snapshot().events || []) {
        const price = Number(event?.cost);
        if (!Number.isSafeInteger(event?.id) || event.id < 0 ||
            !Number.isFinite(price) || price <= 0 || Math.abs(Math.round(price * 100) - price * 100) > 1e-7) continue;
        const option = document.createElement('option');
        option.value = String(event.id);
        option.textContent = String(event.date || '') + ' · ' + String(event.title || '').slice(0,80) +
          ' · ' + price.toFixed(2).replace('.', ',') + ' €';
        select.append(option);
      }
      button.disabled = select.options.length < 2;
    } catch {
      button.disabled = true;
      status.textContent = 'Cloud-Daten nicht bereit. Bitte Seite neu laden.';
    }
  }
  refresh();
  button.addEventListener('click', async () => {
    if (busy || disposed || !select.value || !controller.ready) return;
    const selected = select.value;
    const source = controller.snapshot();
    const event = source.events.find(item => String(item?.id) === selected);
    if (!event || !Number.isFinite(Number(event.cost)) || Number(event.cost) <= 0) return;
    const accepted = window.confirm(
      'Einmalig ins Haushaltsbuch übertragen?\n\n' + String(event.title) +
      '\n' + Number(event.cost).toFixed(2).replace('.', ',') +
      ' € · ' + String(event.date) +
      '\n\nBelege werden nicht übertragen. Zahlungsart danach im Haushaltsbuch prüfen.'
    );
    if (!accepted) return;
    busy = true; button.disabled = true; select.disabled = true;
    status.textContent = 'Transfer wird von Toolya Cloud geprüft …';
    try {
      const {data:auth,error:authError} = await client.auth.getUser();
      if (authError || auth?.user?.id !== userId || auth.user.is_anonymous)
        throw new Error('Konto gewechselt oder Anmeldung ungültig.');
      const target = await client.from('user_data')
        .select('revision').eq('user_id',userId).eq('tool','haushaltsbuch-kassenbon').maybeSingle();
      if (target.error) throw target.error;
      if (!Number.isSafeInteger(target.data?.revision))
        throw new Error('Bitte zuerst das Haushaltsbuch öffnen und die Cloud-Einrichtung abschließen.');
      const result = await client.rpc('toolya_connect_car_to_budget', {
        p_source_id:selected,
        p_source_revision:controller.revision,
        p_target_revision:target.data.revision
      });
      if (result.error) throw result.error;
      const record = Array.isArray(result.data) && result.data.length === 1 ? result.data[0] : null;
      if (!record || !['imported','already_imported'].includes(record.status))
        throw new Error('Cloud-Transfer wurde nicht eindeutig bestätigt.');
      const {data:recheck,error:recheckError} = await client.auth.getUser();
      if (recheckError || recheck?.user?.id !== userId || recheck.user.is_anonymous)
        throw new Error('Konto nach dem Transfer gewechselt. Ergebnis vor erneutem Versuch prüfen.');
      status.textContent = record.status === 'already_imported'
        ? 'Bereits übertragen – keine Doppelbuchung erstellt.'
        : 'Übertragung in Toolya Cloud bestätigt. Haushaltsbuch neu öffnen und Zahlungsart prüfen.';
    } catch (error) {
      status.textContent = 'Keine bestätigte Übertragung: ' +
        (error.code === '40001' ? 'Cloud-Datenstand geändert. Beide Tools neu laden.' :
          'Bitte Cloud-Datenstand im Haushaltsbuch prüfen, bevor du erneut überträgst.');
      console.error('Toolya Connect', error);
    } finally {
      busy = false;
      if (!disposed) { select.disabled = false; button.disabled = !select.value; }
    }
  });
  return Object.freeze({dispose(){disposed = true;root.remove();},refresh});
}
