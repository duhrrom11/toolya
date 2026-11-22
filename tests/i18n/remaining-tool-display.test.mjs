import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const tool = async name => readFile(new URL(`../../tools/${name}/index.html`, import.meta.url), 'utf8');

test('moving box editor refreshes translated subitem amounts without rebuilding draft inputs', async () => {
 const html = await tool('moving');
 const listener = html.slice(html.indexOf("document.addEventListener('toolya:locale-change'"));
 assert.match(listener, /if \(!document\.getElementById\('editBoxModal'\)\?\.classList\.contains\('hidden'\)\) renderSubItemsModal\(\)/);
 assert.match(html, /escapeInventoryText\(item\.name\)/);
 assert.match(html, /\(item\.value \|\| 0\)\.toFixed\(2\)/);
 assert.doesNotMatch(listener.slice(0, listener.indexOf('async function exportInventoryPDF')), /saveData\(|updateBox\(|activeSubItemsTemp\s*=/);
});

test('household diet labels translate only canonical defaults, never custom field values', async () => {
 const html = await tool('housemates');
 const render = html.slice(html.indexOf('function renderDietMatrix()'), html.indexOf('function refreshOpenDietPlaceholders()'));
 assert.match(render, /value === 'Allesesser' \? 'Omnivore'/);
 assert.match(render, /value === 'Keine' \? 'None' : value/);
 assert.match(render, /escapeUserHtml\(dietDisplay\(info\.pref\)\)/);
 assert.match(render, /escapeUserHtml\(dietDisplay\(info\.allergy\)\)/);
 assert.match(render, /const diets = getDiets\(\)/);
 assert.doesNotMatch(render, /saveDiets\(/);
});

test('plant stock unit stays stored in German and only its default display is localized', async () => {
 const html = await tool('plants');
 assert.match(html, /item\.qty === '1 Stk' \? '1 pc' : item\.qty/);
 assert.match(html, /qty: qty \|\| '1 Stk'/);
 assert.match(html, /renderInventoryList\(\)/);
});

test('baking recipe previews translate only recognized display units without persisting', async () => {
 const html = await tool('baking');
 const preview = html.slice(html.indexOf('function renderRecipePreview()'), html.indexOf('function calculateRecipe()'));
 for(const unit of ["TL: ' tsp'", "EL: ' tbsp'", "Stück: ' pcs'", "Pck: ' packets'"])
  assert.ok(preview.includes(unit), `missing English unit: ${unit}`);
 assert.match(preview, /\[unit\] \|\| unit/);
 assert.match(preview, /escapeRecipeHtml\(match\[4\] \|\| ''\)/);
 assert.doesNotMatch(preview, /saveRecipeToStorage|persistRecipes/);
});
