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
   const pages=[];
   for(const route of ['/tools/car/index.html','/tools/budget/index.html']){
    const page=await get(route);
    assert.match(page.body.toString('utf8'),/href=["'][^"']*assets\/helferlein-b3\.css["']/,'Tool retains the shared stylesheet');
    pages.push({url:page.url,status:200,sharedStylesheet:true});
   }
   result={revision,checkedAt:new Date().toISOString(),attempt,css:{url:css.url,expectedSha256:hash(expected),actualSha256:hash(css.body),byteIdentical:true},buddy:{url:buddy.url,expectedSha256:hash(expectedBuddy),actualSha256:hash(buddy.body),byteIdentical:true},pages,scope:'Public static delivery only; authenticated production UI and private flows are not verified by this check.'};
   break;
  }catch(error){lastError=error;if(attempt<6)await new Promise(r=>setTimeout(r,10000));}
 }
 if(!result)throw lastError;
 fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/b3-live-delivery.json',JSON.stringify(result,null,2)+'\n');
 console.log('B3_LIVE_DELIVERY '+JSON.stringify(result));
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'### B3 public delivery\n\nCSS and buddy module byte-identical to '+revision+'; Auto and Budget HTML reference the shared stylesheet. No authenticated production UI check.\n');
})().catch(error=>{console.error(error);process.exitCode=1});
