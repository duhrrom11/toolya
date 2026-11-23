/**
 * OPTIONAL moving UI bridge draft. NOT imported by production Toolya.
 * The existing tool's current saveBox/storeBoxData flow remains unchanged.
 * A server save bypasses the cloud-controller's cached revision; reload
 * the controller explicitly before rendering or attempting a second save.
 */
import { checkFirstBoxRequest } from './moving-box-contract.mjs';

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Inputs:
 *  controller: existing createMovingCloudController (snapshot/revision/load)
 *  request: strict {expectedRevision,locationId,box}
 *  submit: injected authenticated server call returning
 *          {saved:true,revision,boxId,reward:{granted:boolean,...}}
 *  verifySameAccount: callback reading current verified auth user (NOT caller ID)
 *  initialAccountId: authenticated identity obtained before the server call.
 *
 * Returns handled:false when this is not a first-box workflow; the tool can
 * then continue its existing saveData path. When handled:true the response
 * must be checked: NEVER blindly retry or fallback to the ordinary save on
 * an ambiguous error or post-commit fetch failure.
 */
export async function attemptFirstBoxWithRewards({
  controller, request, submit, verifySameAccount, initialAccountId
}) {
  if (!controller?.ready || typeof controller.snapshot !== 'function' ||
      typeof controller.load !== 'function' ||
      typeof verifySameAccount !== 'function' ||
      typeof submit !== 'function' ||
      typeof initialAccountId !== 'string' || !initialAccountId) {
    throw new TypeError('Missing verified controller/auth/service');
  }

  const original = controller.snapshot();
  if (!object(original) || !Array.isArray(original.boxes) ||
      !Array.isArray(original.locations) ||
      original.boxes.length !== 0 ||
      !Number.isSafeInteger(controller.revision) || controller.revision < 1) {
    return Object.freeze({ handled: false, status: 'not-a-first-box' });
  }
  if (!checkFirstBoxRequest(request) || request.expectedRevision !== controller.revision) {
    throw new TypeError('Invalid pilot request or stale controller revision');
  }
  if (!original.locations.some(loc => object(loc) &&
      Number(loc.id) === request.locationId && typeof loc.name === 'string' && !!loc.name.trim())) {
    throw new TypeError('Location missing from local cloud snapshot');
  }
  if (await verifySameAccount() !== initialAccountId) {
    throw new Error('Account changed before save');
  }

  let receipt;
  try {
    receipt = await submit(request);
  } catch {
    // The server may have committed before a response was lost. NEVER retry
    // blindly or perform a second save with the old cached revision.
    try { await controller.load(); }
    catch { controller.invalidate?.(); }
    return Object.freeze({ handled: true, status: 'uncertain' });
  }

  // A valid server receipt is NOT sufficient while our client cache is stale.
  if (!object(receipt) || receipt.saved !== true ||
      !Number.isSafeInteger(receipt.revision) ||
      receipt.revision !== request.expectedRevision + 1 ||
      !Number.isSafeInteger(receipt.boxId) || receipt.boxId <= 0 ||
      !object(receipt.reward) || typeof receipt.reward.granted !== 'boolean') {
    try { await controller.load(); }
    catch { controller.invalidate?.(); }
    return Object.freeze({ handled: true, status: 'uncertain' });
  }

  // Explicit post-save reload so future saveData() uses the new revision.
  try {
    await controller.load();
    if (await verifySameAccount() !== initialAccountId ||
        controller.revision !== receipt.revision ||
        !controller.snapshot().boxes.some(box => object(box) && box.id === receipt.boxId)) {
      controller.invalidate?.();
      return Object.freeze({ handled: true, status: 'uncertain' });
    }
  } catch {
    controller.invalidate?.();
    return Object.freeze({ handled: true, status: 'uncertain' });
  }
  return Object.freeze({
    handled: true,
    status: 'saved',
    rewardGranted: receipt.reward.granted
  });
}
