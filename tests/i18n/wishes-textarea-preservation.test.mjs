import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {applyWishLocale} from '../../shared/toolya/i18n/wishes-dom.mjs';

test('Wishes locale switch preserves textarea default and user content',()=>{
 const {document}=parseHTML('<html><body><textarea placeholder="Name oder Organisation">Geplant</textarea><div data-user-content><h2>Geplant</h2></div></body></html>');
 const textarea=document.querySelector('textarea');
 applyWishLocale(document,'en');
 assert.equal(textarea.textContent,'Geplant');
 assert.equal(textarea.getAttribute('placeholder'),'Name or organisation');
 assert.equal(document.querySelector('[data-user-content] h2').textContent,'Geplant');
 applyWishLocale(document,'de');
 assert.equal(textarea.textContent,'Geplant');
 assert.equal(textarea.getAttribute('placeholder'),'Name oder Organisation');
});
