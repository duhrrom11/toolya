import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {applyWishLocale} from '../../shared/toolya/i18n/wishes-dom.mjs';
import {wishesText} from '../../shared/toolya/i18n/wishes-copy.mjs';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
test('occasion owned copy round trips without translating personal titles or drafts',()=>{
 const {document}=parseHTML('<html><body><h3 data-user-content>Bearbeiten</h3><span data-wish-owned-copy>🔁 Jährlich</span><p data-wish-owned-copy>Aktuell keine anstehenden Erinnerungen.</p><input id="title" value="Bearbeiten"><textarea>Meine Notiz</textarea></body></html>');
 applyWishLocale(document,'en');
 assert.equal(document.querySelector('h3').textContent,'Bearbeiten');
 assert.equal(document.querySelector('span').textContent,'🔁 Yearly');
 assert.equal(document.querySelector('p').textContent,'No reminders are currently due.');
 assert.equal(document.querySelector('input').value,'Bearbeiten');
 assert.equal(document.querySelector('textarea').value,'Meine Notiz');
 applyWishLocale(document,'de');
 assert.equal(document.querySelector('span').textContent,'🔁 Jährlich');
 assert.equal(document.querySelector('p').textContent,'Aktuell keine anstehenden Erinnerungen.');
 assert.match(read('tools/wishes/occasions.mjs'),/title\.setAttribute\('data-user-content',''\)/);
 assert.match(read('tools/wishes/bookmarks.mjs'),/title\.setAttribute\('data-user-content',''\)/);
});
test('bookmark counts and app-owned actions are reversible',()=>{
 assert.equal(wishesText('3 gemerkte öffentliche Sammlungen.','en'),'3 bookmarked public collections.');
 assert.equal(wishesText('3 bookmarked public collections.','de'),'3 gemerkte öffentliche Sammlungen.');
 assert.equal(wishesText('Sammlung öffnen ↗','en'),'Open collection ↗');
});
