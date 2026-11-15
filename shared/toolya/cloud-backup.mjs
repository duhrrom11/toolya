/**
 * Explicit, non-destructive backup protocol for Cloud-only tools.
 * No localStorage persistence and no silent overwrite.
 */
export function exportJsonBackup(snapshot, filename, doc = document) {
  const json = JSON.stringify(snapshot);
  if (!json) throw Error('Sicherung enthält keine Daten.');
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  try {
    const a = doc.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
}
export async function confirmCloudReplacement({
  controller, incoming, validate, confirm, exportBackup
}) {
  if (!controller?.ready || !controller?.replace || !controller?.snapshot)
    throw Error('Cloud-Daten nicht bereit.');
  if (typeof validate !== 'function' || typeof confirm !== 'function' ||
      typeof exportBackup !== 'function') throw Error('Sicherheitsprüfungen fehlen.');
  const original = controller.snapshot();
  const revision = controller.revision;
  const sessionGeneration = controller.sessionGeneration;
  let serialized;
  try {
    serialized = JSON.stringify(incoming);
  } catch (_) {
    throw new Error('Importdaten sind kein gültiges JSON.');
  }
  if (typeof serialized !== 'string') throw new Error('Importdaten sind kein gültiges JSON.');
  const next = validate(JSON.parse(serialized));
  if (await confirm('Import ersetzt vorhandene Cloud-Daten. Zuerst eine Sicherung herunterladen?') !== true)
    return { status: 'cancelled' };
  const backedUp = await exportBackup(original);
  if (backedUp !== true) throw Error('Cloud-Sicherung nicht bestätigt. Import abgebrochen.');
  if (await confirm('Sicherung kontrolliert? Vorhandene Cloud-Daten jetzt wirklich ersetzen?') !== true)
    return { status: 'cancelled' };
  if (!controller.ready || controller.revision !== revision ||
      controller.sessionGeneration !== sessionGeneration)
    throw Error('Cloud-Sitzung oder Datenstand hat sich geändert.');
  const data = await controller.replace(next, { expectedRevision: revision });
  return { status: 'confirmed', data };
}
