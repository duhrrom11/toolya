import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const patterns={csv:/text\/csv|application\/csv|\.csv\b|exportCsv|\b(?:export\s+)?function\s+csv\s*\(/i,json:/application\/json|exportBackup/i,pdf:/application\/pdf|jsPDF|\.pdf\b/i,qr:/QRCode|qrcode/i,print:/window\.print|\.print\(/i,download:/createObjectURL|\.download\s*=/i};
test('tracked application export candidate inventory (review only)',()=>{
 const tracked=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(p=>/^(tools|assets|shared|dashboard|admin-stats-dashboard|supabase\/functions)\//.test(p)&&/\.(html|js|mjs|cjs|ts)$/.test(p)&&!/(^|\/)(vendor|node_modules|tests?|fixtures)(\/|$)|\.min\.js$|\.test\./.test(p));
 const candidates=[];
 for(const path of tracked){
  const lines=readFileSync(resolve(root,path),'utf8').split('\n');
  for(const [i,line] of lines.entries()){
   const kinds=Object.entries(patterns).filter(([,re])=>re.test(line)).map(([kind])=>kind);
   if(kinds.length)candidates.push({path,line:i+1,kinds});
  }
 }
 const dir=resolve(root,'test-results/i18n-quality');mkdirSync(dir,{recursive:true});
 writeFileSync(resolve(dir,'export-candidates.json'),JSON.stringify({scope:'Static candidate locations only; not runtime export acceptance. JSON API and QR rendering may be false positives; indirect exports may be missed.',filesScanned:tracked.length,candidates},null,2)+'\n');
 const byKind=Object.fromEntries(Object.keys(patterns).map(kind=>[kind,candidates.filter(x=>x.kinds.includes(kind)).length]));
 console.log('EXPORT INVENTORY '+JSON.stringify({filesScanned:tracked.length,candidates:candidates.length,byKind}));
 assert.ok(candidates.some(x=>x.path==='tools/budget/index.html'&&x.kinds.includes('csv')));
 assert.ok(candidates.some(x=>x.path==='supabase/functions/wishlist-discovery/model.mjs'&&x.kinds.includes('csv')));
 assert.ok(candidates.some(x=>x.path==='assets/estate-owner.js'&&x.kinds.includes('print')));

});
