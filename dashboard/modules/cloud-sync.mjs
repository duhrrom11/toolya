// Dashboard cloud persistence. Guest browser data are never uploaded automatically.
const URL = 'https://yheogmeaosuigyaxkwth.supabase.co';
const KEY = 'sb_publishable_PK20oOPzG3AB-bd95Ji9Tg_C-MIUgyv';
const TABLES = { tasks: 'dashboard_tasks', reminders: 'dashboard_reminders' };
const safeDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const now = () => new Date().toISOString();
const own = (row, userId) => row?.user_id === userId && !row.deleted_at;
const legacyKey = (kind, id) => kind + ':' + id;

export function createDashboardCloud(onState) {
  const client = globalThis.toolyaDashboardAuthClient || globalThis.supabase?.createClient(URL, KEY);
  let generation = 0, currentUser = null, active = 'local', busy = false;
  const rows = { tasks: [], reminders: [] };
  const signal = (status, message = '') => { active = status; onState({ status, message, userId: currentUser?.id || null }); };
  const snapshot = kind => rows[kind].filter(row => own(row, currentUser?.id)).map(row => ({
    id: row.id, text: row.title, done: row.completed, due: row.due_at, revision: row.revision
  }));
  const requireUser = async () => {
    if (!currentUser || active !== 'cloud') throw Error('Die Cloud ist noch nicht bereit.');
    const { data, error } = await client.auth.getUser();
    if (error || !data?.user || data.user.is_anonymous || data.user.id !== currentUser.id) {
      throw Error('Anmeldung nicht mehr gültig. Bitte erneut anmelden.');
    }
    return data.user;
  };
  async function refresh() {
    if (!currentUser || !client) return;
    if (busy) return;
    const userId = currentUser.id, seq = generation;
    const [a, b] = await Promise.all(Object.values(TABLES).map(table =>
      client.from(table).select('id,user_id,legacy_id,title,completed,due_at,revision,deleted_at,created_at').eq('user_id', userId).is('deleted_at', null).order('created_at', { ascending: true }).limit(1000)
    ));
    if (seq !== generation) return;
    if (a.error || b.error) {
      signal('error', 'Cloud-Daten können nicht geladen werden. Keine Browserdaten wurden überschrieben.');
      return;
    }
    rows.tasks = a.data || [];
    rows.reminders = b.data || [];
    signal('cloud', 'Mit Toolya synchronisiert');
  }
  async function syncAuth() {
    const seq = ++generation;
    if (!client) { currentUser = null; signal('local'); return; }
    signal('loading', 'Kontostatus wird geprüft …');
    try {
      const { data, error } = await client.auth.getUser();
      if (seq !== generation) return;
      if (error) {
        if (error.name === 'AuthSessionMissingError' || /Auth session missing/i.test(error.message || '')) {
          currentUser = null; rows.tasks = []; rows.reminders = []; signal('local'); return;
        }
        currentUser = null; rows.tasks = []; rows.reminders = [];
        signal('error', 'Anmeldestatus unklar. Änderungen sind vorübergehend gesperrt.'); return;
      }
      const user = data?.user;
      if (!user || user.is_anonymous) {
        currentUser = null; rows.tasks = []; rows.reminders = []; signal('local'); return;
      }
      currentUser = user;
      await refresh();
    } catch {
      if (seq === generation) {
        currentUser = null; rows.tasks = []; rows.reminders = [];
        signal('error', 'Cloud-Verbindung nicht verfügbar. Es wurden keine lokalen Daten verändert.');
      }
    }
  }
  async function guarded(action) {
    if (busy) throw Error('Bitte warte, bis der letzte Speichervorgang abgeschlossen ist.');
    const user = await requireUser();
    const userId = user.id;
    busy = true;
    try { return await action(userId); }
    finally { busy = false; }
  }
  async function create(kind, item) {
    return guarded(async userId => {
      const record = { user_id: userId, title: item.text, completed: false };
      if (kind === 'reminders') {
        if (!safeDate(item.due)) throw Error('Ungültiger Erinnerungstermin.');
        record.due_at = item.due;
      }
      const { data, error } = await client.from(TABLES[kind]).insert(record).select('*').single();
      if (error) throw error;
      if (currentUser?.id !== userId) throw Error('Konto wurde während des Speicherns gewechselt.');
      rows[kind].push(data);
      return data;
    });
  }
  async function change(kind, id, completed = null, remove = false) {
    return guarded(async userId => {
      const row = rows[kind].find(r => r.id === id && own(r, userId));
      if (!row) throw Error('Eintrag wurde bereits geändert. Bitte neu laden.');
      const values = { revision: row.revision + 1, updated_at: now() };
      if (remove) values.deleted_at = now();
      else values.completed = !!completed;
      const { data, error } = await client.from(TABLES[kind])
        .update(values).eq('id', row.id).eq('user_id', userId).eq('revision', row.revision).is('deleted_at', null)
        .select('*');
      if (error) throw error;
      if (data?.length !== 1) {
        // No silent overwrite when another device has changed the same record.
        throw Error('Speicherkonflikt: Der Eintrag wurde auf einem anderen Gerät verändert. Bitte aktualisieren.');
      }
      if (currentUser?.id !== userId) throw Error('Konto wurde während des Speicherns gewechselt.');
      rows[kind] = rows[kind].filter(r => r.id !== row.id);
      if (!remove) rows[kind].push(data[0]);
      return data[0];
    });
  }
  async function importLocal(local) {
    return guarded(async userId => {
      let count = 0;
      for (const kind of Object.keys(TABLES)) {
        const valid = (local[kind] || []).filter(item =>
          typeof item?.id === 'string' && item.id.length > 0 && item.id.length <= 170 &&
          typeof item.text === 'string' && item.text.length >= 1 && item.text.length <= 160 &&
          (kind !== 'reminders' || safeDate(item.due))
        ).slice(0, 150);
        // Conflict-ignore is intentionally insert-only. Repeated imports never overwrite cloud changes.
        for (let i = 0; i < valid.length; i += 25) {
          if (currentUser?.id !== userId) throw Error('Konto während des Imports gewechselt. Übernahme gestoppt.');
          const values = valid.slice(i, i + 25).map(item => ({
            user_id: userId, legacy_id: legacyKey(kind, item.id),
            title: item.text, completed: !!item.done,
            ...(kind === 'reminders' ? { due_at: item.due } : {})
          }));
          const { error } = await client.from(TABLES[kind])
            .upsert(values, { onConflict: 'user_id,legacy_id', ignoreDuplicates: true });
          if (error) throw Error('Übernahme unterbrochen: ' + error.message + '. Bereits übernommene Einträge bleiben erhalten.');
          count += values.length;
        }
      }
      return count;
    });
  }
  let started = false;
  function start() {
    if (started) { void syncAuth(); return; }
    started = true;
    if (client) {
      client.auth.onAuthStateChange(() => {
        // Avoid invoking auth APIs within the Supabase auth callback.
        queueMicrotask(() => { void syncAuth(); });
      });
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && active === 'cloud') void refresh();
      });
      setInterval(() => { if (!document.hidden && active === 'cloud') void refresh(); }, 30000);
    }
    void syncAuth();
  }
  return {
    start, retry: syncAuth, refresh, create, change, importLocal, snapshot,
    get status() { return active; },
    get userId() { return currentUser?.id || null; }
  };
}
