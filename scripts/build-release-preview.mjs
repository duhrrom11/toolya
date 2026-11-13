// Build-only, fail-closed static release preparation. No deployment, no source mutation.
import {cpSync,existsSync,mkdirSync,readdirSync,readFileSync,rmSync,statSync} from 'node:fs';
import {join,relative} from 'node:path';
const src='staging',out='.release-preview';
if(!existsSync(join(src,'index.html')))throw Error('staging/index.html missing');
rmSync(out,{recursive:true,force:true});mkdirSync(out,{recursive:true});cpSync(src,out,{recursive:true});
const problems=[];let files=0;
function walk(dir){for(const entry of readdirSync(dir)){const path=join(dir,entry);if(statSync(path).isDirectory()){walk(path);continue}files++;if(!/\.(html|js|css|json|xml|txt|webmanifest)$/i.test(path))continue;const body=readFileSync(path,'utf8');if(body.includes('avapuibsidubuzxjtyld'))problems.push(relative(out,path)+': Helferlein production Supabase reference');if(body.includes('duhrrom11.github.io/Helferlein'))problems.push(relative(out,path)+': legacy Helferlein public URL');}}
walk(out);
console.log('Prepared static preview files:',files);
if(problems.length){console.error('RELEASE BLOCKED: '+problems.length+' unsafe references');for(const x of problems.slice(0,80))console.error(x);process.exitCode=1}else console.log('No legacy production refs found (additional browser checks still required)');
