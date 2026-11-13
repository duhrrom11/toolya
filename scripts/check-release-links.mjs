// Release-only local asset/link audit. No external requests or deployment.
import {existsSync,readdirSync,readFileSync,statSync} from 'node:fs';
import {dirname,extname,join,resolve,relative,sep} from 'node:path';
const root=resolve('.release-preview');const files=[];
function walk(d){for(const n of readdirSync(d)){const p=join(d,n);if(statSync(p).isDirectory())walk(p);else files.push(p)}}walk(root);
const failures=[],warnings=[];let checked=0;
for(const file of files){
 const ext=extname(file).toLowerCase();if(!['.html','.css'].includes(ext))continue;
 const source=readFileSync(file,'utf8');
 const links=[];
 if(ext==='.html'){
  const re=/<(?:script|link|img|source|iframe|a)\b[^>]*?\b(?:src|href)\s*=\s*["']([^"']+)["']/gi;
  for(const m of source.matchAll(re))links.push(m[1]);
 }
 if(ext==='.css'){
  for(const m of source.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi))links.push(m[1].trim());
 }
 for(const value of links){
  if(!value||/^(?:https?:|data:|blob:|mailto:|tel:|javascript:|#|\/\/)/i.test(value)||value.includes('${'))continue;
  const clean=value.split(/[?#]/)[0];if(!clean)continue;
  let decoded;try{decoded=decodeURIComponent(clean.replace(/&amp;/g,'&'))}catch{warnings.push(relative(root,file)+': invalid URL encoding '+value);continue}
  const target=decoded.startsWith('/')?resolve(root,'.'+decoded):resolve(dirname(file),decoded);
  if(target!==root&&!target.startsWith(root+sep)){failures.push(relative(root,file)+': path escapes preview '+value);continue}
  checked++;
  if(!existsSync(target)&&!existsSync(join(target,'index.html'))){failures.push(relative(root,file)+': missing '+value)}
 }
}
console.log('STATIC_LINK_AUDIT files='+files.length+' links='+checked+' errors='+failures.length+' warnings='+warnings.length);
for(const w of warnings.slice(0,25))console.warn('WARN '+w);
for(const f of failures.slice(0,100))console.error('BROKEN '+f);
if(failures.length)process.exitCode=1;
