import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {wishesText} from '../../shared/toolya/i18n/wishes-copy.mjs';
import {applyWishLocale} from '../../shared/toolya/i18n/wishes-dom.mjs';
import {collectionCoverLabel} from '../../tools/wishes/collection-social.mjs';

test('collection reaction buttons translate reversibly without changing state',()=>{
 const {document}=parseHTML('<html><body><div class="collection-reactions"><button aria-label="Sammlung liken" aria-pressed="false">🤍 2 Likes</button><button aria-label="Sammlung merken" aria-pressed="false">🔖 Merken</button><button aria-label="Like entfernen" aria-pressed="true">❤️ 3 Likes</button><button aria-label="Aus Merkliste entfernen" aria-pressed="true">🔖 Gemerkt</button></div></body></html>');
 const buttons=[...document.querySelectorAll('button')];
 const snapshot=()=>buttons.map(b=>[b.textContent,b.getAttribute('aria-label'),b.getAttribute('aria-pressed')]);
 const before=snapshot();
 applyWishLocale(document,'en');
 assert.deepEqual(snapshot(),[['🤍 2 Likes','Like collection','false'],['🔖 Bookmark','Bookmark collection','false'],['❤️ 3 Likes','Remove like','true'],['🔖 Saved','Remove from bookmarks','true']]);
 applyWishLocale(document,'de');
 assert.deepEqual(snapshot(),before);
});

test('collection cover image labels translate only fixed fragments, never the saved title',()=>{
 for(const title of ['Sammlung','Speichern','Private Wunschwelt: Geburtstag']){
  assert.equal(collectionCoverLabel(title,'en'),'Collection cover image: '+title);
  assert.equal(collectionCoverLabel(title,'de'),'Titelbild der Sammlung: '+title);
 }
 assert.equal(collectionCoverLabel('','en'),'Collection cover image: Collection');
 assert.equal(collectionCoverLabel('','de'),'Titelbild der Sammlung: Sammlung');
 for(const file of ['bookmarks','discover']){
  const source=readFileSync(new URL('../../tools/wishes/'+file+'.mjs',import.meta.url),'utf8');
  assert.match(source,/bindCollectionCoverLabel\(img,item\.title\)/);
  assert.match(source,/img\.src=u(?:rl)?\.href/);
  assert.match(source,/title\.setAttribute\('data-user-content',''\)/);
 }
 const helper=readFileSync(new URL('../../tools/wishes/collection-social.mjs',import.meta.url),'utf8');
 assert.match(helper,/new WeakMap\(\)/);
 assert.match(helper,/toolya:wishes-locale-change/);
 assert.equal(wishesText('🔖 Bookmark','de'),'🔖 Merken');
});
