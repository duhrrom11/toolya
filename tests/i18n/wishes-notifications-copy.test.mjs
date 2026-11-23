import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {applyWishLocale} from '../../shared/toolya/i18n/wishes-dom.mjs';
import {wishesText} from '../../shared/toolya/i18n/wishes-copy.mjs';

test('Wishes notification settings and privacy notice translate reversibly without changing checkbox values',()=>{
 const html=readFileSync(new URL('../../tools/wishes/notifications.html',import.meta.url),'utf8');
 const {document}=parseHTML(html);
 const labels=[...document.querySelectorAll('.settings label')];
 const originals=labels.map(x=>x.textContent);
 const notice=document.querySelector('.ty-legacy-note');
 const originalNotice=notice.textContent;
 const inputs=labels.map(x=>x.querySelector('input'));
 const ids=inputs.map(x=>x.id);
 applyWishLocale(document,'en');
 assert.deepEqual(labels.map(x=>x.textContent.trim()),[
  'New public wish worlds from followed profiles',
  'New followers',
  'Likes on my public wish worlds'
 ]);
 assert.match(document.querySelector('.section-head h2').textContent,/Activities/);
 assert.match(notice.textContent,/No push notifications or emails are sent/);
 assert.ok(!notice.textContent.includes('Die Hinweise'));
 assert.deepEqual(inputs.map(x=>x.id),ids);
 assert.ok(inputs.every(x=>x.hasAttribute('checked')));
 applyWishLocale(document,'de');
 assert.deepEqual(labels.map(x=>x.textContent),originals);
 assert.equal(notice.textContent,originalNotice);
 assert.deepEqual(inputs.map(x=>x.id),ids);
});

test('Wishes notifications fixed copy round-trips and leaves individual activity titles untouched',()=>{
 const examples=[
  ['Aktivitäten','Activities'],
  ['Neue Follower','New followers'],
  ['Likes auf meine öffentlichen Wunschwelten','Likes on my public wish worlds']
 ];
 for(const [de,en] of examples){
  assert.equal(wishesText(de,'en'),en);
  assert.equal(wishesText(en,'de'),de);
 }
 assert.equal(wishesText('Mein eigenes Geschenk für Änne','en'),'Mein eigenes Geschenk für Änne');
});
