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
