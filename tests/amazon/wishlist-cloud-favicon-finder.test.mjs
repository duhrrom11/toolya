import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sampleCloud} from '../../tools/wishes/wishlist-cloud.mjs';
import {sourceFavicon,candidate} from '../../supabase/functions/wishlist-discovery/model.mjs';

const read=path=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const frontend=read('tools/wishes/public-amazon.mjs');
const html=read('tools/wishes/public.html');
const edge=read('supabase/functions/wishlist-discovery/index.ts');
const admin=read('admin-stats-dashboard/wishlist-finder.mjs');

test('public profile carousel is bounded, randomized, linked and separate from search',()=>{
 const rows=Array.from({length:75},(_,i)=>({user_id:'00000000-0000-4000-8000-'+String(i).padStart(12,'0'),display_name:'Person '+i}));
 rows.push(rows[0],{user_id:'invalid',display_name:'Invalid'});
 const a=sampleCloud(rows,30,()=>0);
 const b=sampleCloud(rows,30,()=>0.99999);
 assert.equal(a.length,30);
 assert.equal(new Set(a.map(x=>x.user_id)).size,30);
 assert.notDeepEqual(a.map(x=>x.user_id),b.map(x=>x.user_id));
 assert.equal(sampleCloud(rows,100).length,30,'helper caps even oversized requests');
 assert.equal(sampleCloud(rows).length,30,'default limit is 30');
 assert.match(frontend,/\.limit\(80\)/);
 assert.match(frontend,/Math\.floor\(Math\.random\(\)\*\(i\+1\)\)/);
 assert.match(frontend,/\.slice\(0,12\)/);
 assert.match(frontend,/if\(!hasSearchCriteria\(\)\)/);
 assert.match(frontend,/await refreshCloud\(g\)/);
 assert.match(frontend,/a\.href=profileUrl\(p\.user_id\)/);
 assert.match(html,/id="wishPublicTrack"/);
 assert.doesNotMatch(html,/id="amazonDiscovery"|id="mainAmazonSearch"/);
 assert.doesNotMatch(frontend,/amazonSearch\(/);
});
test('favicon URLs stay on source origin, ignore old logo metadata and allow mascot fallback',()=>{
 assert.equal(sourceFavicon('https://example.org/people/maria'), 'https://example.org/favicon.ico');
 assert.equal(sourceFavicon('https://example.org/people/maria','/assets/icon.png'),'https://example.org/assets/icon.png');
 assert.equal(sourceFavicon('https://example.org/people/maria','https://outside.test/favicon.ico'),'https://example.org/favicon.ico');
 assert.equal(sourceFavicon('http://example.org/page'),'');
 const record=candidate({name:'Organisation',wishlist_url:'https://www.amazon.de/hz/wishlist/ls/ABC123',source_url:'https://example.org/page',logo_url:'https://outside.test/tracker.png'});
 assert.equal(record.logo_url,'https://example.org/favicon.ico');
 assert.match(edge,/const favicon=sourceFavicon\(source,iconHref\)/);
 assert.doesNotMatch(edge,/og:image|itemprop="logo"|header img\[alt\*="Logo"/);
 assert.match(frontend,/img\.src=sourceFavicon\(p\.source_url\)\|\|fallback\(\)/);
 assert.match(admin,/img\.src=sourceFavicon\(r\.source_url\)\|\|fallback\(\)/);
});
test('one-click dismiss and restore are admin-only and hide normal result pages',()=>{
 assert.match(admin,/Fund ausblenden:/);
 assert.match(admin,/api\('dismiss',\{ids:\[r\.id\]\}\)/);
 assert.match(admin,/api\('restore',\{id:r\.id\}\)/);
 assert.match(edge,/\.neq\('status','dismissed'\)/);
 assert.match(edge,/\.in\('status',\['new','duplicate'\]\)/);
 assert.match(edge,/\.eq\('status','dismissed'\)/);
 assert.match(edge,/Nur für Administratoren/);
 assert.match(edge,/worldwidePhrases/);
 assert.match(edge,/wishlist_tavily_quota',\{claim:true\}/);
});
