import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {canonicalList,publicUrl,candidate,csv,parseCsv} from '../../supabase/functions/wishlist-discovery/model.mjs';
test('wishlist identities normalize path aliases, tracking, case, host and affiliate tag',()=>{for(const url of ['https://amazon.de/hz/wishlist/ls/abc123?tag=other-21','https://www.amazon.de/gp/registry/wishlist/ABC123/?ref=x#foo','https://www.amazon.fr/registry/wishlist/abc123']){const r=canonicalList(url);assert.equal(r.key,'ABC123');assert.match(r.url,/tag=duhrrom-21$/);assert.doesNotMatch(r.url,/other-21|ref=/)}for(const value of ['http://amazon.de/hz/wishlist/ls/A','https://amazon.de.attacker.org/hz/wishlist/ls/A','https://user@amazon.de/hz/wishlist/ls/A','https://amazon.de/dp/B012345678'])assert.equal(canonicalList(value),null)});
test('source rejects internal and invalid URLs and Amazon source pages',()=>{for(const url of ['https://127.0.0.1/','https://[::1]/','https://localhost/','https://x.internal/','file:///tmp/a'])assert.equal(publicUrl(url),null);assert.throws(()=>candidate({name:'X',wishlist_url:'https://amazon.de/hz/wishlist/ls/A',source_url:'https://amazon.de/'}));const c=candidate({name:'Verein',wishlist_url:'https://amazon.de/hz/wishlist/ls/A',source_url:'https://verein.org/spenden',email:'not valid',logo_url:'javascript:alert(1)'});assert.equal(c.logo_url,'https://verein.org/favicon.ico');assert.equal(c.email,'');assert.equal(c.list_key,'A')});
test('CSV supports quotes, separators, newlines, unicode and spreadsheet formula protection',()=>{const rows=[{name:'Verein "Hilfe"; Österreich\nLuxemburg',wishlist_url:'https://www.amazon.de/hz/wishlist/ls/ABC?tag=duhrrom-21',email:'kontakt@example.org',source_url:'https://example.org/'},{name:'=HYPERLINK("bad")'}];const out=csv(rows),back=parseCsv(out);assert.equal(back[0].name,rows[0].name);assert.equal(back[0].wishlist_url,rows[0].wishlist_url);assert.ok(back[1].name.startsWith("'="));assert.throws(()=>parseCsv('name;url\n"broken'))});
import {robotsAllowed} from '../../supabase/functions/wishlist-discovery/model.mjs';
test('crawler respects robots groups, wildcard paths, allow exceptions and specific agents',()=>{assert.equal(robotsAllowed('User-agent: *\nDisallow: /private','/private/list'),false);assert.equal(robotsAllowed('User-agent: *\nUser-agent: Another\nDisallow: /','/'),false);assert.equal(robotsAllowed('User-agent: *\nDisallow: /\nAllow: /spenden','/spenden/list'),true);assert.equal(robotsAllowed('User-agent: *\nDisallow: /*?secret=*','/list?secret=x'),false);assert.equal(robotsAllowed('User-agent: *\nDisallow: /\nUser-agent: ToolyaWishlistFinder\nAllow: /','/'),true);assert.equal(robotsAllowed('User-agent: *\nDisallow: /private$','/private/list'),true)});

test('Amazon share-link marker is included in discovery without expanding provider scope',()=>{
 const source=readFileSync(new URL('../../supabase/functions/wishlist-discovery/index.ts',import.meta.url),'utf8');
 assert.match(source,/"ref_=wl_share" "Amazon"/);
 assert.match(source,/seeds\.push\(\{query:'"ref_=wl_share"/);
 assert.doesNotMatch(source,/query:'\*\?ref_=wl_share\*/);
 const shared=canonicalList('https://www.amazon.de/hz/wishlist/ls/ABC123?ref_=wl_share');
 assert.equal(shared?.key,'ABC123');
 assert.equal(shared?.url,'https://www.amazon.de/hz/wishlist/ls/ABC123?tag=duhrrom-21');
 assert.equal(canonicalList('https://example.org/hz/wishlist/ls/ABC123?ref_=wl_share'),null);
});

test('CSV shields whitespace-prefixed and full-width formulas, preserves ordinary text',()=>{const names=['  =1+1','\tplain','\nplain','\rplain','＋1','＠SUM(1)',' ordinary text','A;B "C"'];const back=parseCsv(csv(names.map(name=>({name}))));assert.deepEqual(back.map(r=>r.name),names.map((name,i)=>i<6?"'"+name:name));});
