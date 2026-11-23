// Pure, browser-safe primitives for new Toolya tool prototypes.
// No storage, timers, network calls or application credentials.
export function counterStep(current, delta, min = 0, max = 9999) {
  if (![current, delta, min, max].every(Number.isSafeInteger) || min > max ||
      current < min || current > max || ![-1, 0, 1].includes(delta)) {
    throw new RangeError('Invalid counter state or step.');
  }
  return Math.min(max, Math.max(min, current + delta));
}

export function percentageOf(part, total, digits = 1) {
  if (![part, total].every(Number.isFinite) || part < 0 || total <= 0 ||
      !Number.isInteger(digits) || digits < 0 || digits > 2) {
    throw new RangeError('Percentage needs nonnegative part and positive total.');
  }
  const result = (part / total) * 100;
  if (!Number.isFinite(result)) throw new RangeError('Percentage overflow.');
  return Number(result.toFixed(digits));
}

function assertChecklist(items) {
  if (!Array.isArray(items) || items.some(item => typeof item !== 'string' ||
      item.length > 80 || !item.trim()) || items.length > 50) {
    throw new TypeError('Invalid checklist state.');
  }
}

export function addChecklistItem(items, rawLabel) {
  assertChecklist(items);
  if (typeof rawLabel !== 'string') throw new TypeError('Text is required.');
  const label = rawLabel.trim().replace(/\s+/g, ' ');
  if (!label || label.length > 80) throw new RangeError('Use 1 to 80 characters.');
  if (items.length >= 50) throw new RangeError('Checklist is full.');
  return [...items, label];
}

export function removeChecklistItem(items, index) {
  assertChecklist(items);
  if (!Number.isSafeInteger(index) || index < 0 || index >= items.length) {
    throw new RangeError('Invalid checklist index.');
  }
  return items.filter((_, i) => i !== index);
}
