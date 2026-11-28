import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('publication choices are disclosed in the guarded dashboard forms',()=>{
 const publicJs=readFileSync('tools/wishes/public-amazon.mjs','utf8');
 const dashboard=readFileSync('tools/wishes/directory-dashboard.mjs','utf8');
 assert.doesNotMatch(publicJs,/functions\.invoke|amazon-wishlist-scrape/);
 assert.match(dashboard,/Diese Angaben werden öffentlich sichtbar/);
 assert.match(dashboard,/Deine Toolya-Kontodaten bleiben privat/);
 assert.match(dashboard,/guardedWishlistWrite/);
});
