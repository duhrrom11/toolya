import {parseHTML} from 'linkedom';
export class ScrapeError extends Error {constructor(code,message){super(message);this.code=code;}}
export function normalizeAmazonUrl(raw){
 let u;try{u=new URL(raw)}catch{throw new ScrapeError('INVALID_URL','Bitte einen gültigen Amazon.de-Link eingeben.');}
 if(typeof raw!=='string'||raw.length>2048||u.protocol!=='https:'||!['amazon.de','www.amazon.de','m.amazon.de'].includes(u.hostname)||u.username||u.password||u.port)throw new ScrapeError('INVALID_URL','Nur vollständige HTTPS-Links von Amazon.de sind erlaubt.');
 const list=u.pathname.match(/^\/(?:hz\/wishlist\/ls|gp\/registry\/wishlist)\/([A-Z0-9]{8,40})(?:\/|$)/i);
 if(list)return {kind:'list',id:list[1],url:`https://www.amazon.de/hz/wishlist/ls/${list[1]}`};
 const product=u.pathname.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})(?:\/|$)/i);
 if(product)return {kind:'product',id:product[1].toUpperCase(),url:`https://www.amazon.de/dp/${product[1].toUpperCase()}`};
 throw new ScrapeError('INVALID_URL','Bitte einen Produktlink oder einen freigegebenen Wunschlistenlink von Amazon.de eingeben.');
}
export function wishlistContinuation(raw,source){
 let u;try{u=new URL(raw,'https://www.amazon.de')}catch{throw new ScrapeError('BAD_PAGINATION','Ungültige Folgeseite.');}
 if(u.protocol!=='https:'||!['amazon.de','www.amazon.de','m.amazon.de'].includes(u.hostname)||u.username||u.password||u.port||u.href.length>8192)throw new ScrapeError('BAD_PAGINATION','Unsichere Folgeseite abgelehnt.');
 if(u.pathname==='/hz/wishlist/slv/items'){
  if(u.searchParams.get('lid')?.toUpperCase()!==source.id.toUpperCase()||!u.searchParams.get('paginationToken'))throw new ScrapeError('BAD_PAGINATION','Folgeseite gehört nicht zu dieser Liste.');
  const allowed=new Set(['filter','paginationToken','itemsLayout','sort','type','lid']);
  for(const key of [...u.searchParams.keys()])if(!allowed.has(key))u.searchParams.delete(key);
  u.hostname='www.amazon.de';u.hash='';return u.href;
 }
 const normalized=normalizeAmazonUrl(u.href);if(normalized.kind!=='list'||normalized.id.toUpperCase()!==source.id.toUpperCase())throw new ScrapeError('BAD_PAGINATION','Folgeseite gehört nicht zu dieser Liste.');return u.href;
}
const text=(node,max=250)=>Array.from(node?.textContent?.replace(/\s+/g,' ').trim()||'').slice(0,max).join('');
export function safeImage(raw){try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&['m.media-amazon.com','images-eu.ssl-images-amazon.com','images-na.ssl-images-amazon.com','images.ssl-images-amazon.com'].includes(u.hostname)?u.href:null}catch{return null}}
// Strict parsing prevents prices from quantities, crossed-out offers, or unrelated text.
export function parsePrice(raw){
 if(typeof raw==='number')return Number.isFinite(raw)&&raw>=0&&raw<=999999?raw:null;
 if(typeof raw!=='string')return null;
 let value=raw.replace(/\u00a0/g,' ').trim();
 if(!/[0-9]/.test(value)||/\b(?:ab|statt|uvp|pro\s+stück)\b/i.test(value))return null;
 value=value.replace(/(?:EUR|€)/gi,'').replace(/\s/g,'');
 if(!/^\d{1,3}(?:[.\u2009]\d{3})*(?:,\d{1,2})?$/.test(value)&&!/^\d+(?:[.,]\d{1,2})?$/.test(value))return null;
 if(value.includes(','))value=value.replace(/[.\u2009]/g,'').replace(',','.');
 else if(/^\\d{1,3}(?:\\.\\d{3})+$/.test(value))value=value.replace(/\\./g,'');
 const n=Number(value);return Number.isFinite(n)&&n>=0&&n<=999999?n:null;
}
function pricedAttributes(node){
 for(const key of ['data-price','data-item-price','data-price-amount']){
  const value=node?.getAttribute?.(key);
  if(value!=null){const price=parsePrice(value);if(price!=null)return price;}
 }
 return null;
}
function priceFromMarkup(root){
 for(const selector of [
  '.priceToPay .a-offscreen','#corePriceDisplay_desktop_feature_div .priceToPay .a-offscreen',
  '#corePrice_feature_div .a-price:not(.a-text-price) .a-offscreen',
  '#corePriceDisplay_desktop_feature_div .a-price:not(.a-text-price) .a-offscreen',
  '.a-price:not(.a-text-price) .a-offscreen',
  '[id^="itemPrice"] .a-offscreen','[id^="itemPrice"]',
  '#priceblock_ourprice','#priceblock_dealprice'
 ]){
  for(const node of root.querySelectorAll(selector)){
   const parsed=parsePrice(text(node,80));if(parsed!==null)return parsed;
  }
 }
 for(const node of root.querySelectorAll('.priceToPay,.a-price:not(.a-text-price)')){
  const whole=text(node.querySelector('.a-price-whole'),40).replace(/[.,]$/,'');
  const fraction=text(node.querySelector('.a-price-fraction'),5);
  if(whole&&/^\d{1,3}(?:\.\d{3})*$|^\d+$/.test(whole)&&/^\d{2}$/.test(fraction)){
   const parsed=parsePrice(whole+','+fraction);if(parsed!==null)return parsed;
  }
 }
 return pricedAttributes(root);
}
function flattenJsonLd(node){
 if(Array.isArray(node))return node.flatMap(flattenJsonLd).slice(0,32);
 if(node&&typeof node==='object')return [node,...flattenJsonLd(node['@graph']||[])].slice(0,32);
 return [];
}
function productStructuredData(document,asin){
 for(const script of [...document.querySelectorAll('script[type="application/ld+json"]')].slice(0,8)){
  let parsed;try{if((script.textContent||'').length>80000)continue;parsed=JSON.parse(script.textContent)}catch{continue}
  for(const node of flattenJsonLd(parsed)){
   const type=Array.isArray(node['@type'])?node['@type']:[node['@type']];
   if(!type.some(t=>typeof t==='string'&&/(^|\/)Product$/i.test(t)))continue;
   const explicitId=[node.asin,node.sku,node.productID].filter(Boolean);
   if(explicitId.length&&!explicitId.some(x=>String(x).toUpperCase()===asin))continue;
   const offers=Array.isArray(node.offers)?node.offers:[node.offers];
   let price=null;
   for(const offer of offers){
    if(!offer||typeof offer!=='object'||(offer.priceCurrency&&offer.priceCurrency!=='EUR'))continue;
    price=parsePrice(offer.price??offer.lowPrice);if(price!==null)break;
   }
   const description=typeof node.description==='string'?node.description.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,1000):'';
   return {price,description};
  }
 }
 return {price:null,description:''};
}
function doc(html){if(typeof html!=='string'||html.length>3000000)throw new ScrapeError('TOO_LARGE','Amazon-Antwort ist zu groß.');const {document:d}=parseHTML(/<html\b/i.test(html)?html:'<html><body>'+html+'</body></html>');if(d.querySelector('form[action*="validateCaptcha"],#captchacharacters')||/robot check|automatisierte zugriffe|enter the characters you see/i.test(text(d.body,10000)))throw new ScrapeError('BLOCKED','Amazon blockiert den Abruf oder verlangt eine Prüfung. Bitte später erneut versuchen.');return d;}
const pick=(root,selectors)=>selectors.split(',').map(selector=>root.querySelector(selector)).find(Boolean)||null;
function productData(root,asin){
 const titleNode=pick(root,'#productTitle,[id^="itemName"],.a-link-normal[title],.product-title');
 const title=text(titleNode)||titleNode?.getAttribute('title')?.trim().slice(0,250);
 const img=pick(root,'#landingImage,#imgBlkFront,img[data-a-dynamic-image],.g-itemImage img,img');
 let imageUrl=safeImage(img?.getAttribute('data-old-hires'))||safeImage(img?.getAttribute('data-src'))||safeImage(img?.getAttribute('src'));
 if(!imageUrl)try{imageUrl=Object.keys(JSON.parse(img?.getAttribute('data-a-dynamic-image')||'{}')).map(safeImage).find(Boolean)||null}catch{}
 const price=priceFromMarkup(root);
 const description=text(pick(root,'#feature-bullets,#featurebullets_feature_div,#productDescription,#productOverview_feature_div,[id^="itemComment"],[id^="itemDescription"],.g-item-comment,.g-itemComment,.item-comment,.item-description,[data-item-description]'),1000) || text({textContent:root.getAttribute?.('data-item-description')||''},1000);
 const quantityNode=pick(root,'[id^="itemRequestedQty"],[id^="itemRequested_"],[data-quantity]');const quantityText=quantityNode?.getAttribute('data-quantity')||text(quantityNode,100);const quantityMatch=quantityText?.match(/\d+/);const quantity=quantityMatch?Math.min(999,Math.max(1,Number(quantityMatch[0]))):1;
 return title?{asin,marketplace:'amazon.de',title,imageUrl,price,currency:'EUR',description,quantity,productUrl:`https://www.amazon.de/dp/${asin}?tag=duhrrom-21`,scrapedAt:new Date().toISOString()}:null;
}
export function parseProduct(html,asin){const d=doc(html);const canonical=d.querySelector('link[rel="canonical"]')?.getAttribute('href');if(canonical){let c;try{c=normalizeAmazonUrl(canonical)}catch{}if(c?.kind==='product'&&c.id!==asin)throw new ScrapeError('MISMATCH','Amazon hat ein anderes Produkt geliefert.');}const p=productData(d,asin);if(!p||!d.querySelector('#productTitle'))throw new ScrapeError('UNAVAILABLE','Produktdaten konnten nicht eindeutig gelesen werden.');
 const structured=productStructuredData(d,asin);
 if(p.price===null)p.price=structured.price;
 if(!p.description&&structured.description)p.description=structured.description;
 return p;}
