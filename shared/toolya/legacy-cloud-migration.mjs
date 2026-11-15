/**
 * Non-destructive legacy-to-cloud migration coordinator.
 * Caller must provide explicit user confirmation and an export/backup action.
 * Never deletes localStorage; never overwrites an existing cloud snapshot.
 * Development-only: not connected to production tool screens.
 */
import { requireVerifiedUser } from './cloud-auth-gate.mjs';

function copy(value) {
  const bytes = JSON.stringify(value);
  if (typeof bytes !== 'string') throw new Error('Ungültige Bestandsdaten.');
  return JSON.parse(bytes);
}
function canonicalJson(value) {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalJson(value[key])]));
  return value;
}
export function sameJson(a, b) {
  return JSON.stringify(canonicalJson(a)) === JSON.stringify(canonicalJson(b));
}
function validateCar(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      !Array.isArray(value.cars) || !Array.isArray(value.events) ||
      !Array.isArray(value.tires)) throw new Error('Autokosten-Bestand ist beschädigt.');
  return copy(value);
}
function validateBudget(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      !Array.isArray(value.entries) || !Array.isArray(value.goals) ||
      !value.budgets || typeof value.budgets !== 'object' ||
      Array.isArray(value.budgets)) throw new Error('Haushaltsbuch-Bestand ist beschädigt.');
  return copy(value);
}
const TOOLS = Object.freeze({
  'backform-umrechner': {
    keys:['helperly_recipes_pro'],
    validate:value=>{
      if(!Array.isArray(value)||!value.every(x=>x&&typeof x==='object'&&!Array.isArray(x)))
        throw Error('Rezept-Bestand ist beschädigt.');
      return copy(value);
    },
    build:values=>({recipes:values[0]})
  },
  'haustier-gesundheitspass': {
    keys:['haustier_pass_pro_v5'],
    validate:value=>{
      if(!value||typeof value!=='object'||Array.isArray(value)||
        !Array.isArray(value.pets)||!Array.isArray(value.events)||
        !value.pets.every(x=>x&&typeof x==='object'&&!Array.isArray(x))||
        !value.events.every(x=>x&&typeof x==='object'&&!Array.isArray(x))||
        (value.meds!==undefined&&(!Array.isArray(value.meds)||!value.meds.every(x=>x&&typeof x==='object'&&!Array.isArray(x)))))
        throw Error('Haustier-Bestand ist beschädigt.');
      return copy({...value,meds:value.meds??[]});
    },
    build:values=>values[0]
  },
  'parkplatz-merker-parkschein-timer': {
    keys:['park_history_pro_v3'],
    validate:value=>{
      if(!value||typeof value!=='object'||Array.isArray(value)||!Array.isArray(value.sessions)||
        !value.sessions.every(item=>item&&typeof item==='object'&&!Array.isArray(item)))
        throw Error('Parkplatz-Bestand ist beschädigt.');
      return copy(value);
    },
    build:values=>values[0]
  },
  'pflanzenpflege-giessplan': {
    keys:['pflanzen_pass_v10'],
    validate:value=>{
      if(!value||typeof value!=='object'||Array.isArray(value)||!Array.isArray(value.plants)||
        !value.plants.every(x=>x&&typeof x==='object'&&!Array.isArray(x)))
        throw Error('Pflanzen-Bestand ist beschädigt.');
      return copy({...value,
        inventory:Array.isArray(value.inventory)?value.inventory:[{name:'Tomatendünger Flüssig',qty:'1 L'},{name:'Bio Blumenerde',qty:'40 L'}],
        seeds:Array.isArray(value.seeds)?value.seeds:[],
        beetSlots:Array.isArray(value.beetSlots)?value.beetSlots:Array(16).fill(null)});
    },
    build:values=>values[0]
  },
  'zaehlerstaende-erfassen': {
    keys: ['energie_tracker_pro_v8'],
    validate: value => {
      if (!value || typeof value !== 'object' || Array.isArray(value) ||
          !Array.isArray(value.readings) ||
          !value.readings.every(item => item && typeof item === 'object' && !Array.isArray(item)) ||
          (value.tarifs !== undefined && (!value.tarifs || typeof value.tarifs !== 'object' || Array.isArray(value.tarifs))))
        throw new Error('Zählerstände-Bestand ist beschädigt.');
      return copy({...value,tarifs:value.tarifs || {}});
    },
    build: values => values[0]
  },
  'verliehene-gegenstaende-verwalten': {
    keys: ['verleih_tracker_pro_v3'],
    validate: value => {
      if (!value || typeof value !== 'object' || Array.isArray(value) ||
          !['items','contacts','inventory'].every(key =>
            Array.isArray(value[key]) && value[key].every(item =>
              item && typeof item === 'object' && !Array.isArray(item))))
        throw new Error('Verleih-Bestand ist beschädigt.');
      return copy(value);
    },
    build: values => values[0]
  },
  'umzugskisten-inventar': {
    keys: ['mini_homebox_pro'],
    validate: value => {
      if (!value || typeof value !== 'object' || Array.isArray(value) ||
          !Array.isArray(value.locations) || !Array.isArray(value.boxes) ||
          ![...value.locations,...value.boxes].every(item => item && typeof item === 'object' && !Array.isArray(item)))
        throw new Error('Umzugskisten-Bestand ist beschädigt.');
      return copy(value);
    },
    build: values => values[0]
  },
  'autokosten-reifenwechsel': {
    keys: ['kfz_tracker_pro_v3'],
    validate: validateCar,
    build: values => values[0]
  },
  'haushaltsbuch-kassenbon': {
    keys: ['kassenbon_data', 'budgetbuch_budgets', 'budgetbuch_goals'],
    validate: validateBudget,
    build: values => ({
      entries: values[0] ?? [], budgets: values[1] ?? {}, goals: values[2] ?? []
    })
  }
});
function parseLegacy(storage, key) {
  const bytes = storage.getItem(key);
  if (bytes === null) return { exists: false, value: null };
  let value;
  try { value = JSON.parse(bytes); }
  catch (_) { throw new Error('Lokale Altdaten sind beschädigt: ' + key); }
  return { exists: true, value };
}
function ownerGuard(storage, tool, uid) {
  const owner = storage.getItem('helferlein_cloud_owner_' + tool);
  if (owner && owner !== uid) throw new Error('Gerätedaten gehören zu einem anderen Konto.');
}
export function createLegacyMigration({ client, repository, tool, storage = localStorage }) {
  const definition = TOOLS[tool];
  if (!definition || !repository?.read || !repository?.save || !client) {
    throw new Error('Migration nicht verfügbar.');
  }
  async function context() {
    const user = await requireVerifiedUser(client);
    ownerGuard(storage, tool, user.id);
    return user.id;
  }
  async function inspect() {
    const uid = await context();
    const raw = definition.keys.map(k => parseLegacy(storage, k));
    if (!raw.some(x => x.exists)) return { status: 'no-local-data', userId: uid };
    const local = definition.validate(definition.build(raw.map(x => x.value)));
    const cloud = await repository.read();
    if ((await context()) !== uid) throw new Error('Konto während Prüfung gewechselt.');
    return {
      status: cloud.exists ? 'cloud-already-exists' : 'ready-for-review',
      userId: uid, local,
      localKeys: definition.keys.filter((_, i) => raw[i].exists),
      cloudRevision: cloud.revision
    };
  }
  async function migrate({ confirm, exportBackup }) {
    if (typeof confirm !== 'function' || typeof exportBackup !== 'function') {
      throw new Error('Explizite Bestätigung und Sicherung erforderlich.');
    }
    const review = await inspect();
    if (review.status !== 'ready-for-review') {
      throw new Error('Keine sichere automatische Übernahme möglich: ' + review.status);
    }
    const approved = await confirm({
      tool, localKeys: review.localKeys,
      warning: 'Bestehende lokale Daten bleiben erhalten. Kein Cloud-Bestand wird überschrieben.'
    });
    if (approved !== true) return { status: 'cancelled' };
    const backupAccepted = await exportBackup(copy(review.local), tool);
    if (backupAccepted !== true) throw new Error('Sicherung nicht bestätigt. Migration abgebrochen.');
    const uid = await context();
    if (uid !== review.userId) throw new Error('Konto gewechselt.');
    // Re-inspect immediately before writing; do not trust a stale preview.
    const again = await inspect();
    if (again.status !== 'ready-for-review' ||
        again.userId !== review.userId ||
        !sameJson(again.localKeys, review.localKeys) ||
        !sameJson(again.local, review.local)) {
      throw new Error('Daten wurden seit der Vorschau verändert. Bitte erneut prüfen.');
    }
    const saved = await repository.save(review.local, null);
    const confirmed = await repository.read();
    if (!confirmed.exists ||
        !sameJson(confirmed.data, review.local) ||
        confirmed.revision !== saved.revision) {
      throw new Error('Cloud-Readback unklar. Lokale Daten bleiben erhalten.');
    }
    if ((await context()) !== uid) throw new Error('Konto nach Übertragung gewechselt.');
    return { status: 'confirmed', revision: confirmed.revision, localDataRetained: true };
  }
  return Object.freeze({ inspect, migrate });
}
