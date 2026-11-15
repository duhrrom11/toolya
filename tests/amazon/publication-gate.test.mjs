import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('public wishlist creation is scraper-only',()=>{
 const js=readFileSync('tools/wishes/public-amazon.mjs','utf8');
 const html=readFileSync('tools/wishes/public.html','utf8');
 assert.match(js,/action:'create',amazon_url:url/);
 assert.doesNotMatch(js,/\.insert\(\{user_id:sessionUser\.id,amazon_url:url\}\)/);
 assert.match(js,/scrapeResult\?\.status!=='success'/);
 assert.match(html,/Private, leere oder nicht lesbare Listen werden nicht veröffentlicht/);
});