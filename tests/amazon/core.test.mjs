import {test} from 'node:test';import assert from 'node:assert/strict';
import {normalizeAmazonUrl,wishlistContinuation,parsePrice,safeImage,parseProduct,parseList,scrape} from '../../supabase/functions/amazon-scrape/core.mjs';
const asin='B012345678';const list='ABCDEFGH123';const source=normalizeAmazonUrl('https://www.amazon.de/hz/wishlist/ls/'+list);
const row=(id=asin)=>`<li id="item_1" data-itemid="I1"><a id="itemName_1" href="/dp/${id}">Tasse &amp; Teller</a><div class="g-itemImage"><img src="https://m.media-amazon.com/images/I/a.jpg"></div><span class="a-price"><span class="a-offscreen">1.234,56 €</span></span></li>`;
const html=body=>'<html><body>'+body+'</body></html>';
const respond=(body)=>new Response(html(body),{headers:{'content-type':'text/html'}});
test('normalizes direct products and lists; rejects SSRF and deceptive hosts',()=>{assert.equal(normalizeAmazonUrl('https://amazon.de/Name/dp/'+asin+'?tag=evil').url,'https://www.amazon.de/dp/'+asin);for(const bad of ['http://amazon.de/dp/'+asin,'https://amazon.de.evil/dp/'+asin,'https://user@amazon.de/dp/'+asin,'https://127.0.0.1/dp/'+asin,'https://amazon.de:8443/dp/'+asin,'https://amzn.to/abc'])assert.throws(()=>normalizeAmazonUrl(bad));});
test('German prices and image allowlist',()=>{assert.equal(parsePrice('1.234,56 €'),1234.56);assert.equal(parsePrice('19,99€'),19.99);assert.equal(parsePrice(''),null);assert.equal(parsePrice('unbekannt'),null);assert.equal(safeImage('https://m.media-amazon.com.evil/a'),null);});
test('single product has title, image, price, description and affiliate link',()=>{const p=parseProduct(html('<a class="a-link-normal" title="Echo">Echo</a><img src="https://m.media-amazon.com/logo.jpg"><span class="a-price"><span class="a-offscreen">9,99 €</span></span><span id="productTitle"> Lampe &amp; Licht </span><img id="landingImage" src="https://m.media-amazon.com/a.jpg"><div id="corePrice_feature_div"><span class="a-price"><span class="a-offscreen">19,99 €</span></span></div><div id="feature-bullets">Helles Licht</div>'),asin);assert.equal(p.title,'Lampe & Licht');assert.equal(p.price,19.99);assert.equal(p.description,'Helles Licht');assert.match(p.productUrl,/duhrrom-21/);assert.equal(p.imageUrl,'https://m.media-amazon.com/a.jpg');});
test('no fabricated metadata; rejects CAPTCHA and wrong product',()=>{const p=parseProduct(html('<span id="productTitle">Lampe</span>'),asin);assert.equal(p.price,null);assert.equal(p.imageUrl,null);assert.throws(()=>parseProduct(html('<input id="captchacharacters">'),asin));assert.throws(()=>parseProduct(html('<link rel="canonical" href="https://amazon.de/dp/B099999999"><span id="productTitle">Wrong</span>'),asin));});
test('list deduplicates only actual wish items, excludes recommendations',()=>{const p=parseList(html('<h1>Meine Liste</h1>'+row()+row()+'<a href="/dp/B099999999">Empfehlung</a>'),source);assert.equal(p.products.length,1);assert.equal(p.products[0].price,1234.56);assert.equal(p.title,'Meine Liste');});
test('follows same-list pagination, deduplicates across pages',async()=>{let n=0;const r=await scrape(source.url,async url=>{n++;return respond(row(n===1?asin:'B099999999')+(n===1?`<a rel="next" href="${source.url}?page=2">Weiter</a>`:''))});assert.equal(n,2);assert.equal(r.products.length,2);assert.equal(r.complete,true);});
test('unknown continuation and broken item mark import incomplete',async()=>{const r=await scrape(source.url,async()=>respond(row()+'<div class="g-load-more"></div><li id="item_bad" data-itemid="bad">unlesbar</li>'));assert.equal(r.complete,false);assert.ok(r.warnings.length);});
test('pagination loops fail closed; redirects never followed',async()=>{const r=await scrape(source.url,async()=>respond(row()+`<a rel="next" href="${source.url}">Weiter</a>`));assert.equal(r.complete,false);await assert.rejects(()=>scrape(source.url,async()=>new Response('',{status:302,headers:{location:'http://127.0.0.1'}})));});

