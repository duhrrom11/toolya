import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('settings gear sits in text column instead of floating over mascot', () => {
 const css=readFileSync('shared/toolya/header.css','utf8');
 const block=css.slice(css.indexOf('/* Settings occupy a dedicated slot'),css.indexOf('/* Settings occupy a dedicated slot')+900);
 assert.match(block,/\.ty-tool-hero-copy\{position:relative;z-index:2\}/);
 assert.match(block,/grid-template-columns:minmax\(0,1fr\) 46px/);
 assert.match(block,/\.ty-tool-hero-actions\{\s*position:static/);
 assert.doesNotMatch(block,/position:absolute/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\) 44px/);
 assert.match(css,/animation:ty-tool-gear-spin 3\.5s linear infinite/);
});

test('header asset is cache-busted and original tool settings are retained',()=>{
 const js=readFileSync('shared/toolya/platform.mjs','utf8');
 assert.match(js,/20261119-gear-no-overlap-v2/);
 assert.match(js,/actions\.append\(originalSettings\)/);
});
