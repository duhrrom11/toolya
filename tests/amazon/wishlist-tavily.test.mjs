import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../../',import.meta.url);
const edge=readFileSync(new URL('supabase/functions/wishlist-discovery/index.ts',root),'utf8');
const ui=readFileSync(new URL('admin-stats-dashboard/wishlist-finder.mjs',root),'utf8');
const page=readFileSync(new URL('admin-stats-dashboard/wishlist-finder.html',root),'utf8');
const sql=readFileSync(new URL('supabase/migrations/20261117_wishlist_tavily_search.sql',root),'utf8');

test('Tavily search stays server-side and costs only basic credits',()=>{
 assert.match(edge,/https:\/\/api\.tavily\.com\/search/);
 assert.match(edge,/Authorization:'Bearer '\+key/);
 assert.match(edge,/search_depth:'basic'/);
 assert.match(edge,/include_raw_content:false/);
 assert.match(edge,/include_answer:false/);
 assert.doesNotMatch(edge,/api\.search\.brave\.com|BRAVE_SEARCH_API_KEY/);
 assert.doesNotMatch(ui,/tvly-[a-zA-Z0-9-]{16,}/);
});
test('quota is atomic, server-side and capped below free allowance',()=>{
 assert.match(sql,/on conflict \(month_utc\) do update/);
 assert.match(sql,/used<900/);
 assert.match(sql,/revoke all on function public\.wishlist_tavily_quota\(boolean\) from public, anon, authenticated/);
 assert.match(edge,/wishlist_tavily_quota',\{claim:true\}/);
 assert.match(edge,/if\(!credit\.allowed\)return reply/);
 assert.match(page,/900 Basic-Credits/);
 assert.match(ui,/quotaRemaining<=0/);
});
test('encrypted Tavily key is never exposed to public users',()=>{
 assert.match(sql,/vault\.create_secret/);
 assert.match(sql,/vault\.update_secret/);
 assert.match(sql,/toolya_wishlist_tavily_key/);
 assert.match(sql,/revoke all on function public\.wishlist_tavily_key\(text\) from public, anon, authenticated/);
 assert.match(edge,/wishlist_tavily_key/);
 assert.doesNotMatch(page,/tvly-/);
});
test('existing wishlist safety controls remain in place',()=>{
 assert.match(edge,/matching\.length!==1/);
 assert.match(edge,/delete\(\)\.eq\('id',matching\[0\]\.id\)/);
 assert.match(ui,/parseCsv\(text\)/);
 assert.match(ui,/JSON\.parse\(text\)/);
 assert.match(ui,/api\('publish'/);
});

test('discovery includes first-person Amazon wish-list phrases without doubling all country-topic combinations',()=>{
 for(const phrase of ['unsere Amazon Wunschliste','meine Amazon Wunschliste','unsere Amazon-Wunschliste','meine Amazon-Wunschliste','unsere Wunschliste bei Amazon','meine Wunschliste bei Amazon','unser Amazon Wunschzettel','mein Amazon Wunschzettel','Amazon Wunschliste Sachspenden','Amazon Wunschliste Tierheim','notre liste de souhaits Amazon']){
  assert.ok(edge.includes(phrase),'missing phrase: '+phrase);
 }
 assert.match(edge,/for\(const phrase of directPhrases\)seeds\.push/);
 assert.match(edge,/for\(const \[phrase,lang\] of multilingualPhrases\)seeds\.push/);
 assert.match(edge,/exclude_domains:\['amazon\.de','amazon\.com','amazon\.fr',/);
 assert.match(edge,/worldwidePhrases/);
 for(const phrase of ['Amazon lista de desejos','Amazon список желаний','Amazon 欲しいものリスト','Amazon قائمة الأمنيات','Amazon daftar keinginan'])assert.ok(edge.includes(phrase));
 assert.match(edge,/wishlist_tavily_quota',\{claim:true\}/);
 assert.match(edge,/upsert\(seeds,\{onConflict:'query,country,lang',ignoreDuplicates:true\}\)/);
});
