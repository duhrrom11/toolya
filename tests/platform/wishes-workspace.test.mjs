import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
test('wishlist entry redirects to public Amazon-only experience without legacy controls',()=>{
 const entry=readFileSync('tools/wishes/index.html','utf8');
 const page=readFileSync('tools/wishes/public.html','utf8');
 let destination;const location={href:'https://toolya.app/tools/wishes/index.html?profile=fixture#discover',search:'?profile=fixture',hash:'#discover',replace(url){destination=url.href}};
 const redirect=entry.match(/<script>([\s\S]*?)<\/script>/);assert.ok(redirect,'redirect script missing');runInNewContext(redirect[1],{location,URL});
 assert.equal(destination,'https://toolya.app/tools/wishes/public.html?profile=fixture#discover');
 assert.match(page,/shared\/toolya\/platform\.mjs/);
 assert.doesNotMatch(entry,/id="homeNewWish"|id="homeNewList"|id="editor"/);
 for(const id of ['discover','profile','listFields','search','countryFilter','occasionFilter'])assert.match(page,new RegExp('id="'+id+'"'));
 assert.match(page,/public-amazon\.mjs/);
});
