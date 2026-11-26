// One-time migration helper and reproducible audit; no network or database access.
'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const version='2.119.2',old='2.57.0';
const apply=process.argv.includes('--apply'),report=[];
const runtime=p=>/^(?:tools\/|dashboard\/|admin-stats-dashboard\/|assets\/|shared\/|en\/)/.test(p)||!p.includes('/');
const excluded=p=>/^(?:tests\/|test-results\/|staging\/|archive\/|node_modules\/|\.git\/)/.test(p)||p.startsWith('assets/vendor/');
const classic=new Set(['moving','housemates','plants','baking','budget','car','loans','meters','parking','pet-health'].map(x=>'tools/'+x+'/index.html'));
const sdkTag=/<script\b([^>]*\bsrc=(["'])([^"']*assets\/vendor\/supabase-2\.119\.2\.js)\2[^>]*)><\/script>/gi;
const changes=[];
for(const p of files){
 if(!fs.existsSync(p)||!runtime(p)||excluded(p)||!/\.(html|m?js)$/.test(p))continue;
 const before=fs.readFileSync(p,'utf8');let next=before;
 if(p.endsWith('.html')){
  next=next.replaceAll('assets/vendor/supabase-'+old+'.js','assets/vendor/supabase-'+version+'.js');
  if(!next.includes('shared/toolya/supabase-client.js'))next=next.replace(sdkTag,(tag,attrs,quote,src)=>{
   if(/\basync\b/.test(attrs))throw new Error('Async SDK requires manual migration: '+p);
   const helper=src.replace('assets/vendor/supabase-'+version+'.js','shared/toolya/supabase-client.js');
   return tag+'<script src="'+helper+'"'+(/\bdefer\b/.test(attrs)?' defer':'')+'></script>';
  });
  if(classic.has(p)&&!next.includes('window.toolyaAuth ? window.toolyaAuth.get(SUPABASE_URL, SUPABASE_ANON_KEY)')){
   const needle='supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)';
   if(next.split(needle).length!==2)throw new Error('Unexpected client code: '+p);
   next=next.replace(needle,'(window.toolyaAuth ? window.toolyaAuth.get(SUPABASE_URL, SUPABASE_ANON_KEY) : '+needle+')');
  }
  if((p==='index.html'||p==='en/index.html')&&!next.includes('window.toolyaAuth.get(SUPABASE_URL, SUPABASE_ANON_KEY)')){
   next=next.replace('window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) ?? null','window.toolyaAuth ? window.toolyaAuth.get(SUPABASE_URL, SUPABASE_ANON_KEY) : (window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) ?? null)');
   next=next.replace('async function withAccountDeadline(operation) {','async function withAccountDeadline(operation) {\n            if(window.toolyaAuth)return window.toolyaAuth.deadline(operation);');
  }
 }
 if(next!==before){changes.push(p);if(apply)fs.writeFileSync(p,next)}
 if(/supabase-2\.|@supabase\/supabase-js|(?:supabase|Supabase)\??\.createClient|toolyaAuth\.get|toolya-locale-v1|i18n\/[\w-]+entry\.mjs|auth-page-gate\.js|settingsModal/.test(next)){
  report.push({path:p,sdk:[...new Set(next.match(/supabase-2\.\d+\.\d+\.js|@supabase\/supabase-js(?:@[\w.]+)?/g)||[])],sharedClient:next.includes('shared/toolya/supabase-client.js')||next.includes('toolyaAuth.get'),directClientCalls:(next.match(/(?:supabase|Supabase)\??\.createClient\s*\(/g)||[]).length,privateGate:next.includes('auth-page-gate.js'),locales:[...new Set(next.match(/i18n\/[\w-]+entry\.mjs/g)||[])],settings:next.includes('settingsModal')||next.includes('settings-modal')});
 }
}
// Only exact former vendor filename references in current test/tooling code.
// Preserve old-version probes and compatibility regexes (already match both).
for(const p of files){
 if(!/^(tests|scripts)\//.test(p)||!/\.(cjs|mjs|js)$/.test(p)||p===__filename||p==='scripts/platform-foundation-audit.cjs'||!fs.existsSync(p))continue;
 const before=fs.readFileSync(p,'utf8');
 let next=before.replaceAll('supabase-2.57.0.js','supabase-2.119.2.js').replaceAll('supabase-2\\.57\\.0\\.js','supabase-2\\.119\\.2\\.js');
 if(next!==before){changes.push(p);if(apply)fs.writeFileSync(p,next)}
}
const unresolved=report.filter(r=>r.sdk.some(v=>v==='supabase-2.57.0.js'||v.startsWith('@supabase/supabase-js')));
const out={version,changes:changes.sort(),inventory:report.sort((a,b)=>a.path.localeCompare(b.path)),remainingSdkReferences:unresolved};
if(apply)fs.writeFileSync('platform-foundation-audit.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({changed:changes.length,inventory:report.length,remainingSdkReferences:unresolved},null,2));
