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
