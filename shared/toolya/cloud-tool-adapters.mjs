import { createCloudRepository } from './cloud-repository.mjs';
import { requireVerifiedUser } from './cloud-auth-gate.mjs';
import { createCarCloudController, createBudgetCloudController, createMovingCloudController, createLoansCloudController, createMetersCloudController, createPlantsCloudController, createParkingCloudController, createPetHealthCloudController, createBakingCloudController } from './cloud-controller.mjs';
import { createLegacyMigration, sameJson } from './legacy-cloud-migration.mjs';

/**
 * Cloud-only bootstrap for the two legacy tools. This is deliberately separate
 * from their synchronous UI code until every call site can await a save.
 */
export async function prepareCloudTool({ client, tool, storage, confirmMigration, exportBackup, reviewExistingCloud }) {
  const factory = {
    'umzugskisten-inventar': createMovingCloudController,
    'verliehene-gegenstaende-verwalten': createLoansCloudController,
    'zaehlerstaende-erfassen': createMetersCloudController,
    'pflanzenpflege-giessplan': createPlantsCloudController,
    'parkplatz-merker-parkschein-timer': createParkingCloudController,
    'haustier-gesundheitspass': createPetHealthCloudController,
    'backform-umrechner': createBakingCloudController,
    'autokosten-reifenwechsel': createCarCloudController,
    'haushaltsbuch-kassenbon': createBudgetCloudController
  }[tool];
  if (!factory) throw new Error('Unbekanntes Cloud-Werkzeug.');
  const repository = createCloudRepository(client, tool);
  const controller = factory(repository);
  const migration = createLegacyMigration({ client, repository, tool, storage });
  const review = await migration.inspect();
  let reviewedCloudRevision = null;
  if (review.status === 'ready-for-review') {
    if (typeof confirmMigration !== 'function' || typeof exportBackup !== 'function')
      throw new Error('Migration erfordert Bestätigung und Backup.');
    const outcome = await migration.migrate({
      confirm: confirmMigration,
      exportBackup
    });
    if (outcome.status !== 'confirmed') throw new Error('Migration abgebrochen; keine Daten gelöscht.');
  }
  if (review.status === 'cloud-already-exists') {
    // No implicit merge or overwrite. Require explicit acknowledgement and local export.
    if (typeof reviewExistingCloud !== 'function' || typeof exportBackup !== 'function')
      throw Error('Cloud- und Gerätedaten müssen vor dem Fortfahren geprüft werden.');
    const proceed = await reviewExistingCloud({
      tool, localKeys: review.localKeys, cloudRevision: review.cloudRevision,
      warning: 'Cloud-Daten haben Vorrang; Gerätedaten bleiben erhalten und werden nicht automatisch zusammengeführt.'
    });
    if (proceed !== true) throw Error('Datenabgleich abgebrochen.');
    const exported = await exportBackup(review.local, tool);
    if (exported !== true) throw Error('Gerätedaten-Sicherung nicht bestätigt.');
    // Recheck account and cloud revision after the user interaction.
    const checked = await migration.inspect();
    if (checked.status !== 'cloud-already-exists' ||
        checked.userId !== review.userId || checked.cloudRevision !== review.cloudRevision ||
        !sameJson(checked.localKeys, review.localKeys) ||
        !sameJson(checked.local, review.local))
      throw Error('Cloud- oder Gerätedaten haben sich geändert. Bitte neu prüfen.');
    reviewedCloudRevision = checked.cloudRevision;
  }
  // Existing cloud snapshots are authoritative. Local data remains untouched.
  await controller.load();
  // The account may change while the final snapshot is in flight.
  let finalUser;
  try {
    finalUser = await requireVerifiedUser(client);
  } catch (error) {
    controller.invalidate();
    throw error;
  }
  if (finalUser.id !== review.userId) {
    controller.invalidate();
    throw Error('Konto während des Cloud-Ladens gewechselt.');
  }
  if (reviewedCloudRevision !== null && controller.revision !== reviewedCloudRevision) {
    controller.invalidate();
    throw Error('Cloud-Datenstand hat sich nach der Prüfung geändert. Bitte neu laden.');
  }
  return Object.freeze({
    controller,
    async saveBaking(data) {
      if(tool!=='backform-umrechner') throw Error('Falscher Adapter.');
      return controller.replace(data);
    },
    async savePetHealth(data) {
      if(tool!=='haustier-gesundheitspass') throw Error('Falscher Adapter.');
      return controller.replace(data);
    },
    async saveParking(data) {
      if(tool!=='parkplatz-merker-parkschein-timer') throw Error('Falscher Adapter.');
      return controller.replace(data);
    },
    async savePlants(data) {
      if(tool!=='pflanzenpflege-giessplan') throw Error('Falscher Adapter.');
      return controller.replace(data);
    },
    async saveMeters(data) {
      if (tool !== 'zaehlerstaende-erfassen') throw new Error('Falscher Adapter.');
      return controller.replace(data);
    },
    async saveLoans(data) {
      if (tool !== 'verliehene-gegenstaende-verwalten') throw new Error('Falscher Adapter.');
      return controller.replace(data);
    },
    async saveMoving(data) {
      if (tool !== 'umzugskisten-inventar') throw new Error('Falscher Adapter.');
      return controller.replace(data);
    },
    async saveCar(data) {
      if (tool !== 'autokosten-reifenwechsel') throw new Error('Falscher Adapter.');
      return controller.replace(data);
    },
    async saveEntries(entries) {
      if (tool !== 'haushaltsbuch-kassenbon') throw new Error('Falscher Adapter.');
      return controller.mutate(snapshot => { snapshot.entries = entries; });
    },
    async saveBudgets(budgets) {
      if (tool !== 'haushaltsbuch-kassenbon') throw new Error('Falscher Adapter.');
      return controller.mutate(snapshot => { snapshot.budgets = budgets; });
    },
    async saveGoals(goals) {
      if (tool !== 'haushaltsbuch-kassenbon') throw new Error('Falscher Adapter.');
      return controller.mutate(snapshot => { snapshot.goals = goals; });
    }
  });
}
