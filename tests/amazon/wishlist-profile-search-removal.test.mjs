import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src=readFileSync(new URL('../../tools/wishes/public-amazon.mjs',import.meta.url),'utf8');

test('profile cards never embed the general Amazon product search',()=>{
  const card=src.slice(src.indexOf('function card('),src.indexOf('function hasSearchCriteria(){'));
  assert.ok(card.startsWith('function card('),'profile renderer exists');
  assert.doesNotMatch(card,/amazonSearch\(/,'no Amazon search form in profile details');
  assert.match(src,/amazonListUrl\(l\.url\)/,'original Amazon wishlist URLs remain');
  assert.match(card,/listSummary\(l\)/,'original wishlist links still render as clickable cards');
  assert.doesNotMatch(src,/function renderIdeas\(|amazonSearchUrl|rankProducts/,'removed recommendations are not reintroduced');
});

test('general Amazon product-search form is absent from the entire Wishlist page',()=>{
  assert.doesNotMatch(src,/amazonSearch\(/);
});
