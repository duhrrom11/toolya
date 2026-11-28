const prefix = 'toolya-moving-pending-box-v1:';
const limit = 24 * 60 * 60 * 1000;

export function readBoxDraft(storage, owner, now = Date.now()) {
    if (!owner) return null;
    try {
        const draft = JSON.parse(storage.getItem(prefix + owner));
        if (!draft || typeof draft.requestId !== 'string' || !Number.isFinite(draft.savedAt) ||
            now - draft.savedAt > limit || !draft.values || typeof draft.values !== 'object') return null;
        return draft;
    } catch {
        return null;
    }
}

export function writeBoxDraft(storage, owner, draft) {
    if (!owner) return false;
    try {
        storage.setItem(prefix + owner, JSON.stringify(draft));
        return true;
    } catch {
        return false;
    }
}

export function clearBoxDraft(storage, owner) {
    if (!owner) return;
    try { storage.removeItem(prefix + owner); } catch {}
}
