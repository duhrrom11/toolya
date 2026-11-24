import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {parseHTML} from 'linkedom';

const html=readFileSync(new URL('../../tools/baking/index.html',import.meta.url),'utf8');
const first=html.indexOf('function displaySavedRecipeDate(');
const second=html.indexOf('function renderSavedRecipes(',first);
const third=html.indexOf('function refreshSavedRecipeLocale(',second);
const fourth=html.indexOf('async function saveNote(',third);
assert.ok(first>=0&&second>first&&third>second&&fourth>third);
const code=html.slice(first,second)+'\n'+html.slice(third,fourth);

test('saved recipe dates use locale-specific presentation only for valid known date formats',()=>{
 const window={__toolyaUILocale:'de'};
 const {displaySavedRecipeDate}=runInNewContext(code+'\n({displaySavedRecipeDate})',{window});
 for(const [source,de,en] of [
  ['2026-11-23','23.11.2026','23/11/2026'],
  ['23.11.2026','23.11.2026','23/11/2026'],
  ['2026-11-23T16:50:00Z','23.11.2026','23/11/2026'],
  ['2026-02-30','2026-02-30','2026-02-30'],
  ['31.04.2026','31.04.2026','31.04.2026'],
  ['Omas privates Datum','Omas privates Datum','Omas privates Datum'],
  ['','', '']
 ]){
  assert.equal(displaySavedRecipeDate(source),de);
  window.__toolyaUILocale='en';
  assert.equal(displaySavedRecipeDate(source),en);
  window.__toolyaUILocale='de';
 }
});

test('language change repaints saved recipe date and label without replacing card, note input or stored source',()=>{
 const {document}=parseHTML('<html><body><div id="saved-recipes-list"><section>'+
  '<h4>Omas privater Kuchen</h4>'+
  '<p data-recipe-factor><span data-recipe-factor-label>Faktor</span>: ×1.5 | <span data-recipe-date-source="23.11.2026">23.11.2026</span></p>'+
  '<button data-recipe-delete>Löschen</button><label data-recipe-note-label>Geling-Protokoll / Notiz:</label>'+
  '<input data-recipe-note-input value="Geheime Füllung" placeholder="Z.B. Nächstes Mal 5 Min weniger backen...">'+
  '</section></div></body></html>');
 const window={__toolyaUILocale:'de'};
 const {refreshSavedRecipeLocale}=runInNewContext(code+'\n({refreshSavedRecipeLocale})',{window,document,bakingCloudReady:true});
 const input=document.querySelector('[data-recipe-note-input]');
 const date=document.querySelector('[data-recipe-date-source]');
 const source=date.getAttribute('data-recipe-date-source');
 const card=document.querySelector('section');
 for(const [locale,expected] of [['en','23/11/2026'],['de','23.11.2026'],['en','23/11/2026']]){
  window.__toolyaUILocale=locale;
  refreshSavedRecipeLocale();
  assert.equal(date.textContent,expected);
  assert.equal(date.getAttribute('data-recipe-date-source'),source);
  assert.equal(document.querySelector('section'),card);
  assert.equal(document.querySelector('[data-recipe-note-input]'),input);
  assert.equal(input.value,'Geheime Füllung');
  assert.equal(document.querySelector('h4').textContent,'Omas privater Kuchen');
  assert.match(document.querySelector('[data-recipe-factor]').textContent,/×1\.5/);
  assert.equal(document.querySelector('[data-recipe-factor-label]').textContent,locale==='en'?'Factor':'Faktor');
 }
});
