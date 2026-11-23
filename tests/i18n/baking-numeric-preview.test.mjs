import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {parseHTML} from 'linkedom';

const html=readFileSync(new URL('../../tools/baking/index.html',import.meta.url),'utf8');
function extract(start,end){
 const a=html.indexOf(start),b=html.indexOf(end,a+1);
 assert.ok(a>=0&&b>a,start);
 return html.slice(a,b);
}
const source=extract('function formatBakingDisplayNumber(','function updateSlices(')+'\n'+
 extract('function escapeRecipeHtml(','function displaySavedRecipeDate(')+'\n'+
 extract('function renderRecipePreview(','function calculateRecipe(');

test('calculator presentation formats decimals in DE and EN without changing machine factor',()=>{
 const window={__toolyaUILocale:'de'};
 const {formatBakingDisplayNumber}=runInNewContext(source+'\n({formatBakingDisplayNumber})',{window});
 assert.equal(formatBakingDisplayNumber(1234.5,1),'1.234,5');
 assert.equal(formatBakingDisplayNumber(1200,1,0),'1.200');
 window.__toolyaUILocale='en';
 assert.equal(formatBakingDisplayNumber(1234.5,1),'1,234.5');
 assert.equal(formatBakingDisplayNumber(1200,1,0),'1,200');
});

test('recipe preview re-renders localized quantities without changing private ingredients or HTML safety',()=>{
 const {document}=parseHTML('<html><body>'+
  '<input id="recipe-name" value="Omas <geheime> Torte">'+
  '<textarea id="recipe-input">1000.5 g Omas Spezialmehl\n1500 g <img onerror=alert(1)> Kakao\n1 Ei Omas Eigelb</textarea>'+
  '<select id="unit-system"><option value="metric">Metric</option></select>'+
  '<span id="res-factor"></span><div id="print-card"></div></body></html>');
 const factor=document.querySelector('#res-factor');
 Object.defineProperty(factor,'innerText',{configurable:true,value:'0.75'});
 const window={__toolyaUILocale:'de'};
 const {renderRecipePreview}=runInNewContext(source+'\n({renderRecipePreview})',{document,window});
 const name=document.querySelector('#recipe-name'),recipe=document.querySelector('#recipe-input');
 const raw=recipe.value,privateName=name.value;
 renderRecipePreview();
 assert.match(document.querySelector('#print-card').textContent,/750,4g Omas Spezialmehl/);
 assert.match(document.querySelector('#print-card').textContent,/1\.125g/);
 assert.match(document.querySelector('#print-card').textContent,/1 Ei Omas Eigelb/);
 assert.equal(document.querySelector('#print-card img'),null,'source ingredient markup must be escaped');
 window.__toolyaUILocale='en';
 renderRecipePreview();
 assert.match(document.querySelector('#print-card').textContent,/750.4g Omas Spezialmehl/);
 assert.match(document.querySelector('#print-card').textContent,/1,125g/);
 assert.match(document.querySelector('#print-card').textContent,/1 egg Omas Eigelb/);
 assert.match(document.querySelector('#print-card').textContent,/Factor ×0.75/);
 window.__toolyaUILocale='de';
 renderRecipePreview();
 assert.match(document.querySelector('#print-card').textContent,/Faktor ×0,75/);
 assert.equal(recipe.value,raw);
 assert.equal(name.value,privateName);
 assert.equal(factor.innerText,'0.75');
});

test('only a newly saved unnamed recipe gets a localized default title; the original text is untouched',()=>{
 const sourceSave=extract('function calculateRecipe(','let bakingCloudReady');
 const window={__toolyaUILocale:'en'};
 const fields={
  'recipe-name':{value:''},
  'recipe-input':{value:'Private Zutaten: 300 g Mehl'},
  'res-factor':{innerText:'1.25'}
 };
 const records=[];
 const document={getElementById:id=>fields[id]};
 const {calculateRecipe}=runInNewContext(sourceSave+'\n({calculateRecipe})',{
  window,document,calculateAll(){},renderRecipePreview(){},
  saveRecipeToStorage(...args){records.push(args)}
 });
 calculateRecipe();
 assert.deepEqual(records[0],['Untitled recipe','Private Zutaten: 300 g Mehl',1.25]);
 window.__toolyaUILocale='de';
 calculateRecipe();
 assert.deepEqual(records[1],['Unbenanntes Rezept','Private Zutaten: 300 g Mehl',1.25]);
 fields['recipe-name'].value='Omas privater Kuchen';
 window.__toolyaUILocale='en';
 calculateRecipe();
 assert.deepEqual(records[2],['Omas privater Kuchen','Private Zutaten: 300 g Mehl',1.25]);
 assert.equal(fields['recipe-input'].value,'Private Zutaten: 300 g Mehl');
});
