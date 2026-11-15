/**
 * Cloud-only, version-checked JSON snapshot repository.
 * Wired on feature branch only. Requires isolated revision RPC schema before use.
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
  const serialized = JSON.stringify(data);
  if (!serialized) throw new Error('Ungültige oder zu große Daten.');
  // PostgreSQL enforces octet_length(jsonb::text), not JS UTF-16 code units.
  // Use a conservative UTF-8 byte limit; canonical JSONB formatting may
  // add whitespace, so leave headroom for server-side serialization.
  const byteLength = new TextEncoder().encode(serialized).byteLength;
  if (byteLength > 4_000_000) throw new Error('Ungültige oder zu große Daten.');
  return JSON.parse(serialized);
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
}
function sameJson(a,b) { return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b)); }
function assertResponse(result) {
  if (result.error) throw result.error;
  return result.data;
}
export function createCloudRepository(client, tool) {
  assertTool(tool);
  if (!client?.from || !client?.rpc || !client?.auth?.getUser) throw new Error('Supabase nicht verfügbar.');
  async function currentUser() {
    const user = await requireVerifiedUser(client);
    return user.id;
  }
  async function read() {
    const uid = await currentUser();
    const row = assertResponse(await client.from('user_data')
      .select('id,user_id,tool,data,revision')
      .eq('user_id', uid).eq('tool', tool).maybeSingle());
    if ((await currentUser()) !== uid) throw new Error('Konto während des Ladens gewechselt.');
    if (!row) return { exists: false, data: null, revision: null };
    if (row.user_id !== uid || row.tool !== tool || !Number.isSafeInteger(row.revision) || row.revision < 1) {
      throw new Error('Cloud-Antwort ist inkonsistent.');
    }
    return { exists: true, data: assertSnapshot(row.data), revision: row.revision };
  }
  async function save(data, expectedRevision) {
    const payload = assertSnapshot(data);
    const uid = await currentUser();
    if (expectedRevision !== null &&
        (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1)) {
      throw new Error('Erwartete Cloud-Version ungültig.');
    }
    if (expectedRevision === undefined) throw new Error('Erwartete Cloud-Version erforderlich.');
    if (typeof navigator !== 'undefined' && !navigator.onLine)
      throw new Error('Offline: Änderungen wurden nicht gespeichert.');
    // Atomic server-side compare-and-swap; no client timestamps or direct writes.
    const result = await client.rpc('toolya_save_snapshot', {
      p_tool: tool, p_data: payload, p_expected_revision: expectedRevision
    });
    if (result.error?.code === '40001') throw new Error('Cloud-Konflikt: Bitte neu laden.');
    const rows = assertResponse(result);
    if (!Array.isArray(rows) || rows.length !== 1)
      throw new Error('Cloud-Speicherung nicht bestätigt.');
    const row = rows[0];
    if ((await currentUser()) !== uid || !Number.isSafeInteger(row.revision) || row.revision < 1 ||
        (expectedRevision !== null && row.revision !== expectedRevision + 1) ||
        (expectedRevision === null && row.revision !== 1) ||
        !sameJson(row.data, payload)) {
      throw new Error('Cloud-Speicherung nicht eindeutig bestätigt.');
    }
    return { revision: row.revision, data: assertSnapshot(row.data) };
  }
  return Object.freeze({ read, save });
}
