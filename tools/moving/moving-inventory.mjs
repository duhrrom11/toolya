const normalize = value => String(value ?? '').toLowerCase().normalize('NFD')
    .replace(/\p{M}/gu, '').replaceAll('ß', 'ss').trim();
const tokens = value => value.match(/[\p{L}\p{N}]+/gu) ?? [];

function withinOneEdit(first, second) {
    if (Math.abs(first.length - second.length) > 1) return false;
    const i = [...first].findIndex((letter, index) => letter !== second[index]);
    if (i === -1) return second.length - first.length <= 1;
    if (first.length < second.length) return first.slice(i) === second.slice(i + 1);
    if (first.length > second.length) return first.slice(i + 1) === second.slice(i);
    const suffix = first.slice(i + 1) === second.slice(i + 1);
    const swapped = first[i] === second[i + 1] && first[i + 1] === second[i] &&
        first.slice(i + 2) === second.slice(i + 2);
    return suffix || swapped;
}

export function searchMovingBoxes(data, query) {
    const needle = normalize(query);
    const hits = new Map();
    if (!needle) return hits;
    const exactCodes = data.boxes.filter(box => String(box.id) === needle || normalize(box.barcode) === needle || normalize(box.boxNumber) === needle);
    if (exactCodes.length) {
        for (const box of exactCodes) hits.set(box.id, { score: 0 });
        return hits;
    }
    const locations = new Map(data.locations.map(location => [location.id, location.name]));
    const words = tokens(needle);
    for (const box of data.boxes) {
        const fields = [box.name, box.desc, ...(box.subItems ?? []).map(item => item.name),
            box.tag, box.barcode, box.placement, box.piece?.name, locations.get(box.locId)];
        const candidates = fields.map(normalize);
        const i = candidates.findIndex(field => field.includes(needle));
        if (i >= 0) {
            hits.set(box.id, { score: 1, match: fields[i] });
        } else if (words.length && words.some(word => /\p{L}/u.test(word) && word.length >= 4)) {
            const haystack = candidates.flatMap(tokens);
            if (words.every(word => haystack.some(token => token.includes(word) ||
                (word.length >= 4 && /\p{L}/u.test(word) && withinOneEdit(word, token))))) {
                const match = fields.find((field, index) => tokens(candidates[index])
                    .some(token => words.some(word => word.length >= 4 && withinOneEdit(word, token))));
                hits.set(box.id, { score: 2, match });
            }
        }
    }
    return hits;
}

export function planBoxNames(boxes, prefix, quantity) {
    const cleaned = prefix.trim();
    if (!cleaned || cleaned.length > 70 || !Number.isInteger(quantity) || quantity < 2 || quantity > 50) return [];
    const used = new Set(boxes.map(box => normalize(box.name)));
    const names = [];
    for (let number = 1; names.length < quantity; number++) {
        const name = cleaned + ' ' + String(number).padStart(2, '0');
        if (!used.has(normalize(name))) names.push(name);
    }
    return names;
}

export function parseMovingItems(value) {
    return value.split(/[\n,;•]+/)
        .map(item => item.replace(/^\s*(?:[-*]\s+|\d+[.)]\s+)/, '').trim()).filter(Boolean);
}

export async function resizeMovingPhoto(file) {
    if (file.size > 30 * 1024 * 1024) throw Error('Photo too large');
    const image = await createImageBitmap(file, { imageOrientation: 'from-image' });
    try {
        const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d', { alpha: false });
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.82);
    } finally {
        image.close();
    }
}

export function moveInventoryBoxes(data, boxIds, locationId) {
    if (!data.locations.some(location => location.id === locationId)) return false;
    const selected = new Set(boxIds);
    const boxes = data.boxes.filter(box => selected.has(box.id));
    if (!boxes.length || boxes.length !== selected.size) return false;
    for (const box of boxes) {
        box.locId = locationId;
        delete box.placement;
    }
    return true;
}

export function repackInventoryItems(data, sourceId, targetId, indices, includeDescription) {
    if (sourceId === targetId) return false;
    const source = data.boxes.find(box => box.id === sourceId);
    const target = data.boxes.find(box => box.id === targetId);
    if (!source || !target) return false;
    const items = source.subItems ?? [];
    const selection = new Set(indices);
    if ([...selection].some(index => !Number.isInteger(index) || index < 0 || index >= items.length)) return false;
    if (!selection.size && !(includeDescription && source.desc)) return false;
    target.subItems = [...(target.subItems ?? []), ...items.filter((_, index) => selection.has(index))];
    source.subItems = items.filter((_, index) => !selection.has(index));
    if (includeDescription && source.desc) {
        target.desc = [target.desc, source.desc].filter(Boolean).join(' · ');
        source.desc = '';
    }
    return true;
}

export function movingPieceGroups(boxes, assignments, liveStatus) {
    const groups = new Map();
    const byId = new Map(boxes.map(box => [box.id, box]));
    for (const assignment of assignments) {
        const piece = byId.get(assignment.boxId)?.piece;
        if (!piece || typeof piece.name !== 'string' || !Number.isInteger(piece.total) ||
            piece.total < 2 || piece.total > 99) continue;
        const key = piece.name.trim().toLowerCase();
        if (!groups.has(key)) groups.set(key, { name: piece.name, total: piece.total, arrived: new Set() });
        if (['arrived', 'unpacked'].includes(liveStatus(assignment))) groups.get(key).arrived.add(piece.part);
    }
    return [...groups.values()].map(group => ({
        name: group.name, total: group.total,
        missing: Array.from({ length: group.total }, (_, index) => index + 1).filter(index => !group.arrived.has(index))
    }));
}
