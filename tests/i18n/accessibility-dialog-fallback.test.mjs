import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const source=readFileSync(resolve(import.meta.dirname,'../../assets/helferlein-accessibility.js'),'utf8');
test('closed account and help dialogs remain hidden without Tailwind CDN',()=>{
 assert.match(source,/fallback\.textContent = ids\.map\(id => '#' \+ id \+ '\.hidden'\)\.join\(','\) \+ '\{display:none!important\}'/);
 assert.match(source,/document\.getElementById\('helferlein-dialog-visibility-fallback'\)/);
 assert.match(source,/node\.classList\?\.contains\('hidden'\)/);
 assert.match(source,/managedInert\.clear\(\)/);
 assert.match(source,/blockBackground\(current\.dialog\)/);
});
test('the synthetic Chromium runtime gate asserts dialogs are hidden and tool is interactive',()=>{
 const src=readFileSync(resolve(import.meta.dirname,'../../tests/browser/tool-pages-ui.spec.cjs'),'utf8');
 assert.match(src,/expect\(authState\.shellInert\)\.toBe\(false\)/);
 assert.match(src,/expect\(authState\.dialogHidden\)\.toBe\(true\)/);
 assert.match(src,/expect\(await action\.evaluate\(button=>!!button\.closest\('\[inert\]'\)\)\)\.toBe\(false\)/);
});
