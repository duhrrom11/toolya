/**
 * Toolya Cloud-only state controller. In-memory state is a read cache, not persistence.
 * All writes await Supabase confirmation; no localStorage write fallback.
 */
export function createCloudController({ repository, validate, initial }) {
  if (!repository?.read || !repository?.save || typeof validate !== 'function') {
    throw new TypeError('Cloud-Controller benötigt Repository und Validator.');
  }
  const clone = value => JSON.parse(JSON.stringify(value));
  const normalize = value => Array.isArray(value) ? value.map(normalize) :
    value && typeof value === 'object'
      ? Object.fromEntries(Object.keys(value).sort().map(key => [key, normalize(value[key])]))
      : value;
  const sameJson = (a, b) => JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
  let state = clone(initial), revision = null, loaded = false, busy = false, generation = 0;
  const ensureReady = () => {
    if (!loaded) throw new Error('Cloud-Daten noch nicht geladen.');
    if (busy) throw new Error('Speichern läuft bereits.');
  };
  const api = {
    get ready() { return loaded && !busy; },
    get revision() { return revision; },
    get sessionGeneration() { return generation; },
    snapshot() { ensureReady(); return clone(state); },
    async load() {
      if (busy) throw new Error('Speichern läuft bereits.');
      busy = true;
      const token = ++generation;
      try {
        const result = await repository.read();
        if (!result || typeof result.exists !== 'boolean' ||
            (result.exists && (!Number.isSafeInteger(result.revision) || result.revision < 1 ||
              result.data === null || result.data === undefined)) ||
            (!result.exists && (result.revision !== null || result.data !== null))) {
          throw new Error('Cloud-Leseantwort ist inkonsistent.');
        }
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
      const token = generation;
      try {
        const result = await repository.save(payload, revision);
        if (token !== generation || !loaded)
          throw new Error('Cloud-Sitzung während des Speicherns ungültig geworden.');
        if (!result || !Number.isSafeInteger(result.revision) ||
            result.revision !== (revision === null ? 1 : revision + 1) ||
            result.data === null || result.data === undefined ||
            !sameJson(result.data, payload))
          throw new Error('Cloud-Speicherantwort ist inkonsistent.');
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
      // Reserve the controller synchronously so nested/reentrant mutations
      // cannot observe the same revision and race against one another.
      busy = true;
      let next;
      try {
        next = clone(state);
        const changed = transform(next);
        if (changed && typeof changed.then === 'function')
          throw new Error('Asynchrone Mutationen sind nicht erlaubt.');
        next = validate(clone(changed === undefined ? next : changed));
      } catch (error) {
        busy = false;
        throw error;
      }
      busy = false;
      // No await occurs between releasing the reservation and replace(),
      // whose synchronous prelude reserves the controller for the write.
      return api.replace(next);
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

export function validateMovingSnapshot(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) ||
      !Array.isArray(data.locations) || !Array.isArray(data.boxes) ||
      ![...data.locations,...data.boxes].every(item =>
        item && typeof item === 'object' && !Array.isArray(item)))
    throw new Error('Ungültiger Umzugskisten-Datenstand.');
  return data;
}
export function createMovingCloudController(repository) {
  return createCloudController({ repository, validate: validateMovingSnapshot,
    initial: { locations: [], boxes: [] } });
}

export function validateLoansSnapshot(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) ||
      !['items','contacts','inventory'].every(key =>
        Array.isArray(data[key]) && data[key].every(item =>
          item && typeof item === 'object' && !Array.isArray(item))))
    throw new Error('Ungültiger Verleih-Datenstand.');
  return data;
}
export function createLoansCloudController(repository) {
  return createCloudController({repository,validate:validateLoansSnapshot,
    initial:{items:[],contacts:[],inventory:[]}});
}

export function validateMetersSnapshot(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) ||
      !Array.isArray(data.readings) ||
      !data.readings.every(item => item && typeof item === 'object' && !Array.isArray(item)) ||
      !data.tarifs || typeof data.tarifs !== 'object' || Array.isArray(data.tarifs))
    throw new Error('Ungültiger Zählerstände-Datenstand.');
  return data;
}
export function createMetersCloudController(repository) {
  return createCloudController({repository,validate:validateMetersSnapshot,
    initial:{readings:[],tarifs:{}}});
}

export function validatePlantsSnapshot(data) {
  if(!data||typeof data!=='object'||Array.isArray(data)||!Array.isArray(data.plants)||
     !data.plants.every(x=>x&&typeof x==='object'&&!Array.isArray(x))||
     !Array.isArray(data.inventory)||!Array.isArray(data.seeds)||!Array.isArray(data.beetSlots))
    throw Error('Ungültiger Pflanzen-Datenstand.');
  return data;
}
export function createPlantsCloudController(repository) {
  return createCloudController({repository,validate:validatePlantsSnapshot,initial:{
    plants:[],monthWaterLiters:0,totalHarvestGrams:0,
    inventory:[{name:'Tomatendünger Flüssig',qty:'1 L'},{name:'Bio Blumenerde',qty:'40 L'}],
    seeds:[],beetSlots:Array(16).fill(null),cisternMax:500,cisternCurrent:500
  }});
}

export function validateParkingSnapshot(data){
  if(!data||typeof data!=='object'||Array.isArray(data)||!Array.isArray(data.sessions)||
     !data.sessions.every(item=>item&&typeof item==='object'&&!Array.isArray(item) &&
       Number.isSafeInteger(item.id)&&item.id>=0 &&
       typeof item.desc==='string'&&Number.isFinite(item.cost)&&item.cost>=0 &&
       (item.gps==null||(Number.isFinite(item.gps.lat)&&Number.isFinite(item.gps.lng)))))
    throw Error('Ungültiger Parkplatz-Datenstand.');
  return data;
}
export function createParkingCloudController(repository){
  return createCloudController({repository,validate:validateParkingSnapshot,initial:{sessions:[]}});
}
