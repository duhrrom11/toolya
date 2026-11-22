import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {panArea,calculatePanResize} from '../../shared/toolya/i18n/pan-calculator.mjs';

test('10-inch round recipe into 8-inch round pan gives factor 0.64',()=>{
 const r=calculatePanResize({sourceShape:'round',targetShape:'round',sourceLength:10,targetLength:8,amount:250});
 assert.ok(Math.abs(r.factor-0.64)<1e-10);
 assert.ok(Math.abs(r.amount-160)<1e-10);
});
test('rectangle comparisons and mixed shapes use actual base areas',()=>{
 const r=calculatePanResize({sourceShape:'rect',targetShape:'rect',sourceLength:20,sourceWidth:10,targetLength:10,targetWidth:10,amount:100});
 assert.equal(r.factor,0.5);assert.equal(r.amount,50);
 const mixed=calculatePanResize({sourceShape:'round',targetShape:'rect',sourceLength:20,targetLength:10,targetWidth:10,amount:null});
 assert.ok(Math.abs(mixed.factor-(1/Math.PI))<1e-10);
 assert.equal(mixed.amount,null);
});
test('invalid and nonsensical measurements are rejected',()=>{
 assert.throws(()=>panArea('round',0),RangeError);
 assert.throws(()=>panArea('square',2),RangeError);
 assert.throws(()=>panArea('rect',2,0),RangeError);
 assert.throws(()=>panArea('round',501),RangeError);
 assert.throws(()=>calculatePanResize({sourceShape:'round',targetShape:'round',sourceLength:20,targetLength:20,amount:-1}),RangeError);
});
test('public page mounts accessible browser calculator without service or storage dependency',()=>{
 const path=resolve(import.meta.dirname,'../../en/cake-pan-calculator/index.html');
 const html=readFileSync(path,'utf8');
 assert.ok(html.includes('id="ty-en-pan-calculator"'));
 assert.ok(html.includes('href="#calculator"'));
 assert.ok(html.includes('aria-live="polite"'));
 assert.ok(html.includes('pan-calculator.mjs'));
 const js=readFileSync(resolve(import.meta.dirname,'../../shared/toolya/i18n/pan-calculator.mjs'),'utf8');
 assert.doesNotMatch(js,/supabase|localStorage|fetch\(|XMLHttpRequest/);
});
