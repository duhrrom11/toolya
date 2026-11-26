const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||'');
if(!process.argv[2]||root===process.cwd()||!fs.existsSync(path.join(root,'.toolya-perf-candidate')))throw Error('Isolated candidate required');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/perf/manifest.json'),'utf8'));
const map={};
for(const p of manifest.files){
 const match=/^assets\/perf\/[a-z0-9-]+\.([a-f0-9]{64})\.(css|js|webp)$/.exec(p);
 assert.ok(match,p);
 const data=fs.readFileSync(path.join(root,p));
 assert.equal(crypto.createHash('sha256').update(data).digest('hex'),match[1],p);
 map['/'+p]=match[1];
}
const version=crypto.createHash('sha256').update(JSON.stringify(map)).digest('hex').slice(0,16);
const swPath=path.join(root,'sw.js');
const sw=fs.readFileSync(swPath,'utf8');
assert.ok(sw.includes('Never cache authenticated HTML'));
assert.ok(!sw.includes('const PERF_ASSETS'));
const template=fs.readFileSync(path.join(__dirname,'public-static-cache-template.js'),'utf8');
fs.writeFileSync(swPath,sw+'\n'+template.replace('__PERF_ASSET_MAP__',JSON.stringify(map)).replace('__PERF_VERSION__',version));
