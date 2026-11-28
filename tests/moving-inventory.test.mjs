import test from 'node:test';
import assert from 'node:assert/strict';
import { searchMovingBoxes, planBoxNames, parseMovingItems } from '../tools/moving/moving-inventory.mjs';

const inventory = {
    locations: [{ id: 1, name: 'Küche' }, { id: 2, name: 'Garage' }],
    boxes: [
        { id: 11, locId: 1, name: 'Küche 01', barcode: '0007', subItems: [{ name: 'Wasserkocher' }] },
        { id: 12, locId: 2, name: 'Karton 0007', desc: 'Álbum, Wasserflasche' },
        { id: 13, locId: 2, name: 'Kitchen supplies', subItems: [{ name: 'Tea towels' }] }
    ]
};

test('moving search handles typos and accents while keeping exact identifiers authoritative', () => {
    assert.deepEqual([...searchMovingBoxes(inventory, '0007').keys()], [11]);
    assert.deepEqual([...searchMovingBoxes(inventory, '12').keys()], [12]);
    assert.equal(searchMovingBoxes(inventory, 'Waserkocher').get(11).match, 'Wasserkocher');
    assert.equal(searchMovingBoxes(inventory, 'Wasesrkocher').get(11).score, 2);
    assert.equal(searchMovingBoxes(inventory, 'album').get(12).score, 1);
    assert.equal(searchMovingBoxes(inventory, 'kuche').get(11).score, 1);
    assert.equal(searchMovingBoxes(inventory, 'tea towles').get(13).match, 'Tea towels');
    assert.equal(searchMovingBoxes(inventory, 'unknown item').size, 0);
});

test('batch preview skips collisions and splits typed or dictated items', () => {
    assert.deepEqual(planBoxNames(inventory.boxes, 'Küche', 3), ['Küche 02', 'Küche 03', 'Küche 04']);
    assert.deepEqual(planBoxNames(inventory.boxes, 'Küche', 51), []);
    assert.deepEqual(parseMovingItems('1. Tassen, Wörterbuch\n- Kabel • Tea towels'), ['Tassen', 'Wörterbuch', 'Kabel', 'Tea towels']);
});

test('CSV reads both template languages, retains leading zeros, and skips reported errors', async () => {
    const { planMovingCsv, addMovingCsvRows } = await import('../tools/moving/moving-csv.mjs');
    const rows = planMovingCsv(
        '\uFEFFBox number,Name,Destination room,Contents,Note\r\n' +
        '007,Kitchen,Kitchen,"cups, ""tea tools""",Fragile\r\n' +
        '007,Kitchen,Kitchen,Books,\r\n' +
        '008,Bathroom,,Towels,', inventory);
    assert.deepEqual(rows.map(row => row.issue), ['', 'duplicate', 'missing']);
    assert.equal(rows[0].contents, 'cups, "tea tools"');
    const data = structuredClone(inventory);
    addMovingCsvRows(data, rows, 11);
    assert.equal(data.boxes.at(-1).boxNumber, '007');
    assert.equal(data.boxes.at(-1).name, 'Kitchen 007');
    assert.equal(data.locations.at(-1).name, 'Kitchen');
    assert.equal(data.boxes.at(-1).tag, 'Zerbrechlich');
    assert.equal(planMovingCsv('Kistennummer;Name;Zielraum\n07;Küche;Küche', inventory)[0].newLocation, false);
});

test('A4 label slots skip consumed cells and wrap onto the next page', async () => {
    const { labelSlots } = await import('../tools/moving/moving-labels.mjs');
    assert.deepEqual(labelSlots(3, '2x4', 7).map(({ page, col, row }) => [page, col, row]),
        [[0, 1, 3], [1, 0, 0], [1, 1, 0]]);
    assert.equal(labelSlots(19, '3x6', 0).at(-1).page, 1);
});

