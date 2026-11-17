// Read-only public release delivery check. No accounts, API calls or production writes.
const fs=require('node:fs'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const origin='https://toolya.app',hash=b=>createHash('sha256').update(b).digest('hex');
const expected=fs.readFileSync('assets/helferlein-b3.css'),revision=process.env.GITHUB_SHA||hash(expected);
async function get(path){
 const url=new URL(path,origin);url.searchParams.set('release',revision);
 const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(10000)});
 assert.equal(response.status,200,path+' HTTP status');
 return {url:url.href,body:Buffer.from(await response.arrayBuffer())};
}
(async()=>{
 let result,lastError;
 for(let attempt=1;attempt<=6;attempt++){
  try{
   const css=await get('/assets/helferlein-b3.css');
   assert.equal(hash(css.body),hash(expected),'Live B3 CSS must match this release byte for byte');
   const buddy=await get('/shared/toolya/buddy.mjs'),expectedBuddy=fs.readFileSync('shared/toolya/buddy.mjs');
   assert.equal(hash(buddy.body),hash(expectedBuddy),'Live buddy module must match this release byte for byte');
   const themeStyles=[];
   for(const path of ['/assets/helferlein-b3-autokosten.css','/assets/helferlein-b3-haushaltsbuch.css','/assets/helferlein-b3-umzugskisten.css','/assets/helferlein-b3-verleih.css','/assets/helferlein-b3-zaehler.css','/assets/helferlein-b3-pflanzen.css','/assets/helferlein-b3-parkplatz.css','/assets/helferlein-b3-haustiere.css','/assets/helferlein-b3-wg.css','/assets/helferlein-b3-backform.css','/assets/helferlein-b3-backform.js']){
    const asset=await get(path),expectedAsset=fs.readFileSync(path.slice(1));
    assert.equal(hash(asset.body),hash(expectedAsset),'Live theme CSS must match this release byte for byte');
    themeStyles.push({url:asset.url,expectedSha256:hash(expectedAsset),actualSha256:hash(asset.body),byteIdentical:true});
   }
   const pages=[];
   for(const route of ['/tools/car/index.html','/tools/budget/index.html','/tools/moving/index.html','/tools/loans/index.html','/tools/meters/index.html','/tools/plants/index.html','/tools/parking/index.html','/tools/pet-health/index.html','/tools/housemates/index.html','/tools/baking/index.html']){
    const page=await get(route);
    assert.match(page.body.toString('utf8'),/href=["'][^"']*assets\/helferlein-b3\.css["']/,'Tool retains the shared stylesheet');
    const expectedPage=fs.readFileSync(route.slice(1));
    assert.equal(hash(page.body),hash(expectedPage),'Tool HTML must match this release byte for byte');
    pages.push({url:page.url,status:200,sharedStylesheet:true,byteIdentical:true,expectedSha256:hash(expectedPage),actualSha256:hash(page.body)});
   }
   const wishlist=[];
   for(const path of ['/tools/wishes/public.html','/tools/wishes/public-profiles.css','/tools/wishes/public-amazon.mjs','/tools/wishes/public-profile-model.mjs','/tools/wishes/public-products.json']){
    const asset=await get(path),expectedAsset=fs.readFileSync(path.slice(1));
    assert.equal(hash(asset.body),hash(expectedAsset),'Public wishlist asset must match release byte for byte');
    wishlist.push({url:asset.url,expectedSha256:hash(expectedAsset),actualSha256:hash(asset.body),byteIdentical:true});
   }
   const estate=[];
   for(const path of ['/assets/estate-app.css','/tools/estate/index.html','/tools/estate/heirs.html']){
    const asset=await get(path),expectedAsset=fs.readFileSync(path.slice(1));
    assert.equal(hash(asset.body),hash(expectedAsset),'Estate public asset must match release byte for byte');
    estate.push({url:asset.url,status:200,expectedSha256:hash(expectedAsset),actualSha256:hash(asset.body),byteIdentical:true});
   }
   const info=[];
   for(const path of ['/legal.html','/privacy.html','/mascots.html','/shared/toolya/info-pages.css','/shared/toolya/platform.mjs']){
    const asset=await get(path),expectedAsset=fs.readFileSync(path.slice(1));
    assert.equal(hash(asset.body),hash(expectedAsset),'Information page resource must match release byte for byte');
    info.push({url:asset.url,status:200,expectedSha256:hash(expectedAsset),actualSha256:hash(asset.body),byteIdentical:true});
   }
   const legacy=[];
   for(const path of ["/tools/wishes/assistant.html", "/tools/wishes/bookmarks.html", "/tools/wishes/cockpit.html", "/tools/wishes/collection.html", "/tools/wishes/dashboard.html", "/tools/wishes/discover.html", "/tools/wishes/feed.html", "/tools/wishes/gift-analytics.html", "/tools/wishes/gift-tasks.html", "/tools/wishes/notifications.html", "/tools/wishes/occasions.html", "/tools/wishes/planner.html", "/tools/wishes/profile.html", "/tools/wishes/report.html", "/tools/wishes/reservations.html", "/tools/wishes/social.html", "/tools/wishes/legacy-design.css", "/tools/wishes/discover.mjs"]){
    const asset=await get(path),expectedAsset=fs.readFileSync(path.slice(1));
    assert.equal(hash(asset.body),hash(expectedAsset),'Legacy wishlist resource must match release byte for byte');
    legacy.push({url:asset.url,status:200,expectedSha256:hash(expectedAsset),actualSha256:hash(asset.body),byteIdentical:true});
   }
   result={revision,checkedAt:new Date().toISOString(),attempt,css:{url:css.url,expectedSha256:hash(expected),actualSha256:hash(css.body),byteIdentical:true},buddy:{url:buddy.url,expectedSha256:hash(expectedBuddy),actualSha256:hash(buddy.body),byteIdentical:true},themeStyles,pages,wishlist,estate,info,legacy,scope:'Public static delivery only; authenticated production UI and private flows are not verified by this check.'};
   break;
  }catch(error){lastError=error;if(attempt<6)await new Promise(r=>setTimeout(r,10000));}
 }
 if(!result)throw lastError;
 fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/b3-live-delivery.json',JSON.stringify(result,null,2)+'\n');
 console.log('B3_LIVE_DELIVERY '+JSON.stringify(result));
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'### B3 public delivery\n\nShared/theme CSS, tool HTML and buddy module byte-identical to '+revision+'; Car, Budget, Moving, Loans, Meters, Plants, Parking, Pet Health, WG and Baking HTML reference the shared stylesheet. No authenticated production UI check.\n');
})().catch(error=>{console.error(error);process.exitCode=1});
