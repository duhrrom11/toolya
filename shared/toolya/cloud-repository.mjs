/**
 * Cloud-only, version-checked JSON snapshot repository.
 * Not yet wired to tool UIs. No localStorage fallback and no implicit insert/upsert.
 * A verified user is required for every operation; RLS is the authorization boundary.
 */
import { requireVerifiedUser } from './cloud-auth-gate.mjs';

function assertTool(tool) {
  if (typeof tool !== 'string' || !/^[a-z0-9_-]{1,80}$/i.test(tool)) {
    throw new Error('Ungültiger Werkzeugschlüssel.');
  }
}
function assertSnapshot(data) {
  if (!data || Array.isArray(data) || typeof data !== 'object') {
    throw new Error('Ungültiges Cloud-Datenformat.');
  }
  // Reject accidental non-JSON values and cyclic structures.
  const bytes = JSON.stringify(data);
  if (!bytes || bytes.length > 5_000_000) throw new Error('Ungültige oder zu große Daten.');
  return JSON.parse(bytes);
}
function assertResponse(result) {
  if (result.error) throw result.error;
  return result.data;
}
export function createCloudRepository(client, tool) {
  assertTool(tool);
  if (!client?.from || !client?.auth?.getUser) throw new Error('Supabase nicht verfügbar.');
  async function currentUser() {
    const user = await requireVerifiedUser(client);
    return user.id;
  }
  async function read() {
    const uid = await currentUser();
    const row = assertResponse(await client.from('user_data')
      .select('id,user_id,tool,data,updated_at')
      .eq('user_id', uid).eq('tool', tool).maybeSingle());
    if ((await currentUser()) !== uid) throw new Error('Konto während des Ladens gewechselt.');
    if (!row) return { exists: false, data: null, revision: null };
    if (row.user_id !== uid || row.tool !== tool || !row.updated_at) {
      throw new Error('Cloud-Antwort ist inkonsistent.');
    }
    return { exists: true, data: assertSnapshot(row.data), revision: row.updated_at };
  }
  async function save(data, expectedRevision) {
    const payload = assertSnapshot(data);
    const uid = await currentUser();
    if (expectedRevision !== null && (typeof expectedRevision !== 'string' || !expectedRevision)) {
      throw new Error('Cloud-Version fehlt.');
    }
    if (expectedRevision === undefined) throw new Error('Erwartete Cloud-Version erforderlich.');
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('Offline: Änderungen wurden nicht gespeichert.');
    }
    let result;
    if (expectedRevision === null) {
      result = await client.from('user_data')
        .insert({ user_id: uid, tool, data: payload })
        .select('id,user_id,tool,data,updated_at');
    } else {
      result = await client.from('user_data')
        .update({ data: payload, updated_at: new Date().toISOString() })
        .eq('user_id', uid).eq('tool', tool).eq('updated_at', expectedRevision)
        .select('id,user_id,tool,data,updated_at');
    }
    if (result.error?.code === '23505') throw new Error('Cloud-Konflikt: Datensatz existiert bereits.');
    const rows = assertResponse(result);
    if (!Array.isArray(rows) || rows.length !== 1) {
      throw new Error('Cloud-Konflikt oder unbestätigtes Speichern. Bitte neu laden.');
    }
    const row = rows[0];
    if ((await currentUser()) !== uid || row.user_id !== uid || row.tool !== tool ||
        !row.updated_at || JSON.stringify(row.data) !== JSON.stringify(payload)) {
      throw new Error('Cloud-Speicherung nicht eindeutig bestätigt.');
    }
    return { revision: row.updated_at, data: assertSnapshot(row.data) };
  }
  return Object.freeze({ read, save });
}
