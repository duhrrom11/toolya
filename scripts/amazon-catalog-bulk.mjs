import {scrape} from '../supabase/functions/amazon-scrape/core.mjs';
import {readFile,writeFile} from 'node:fs/promises';
const root='shared/toolya/';
const candidates=JSON.parse(await readFile(root+'amazon-candidates.json','utf8'));
const catalog=JSON.parse(await readFile(root+'amazon-catalog.json','utf8'));
let success=0,failed=0;
for(const [tool,items] of Object.entries(candidates)){
 if(!/^[a-z-]+$/.test(tool)||!Array.isArray(items))throw Error('Invalid candidates: '+tool);
 const existing=Array.isArray(catalog[tool])?catalog[tool]:[];
 for(const item of items){
  if(!/^[A-Z0-9]{10}$/.test(item.asin||''))throw Error('Invalid ASIN for '+tool);
  try{
   const result=await scrape('https://www.amazon.de/dp/'+item.asin);
   const p=result.products?.[0];
   if(!result.complete||p?.asin!==item.asin||!p.title||!p.imageUrl)throw Error('Incomplete product');
   if(item.label){const words=item.label.toLocaleLowerCase('de').split(/[^\\p{L}\\p{N}]+/u).filter(x=>x.length>=3);const title=p.title.toLocaleLowerCase('de');if(words.length&&!words.some(word=>title.includes(word)))throw Error('Product title does not match expected product');}
   const record={asin:p.asin,title:p.title,imageUrl:p.imageUrl,productUrl:p.productUrl,source:'amazon-scrape',scrapedAt:p.scrapedAt};
   const at=existing.findIndex(x=>x.asin===p.asin);
   if(at>=0)existing[at]=record;else existing.push(record);
   success++;console.log('OK',tool,p.asin);
  }catch(e){failed++;console.warn('SKIP',tool,item.asin,String(e.message).slice(0,120))}
 }
 if(existing.length)catalog[tool]=existing;
}
if(success)await writeFile(root+'amazon-catalog.json',JSON.stringify(catalog,null,2)+'\n');
console.log('Import completed:',success,'products;',failed,'skipped. Existing catalog retained.');
if(failed)process.exitCode=0;
