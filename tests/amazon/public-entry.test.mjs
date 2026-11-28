import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const entry = readFileSync('tools/wishes/index.html', 'utf8');
const page = readFileSync('tools/wishes/public.html', 'utf8');
const app = readFileSync('tools/wishes/public-amazon.mjs', 'utf8');

test('public discovery entry does not require staging authentication', () => {
  assert.doesNotMatch(entry, /auth-page-gate|toolya-auth-pending|toolya-auth-verified/);
  assert.match(entry, /location\.replace\(new URL\('\.\/public\.html' \+ location\.search \+ location\.hash/);
});

test('public profile frontend uses production Supabase with bundled client', () => {
  assert.match(page, /mode:"production",url:"https:\/\/yheogmeaosuigyaxkwth\.supabase\.co"/);
  assert.match(app, /const PROD_PROJECT = 'yheogmeaosuigyaxkwth'/);
  assert.match(page, /assets\/vendor\/supabase-2\.119\.2\.js/);
  assert.doesNotMatch(page, /cdn\.jsdelivr\.net\/npm\/@supabase/);
});

test('public list page retains discovery, profile editing, and SEO entry points', () => {
  for (const id of ['search','results','favorites','profile','wishCardEditor']) {
    assert.match(page, new RegExp('id="' + id + '"'));
  }
  assert.match(page, /href="\/dashboard\/\?wishes=add#wish-profiles"/);
  assert.match(page, /rel="canonical"/);
  assert.match(page, /application\/ld\+json/);
});
