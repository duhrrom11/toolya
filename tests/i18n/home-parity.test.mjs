import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {parseHTML} from 'linkedom';
const page=p=>parseHTML(readFileSync(new URL('../../'+p,import.meta.url),'utf8')).document;
test('English home preserves German tool IDs and existing English guide routes',()=>{
 const de=page('index.html'),en=page('en/index.html');
 const ids=d=>[...d.querySelectorAll('#toolsGrid .tool-card')].map(e=>e.dataset.id);
 assert.equal(ids(de).length,12);
 assert.deepEqual(ids(en),ids(de));
 for(const id of ['settingsModal','loginEmail','loginPassword','passwordRecoveryPanel','datensicherung','favoriteFeedback','toolDiscovery'])assert.ok(en.getElementById(id),id);
 const guides=[...en.querySelectorAll('.ty-guide-card')];
 assert.equal(guides.length,14);
 for(const a of guides){const url=a.getAttribute('href');assert.ok(url.startsWith('/en/'));assert.ok(existsSync(new URL('../..'+url+(url.endsWith('/')?'index.html':''),import.meta.url)),url);}
 assert.equal(en.querySelector('meta[name="robots"]').content,'noindex,follow');
 for(const a of en.querySelectorAll('.ty-tool-link'))assert.match(a.getAttribute('href'),/^\/tools\/.*\?lang=en$/);
});