test('Amazon AJAX scroll continues only within the same wishlist and terminates explicitly',async()=>{
 let calls=0;
 const next='/hz/wishlist/slv/items?paginationToken=opaque&lid='+list+'&type=wishlist';
 const result=await scrape(source.url,async url=>{calls++;return respond(calls===1?'<h1>Seitenübergreifende Liste</h1>'+row()+`<input name="showMoreUrl" value="${next.replaceAll('&','&amp;')}">`:row('B099999999')+`<script data-a-state='{"key":"scrollState"}'>{"lastEvaluatedKey":null,"showMoreUrl":"/hz/wishlist/slv/items"}</script>`);});
 assert.equal(calls,2);assert.equal(result.title,'Seitenübergreifende Liste');assert.equal(result.complete,true);assert.equal(result.products.length,2);
 assert.throws(()=>wishlistContinuation('/hz/wishlist/slv/items?paginationToken=opaque&lid=OTHERLIST',source));
 assert.throws(()=>wishlistContinuation('https://evil.test/hz/wishlist/slv/items?lid='+list,source));
 const p=parseList(html(row().replace('<li ', '<li data-price="17.47" ').replace('<span class="a-price"><span class="a-offscreen">1.234,56 €</span></span>','')),source);assert.equal(p.products[0].price,17.47);
});

test('optional detail enrichment fills missing metadata without overwriting wishlist title',async()=>{
 const item={asin,title:'Wunschlisten-Titel',price:null,description:'',imageUrl:null};
 const calls=[];
 const {enrichMissingProductMetadata}=await import('../../supabase/functions/amazon-wishlist-scrape/toolya-core.mjs');
 const good=html('<span id="productTitle">Produkt Detail</span><div id="feature-bullets">Wichtige Details</div><div id="corePrice_feature_div"><span class="a-price"><span class="a-offscreen">29,95 €</span></span></div>');
 const n=await enrichMissingProductMetadata([item],async url=>{calls.push(url);return respond(good)},10);
 assert.equal(n,1);assert.equal(item.price,29.95);assert.equal(item.description,'Wichtige Details');assert.equal(item.title,'Wunschlisten-Titel');
 assert.deepEqual(calls,['https://www.amazon.de/dp/'+asin]);
});
test('optional enrichment tolerates unavailable product details and keeps original data',async()=>{
 const {enrichMissingProductMetadata}=await import('../../supabase/functions/amazon-wishlist-scrape/toolya-core.mjs');
 const item={asin,title:'Unverändert',price:null,description:'',imageUrl:null};
 await enrichMissingProductMetadata([item],async()=>new Response('',{status:403}),10);
 assert.equal(item.title,'Unverändert');assert.equal(item.price,null);assert.equal(item.description,'');
});

test('wishlist parser recognizes alternate German price and comment selectors',async()=>{
 const {parseList:parseWishlist}=await import('../../supabase/functions/amazon-wishlist-scrape/toolya-core.mjs');
 const product='<li id="item_32" data-itemid="item32" data-price="19.95"><a id="itemName_32" href="/dp/'+asin+'">Produkt Test</a><div class="g-itemComment">Für das Gartenhaus</div></li>';
 const result=parseWishlist(html(product),source);
 assert.equal(result.products.length,1);assert.equal(result.products[0].price,19.95);
 assert.equal(result.products[0].description,'Für das Gartenhaus');
});
test('product page reads priceToPay, split price, feature overview, and JSON-LD',async()=>{
 const {parsePrice:parseWishlistPrice,parseProduct:parseWishlistProduct}=await import('../../supabase/functions/amazon-wishlist-scrape/toolya-core.mjs');
 assert.equal(parseWishlistPrice('1.234,56 €'),1234.56);
 assert.equal(parseWishlistPrice('1.234 €'),1234);
 assert.equal(parseWishlistPrice('19.99'),19.99);
 assert.equal(parseWishlistPrice('statt 29,99 €'),null);
 const p=parseWishlistProduct(html('<span id="productTitle">Tolles Gartengerät</span><div class="priceToPay"><span class="a-price"><span class="a-price-whole">1.234</span><span class="a-price-fraction">56</span></span></div><div id="productOverview_feature_div">Leicht und stabil</div>'),asin);
 assert.equal(p.price,1234.56);assert.equal(p.description,'Leicht und stabil');
 const json={'@type':'Product',sku:asin,description:'Strukturierter Informationstext',offers:{price:'12.49',priceCurrency:'EUR'}};
 const result=parseWishlistProduct(html('<span id="productTitle">Produkt</span><script type="application/ld+json">'+JSON.stringify(json)+'</script>'),asin);
 assert.equal(result.price,12.49);assert.equal(result.description,'Strukturierter Informationstext');
});
test('structured data with different ASIN is not imported',async()=>{
 const {parseProduct:parseWishlistProduct}=await import('../../supabase/functions/amazon-wishlist-scrape/toolya-core.mjs');
 const json={'@type':'Product',sku:'B099999999',description:'Falsches Produkt',offers:{price:'999.99',priceCurrency:'EUR'}};
 const product=parseWishlistProduct(html('<span id="productTitle">Richtiges Produkt</span><script type="application/ld+json">'+JSON.stringify(json)+'</script>'),asin);
 assert.equal(product.price,null);assert.equal(product.description,'');
});
