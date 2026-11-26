'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {parseHTML} = require('linkedom');
const root = path.resolve(__dirname, '..');
const origin = 'https://toolya.app';
const errors = [], warnings = [];
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const fail = (u,m) => errors.push(u+': '+m);
const warn = (u,m) => warnings.push(u+': '+m);
const xml = read('sitemap.xml');
const urls = [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(m=>m[1].trim());
if (!urls.length) fail('sitemap','empty');
if (new Set(urls).size !== urls.length) fail('sitemap','duplicate URLs');
const robots = read('robots.txt');
if (!robots.split(/\r?\n/).some(l=>l.trim() === 'Sitemap: '+origin+'/sitemap.xml')) fail('robots.txt','missing sitemap declaration');
const groups = [];
let group = null;
for (const line of robots.split(/\r?\n/)) {
  const m = line.split('#')[0].match(/^\s*(user-agent|allow|disallow)\s*:\s*(.*?)\s*$/i);
  if (!m) continue;
  if (m[1].toLowerCase()==='user-agent') {
    if (!group || group.rules.length) { group={agents:[],rules:[]}; groups.push(group); }
    group.agents.push(m[2].toLowerCase());
  } else if (group && m[2]) group.rules.push([m[1].toLowerCase(),m[2]]);
}
function blocked(url) {
  const specific=groups.filter(g=>g.agents.includes('googlebot'));
  const rules=(specific.length?specific:groups.filter(g=>g.agents.includes('*'))).flatMap(g=>g.rules);
  const target=url.pathname+url.search;
  const matching=rules.filter(([,r])=>{
    const end=r.endsWith('$'); const raw=end?r.slice(0,-1):r;
    const pattern=raw.split('*').map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*');
    return new RegExp('^'+pattern+(end?'$':'')).test(target);
  }).sort((a,b)=>b[1].length-a[1].length || (a[0]==='allow'?-1:1));
  return matching[0]?.[0]==='disallow';
}
const docs=new Map(), titles=new Map();
for (const u of urls) {
  try {
    const url=new URL(u);
    if(url.origin!==origin || url.search || url.hash) {fail(u,'not a clean canonical URL');continue;}
    if(blocked(url)) fail(u,'blocked for Googlebot');
    let file=decodeURIComponent(url.pathname).slice(1);
    if(!file || file.endsWith('/')) file+='index.html';
    if(!file.endsWith('.html') || !path.resolve(root,file).startsWith(root+path.sep)) {fail(u,'unsupported HTML path');continue;}
    const {document:d}=parseHTML(read(file)); docs.set(u,d);
    const meta=name=>[...d.querySelectorAll('head meta[name]')].filter(n=>n.getAttribute('name').toLowerCase()===name).map(n=>n.getAttribute('content')||'');
    const directives=[...meta('robots'),...meta('googlebot')].join(',').toLowerCase().split(/[\s,]+/);
    if(directives.includes('noindex')||directives.includes('none')) fail(u,'noindex in sitemap');
    const canon=[...d.querySelectorAll('head link[rel="canonical"]')];
    if(canon.length!==1||canon[0].getAttribute('href')!==u) fail(u,'canonical must match sitemap URL exactly');
    if([...d.querySelectorAll('head meta[http-equiv]')].some(n=>n.getAttribute('http-equiv').toLowerCase()==='refresh')) fail(u,'HTML redirect in sitemap');
    const title=d.querySelector('head title')?.textContent.trim();
    if(!title) fail(u,'missing title');
    else { if(titles.has(title)) fail(u,'duplicate title with '+titles.get(title)); titles.set(title,u); if(title.length>60) warn(u,'long title'); }
    const desc=meta('description').join('').trim();
    if(!desc) fail(u,'missing description'); else if(desc.length>160) warn(u,'long description');
    if(d.querySelectorAll('h1').length!==1) fail(u,'expected exactly one H1');
  } catch(e) {fail(u,e.message);}
}
for(const [u,d] of docs) for(const l of d.querySelectorAll('head link[hreflang]')) {
  const lang=l.getAttribute('hreflang'); const target=l.getAttribute('href');
  if(lang==='x-default') continue;
  if(!docs.has(target)) {fail(u,'hreflang target absent from sitemap: '+target);continue;}
  const own=d.documentElement.getAttribute('lang')?.split('-')[0];
  if(![...docs.get(target).querySelectorAll('head link[hreflang]')].some(n=>n.getAttribute('hreflang')===own && n.getAttribute('href')===u)) fail(u,'non-reciprocal hreflang: '+target);
}
for(const p of ['dashboard/index.html','tools/estate/index.html','tools/estate/heirs.html']) {
  try {const {document:d}=parseHTML(read(p)); if(![...d.querySelectorAll('head meta[name="robots"]')].some(n=>/\bnoindex\b/i.test(n.getAttribute('content')||''))) fail(p,'private route missing noindex');}
  catch(e){fail(p,e.message);}
}
for(const w of warnings) console.warn('WARN '+w);
for(const e of errors) console.error('ERROR '+e);
console.log('SEO: '+urls.length+' sitemap URLs, '+errors.length+' errors, '+warnings.length+' warnings');
process.exitCode=errors.length?1:0;