test('helper QR codes resolve only for the active grant and a visible box', async () => {
    const { helperBoxFromCode } = await import('../tools/moving/moving-qr-reader.mjs');
    const origin = 'https://toolya.app';
    const boxes = [{ assignmentId: 'visible' }];
    const resolve = value => helperBoxFromCode(value, origin, 'grant', boxes);
    assert.equal(resolve('/tools/moving/helper/index.html#t=grant&a=visible'), 'visible');
    assert.equal(resolve('/tools/moving/helper/index.html#t=grant&a=hidden'), '');
    assert.equal(resolve('/tools/moving/helper/index.html#t=another&a=visible'), '');
    assert.equal(resolve('https://other.example/tools/moving/helper/index.html#t=grant&a=visible'), '');
});

test('physical placement and contents can change without replacing box identity', async () => {
    const { moveInventoryBoxes, repackInventoryItems } = await import('../tools/moving/moving-inventory.mjs');
    const data = structuredClone(inventory);
    data.boxes[0].placement = 'Flur';
    assert.equal(searchMovingBoxes(data, 'Flur').get(11).score, 1);
    assert.equal(moveInventoryBoxes(data, [11, 13], 2), true);
    assert.equal(data.boxes[0].locId, 2);
    assert.equal(data.boxes[0].placement, undefined);
    assert.equal(repackInventoryItems(data, 11, 13, [0], false), true);
    assert.deepEqual(data.boxes[0].subItems, []);
    assert.equal(data.boxes[2].subItems.at(-1).name, 'Wasserkocher');
    assert.deepEqual(data.boxes.map(box => box.id), [11, 12, 13]);
});

test('part groups report missing parts from the current transport status', async () => {
    const { movingPieceGroups } = await import('../tools/moving/moving-inventory.mjs');
    const boxes = [
        { id: 1, piece: { name: 'Desk', part: 1, total: 3 } },
        { id: 2, piece: { name: 'Desk', part: 2, total: 3 } }
    ];
    const assignments = [{ boxId: 1, status: 'arrived' }, { boxId: 2, status: 'loaded' }];
    assert.deepEqual(movingPieceGroups(boxes, assignments, item => item.status), [{ name: 'Desk', total: 3, missing: [2, 3] }]);
});

test('split quantities preserve box identity, accessory links and total item value', async () => {
    const { repackInventoryItems } = await import('../tools/moving/moving-inventory.mjs');
    const data = { boxes: [{ id: 1, subItems: [{ name: 'Screws', quantity: 5, value: 2, relatedBoxId: 3 }] }, { id: 2 }] };
    const before = structuredClone(data);
    assert.equal(repackInventoryItems(data, 1, 2, [0], false, new Map([[0, 6]])), false);
    assert.deepEqual(data, before);
    assert.equal(repackInventoryItems(data, 1, 2, [0], false, new Map([[0, 2]])), true);
    assert.deepEqual(data.boxes[0].subItems, [{ name: 'Screws', quantity: 3, value: 1.2, relatedBoxId: 3 }]);
    assert.deepEqual(data.boxes[1].subItems, [{ name: 'Screws', quantity: 2, value: 0.8, relatedBoxId: 3 }]);
});

test('pending box drafts are owner-bound and expire after a day', async () => {
    const { readBoxDraft, writeBoxDraft, clearBoxDraft } = await import('../tools/moving/moving-draft.mjs');
    const map = new Map();
    const storage = { setItem: (key, value) => map.set(key, value), getItem: key => map.get(key), removeItem: key => map.delete(key) };
    const draft = { requestId: 'request-id', savedAt: 100, values: { boxName: 'Private box' } };
    assert.equal(writeBoxDraft(storage, 'first', draft), true);
    assert.deepEqual(readBoxDraft(storage, 'first', 120), draft);
    assert.equal(readBoxDraft(storage, 'other', 120), null);
    assert.equal(readBoxDraft(storage, 'first', 86_400_101), null);
    clearBoxDraft(storage, 'first');
    assert.equal(readBoxDraft(storage, 'first', 120), null);
});
