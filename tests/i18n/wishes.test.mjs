import test from 'node:test';import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {WISHES_COPY,wishesText} from '../../shared/toolya/i18n/wishes-copy.mjs';
import {applyWishLocale} from '../../shared/toolya/i18n/wishes-dom.mjs';
test('Wishlist translation changes only author-owned controls and restores implicit option keys',()=>{
 const {document}=parseHTML('<html><body><h1>Meine Merkliste</h1><button onclick="saveGift()">Abbrechen</button><select><option>Geplant</option></select><input placeholder="Name oder Organisation" value="Private value"><div class="profile-card"><h2>Geplant</h2></div></body></html>');
 const button=document.querySelector('button'),option=document.querySelector('option'),input=document.querySelector('input');
 applyWishLocale(document,'en');
 assert.equal(document.querySelector('h1').textContent,'My bookmarks');
 assert.equal(button.textContent,'Cancel');
 assert.equal(button.getAttribute('onclick'),'saveGift()');
 assert.equal(option.textContent,'Planned');
 assert.equal(option.getAttribute('value'),'Geplant');
 assert.equal(input.value,'Private value');
 assert.equal(document.querySelector('.profile-card h2').textContent,'Geplant');
 applyWishLocale(document,'de');
 assert.equal(option.textContent,'Geplant');
 assert.ok(!option.hasAttribute('value'));
 assert.equal(input.getAttribute('placeholder'),'Name oder Organisation');
});
test('wishlist catalogue includes public, planning, social and account UI without free-text translation',()=>{
 assert.ok(Object.keys(WISHES_COPY).length>=160);
 assert.equal(wishesText('Geschenk speichern','en'),'Save gift');
 assert.equal(wishesText('Private note from a user','en'),'Private note from a user');
});