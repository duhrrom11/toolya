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
const text=(node,max=250)=>Array.from(node?.textContent?.replace(/\s+/g,' ').trim()||'').slice(0,max).join('');
export function safeImage(raw){try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&['m.media-amazon.com','images-eu.ssl-images-amazon.com','images-na.ssl-images-amazon.com','images.ssl-images-amazon.com'].includes(u.hostname)?u.href:null}catch{return null}}
export function parsePrice(raw){if(!raw)return null;let s=raw.replace(/[^\d,.]/g,'');if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');else if(/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');const n=Number(s);return s&&Number.isFinite(n)&&n>=0&&n<=999999?n:null;}
function doc(html){if(typeof html!=='string'||html.length>3000000)throw new ScrapeError('TOO_LARGE','Amazon-Antwort ist zu groß.');const {document:d}=parseHTML(html);if(d.querySelector('form[action*="validateCaptcha"],#captchacharacters')||/robot check|automatisierte zugriffe|enter the characters you see/i.test(text(d.body,10000)))throw new ScrapeError('BLOCKED','Amazon blockiert den Abruf oder verlangt eine Prüfung. Bitte später erneut versuchen.');return d;}
function productData(root,asin){
 const titleNode=root.querySelector('#productTitle,[id^="itemName"],.a-link-normal[title],.product-title');
 const title=text(titleNode)||titleNode?.getAttribute('title')?.trim().slice(0,250);
 const img=root.querySelector('#landingImage,#imgBlkFront,img[data-a-dynamic-image],.g-itemImage img,img');
 let imageUrl=safeImage(img?.getAttribute('data-old-hires'))||safeImage(img?.getAttribute('data-src'))||safeImage(img?.getAttribute('src'));
 if(!imageUrl)try{imageUrl=Object.keys(JSON.parse(img?.getAttribute('data-a-dynamic-image')||'{}')).map(safeImage).find(Boolean)||null}catch{}
 const priceNode=root.querySelector('#corePriceDisplay_desktop_feature_div .a-price:not(.a-text-price) .a-offscreen,#corePrice_feature_div .a-price .a-offscreen,.a-price:not(.a-text-price) .a-offscreen,[id^="itemPrice"],#priceblock_ourprice,#priceblock_dealprice');
 const price=parsePrice(text(priceNode,100));
 const description=text(root.querySelector('#feature-bullets,#productDescription'),1000);
 const quantityNode=root.querySelector('[id^="itemRequestedQty"],[data-quantity]');const quantityText=quantityNode?.getAttribute('data-quantity')||text(quantityNode,100);const quantityMatch=quantityText?.match(/\d+/);const quantity=quantityMatch?Math.min(999,Math.max(1,Number(quantityMatch[0]))):1;
 return title?{asin,marketplace:'amazon.de',title,imageUrl,price,currency:'EUR',description,quantity,productUrl:`https://www.amazon.de/dp/${asin}?tag=duhrrom-21`,scrapedAt:new Date().toISOString()}:null;
}
export function parseProduct(html,asin){const d=doc(html);const canonical=d.querySelector('link[rel="canonical"]')?.getAttribute('href');if(canonical){let c;try{c=normalizeAmazonUrl(canonical)}catch{}if(c?.kind==='product'&&c.id!==asin)throw new ScrapeError('MISMATCH','Amazon hat ein anderes Produkt geliefert.');}const p=productData(d,asin);if(!p||!d.querySelector('#productTitle'))throw new ScrapeError('UNAVAILABLE','Produktdaten konnten nicht eindeutig gelesen werden.');return p;}
export function parseList(html,source){
 const d=doc(html),products=new Map();let failed=0;
 const rows=[...d.querySelectorAll('[id^="item_"][data-itemid],li[data-itemid],.g-item-sortable')];
 for(const row of rows){let asin=row.getAttribute('data-asin');if(!/^[A-Z0-9]{10}$/.test(asin||'')){for(const a of row.querySelectorAll('a[href]'))try{const p=normalizeAmazonUrl(new URL(a.getAttribute('href'),'https://www.amazon.de').href);if(p.kind==='product'){asin=p.id;break}}catch{}}
 if(!/^[A-Z0-9]{10}$/.test(asin||'')){failed++;continue;}const p=productData(row,asin);if(p)products.set(asin,p);else failed++;}
 let next=null;
 for(const a of d.querySelectorAll('.a-pagination .a-last:not(.a-disabled) a,a[rel="next"],a.wl-see-more,[id*="showMore"] a,a[href*="lastEvaluatedKey"],a[href*="paginationToken"]')){try{const u=new URL(a.getAttribute('href'),'https://www.amazon.de');const n=normalizeAmazonUrl(u.href);if(n.kind==='list'&&n.id===source.id){next=u.href;break;}}catch{}}
 // Amazon's AJAX continuation is an explicit completeness signal even when no normal next link exists.
 const continuation=d.querySelector('[data-load-more-url],[data-pagination-token],.wl-see-more,.g-load-more,[data-last-evaluated-key]');
 const title=text(d.querySelector('#profile-list-name,#wl-list-info h1,h1'),80)||'Amazon-Wunschliste';
 const countNode=d.querySelector('#wl-list-entry-count,[data-item-count]');const countText=countNode?.getAttribute('data-item-count')||text(countNode,100);const countMatch=countText?.match(/\d+/);const expected=countMatch?Number(countMatch[0]):null;
 if(!rows.length)throw new ScrapeError('EMPTY_OR_PRIVATE','Keine Produkte gelesen. Die Liste ist leer, privat oder das Amazon-Format wird nicht unterstützt.');
 return {title,expected,products:[...products.values()],next,incomplete:!!continuation&&!next,failed};
}
export async function fetchAmazon(url,fetcher=fetch){const source=normalizeAmazonUrl(url);const target=new URL(url);if(source.kind==='product'&&target.pathname!==`/dp/${source.id}`)url=source.url;const response=await fetcher(url,{redirect:'manual',signal:AbortSignal.timeout(15000),headers:{'accept-language':'de-DE,de;q=0.9','accept':'text/html','user-agent':'ToolyaWishlistImporter/1.0'}});if(response.status>=300&&response.status<400)throw new ScrapeError('REDIRECT','Amazon verlangt eine Weiterleitung. Bitte den vollständigen direkten Listen- oder Produktlink verwenden.');if(!response.ok)throw new ScrapeError('AMAZON_ERROR',`Amazon-Abruf fehlgeschlagen (${response.status}).`);if(!response.headers.get('content-type')?.includes('text/html'))throw new ScrapeError('BAD_RESPONSE','Amazon hat keine Produktseite geliefert.');const reader=response.body.getReader();let bytes=0;const chunks=[];try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>3000000)throw new ScrapeError('TOO_LARGE','Amazon-Antwort ist zu groß.');chunks.push(value)}}finally{await reader.cancel()}const joined=new Uint8Array(bytes);let i=0;for(const c of chunks){joined.set(c,i);i+=c.length}return new TextDecoder().decode(joined);}
export async function scrape(raw,fetcher=fetch){const source=normalizeAmazonUrl(raw);if(source.kind==='product'){const p=parseProduct(await fetchAmazon(source.url,fetcher),source.id);return {kind:'product',title:p.title,products:[p],complete:true,warnings:[]};}
 const products=new Map(),visited=new Set();let url=source.url,title='Amazon-Wunschliste',failed=0,complete=true,expected=null;
 while(url){if(visited.has(url)||visited.size>=20){complete=false;break}visited.add(url);const page=parseList(await fetchAmazon(url,fetcher),source);title=page.title;expected=page.expected??expected;failed+=page.failed;for(const p of page.products)products.set(p.asin,p);if(products.size>500){complete=false;break}if(page.incomplete)complete=false;url=page.next;}
 if(failed||(expected!==null&&expected!==products.size))complete=false;
 return {kind:'list',title,products:[...products.values()].slice(0,500),complete,warnings:complete?[]:['Die Liste konnte nicht vollständig gelesen werden. Es wird nichts importiert.']};}
