import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import path from 'node:path';

const target='tools/wishes/app.mjs';
const ids=/\b(?:exportWishesJson|exportWishes)\b/g;
const moduleRefs=/(?:[a-zA-Z0-9_./:@%-]+\/)?app\.mjs(?:[?#][^\s"'<>]*)?/g;
const sourceTypes=/\.(?:html?|[cm]?js|jsx|tsx?|vue|svelte|json|ya?ml|sh|py|toml)$/i;
function resolveRef(file,raw){
 const clean=raw.split(/[?#]/)[0];
 if(/^https?:\/\//i.test(clean)){
  try{return new URL(clean).pathname.replace(/^\/+/,'')}catch{return null}
 }
 if(clean.startsWith('/'))return clean.replace(/^\/+/,'');
 if(clean.startsWith('tools/'))return clean;
 return path.posix.normalize(path.posix.join(path.posix.dirname(file),clean));
}
function inspect(file,source){
 const hits=[];
 for(const [i,line] of source.split(/\r?\n/).entries()){
  for(const m of line.matchAll(moduleRefs)){
   const raw=m[0],resolved=resolveRef(file,raw);
   hits.push({file,line:i+1,kind:resolved===target||raw.includes('tools/wishes/app.mjs')?'target-reference':'generic-app-reference',reference:raw});
  }
  for(const m of line.matchAll(ids))hits.push({file,line:i+1,kind:'export-id',reference:m[0]});
 }
 return hits;
}
test('legacy Wishes static reference scanner resolves local and external references',()=>{
 for(const [file,source] of [
  ['tools/wishes/index.html','<script src="./app.mjs?v=1"></script>'],
  ['tools/other/index.html','import("../wishes/app.mjs")'],
  ['index.html','<script src="/tools/wishes/app.mjs"></script>'],
  ['shared/example.mjs','import("https://toolya.app/tools/wishes/app.mjs")']
 ])assert.ok(inspect(file,source).some(x=>x.kind==='target-reference'),file);
 assert.ok(inspect('index.html','<button id="exportWishesJson">').some(x=>x.kind==='export-id'));
 assert.equal(inspect('tools/other/index.html','<script src="./app.mjs"></script>')[0].kind,'generic-app-reference');
});
test('repository-wide legacy Wishes export static reachability inventory',()=>{
 const root=execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'}).trim();
 const files=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024}).split('\0').filter(Boolean).filter(p=>sourceTypes.test(p));
 assert.ok(files.includes(target),'legacy source must be accounted for');
 const hits=[];
 for(const file of files){
  if(file===target||file==='tests/i18n/legacy-wishes-reachability.test.mjs')continue;
  hits.push(...inspect(file,readFileSync(path.join(root,file),'utf8')));
 }
 const relevant=hits.filter(x=>x.kind!=='generic-app-reference');
 const generic=hits.filter(x=>x.kind==='generic-app-reference');
 console.log('LEGACY WISHES STATIC AUDIT '+JSON.stringify({filesScanned:files.length-2,target,relevant,generic,limitations:['literal reference inventory only','computed paths, generated output and external deployment configuration require separate review','test and build references require classification']}));
 assert.ok(files.length>100,'repository scan must not silently omit source files');
 // Inventory deliberately reports candidates for human classification, not a release waiver.
});
