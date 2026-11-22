import test from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';import {adminText} from '../../shared/toolya/i18n/admin-copy.mjs';import {applyAdminLocale} from '../../shared/toolya/i18n/admin-dom.mjs';
test('admin label translations do not touch private data, roles or action handlers',()=>{
 const {document}=parseHTML('<html><body><h1>Wunschlisten-Finder</h1><button onclick="publish()">Aktualisieren</button><input value="secret-api-key"><div id="summary"><h2>Neue Funde</h2></div></body></html>');
 const b=document.querySelector('button'),key=document.querySelector('input');applyAdminLocale(document,'en');
 assert.equal(document.querySelector('h1').textContent,'Wish-list finder');assert.equal(b.textContent,'Refresh');
 assert.equal(b.getAttribute('onclick'),'publish()');assert.equal(key.value,'secret-api-key');
 assert.equal(document.querySelector('#summary h2').textContent,'Neue Funde');
 applyAdminLocale(document,'de');assert.equal(b.textContent,'Aktualisieren');
});
test('admin implicit option values retain German keys during English display',()=>{const {document}=parseHTML('<html><body><select><option>Neue Funde</option></select></body></html>');const opt=document.querySelector('option');applyAdminLocale(document,'en');assert.equal(opt.getAttribute('value'),'Neue Funde');assert.equal(opt.textContent,'New findings');applyAdminLocale(document,'de');assert.equal(opt.hasAttribute('value'),false);});
