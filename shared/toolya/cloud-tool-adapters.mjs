import { createCloudRepository } from './cloud-repository.mjs';
import { createCarCloudController, createBudgetCloudController } from './cloud-controller.mjs';
import { createLegacyMigration } from './legacy-cloud-migration.mjs';

/**
 * Cloud-only bootstrap for the two legacy tools. This is deliberately separate
 * from their synchronous UI code until every call site can await a save.
 */
export async function prepareCloudTool({ client, tool, storage, confirmMigration, exportBackup }) {
  const factory = {
    'autokosten-reifenwechsel': createCarCloudController,
    'haushaltsbuch-kassenbon': createBudgetCloudController
  }[tool];
  if (!factory) throw new Error('Unbekanntes Cloud-Werkzeug.');
  const repository = createCloudRepository(client, tool);
  const controller = factory(repository);
  const migration = createLegacyMigration({ client, repository, tool, storage });
  const review = await migration.inspect();
  if (review.status === 'ready-for-review') {
    if (typeof confirmMigration !== 'function' || typeof exportBackup !== 'function')
      throw new Error('Migration erfordert Bestätigung und Backup.');
    const outcome = await migration.migrate({
      confirm: confirmMigration,
      exportBackup
    });
    if (outcome.status !== 'confirmed') throw new Error('Migration abgebrochen; keine Daten gelöscht.');
  }
  // Existing cloud snapshots are authoritative. Local data remains untouched.
  await controller.load();
  return Object.freeze({
    controller,
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
    },
    async importBackup(snapshot) {
      // The caller must validate/preview the entire backup and obtain explicit
      // consent before calling this method. No local writes are performed.
      return controller.replace(snapshot);
    }
  });
}
