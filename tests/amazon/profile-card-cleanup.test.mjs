import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const js=readFileSync('tools/wishes/public-amazon.mjs','utf8');
const html=readFileSync('tools/wishes/public.html','utf8');
const css=readFileSync('tools/wishes/profile-cards.css','utf8');

test('profile views do not add Amazon search or recommendation widgets',()=>{
 assert.doesNotMatch(js,/renderIdeas|rankProducts|amazonSearchUrl|public-products\.json/);
 assert.doesNotMatch(js,/Vielleicht interessiert dich|Entdecke passende Geschenkideen|Als Amazon-Partner verdiene ich/);
 const card=js.slice(js.indexOf('function card('),js.indexOf('function hasSearchCriteria(){'));
 assert.ok(card.startsWith('function card('));
 assert.doesNotMatch(card,/amazonSearch\(|renderIdeas\(|catalog|products/);
 assert.match(js,/profile-wishlist-link/);
 assert.match(js,/amazonListUrl\(l\.url\)/);
 assert.match(js,/noopener noreferrer sponsored/);
 assert.match(card,/profile-report-link/);
});

test('redesigned cards keep original profile and wishlist actions',()=>{
 assert.match(js,/favorite\(p\)/);
 assert.match(js,/profile-open-link/);
 assert.match(js,/profile-card--detail/);
 assert.match(js,/profile-card--compact/);
 assert.match(html,/profile-cards\.css\?v=[^"]+/);
 assert.match(css,/\.profile-wishlist-link/);
 assert.match(css,/@media\(max-width:600px\)/);
});
