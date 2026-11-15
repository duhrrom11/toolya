import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('wishlist entry redirects to public Amazon-only experience without legacy controls',()=>{
 const entry=readFileSync('tools/wishes/index.html','utf8');
 const page=readFileSync('tools/wishes/public.html','utf8');
 assert.match(entry,/location\.replace\(new URL\('\.\/public\.html'/);
 assert.match(entry,/shared\/toolya\/platform\.mjs/);
 assert.doesNotMatch(entry,/id="homeNewWish"|id="homeNewList"|id="editor"/);
 for(const id of ['discover','profile','publish','amazonUrl','tickerTrack','search'])assert.match(page,new RegExp('id="'+id+'"'));
 assert.match(page,/public-amazon\.mjs/);
});
