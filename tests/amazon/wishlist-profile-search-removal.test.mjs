import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src=readFileSync(new URL('../../tools/wishes/public-amazon.mjs',import.meta.url),'utf8');

test('profile cards never embed the general Amazon product search',()=>{
  const card=src.slice(src.indexOf('function card('),src.indexOf('function renderIdeas('));
  assert.ok(card.startsWith('function card('),'profile renderer exists');
  assert.doesNotMatch(card,/amazonSearch\(/,'no Amazon search form in profile details');
  assert.match(card,/Original bei Amazon öffnen/,'original Amazon wishlist links remain');
});

test('main discovery section keeps its separate gift-idea search',()=>{
  assert.match(src,/amazonSearch\(\$\('mainAmazonSearch'\)/);
});
