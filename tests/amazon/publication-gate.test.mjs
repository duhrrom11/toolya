import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('public profiles explicitly disclose publication and use no scraper',()=>{
 const js=readFileSync('tools/wishes/public-amazon.mjs','utf8'),html=readFileSync('tools/wishes/public.html','utf8');
 assert.doesNotMatch(js,/functions\.invoke|amazon-wishlist-scrape/);
 assert.match(html,/Alle Angaben sind öffentlich sichtbar/);
 assert.doesNotMatch(html,/type="checkbox"/);
 assert.match(js,/guardedWishlistWrite/);
});
