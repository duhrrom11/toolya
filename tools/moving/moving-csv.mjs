const headers = {
    'box number': 'number', kistennummer: 'number', name: 'name',
    'destination room': 'room', zielraum: 'room', contents: 'contents', inhalt: 'contents',
    note: 'note', hinweis: 'note'
};
const key = value => value.trim().toLowerCase();
function readRows(text, separator) {
    const rows = [];
    let row = [], value = '', quoted = false, closed = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (quoted) {
            if (char === '"' && text[i + 1] === '"') { value += '"'; i++; }
            else if (char === '"') { quoted = false; closed = true; }
            else value += char;
        } else if (char === '"' && !value && !closed) {
            quoted = true;
        } else if (char === separator || char === '\n' || char === '\r') {
            row.push(value);
            value = '';
            closed = false;
            if (char !== separator) {
                rows.push(row);
                row = [];
                if (char === '\r' && text[i + 1] === '\n') i++;
            }
        } else if (char === '"' || closed) {
            throw Error('format');
        } else {
            value += char;
        }
        if (rows.length > 1001 || row.length > 40) throw Error('size');
    }
    if (quoted) throw Error('format');
    if (row.length || value || closed) rows.push([...row, value]);
    return rows;
}

export function planMovingCsv(text, { boxes, locations }) {
    if (text.length > 1_000_000) throw Error('size');
    text = text.replace(/^\uFEFF/, '');
    const separator = text.split(/\r?\n/, 1)[0].includes(';') ? ';' : ',';
    const rows = readRows(text, separator);
    const columns = (rows.shift() ?? []).map(name => headers[key(name)] ?? '');
    if (!columns.includes('name') || !columns.includes('room') ||
        new Set(columns.filter(Boolean)).size !== columns.filter(Boolean).length) throw Error('headers');
    const knownNames = new Set(boxes.map(box => key(box.name ?? '')));
    const knownNumbers = new Set(boxes.map(box => key(box.boxNumber ?? '')));
    const knownLocations = new Map(locations.map(location => [key(location.name ?? ''), location.id]));
    return rows.flatMap((cells, index) => {
        if (!cells.some(cell => cell.trim())) return [];
        const values = Object.fromEntries(columns.map((column, i) => [column, (cells[i] ?? '').trim()]));
        const { name = '', room = '', number = '', contents = '', note = '' } = values;
        const displayName = number ? name + ' ' + number : name;
        let issue = '';
        if (cells.length !== columns.length) issue = 'columns';
        else if (!name || !room) issue = 'missing';
        else if (displayName.length > 120 || room.length > 80 || contents.length > 2000 ||
            note.length > 300 || number.length > 32) issue = 'length';
        else if (knownNames.has(key(displayName)) || (number && knownNumbers.has(key(number)))) issue = 'duplicate';
        if (!issue) {
            knownNames.add(key(displayName));
            if (number) knownNumbers.add(key(number));
        }
        return [{ row: index + 2, name: displayName, room, number, contents, note,
            newLocation: !knownLocations.has(key(room)), issue }];
    });
}

export function addMovingCsvRows(data, rows, timestamp = Date.now()) {
    let id = timestamp;
    const occupied = new Set([...data.locations, ...data.boxes].map(item => item.id));
    function nextId() {
        while (occupied.has(id)) id++;
        return id++;
    }
    const locationIds = new Map(data.locations.map(location => [key(location.name), location.id]));
    for (const row of rows) {
        if (row.issue) continue;
        const locationKey = key(row.room);
        if (!locationIds.has(locationKey)) {
            const locId = nextId();
            data.locations.push({ id: locId, name: row.room, icon: '📍' });
            locationIds.set(locationKey, locId);
        }
        data.boxes.push({ id: nextId(), locId: locationIds.get(locationKey), name: row.name,
            boxNumber: row.number, desc: [row.contents, row.note].filter(Boolean).join(' · '),
            value: 0, tag: ['fragile', 'zerbrechlich'].includes(key(row.note)) ? 'Zerbrechlich' : 'Standard',
            barcode: '', expiry: '', lentTo: '', subItems: [], photo: '' });
    }
}
