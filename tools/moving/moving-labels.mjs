const roomColors = [[26, 103, 144], [106, 72, 147], [130, 71, 42], [157, 49, 91], [43, 91, 115]];

export function movingRoomMarker(id) {
    if (typeof id !== 'string' || !id) return null;
    const hash = [...id].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 0);
    return { symbol: String.fromCharCode(65 + (hash % 26)), color: roomColors[hash % roomColors.length] };
}

export const labelLayouts = { '2x4': [2, 4], '2x5': [2, 5], '3x6': [3, 6] };

export function labelSlots(count, layout, skip) {
    const [columns, rows] = labelLayouts[layout] ?? labelLayouts['2x4'];
    const capacity = columns * rows;
    const firstSlot = Math.max(0, Math.min(capacity - 1, Math.trunc(skip) || 0));
    return Array.from({ length: count }, (_, index) => {
        const slot = firstSlot + index;
        return { page: Math.floor(slot / capacity), col: slot % columns,
            row: Math.floor(slot % capacity / columns), columns, rows };
    });
}

function fit(doc, value, width, limit) {
    const lines = doc.splitTextToSize(String(value ?? '').replace(/[\r\n]+/g, ' '), width);
    return lines.length <= limit ? lines : [...lines.slice(0, limit - 1),
        doc.splitTextToSize(lines[limit - 1], width - 4)[0] + '…'];
}

export async function printMovingLabels(doc, boxes, options) {
    const { english, layout, skip, includePrivate, qr, link, roomFor, amount, label, markerFor } = options;
    const t = (de, en) => english ? en : de;
    const slots = labelSlots(boxes.length, layout, skip);
    let page = 0;
    for (const [index, box] of boxes.entries()) {
        const slot = slots[index];
        if (slot.page !== page) {
            doc.addPage();
            page = slot.page;
        }
        const width = 190 / slot.columns, height = 277 / slot.rows;
        const x = 10 + slot.col * width, y = 10 + slot.row * height;
        const qrSize = Math.min(29, width * 0.37, height - 9);
        const png = await qr(link(box));
        if (!png) throw Error('QR generation failed');
        const marker = markerFor(box);
        doc.setDrawColor(...(marker?.color ?? [170]));
        doc.rect(x + 1, y + 1, width - 2, height - 2);
        doc.addImage(png, 'PNG', x + 3, y + 4, qrSize, qrSize);
        const left = x + qrSize + 7, textWidth = width - qrSize - 11;
        let top = y + 7;
        const line = (text, lines, points) => {
            doc.setFontSize(points);
            const wrapped = fit(doc, text, textWidth, lines);
            doc.text(wrapped, left, top);
            top += 3.5 * wrapped.length + 0.5;
        };
        doc.setFont('helvetica', 'bold');
        line(box.name, 2, 11);
        doc.setFont('helvetica', 'normal');
        line(box.boxNumber || box.id, 1, 8);
        line(t('Zielraum: ', 'Destination room: ') + (marker ? '[' + marker.symbol + '] ' : '') + roomFor(box), 2, 9);
        line(t('Kennzeichnung: ', 'Label: ') + label(box.tag), 1, 8);
        if (includePrivate) {
            line(t('Inhalt: ', 'Contents: ') + (box.desc || '–'), 2, 8);
            line(t('Wert: ', 'Value: ') + amount(box.value) + ' EUR', 1, 8);
        }
    }
}

export function printHandover(doc, boxes, roomFor, english) {
    const heading = english ? 'Toolya moving box handover' : 'Toolya Übergabeliste';
    for (const [index, box] of boxes.entries()) {
        if (index && index % 24 === 0) doc.addPage();
        const row = index % 24;
        if (!row) {
            doc.setFontSize(16);
            doc.text(heading, 14, 15);
        }
        const y = 25 + row * 11;
        doc.rect(14, y - 4, 4, 4);
        doc.setFontSize(9);
        doc.text(fit(doc, (box.boxNumber || box.id) + ' · ' + box.name, 100, 2), 22, y);
        doc.text(fit(doc, roomFor(box), 65, 2), 130, y);
    }
}

export function printRoomSigns(doc, rooms, directions) {
    for (const [index, room] of rooms.entries()) {
        if (index) doc.addPage();
        const marker = movingRoomMarker(room.id);
        doc.setFillColor(...(marker?.color ?? [25, 120, 137]));
        doc.rect(15, 35, 180, 5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(42);
        doc.text(fit(doc, (marker ? '[' + marker.symbol + '] ' : '') + room.name, 170, 4), 20, 78);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(17);
        doc.text(fit(doc, directions(room), 170, 6), 20, 175);
    }
}
