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
  assert.equal(localizedPublicUrl('de'),'/');
  assert.equal(localizedPublicUrl('de','moving-boxes'),'/umzugskisten/');
  assert.throws(()=>localizedPublicUrl('en','unknown-tool'),/Unknown/);
  assert.throws(()=>localizedPublicUrl('en','../dashboard'),/Invalid/);
});
test('campaign links preserve locale and tracking', () => {
  const url = new URL(campaignUrl({locale:'en',slug:'moving-boxes',source:'instagram',campaign:'launch_en'}));
  assert.equal(url.pathname,'/en/moving-boxes/');
  assert.equal(url.searchParams.get('utm_source'),'instagram');
  assert.equal(url.searchParams.get('utm_campaign'),'launch_en');
  assert.equal(new URL(campaignUrl({locale:'de',slug:'moving-boxes',source:'instagram',campaign:'launch_de'})).pathname,'/umzugskisten/');
  assert.throws(()=>campaignUrl({source:'instagram',campaign:'invalid value'}),/Invalid/);
});

test('new English public guide paths keep their German originals',async()=>{
 const {localizedPublicUrl}=await import('../../shared/toolya/i18n/locale.mjs');
 const pairs=[["vehicle-costs","autokosten"],["household-budget","haushaltsbuch"],["digital-estate","digitaler-nachlass"],["parking-spot","parkplatz-merker"],["pet-health","tiergesundheit"],["lent-items","verliehene-dinge"],["meter-readings","zaehlerstaende"],["publish-amazon-wishlist","amazon-wunschliste-veroeffentlichen"]];
 for(const [slug,german] of pairs){
  assert.equal(localizedPublicUrl('en',slug),'/en/'+slug+'/');
  assert.equal(localizedPublicUrl('de',slug),'/'+german+'/');
 }
});
