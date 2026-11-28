import test from 'node:test';
import assert from 'node:assert/strict';
import {cardDesigns, cardFormats, cardLanguages, newVariant} from '../../tools/wishes/directory-card-designs.mjs';
import {directoryUrl, httpsUrl} from '../../tools/wishes/directory-links.mjs';
import {fourPlacements, wrappedLines} from '../../tools/wishes/directory-card-render.mjs';

test('eighteen distinctive designs have five labeled colors and all four formats share one draft', () => {
  assert.equal(cardDesigns.length, 18);
  assert.equal(new Set(cardDesigns.map(d => d.id)).size, 18);
  assert.equal(new Set(cardDesigns.map(d => d.motif)).size, 18);
  for (const category of new Set(cardDesigns.map(d => d.category))) {
    const designs=cardDesigns.filter(d=>d.category===category);
    assert.equal(designs.length,3);
    for(const d of designs)assert.equal(new Set(d.colors.map(c=>c.name)).size,5);
  }
  assert.deepEqual(Object.keys(cardFormats),['square','story','a4','four']);
  for(const {x,y,w,h} of fourPlacements())assert.ok(x>=4&&y>=4&&x+w<=206&&y+h<=293);
});

test('card language defaults keep the QR target separate and preserve all scripts', () => {
  assert.equal(newVariant('ar','list').direction,'rtl');
  for(const language of Object.keys(cardLanguages).filter(x=>x!=='custom')){
    assert.ok(newVariant(language,'list').text.qr);
    assert.notEqual(newVariant(language,'list').text.qr,newVariant(language,'profile').text.qr);
  }
  assert.equal(newVariant('custom','list').text.qr,'');
  const context={measureText:value=>({width:[...value].length})};
  for(const [lang,text] of [['de','Jérôme & Zoë'],['uk','Привіт, світе'],['ar','مرحبا بالعالم'],['ja','願いごとリスト']]){
    assert.equal(wrappedLines(context,text,30,lang).join(''),text);
    assert.deepEqual(wrappedLines(context,text+'\n'+text,30,lang),[text,text]);
  }
  assert.deepEqual(wrappedLines(context,'か\u3099か\u3099',2,'ja'),['か\u3099','か\u3099']);
});

test('stable link builders never take a target URL from a draft field', () => {
  const id='11111111-1111-4111-8111-111111111111';
  assert.equal(directoryUrl('list',id).href,'https://toolya.app/tools/wishes/public.html?list='+id);
  assert.equal(directoryUrl('profile',id).href,'https://toolya.app/tools/wishes/public.html?profile='+id);
  assert.equal(directoryUrl('list','javascript:alert(0)').search,'');
  assert.equal(httpsUrl('https://example.invalid/path'),'https://example.invalid/path');
  assert.equal(httpsUrl('https://someone:secret@example.invalid'),'');
});
