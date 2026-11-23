/**
 * Toolya Rewards V1 — browser-to-internal-endpoint contract (draft).
 * Pure validation only; does NOT award XP or attest a trusted save.
 * Existing moving storeBoxData(locId,name,desc,value,tag,barcode,expiry,lentTo,subItems,photo)
 * is preserved by the conversion function.
 */
export const MAX_BODY_BYTES = 4_000_000;
export const MAX_PHOTO_BYTES = 3_000_000;
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const size = x => new TextEncoder().encode(x).byteLength;
const text = (x, max) => typeof x === 'string' && x.length <= max;
const positiveInt = n => Number.isSafeInteger(n) && n > 0;
const allowedFields = ['name','desc','value','tag','barcode','expiry','lentTo','subItems','photo'];

export function checkMovingBoxPayload(payload) {
  if (!object(payload) || Object.keys(payload).sort().join(',') !== allowedFields.slice().sort().join(','))
    return false;
  if (!text(payload.name,150) || !payload.name.trim() ||
      !text(payload.desc,20000) || !text(payload.tag,100) ||
      !text(payload.barcode,300) || !text(payload.expiry,20) ||
      !text(payload.lentTo,300) || !text(payload.photo,MAX_PHOTO_BYTES)) return false;
  if (size(payload.name) > 600 || !Number.isFinite(payload.value) ||
      payload.value < 0 || payload.value > 100000000 ||
      !Array.isArray(payload.subItems) || payload.subItems.length > 1000) return false;
  if (payload.expiry && !/^\d{4}-\d{2}-\d{2}$/.test(payload.expiry)) return false;
  if (payload.photo && (!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(payload.photo) ||
      size(payload.photo) > MAX_PHOTO_BYTES)) return false;
  return payload.subItems.every(item => object(item) &&
    Object.keys(item).sort().join(',')==='name,value' &&
    text(item.name,300) && item.name.trim() &&
    typeof item.value==='number' && Number.isFinite(item.value) &&
    item.value>=0 && item.value<=100000000);
}

export function checkFirstBoxRequest(request) {
  if (!object(request) || Object.keys(request).sort().join(',') !== 'box,expectedRevision,locationId' ||
      !positiveInt(request.locationId) || !positiveInt(request.expectedRevision) ||
      !checkMovingBoxPayload(request.box)) return false;
  return size(JSON.stringify(request)) <= MAX_BODY_BYTES;
}

/**
 * Conversion from the existing full saveBox() parameters.
 * Returns only necessary fields; authenticatedUserId and XP are NEVER client inputs.
 */
export function makeFirstBoxRequest(expectedRevision, locId, name, desc, value, tag, barcode, expiry, lentTo, subItems, photo) {
  const request = {
    expectedRevision,
    locationId: Number(locId),
    box: {name,desc,value,tag,barcode,expiry,lentTo,subItems,photo}
  };
  if (!checkFirstBoxRequest(request)) throw new TypeError('Invalid first-box request');
  return request;
}
