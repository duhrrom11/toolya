/* Toolya Connect v1: explicit, same-browser, account-scoped handoff.
   No automatic imports, no direct Supabase writes. */
(function (global) {
  'use strict';
  const PREFIX = 'toolya_connect_v1_';
  const CAR = 'autokosten-reifenwechsel';
  const BUDGET = 'haushaltsbuch-kassenbon';
  const key = uid => PREFIX + uid;
  const isId = value => typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value);
  const parse = raw => { try { return JSON.parse(raw); } catch (_) { return null; } };
  async function identity() {
    const client = global.supabaseClient;
    if (!client || !client.auth) throw Error('Anmeldung erforderlich.');
    const { data, error } = await client.auth.getUser();
    if (error || !data || !data.user || !isId(data.user.id)) throw Error('Konto nicht verifiziert.');
    const uid = data.user.id;
    for (const tool of [CAR, BUDGET]) {
      if (localStorage.getItem('helferlein_cloud_owner_' + tool) !== uid ||
          localStorage.getItem('helferlein_cloud_enabled_' + tool + '_' + uid) !== 'true')
        throw Error('Beide Werkzeuge müssen für dasselbe Konto mit Cloud-Sicherung aktiviert sein.');
    }
    if (!navigator.onLine) throw Error('Für Connect ist eine Internetverbindung erforderlich.');
    if (!global.helferleinCloudBridge || !global.helferleinCloudBridge.canWriteLocal())
      throw Error('Cloud-Synchronisation oder Kontoprüfung ist noch nicht bereit.');
    return uid;
  }
  function read(uid) {
    const value = parse(localStorage.getItem(key(uid)));
    if (value === null) return [];
    if (!Array.isArray(value) || value.some(v => !v || typeof v !== 'object' ||
        typeof v.sourceId !== 'string' || typeof v.uid !== 'string' || v.uid !== uid))
      throw Error('Connect-Daten sind beschädigt. Keine Änderungen vorgenommen.');
    return value;
  }
  function persist(uid, rows) { localStorage.setItem(key(uid), JSON.stringify(rows)); }
  function cents(cost) {
    if (typeof cost !== 'number' || !Number.isFinite(cost) || cost <= 0 ||
        !Number.isSafeInteger(Math.round(cost * 100)) ||
        Math.abs(cost * 100 - Math.round(cost * 100)) > 0.000001) throw Error('Ungültiger Kostenbetrag.');
    return Math.round(cost * 100);
  }
  function normalize(event) {
    if (!event || !Number.isSafeInteger(event.id) || event.id <= 0 ||
        !Number.isSafeInteger(event.carId) || event.carId <= 0 ||
        typeof event.title !== 'string' || !event.title.trim() ||
        typeof event.date !== 'string' || !/^\\d{4}-\\d{2}-\\d{2}$/.test(event.date) ||
        !Number.isFinite(new Date(event.date + 'T12:00:00').getTime()) ||
        typeof event.type !== 'string') throw Error('Unvollständiger Fahrzeugkosteneintrag.');
    return { sourceId: String(event.id), sourceCarId: String(event.carId),
      sourceRevision: JSON.stringify([event.date,event.title,event.type,event.cost]),
      date: event.date, title: event.title.trim(), type: event.type,
      amountCents: cents(event.cost), currency: 'EUR' };
  }
  async function enqueue(event) {
    const uid = await identity();
    const item = normalize(event);
    const rows = read(uid);
    const existing = rows.find(r => r.sourceId === item.sourceId);
    if (existing) {
      if (existing.sourceRevision !== item.sourceRevision) throw Error('Dieser Eintrag wurde seit der Übergabe verändert. Bitte zuerst die bestehende Verknüpfung prüfen.');
      return false;
    }
    rows.push({ ...item, uid, status: 'pending', createdAt: new Date().toISOString() });
    persist(uid, rows);
    return true;
  }
  async function pending() { const uid = await identity(); return read(uid).filter(x => x.status === 'pending'); }
  async function importOne(sourceId, getEntries, saveEntries) {
    const uid = await identity();
    const rows = read(uid), row = rows.find(x => x.sourceId === sourceId);
    if (!row || row.status !== 'pending') throw Error('Keine offene Übertragung vorhanden.');
    if (typeof getEntries !== 'function' || typeof saveEntries !== 'function') throw Error('Haushaltsbuch nicht bereit.');
    const entries = getEntries();
    if (!Array.isArray(entries)) throw Error('Buchungen nicht lesbar.');
    const ref = CAR + ':' + sourceId;
    if (entries.some(e => e && e.toolyaConnectSource === ref)) {
      row.status = 'local'; persist(uid, rows); return 'already-present';
    }
    const price = row.amountCents / 100;
    if (!Number.isFinite(price) || price <= 0) throw Error('Ungültiger Betrag.');
    let id = Date.now();
    while (entries.some(e => e && e.id === id)) id++;
    const category = 'Auto';
    const entry = { id, title: row.title, store: '', date: row.date, price,
      category, paymentMethod: 'Bargeld', warrantyMonths: 0, returnDays: 14,
      lifespan: 5, sn: '', location: '', isFixkosten: false, isTax: false,
      note: 'Aus Autokosten übernommen (Fahrzeug-ID ' + row.sourceCarId + '). Zahlungsart bitte prüfen.',
      entryType: 'ausgabe', photos: [], toolyaConnectSource: ref };
    if (!saveEntries([...entries, entry])) throw Error('Haushaltsbuch konnte nicht speichern.');
    row.status = 'local'; row.targetId = id; row.importedAt = new Date().toISOString();
    persist(uid, rows);
    return 'imported';
  }
  global.ToolyaConnect = Object.freeze({ enqueue, pending, importOne });
})(window);
