import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeLocale, localeFromPath, resolveLocale, localizedPublicUrl, campaignUrl} from '../../shared/toolya/i18n/locale.mjs';

test('language normalization', () => {
  assert.equal(normalizeLocale('en-US'), 'en');
  assert.equal(normalizeLocale('de_DE'), 'de');
  assert.equal(normalizeLocale('fr-FR'), null);
  assert.equal(normalizeLocale(null), null);
});
test('explicit public paths override preferences', () => {
  assert.equal(localeFromPath('/en/moving-boxes/'), 'en');
  assert.equal(localeFromPath('/tools/moving/'), null);
  assert.equal(resolveLocale({pathname:'/de/',saved:'en',browser:['en-US']}),'de');
});
test('fallback preference and browser language', () => {
  assert.equal(resolveLocale({saved:'en'}),'en');
  assert.equal(resolveLocale({browser:['fr-FR','en-GB']}),'en');
  assert.equal(resolveLocale({browser:['fr-FR']}),'de');
});
test('localized paths are safe', () => {
  assert.equal(localizedPublicUrl('en','moving-boxes'),'/en/moving-boxes/');
  assert.throws(()=>localizedPublicUrl('en','../dashboard'),/Invalid/);
});
test('campaign links preserve locale and tracking', () => {
  const url = new URL(campaignUrl({locale:'en',slug:'moving-boxes',source:'instagram',campaign:'launch_en'}));
  assert.equal(url.pathname,'/en/moving-boxes/');
  assert.equal(url.searchParams.get('utm_source'),'instagram');
  assert.equal(url.searchParams.get('utm_campaign'),'launch_en');
  assert.throws(()=>campaignUrl({source:'instagram',campaign:'invalid value'}),/Invalid/);
});
