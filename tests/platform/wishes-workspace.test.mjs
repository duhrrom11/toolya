import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
test('wishlist groups existing controls into four areas without losing IDs or auth visibility',async()=>{
 const {document,window}=parseHTML(readFileSync('tools/wishes/index.html','utf8'));
 const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
 Object.assign(globalThis,{document,location:new URL('https://toolya.app/tools/wishes/'),history:{replaceState(){}},MutationObserver:class{observe(){}},addEventListener(){}});
 const {showWishlistArea}=await import('../../tools/wishes/workspace.mjs');
 assert.equal(document.querySelectorAll('.wishes-navigation a').length,4);
 assert.equal(document.querySelectorAll('.wishlist-hub-nav,.wishlist-welcome').length,0);
 assert.deepEqual([...document.querySelectorAll('[id]')].map(e=>e.id).sort(),ids.sort());
 assert.equal(document.querySelector('#handle').closest('[data-wishes-area]').dataset.wishesArea,'account');
 assert.equal(document.querySelector('#backupFile').closest('[data-wishes-area]').dataset.wishesArea,'account');
 assert.equal(document.querySelector('#url').closest('[data-wishes-area]').dataset.wishesArea,'lists');
 assert.equal(document.querySelector('#editor').hidden,true);
 for(const area of ['lists','discover','gifts','account']){showWishlistArea(area,false);assert.equal([...document.querySelectorAll('[data-wishes-area]')].filter(e=>!e.hidden).length,1);assert.equal(document.querySelector('.wishes-navigation [aria-current]').dataset.area,area)}
 for(const a of document.querySelectorAll('.wishes-gift-links a'))assert.match(a.getAttribute('href'),/^\.\/.*\.html$/);
});
