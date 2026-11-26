// Build an isolated static homepage candidate. Never run on the production checkout.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||'');
if(!process.argv[2]||root===process.cwd()||!fs.existsSync(path.join(root,'.toolya-perf-candidate')))throw Error('Use an explicitly marked isolated candidate directory');
const esbuild=require(process.env.ESBUILD_PATH||'esbuild');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const write=(p,s)=>{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),s);};
const images=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
const generated=new Set(Object.values(images.mapping));const stats=[];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function asset(name,ext,bytes,originalBytes){
 const data=Buffer.from(bytes),p='assets/perf/'+name+'.'+sha(data)+'.'+ext;
 write(p,data);generated.add(p);stats.push({name,originalBytes,bytes:data.length,path:p});return '/'+p;
}
const cssFiles=['assets/helferlein-b3-startseite.css','assets/helferlein-accessibility.css','assets/toolya-home.css','assets/toolya-home-guides.css','assets/toolya-settings.css','shared/toolya/alpha.css','shared/toolya/i18n/switcher.css'];
function cssSource(p){
 const raw=read(p);
 if(/@import\b|@charset\b|@namespace\b/i.test(raw))throw Error('Unexpected CSS import or namespace: '+p);
 // Existing static CSS URLs are relative paths; preserve their original resolution.
 return raw.replace(/url\(\s*(?:(["'])(.*?)\1|([^)"']+))\s*\)/g,(m,q,a,b)=>{
  const value=(a??b).trim();
  if(/^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(value))return m;
  const absolute=new URL(value,'https://toolya.app/'+p);
  return 'url("'+absolute.pathname+absolute.search+absolute.hash+'")';
 });
}
const minCSS=src=>esbuild.transformSync(src,{loader:'css',minify:true,legalComments:'inline',target:['chrome100','firefox100','safari15']}).code;
const utility='assets/toolya-home-utilities.css';
const utilityURL=asset('home-utilities','css',minCSS(cssSource(utility)),Buffer.byteLength(read(utility)));
const group=cssFiles.map(cssSource).join('\n');
const groupURL=asset('home-styles','css',minCSS(group),cssFiles.reduce((n,p)=>n+Buffer.byteLength(read(p)),0));
const scripts=['assets/helferlein-b3-startseite.js','assets/helferlein-accessibility.js','assets/helferlein-dialogs.js','assets/toolya-pwa.js'];
const js=new Map();
for(const p of scripts){
 const source=read(p);
 if(/\bcurrentScript\b/.test(source))throw Error('Unexpected currentScript dependency: '+p);
 const code=esbuild.transformSync(source,{loader:'js',minifyWhitespace:true,minifyIdentifiers:false,minifySyntax:false,legalComments:'inline',target:'esnext'}).code;
 js.set(p,asset(path.basename(p,'.js'),'js',code,Buffer.byteLength(source)));
}
for(const p of ['index.html','en/index.html']){
 let html=read(p);const original=html;
 const normalize=s=>s.replace(/^\//,'').split('?')[0];
 const seen=[];
 html=html.replace(/<link\b[^>]*\brel="stylesheet"[^>]*>/gi,tag=>{
  const href=tag.match(/\bhref="([^"]+)"/)?.[1];if(!href)return tag;
  const key=normalize(href);
  if(key===utility)return tag.replace(href,utilityURL);
  if(!cssFiles.includes(key))return tag;
  seen.push(key);return seen.length===1?tag.replace(href,groupURL):'';
 });
 assert.deepEqual(seen,cssFiles,p+' CSS cascade order changed');
 html=html.replace(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/gi,(tag,src)=>{
  const target=js.get(normalize(src));return target?tag.replace(src,target):tag;
 });
 for(const [source,dest] of Object.entries(images.mapping)){
  // Only HTML attribute/srcset paths, not arbitrary inline scripts or data.
  const literal=source.replace(/[.*+?^$\x7b\x7d()|[\]\\]/g,'\\$&');
  html=html.replace(/<(?:img|link)\b[^>]*>/gi,tag=>tag.replace(new RegExp('(?:\\/)?'+literal+'(?=[\\s",])','g'),'/'+dest));
 }
 const inline=s=>[...s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(x=>x.trim());
 assert.deepEqual(inline(html),inline(original),'inline app and JSON-LD must be identical');
 const hero=html.match(/<img class="ty-hero-art"[\s\S]*?>/)[0],pre=html.match(/<link rel="preload" as="image"[^>]*>/)[0];
 assert.equal(hero.match(/srcset="([^"]+)"/)[1],pre.match(/imagesrcset="([^"]+)"/)[1]);
 assert.equal(hero.match(/sizes="([^"]+)"/)[1],pre.match(/imagesizes="([^"]+)"/)[1]);
 write(p,html);
}
const report={images:images.images,staticAssets:stats,files:[...generated].sort(),html:['index.html','en/index.html']};
write('assets/perf/manifest.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({imageSavings:images.images.reduce((s,x)=>s+x.originalBytes-x.bytes,0),staticSavings:stats.reduce((s,x)=>s+x.originalBytes-x.bytes,0),generated:report.files.length,cssRequestsBefore:8,cssRequestsAfter:2}));
