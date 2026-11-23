/**
 * Toolya Rewards V1 / moving first-box BRIDGE (draft, server-internal only).
 *
 * NOT a public endpoint. NOT production wired. No service keys.
 * Both snapshots MUST come from a trusted server-side transactional /
 * revision-audited persistence workflow. Browser-supplied data is NOT proof.
 *
 * This module checks business conditions and invokes an injected INTERNAL
 * idempotent grant callback after a verified save. SQL enforces uniqueness.
 */
export const PILOT_EVENT = Object.freeze({
  eventType: 'moving.first_box_saved.v1',
  toolId: 'umzugskisten-inventar',
  xp: 20,
  kp: 10,
  competency: 'organisation'
});
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const uuid = value => typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const validRevision = value => Number.isSafeInteger(value) && value >= 1;

/** Return a boolean only. Never return or log private box contents. */
export function isQualifiedFirstBoxTransition(before, after, receipt) {
  if (!object(before) || !object(after) || !object(receipt)) return false;
  if (receipt.toolId !== PILOT_EVENT.toolId ||
      receipt.persistenceConfirmed !== true ||
      receipt.isMigration !== false ||
      !validRevision(receipt.previousRevision) ||
      receipt.persistedRevision !== receipt.previousRevision + 1) return false;
  if (!Array.isArray(before.boxes) || before.boxes.length !== 0 ||
      !Array.isArray(after.boxes) || after.boxes.length !== 1 ||
      !Array.isArray(before.locations) || !Array.isArray(after.locations) ||
      before.locations.length === 0 ||
      JSON.stringify(before.locations) !== JSON.stringify(after.locations)) return false;
  const box = after.boxes[0];
  if (!object(box) || !Number.isSafeInteger(box.id) || box.id <= 0 ||
      !Number.isSafeInteger(box.locId) ||
      typeof box.name !== 'string' || box.name.trim().length === 0 ||
      box.name.trim().length > 150) return false;
  const match = after.locations.filter(location =>
    object(location) && Number(location.id) === box.locId &&
    typeof location.name === 'string' && location.name.trim().length > 0);
  if (match.length !== 1) return false;
  // Minimal plausible database transition only, not proof of a physical move.
  // Only meaningful when a trusted caller has verified both snapshots.
  return true;
}

/**
 * The context object MUST be constructed by trusted server code, NEVER
 * directly from a client JSON body. The grant callback is internal-only.
 */
export async function grantAfterVerifiedMovingSave(context, grantVerifiedFirstBox) {
  if (!object(context) || !uuid(context.authenticatedUserId))
    return Object.freeze({ status: 'ineligible' });
  if (typeof grantVerifiedFirstBox !== 'function')
    throw new TypeError('Internal trusted grant callback required');
  if (!isQualifiedFirstBoxTransition(context.before, context.after, context.receipt))
    return Object.freeze({ status: 'ineligible' });
  // Database additionally enforces UNIQUE(user_id,event_type).
  // No private box fields or user-supplied XP amounts forwarded.
  const result = await grantVerifiedFirstBox({
    authenticatedUserId: context.authenticatedUserId,
    eventType: PILOT_EVENT.eventType
  });
  if (!object(result) || typeof result.granted !== 'boolean')
    throw new Error('Internal grant returned invalid receipt');
  return Object.freeze({ status: result.granted ? 'granted' : 'already-granted' });
}
