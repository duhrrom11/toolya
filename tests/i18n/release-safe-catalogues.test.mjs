import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {WISHES_COPY,wishesText} from '../../shared/toolya/i18n/wishes-copy.mjs';
import {applyWishLocale} from '../../shared/toolya/i18n/wishes-dom.mjs';
import {ESTATE_COPY,estateText} from '../../shared/toolya/i18n/estate-copy.mjs';
import {ADMIN_COPY,adminText} from '../../shared/toolya/i18n/admin-copy.mjs';
import {dashboardText} from '../../shared/toolya/i18n/dashboard-copy.mjs';
import {translateToolDialog} from '../../shared/toolya/i18n/interface.mjs';

test('released exact English catalogues include reviewed additional UI copy',()=>{
 assert.equal(wishesText('Aktivitäten','en'),'Activities');
 assert.equal(wishesText('Neue Follower','en'),'New followers');
 assert.equal(wishesText('Amazon-Wunschliste nach Namen finden – ohne Link | Toolya','en'),
  'Find Amazon wish lists by name – no link needed | Toolya');
 assert.equal(estateText('Passwort für den privaten Schlüssel (mindestens 16 Zeichen)','en'),
  'Password for the private key (at least 16 characters)');
 assert.equal(adminText('Ausblenden','en'),'Hide');
 assert.equal(adminText('Wieder anzeigen','en'),'Show again');
 assert.equal(dashboardText('Zuletzt verwendet','en'),'Recently used');
 assert.equal(translateToolDialog('car','en','Backup erfolgreich importiert!'),
  'Backup imported successfully!');
 assert.equal(translateToolDialog('budget','en','Der QR-Code konnte nicht geladen werden. Bitte versuche es erneut.'),
  'The QR code could not be loaded. Please try again.');
 assert.ok(Object.keys(WISHES_COPY).length>=790,'source-exact wish catalogue may not shrink');
 assert.ok(Object.keys(ESTATE_COPY).length>=130,'estate display catalogue may not shrink');
 assert.ok(Object.keys(ADMIN_COPY).length>=80,'admin display catalogue may not shrink');
});

test('new catalogues reverse fixed labels but do not rewrite private data or identifiers',()=>{
 for(const [src,translated] of Object.entries({
  'Aktivitäten':'Activities','Neue Follower':'New followers',
  'Amazon-Wunschliste nach Namen finden – ohne Link | Toolya':
    'Find Amazon wish lists by name – no link needed | Toolya'})){
  assert.equal(wishesText(src,'en'),translated);
  assert.equal(wishesText(translated,'de'),src);
 }
 for(const [src,translated] of [
  ['Passwort für den privaten Schlüssel (mindestens 16 Zeichen)',
   'Password for the private key (at least 16 characters)'],
  ['Dein persönlicher Schlüssel','Your personal key']]){
   assert.equal(estateText(src,'en'),translated);
   assert.equal(estateText(translated,'de'),src);
 }
 for(const [src,translated] of [
  ['Ausblenden','Hide'],['Wieder anzeigen','Show again']]){
   assert.equal(adminText(src,'en'),translated);
   assert.equal(adminText(translated,'de'),src);
 }
 for(const unknown of ['__proto__','private@example.invalid',
  'Benutzername mit Sonderzeichen <Passwort> & 2040','synthetic-user-id-003']){
   assert.equal(wishesText(unknown,'en'),unknown);
   assert.equal(estateText(unknown,'en'),unknown);
   assert.equal(adminText(unknown,'en'),unknown);
   assert.equal(translateToolDialog('car','en',unknown),unknown);
 }
});

test('opted-in public wish controls switch safely without modifying free-form values',()=>{
 const {document}=parseHTML('<html><body><div class="profile-card"><p>Aktivitäten</p><input id="private" value="Aktivitäten"></div>'+
  '<a id="settings" data-wish-copy href="/settings">Wunschlisten-Anleitung</a>'+
  '<p data-wishes-copy id="editorial">Öffentliche Profile werden geladen …</p>'+
  '<textarea id="draft">Neue Follower</textarea></body></html>');
 const originalValue=document.querySelector('#private').value;
 applyWishLocale(document,'en');
 assert.equal(document.querySelector('#editorial').textContent,'Loading public profiles…');
 assert.equal(document.querySelector('#settings').textContent,'Wish-list guide');
 assert.equal(document.querySelector('.profile-card p').textContent,'Aktivitäten');
 assert.equal(document.querySelector('#private').value,originalValue);
 assert.equal(document.querySelector('#draft').textContent,'Neue Follower');
 applyWishLocale(document,'de');
 assert.equal(document.querySelector('#editorial').textContent,'Öffentliche Profile werden geladen …');
 assert.equal(document.querySelector('#settings').textContent,'Wunschlisten-Anleitung');
 assert.equal(document.querySelector('#private').value,originalValue);
});