export function parseList(html,source){
 const d=doc(html),products=new Map();let failed=0;
 const rows=[...d.querySelectorAll('[id^="item_"][data-itemid],li[data-itemid],.g-item-sortable')];
 for(const row of rows){let asin=row.getAttribute('data-asin');if(!/^[A-Z0-9]{10}$/.test(asin||'')){for(const a of row.querySelectorAll('a[href]'))try{const p=normalizeAmazonUrl(new URL(a.getAttribute('href'),'https://www.amazon.de').href);if(p.kind==='product'){asin=p.id;break}}catch{}}
 if(!/^[A-Z0-9]{10}$/.test(asin||'')){failed++;continue;}const p=productData(row,asin);if(p)products.set(asin,p);else failed++;}
 let next=null,scroll=null;
 for(const script of d.querySelectorAll('script[data-a-state]')){try{if(JSON.parse(script.getAttribute('data-a-state')).key==='scrollState')scroll=JSON.parse(script.textContent);}catch{}}
 const nextInput=d.querySelector('input[name="showMoreUrl"]');
 const rawNext=nextInput?.getAttribute('value')||scroll?.showMoreUrl;
 // Amazon can leave a base showMoreUrl on its final page; the empty cursor is authoritative.
 let terminal=!!((scroll&&'lastEvaluatedKey' in scroll&&!scroll.lastEvaluatedKey)||(nextInput&&nextInput.getAttribute('value')===''));
 if(rawNext&&!terminal){
  const candidate=new URL(rawNext,'https://www.amazon.de');
  if(candidate.pathname==='/hz/wishlist/slv/items'&&candidate.searchParams.get('lid')===source.id&&candidate.searchParams.has('paginationToken')&&!candidate.searchParams.get('paginationToken'))terminal=true;
  else next=wishlistContinuation(rawNext,source);
 }
 for(const a of d.querySelectorAll('.a-pagination .a-last:not(.a-disabled) a,a[rel="next"],a.wl-see-more,[id*="showMore"] a,a[href*="lastEvaluatedKey"],a[href*="paginationToken"]')){try{const u=new URL(a.getAttribute('href'),'https://www.amazon.de');const n=normalizeAmazonUrl(u.href);if(!terminal&&!next&&n.kind==='list'&&n.id===source.id){next=u.href;break;}}catch{}}
 // Amazon's AJAX continuation is an explicit completeness signal even when no normal next link exists.
 const continuation=d.querySelector('[data-load-more-url],[data-pagination-token],.wl-see-more,.g-load-more,[data-last-evaluated-key]');
 const title=text(pick(d,'#profile-list-name,#wl-list-info h1,h1'),80)||null;
 const countNode=d.querySelector('#wl-list-entry-count,[data-item-count]');const countText=countNode?.getAttribute('data-item-count')||text(countNode,100);const countMatch=countText?.match(/\d+/);const expected=countMatch?Number(countMatch[0]):null;
 if(!rows.length&&!terminal)throw new ScrapeError('EMPTY_OR_PRIVATE','Keine Produkte gelesen. Die Liste ist leer, privat oder das Amazon-Format wird nicht unterstützt.');
 return {title,expected,products:[...products.values()],next,incomplete:!terminal&&!next&&!!(continuation||scroll?.lastEvaluatedKey),failed};
}
export async function fetchAmazon(url,fetcher=fetch,expectedList=null){const source=expectedList||(normalizeAmazonUrl(url));if(expectedList)url=wishlistContinuation(url,expectedList);const target=new URL(url);if(source.kind==='product'&&target.pathname!==`/dp/${source.id}`)url=source.url;const response=await fetcher(url,{redirect:'manual',signal:AbortSignal.timeout(15000),headers:{'accept-language':'de-DE,de;q=0.9','accept':'text/html','user-agent':'ToolyaWishlistImporter/1.0',...(new URL(url).pathname==='/hz/wishlist/slv/items'?{'x-requested-with':'XMLHttpRequest'}:{})}});if(response.status>=300&&response.status<400)throw new ScrapeError('REDIRECT','Amazon verlangt eine Weiterleitung. Bitte den vollständigen direkten Listen- oder Produktlink verwenden.');if(!response.ok)throw new ScrapeError('AMAZON_ERROR',`Amazon-Abruf fehlgeschlagen (${response.status}).`);if(!response.headers.get('content-type')?.includes('text/html'))throw new ScrapeError('BAD_RESPONSE','Amazon hat keine Produktseite geliefert.');const reader=response.body.getReader();let bytes=0;const chunks=[];try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>3000000)throw new ScrapeError('TOO_LARGE','Amazon-Antwort ist zu groß.');chunks.push(value)}}finally{await reader.cancel()}const joined=new Uint8Array(bytes);let i=0;for(const c of chunks){joined.set(c,i);i+=c.length}return new TextDecoder().decode(joined);}
// Enrich only a small bounded number of missing previews with their actual Amazon product page.
// Never replace wishlist data with ambiguous or blocked product responses.
export async function enrichMissingProductMetadata(items,fetcher=fetch,maxItems=10){
 const candidates=items.filter(p=>p&&(p.price==null||!p.description?.trim())).slice(0,maxItems);
 let next=0,enriched=0;
 await Promise.all(Array.from({length:Math.min(3,candidates.length)},async()=>{
  while(next<candidates.length){
   const item=candidates[next++];
   try{
    const html=await fetchAmazon('https://www.amazon.de/dp/'+item.asin,fetcher);
    const detail=parseProduct(html,item.asin);
    if(detail.asin!==item.asin)continue;
    if(item.price==null&&detail.price!=null){item.price=detail.price;enriched++;}
    if(!item.description?.trim()&&detail.description?.trim()){item.description=detail.description;}
    if(!item.imageUrl&&detail.imageUrl)item.imageUrl=detail.imageUrl;
   }catch{/* A single unavailable Amazon product must not invalidate a complete wishlist. */}
  }
 }));
 return enriched;
}
export async function scrape(raw,fetcher=fetch,options={}){const source=normalizeAmazonUrl(raw);if(source.kind==='product'){const p=parseProduct(await fetchAmazon(source.url,fetcher),source.id);return {kind:'product',title:p.title,products:[p],complete:true,warnings:[]};}
 const products=new Map(),visited=new Set();let url=source.url,title='Amazon-Wunschliste',failed=0,complete=true,expected=null;
 while(url){if(visited.has(url)||visited.size>=20){complete=false;break}visited.add(url);const page=parseList(await fetchAmazon(url,fetcher,source),source);title=page.title||title;expected=page.expected??expected;failed+=page.failed;for(const p of page.products)products.set(p.asin,p);if(products.size>500){complete=false;break}if(page.incomplete)complete=false;url=page.next;}
 if(failed||(expected!==null&&expected!==products.size))complete=false;
 const items=[...products.values()].slice(0,500);
 // Enrichment is opt-in for the server-side public wishlist flow only.
 // Product-detail enrichment runs outside the wishlist transaction to avoid
 // large-list CPU exhaustion. A separate authenticated request handles one ASIN.
 if(complete&&options.enrichMissing===true&&items.length<=4)await enrichMissingProductMetadata(items,(url,request)=>fetcher(url,{...request,signal:AbortSignal.timeout(2000)}),1);
 return {kind:'list',title,products:items,complete,warnings:complete?[]:['Die Liste konnte nicht vollständig gelesen werden. Es wird nichts importiert.']};}
