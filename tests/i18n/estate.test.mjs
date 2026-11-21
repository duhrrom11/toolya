import test from 'node:test';import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {estateText} from '../../shared/toolya/i18n/estate-copy.mjs';
import {applyEstateLocale} from '../../shared/toolya/i18n/estate-dom.mjs';
test('estate labels are translated without changing secret input or print data',()=>{
 const {document}=parseHTML('<html><body><h1>Digitaler Nachlass: Mein Tresor</h1><button onclick="lock()">Tresor schließen</button><input value="sensitive-key"><main id="print-pages"><h2>Meine Unterlagen</h2></main></body></html>');
 const button=document.querySelector('button'),input=document.querySelector('input');
 applyEstateLocale(document,'en');
 assert.equal(document.querySelector('h1').textContent,'Digital estate: My vault');
 assert.equal(button.getAttribute('onclick'),'lock()');
 assert.equal(button.textContent,'Close vault');
 assert.equal(input.value,'sensitive-key');
 assert.equal(document.querySelector('#print-pages h2').textContent,'Meine Unterlagen');
 applyEstateLocale(document,'de');
 assert.equal(button.textContent,'Tresor schließen');
});
test('unknown user messages and cryptographic material are never rewritten',()=>{assert.equal(estateText('real user@example.org','en'),'real user@example.org');});
test('estate options preserve source keys on locale change',()=>{const {document}=parseHTML('<html><body><select><option>30 Tage</option></select></body></html>');const option=document.querySelector('option');applyEstateLocale(document,'en');assert.equal(option.textContent,'30 days');assert.equal(option.getAttribute('value'),'30 Tage');applyEstateLocale(document,'de');assert.equal(option.textContent,'30 Tage');assert.equal(option.hasAttribute('value'),false);});
