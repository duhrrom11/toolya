import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
const js=readFileSync('tools/wishes/public-amazon.mjs','utf8');
const html=readFileSync('tools/wishes/public.html','utf8');
test('owner controls require authenticated matching user and confirmed deletion',()=>{
 assert.match(js,/sessionUser\?\.id===list\.user_id/);
 assert.match(js,/window\.confirm\(/);
 assert.match(js,/\.delete\(\)\.eq\('id',list\.id\)\.eq\('user_id',sessionUser\.id\)/);
 assert.match(js,/Liste aktualisieren/);assert.match(js,/Liste löschen/);
 assert.match(js,/functions\.invoke\('amazon-wishlist-scrape'/);
 assert.match(html,/owner-actions/);
});
