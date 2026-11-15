/**
 * Toolya Cloud-only state controller. In-memory state is a read cache, not persistence.
 * All writes await Supabase confirmation; no localStorage write fallback.
 */
export function createCloudController({ repository, validate, initial }) {
  if (!repository?.read || !repository?.save || typeof validate !== 'function') {
    throw new TypeError('Cloud-Controller benötigt Repository und Validator.');
  }
  const clone = value => JSON.parse(JSON.stringify(value));
  let state = clone(initial), revision = null, loaded = false, busy = false, generation = 0;
  const ensureReady = () => {
    if (!loaded) throw new Error('Cloud-Daten noch nicht geladen.');
    if (busy) throw new Error('Speichern läuft bereits.');
  };
  const api = {
    get ready() { return loaded && !busy; },
    get revision() { return revision; },
    snapshot() { ensureReady(); return clone(state); },
    async load() {
      if (busy) throw new Error('Speichern läuft bereits.');
      busy = true;
      const token = ++generation;
      try {
        const result = await repository.read();
        const next = validate(result.exists ? result.data : initial);
        if (token !== generation) throw new Error('Ladevorgang wurde überholt.');
        state = clone(next);
        revision = result.revision;
        loaded = true;
        return clone(state);
      } catch (error) {
        loaded = false;
        throw error;
      } finally { busy = false; }
    },
    async replace(next, { expectedRevision } = {}) {
      ensureReady();
      if (expectedRevision !== undefined && expectedRevision !== revision) {
        throw new Error('Datenstand hat sich verändert.');
      }
      const payload = validate(clone(next));
      busy = true;
      try {
        const result = await repository.save(payload, revision);
        state = clone(validate(result.data));
        revision = result.revision;
        return clone(state);
      } catch (error) {
        // Unknown write outcome must never be retried blindly.
        loaded = false;
        throw error;
      } finally { busy = false; }
    },
    async mutate(transform) {
      ensureReady();
      if (typeof transform !== 'function') throw new TypeError('Änderungsfunktion fehlt.');
      const next = clone(state);
      const changed = await transform(next);
      return api.replace(changed === undefined ? next : changed);
    },
    invalidate() { loaded = false; revision = null; ++generation; }
  };
  return Object.freeze(api);
}
export function validateCarSnapshot(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) ||
      !Array.isArray(data.cars) || !Array.isArray(data.events) ||
      !Array.isArray(data.tires)) throw new Error('Ungültiger Autokosten-Datenstand.');
  return data;
}
export function validateBudgetSnapshot(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) ||
      !Array.isArray(data.entries) || !Array.isArray(data.goals) ||
      !data.budgets || typeof data.budgets !== 'object' ||
      Array.isArray(data.budgets)) throw new Error('Ungültiger Haushaltsbuch-Datenstand.');
  return data;
}
export function createCarCloudController(repository) {
  return createCloudController({ repository, validate: validateCarSnapshot,
    initial: { cars: [], events: [], tires: [] } });
}
export function createBudgetCloudController(repository) {
  return createCloudController({ repository, validate: validateBudgetSnapshot,
    initial: { entries: [], budgets: {}, goals: [] } });
}
