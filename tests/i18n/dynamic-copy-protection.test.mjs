import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {applyWishLocale} from '../../shared/toolya/i18n/wishes-dom.mjs';
import {wishesText} from '../../shared/toolya/i18n/wishes-copy.mjs';
import {applyEstateLocale} from '../../shared/toolya/i18n/estate-dom.mjs';
import {applyDashboardPageLocale} from '../../shared/toolya/i18n/dashboard-dom.mjs';
import {adminText} from '../../shared/toolya/i18n/admin-copy.mjs';
test('discovery translates owned badges and result counts but not collection titles',()=>{
 const {document}=parseHTML('<html><body><h2 data-user-content>Bearbeiten</h2><span data-wish-owned-copy>❤️ 2 Likes · 👥 3 Profil-Follower</span></body></html>');
 applyWishLocale(document,'en');assert.equal(document.querySelector('h2').textContent,'Bearbeiten');assert.equal(document.querySelector('span').textContent,'❤️ 2 likes · 👥 3 profile followers');
 applyWishLocale(document,'de');assert.equal(document.querySelector('span').textContent,'❤️ 2 Likes · 👥 3 Profil-Follower');
 const de='4 öffentliche Sammlungen gefunden · aus maximal 60 zuletzt erstellten Sammlungen.';assert.equal(wishesText(wishesText(de,'en'),'de'),de);
});
test('estate document summary translates but personal print-choice name does not',()=>{
 const {document}=parseHTML('<html><body><article class="entry"><h3>Unterlage</h3><summary data-estate-copy>Unterlage ansehen</summary></article><label data-user-content><input type="checkbox" value="private-id">Löschen</label></body></html>');
 applyEstateLocale(document,'en');assert.equal(document.querySelector('h3').textContent,'Unterlage');assert.equal(document.querySelector('summary').textContent,'View document');assert.equal(document.querySelector('label').textContent,'Löschen');assert.equal(document.querySelector('input').value,'private-id');
 applyEstateLocale(document,'de');assert.equal(document.querySelector('summary').textContent,'Unterlage ansehen');
});
test('dashboard explicit private markers preserve values and admin partial import keeps diagnostic suffix',()=>{
 const {document}=parseHTML('<html><body><p data-user-content>Haushaltsbuch</p><p>Haushaltsbuch</p></body></html>');applyDashboardPageLocale(document,'en');assert.equal(document.querySelector('[data-user-content]').textContent,'Haushaltsbuch');assert.equal(document.querySelector('p:not([data-user-content])').textContent,'Household budget');
 assert.equal(adminText('12 bereits gespeichert. Rest nicht eingelesen: private detail','en'),'12 already saved. Remaining entries not imported: private detail');
});
