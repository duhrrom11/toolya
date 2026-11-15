// Build a reviewed, static Toolya product card from the existing Amazon scraper.
// Usage: node scripts/amazon-catalog-import.mjs <tool-slug> <amazon.de/dp/ASIN URL>
// Run by a maintainer only. Never expose login credentials in this script.
import {scrape} from '../supabase/functions/amazon-scrape/core.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const [tool,raw]=process.argv.slice(2);
const allowed=new Set(['baking','budget','car','estate','housemates','loans','meters','moving','parking','pet-health','plants']);
if(!allowed.has(tool)||!raw){console.error('Usage: node scripts/amazon-catalog-import.mjs <tool> <Amazon product URL>');process.exit(2)}
const result=await scrape(raw);
if(result.kind!=='product'||!result.complete||result.products.length!==1)throw Error('Product not verified');
const p=result.products[0];
if(!p.imageUrl||!p.title||!p.asin||!p.productUrl)throw Error('Product image/title/ASIN missing: not publishing');
const file='shared/toolya/amazon-catalog.json';
let catalog={};try{catalog=JSON.parse(await readFile(file,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
const list=Array.isArray(catalog[tool])?catalog[tool]:[];
const item={asin:p.asin,title:p.title,imageUrl:p.imageUrl,productUrl:p.productUrl,source:'amazon-scrape',scrapedAt:p.scrapedAt};
catalog[tool]=[...list.filter(x=>x.asin!==p.asin),item];
await mkdir('shared/toolya',{recursive:true});
await writeFile(file,JSON.stringify(catalog,null,2)+'\n');
console.log('Added',p.asin,'to',tool,'— review image usage rights before publishing.');
