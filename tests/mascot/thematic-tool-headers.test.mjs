import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, statSync} from 'node:fs';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const platform=read('../../shared/toolya/platform.mjs');
const header=read('../../shared/toolya/header.css');
const footer=read('../../shared/toolya/footer.css');
const style=read('../../shared/toolya/platform.css');

test('all twelve tools retain separate themed outfits for both selected characters',()=>{
 const roles=['wishes','budget','housemates','moving','estate','car','pet-health','parking','loans','plants','meters','baking'];
 for(const [role,tool] of roles.entries())assert.match(platform,new RegExp(`['"]?${tool}['"]?:\\{role:${role},`),`missing or mismatched outfit role: ${tool}`);
 assert.match(platform,/r\.role\*2\+character/,'both characters must use the respective outfit cell');
 assert.match(platform,/paint\(r,'outfits\.webp',r\.role\*2\+character\)/);
 assert(statSync(new URL('../../assets/toolya/outfits.webp',import.meta.url)).size>100_000,'the complete outfit atlas must exist');
});

test('headers and Ko-fi companions use themed atlas, not shared wishlist gift artwork',()=>{
 const hero=platform.split('function mountToolHero()')[1].split('function finalizeToolSettingsAndHeader()')[0];
 const donation=platform.split('function mountDonation()')[1].split("window.addEventListener('storage'")[0];
 assert.match(hero,/attach\(img,'outfit',context\.role\)/);
 assert.match(hero,/refreshFrames\(\)/);
 assert.match(donation,/attach\(mascot,'outfit',context\.role\)/);
 assert.doesNotMatch(platform,/welcomeMascotURL|headers\/toolya_wishlist_/);
 assert.match(header,/\.ty-tool-hero-inner>\.ty-sprite-wrap/);
 assert.match(footer,/\.ty-kofi-action>\.ty-sprite-wrap/);
});

test('failed atlas never shows wishlist original artwork outside wishlist',()=>{
 assert.match(platform,/TOOL_SYMBOLS\[record\.role\]/);
 assert.match(platform,/record\.frame\.classList\.add\('ty-sprite-fallback'\)/);
 assert.match(platform,/if\(tool==='wishes'\)stockImage/);
 assert.match(style,/\.ty-frame\.ty-sprite-fallback/);
});
