import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,dirname,join,relative} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve('.');const read=p=>readFileSync(p,'utf8');
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?files(join(dir,d.name)):[join(dir,d.name)])}
const pages=['index.html','privacy.html','legal.html',...files('tools').filter(p=>p.endsWith('.html'))];
test('all local HTML imports and references resolve within the published root',()=>{
 const missing=[];for(const file of pages)for(const m of read(file).matchAll(/(?:src|href)=["']([^"']+)["']/g)){const raw=m[1];if(raw.includes('${')||/^(?:[a-z]+:|#|\/\/)/i.test(raw))continue;const path=decodeURI(raw.split(/[?#]/)[0]);if(!path)continue;const target=resolve(path.startsWith('/')?root:dirname(resolve(file)),'.'+(path.startsWith('/')?path:'/'+path));if(!existsSync(target))missing.push(file+' -> '+raw)}assert.deepEqual(missing,[]);
});
test('the live release uses only Toolya Supabase and routes, preserving the existing wishes importer',()=>{
 for(const p of [...pages,...files('assets').filter(p=>/\.(?:m?js|css)$/.test(p)),...files('shared')])assert.doesNotMatch(read(p).replace("legacyLink.href='https://duhrrom11.github.io/Helferlein/';",''),/avapuibsidubuzxjtyld|duhrrom11\.github\.io\/Helferlein/,'Old production reference in '+p);
 assert.match(read('tools/wishes/app.mjs'),/mountAmazonImport/);assert.match(read('tools/wishes/toolya-client.mjs'),/yheogmeaosuigyaxkwth/);
 assert.match(read('index.html'),/tools\/wishes\/index.html/);assert.equal(read('CNAME').trim(),'toolya.app');
});
test('all eight original PNGs remain byte-for-byte unchanged',()=>{
 for(const line of read('assets/toolya/originals/SHA256SUMS').trim().split('\n')){const [sha,name]=line.split(/\s+/);assert.equal(createHash('sha256').update(readFileSync('assets/toolya/originals/'+name)).digest('hex'),sha,name)}
});
test('every canonical tool has a costume and an explicit shared entry point',()=>{
 const inventory=JSON.parse(read('docs/runtime-port-inventory.json'));assert.equal(Object.keys(inventory.routes).length,12);
 for(const tool of Object.values(inventory.routes)){assert.ok(existsSync('tools/'+tool+'/index.html'));assert.match(read('tools/'+tool+'/index.html'),/shared\/toolya\/platform.mjs/)}
 for(const asset of ['emotions-purple.webp','emotions-turquoise.webp','outfits.webp'])assert.ok(readFileSync('assets/toolya/'+asset).length<1000000);
});
