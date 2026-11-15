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
        JSON.stringify(again.local) !== JSON.stringify(review.local)) {
      throw new Error('Daten wurden seit der Vorschau verändert. Bitte erneut prüfen.');
    }
    const saved = await repository.save(review.local, null);
    const confirmed = await repository.read();
    if (!confirmed.exists ||
        JSON.stringify(confirmed.data) !== JSON.stringify(review.local) ||
        confirmed.revision !== saved.revision) {
      throw new Error('Cloud-Readback unklar. Lokale Daten bleiben erhalten.');
    }
    if ((await context()) !== uid) throw new Error('Konto nach Übertragung gewechselt.');
    return { status: 'confirmed', revision: confirmed.revision, localDataRetained: true };
  }
  return Object.freeze({ inspect, migrate });
}
