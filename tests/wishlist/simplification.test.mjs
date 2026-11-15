import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const source=name=>readFileSync(resolve(root,'tools/wishes',name),'utf8');
test('Wishlist module syntax',()=>{
 for(const file of ['app.mjs','lists-dashboard.mjs','gift-start.mjs','workspace.mjs','gift-finder.mjs','wish-worlds.mjs','gift-ideas.mjs'])
  assert.doesNotThrow(()=>execFileSync(process.execPath,['--check',resolve(root,'tools/wishes',file)],{stdio:'pipe'}),file);
});
test('batch actions removed, single wish movement retained',()=>{
 const c=source('lists-dashboard.mjs');
 for(const s of ['executeBulkJob(','bulkAssign(','applyBulk(','moveSelectedWishes(','bulkControlsEnabled(','retryBulkResult('])
  assert.equal(c.includes(s),false,s);
 assert.match(c,/async function moveWishToList\(/);
});
test('dashboard history and cloud checkpoint views removed',()=>{
 const c=source('gift-start.mjs');
 for(const s of ['loadCheckpoints(','loadHistory(','cloudCheckpointViews','checkpointRows','backupSettings('])
  assert.equal(c.includes(s),false,s);
 assert.match(c,/homeGiftSettingsForm/);
 assert.match(c,/showPreview\(/);
});
test('wishlist and Amazon import remain wired',()=>{
 const c=source('app.mjs');
 assert.match(c,/mountListsDashboard/);
 assert.match(c,/amazon-import\.mjs/);
});

test('obsolete dashboard history HTML is removed without removing settings',()=>{
 const html=readFileSync(resolve(root,'tools/wishes/index.html'),'utf8');
 for(const id of ['homeGiftCheckpoints','homeGiftBackup','homeGiftHistory'])
  assert.equal(html.includes('id="'+id+'"'),false,id);
 assert.match(html,/id="homeGiftSettings"/);
 assert.match(html,/id="homePreviewDraft"/);
});

test('static Wishlist element references resolve in HTML',()=>{
 const html=readFileSync(resolve(root,'tools/wishes/index.html'),'utf8');
 const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 for(const file of ['app.mjs','lists-dashboard.mjs','gift-start.mjs','workspace.mjs']){
  const code=source(file);
  for(const match of code.matchAll(/\$\(['"]([^'"]+)['"]\)|getElementById\(['"]([^'"]+)['"]\)/g))
   assert.ok(ids.has(match[1]||match[2]),file+': missing #'+(match[1]||match[2]));
 }
});
test('obsolete bulk history and multi-wish move HTML removed',()=>{
 const html=readFileSync(resolve(root,'tools/wishes/index.html'),'utf8');
 for(const id of ['bulkHistoryPanel','bulkMoveTarget','bulkMove'])
  assert.equal(html.includes('id="'+id+'"'),false,id);
 assert.match(html,/id="wishDetailDialog"/);
});

test('private Wishlist feed does not query follows or expose people search',()=>{
 const app=source('app.mjs');
 const html=readFileSync(resolve(root,'tools/wishes/index.html'),'utf8');
 assert.match(app,/const allowed=\[user\.id\]/);
 assert.doesNotMatch(app,/wishlist_follows/);
 assert.doesNotMatch(app,/profileLink\.href/);
 assert.doesNotMatch(html,/id="peopleSearch"/);
 assert.match(html,/id="saveProfile"/);
 assert.match(html,/id="feed"/);
 assert.match(app,/mountAmazonImport/);
 assert.match(app,/mountListsDashboard/);
});

test('gift discovery modules do not depend on community feed',()=>{
 for(const file of ['gift-finder.mjs','wish-worlds.mjs']){
  const code=source(file);
  assert.ok(code.includes('gift-ideas.mjs'));
  for(const forbidden of ['getCandidates','readPublicWishes','wishlist_follows','db.from(',"('feed')"])
   assert.equal(code.includes(forbidden),false,file+': '+forbidden);
 }
 const html=readFileSync(resolve(root,'tools/wishes/index.html'),'utf8');
 for(const required of ['giftFinderForm','wishWorldsTopics'])
  assert.ok(html.includes('id="'+required+'"'));
 for(const removed of ['giftFinderSurprise','wishWorldsShuffle'])
  assert.equal(html.includes('id="'+removed+'"'),false);
});
test('offline gift ideas filter by category, occasion and query',async()=>{
 const {ideas,categories,matchingIdeas}=await import('../../tools/wishes/gift-ideas.mjs');
 assert.ok(ideas.length>=6);
 assert.ok(categories.length>=6);
 assert.equal(matchingIdeas().length,ideas.length);
 assert.ok(matchingIdeas({interest:'gaming'}).every(item=>item.category==='gaming'));
 assert.ok(matchingIdeas({occasion:'baby'}).every(item=>item.occasions.includes('baby')));
 assert.ok(matchingIdeas({query:'Pflanze'}).some(item=>item.title.toLocaleLowerCase('de-DE').includes('pflanze')));
 assert.ok(matchingIdeas({budget:'20'}).every(item=>!('price' in item)));
});

test('social profile state and obsolete profile controls are absent',()=>{
 const app=source('app.mjs');
 const html=readFileSync(resolve(root,'tools/wishes/index.html'),'utf8');
 for(const state of ['hiddenProfileIds','selectedProfileId','updateHiddenProfiles'])
  assert.equal(app.includes(state),false,state);
 for(const id of ['restoreHiddenProfiles','hiddenProfileInfo','copyMyProfile'])
  assert.equal(html.includes('id="'+id+'"'),false,id);
 assert.match(app,/\$\('saveProfile'\)\.onclick/);
 assert.match(app,/const allowed=\[user\.id\]/);
});

test('private gift dashboard is not hidden by simplification CSS',()=>{
 const html=readFileSync(resolve(root,'tools/wishes/index.html'),'utf8');
 const style=html.match(/<style id="wishlist-simplification-stage1">([\s\S]*?)<\/style>/)?.[1]||'';
 assert.ok(style);
 assert.equal(style.split(',').some(selector=>selector.trim()==='#homeGiftStart'),false);
 assert.match(html,/id="homeGiftStart"/);
 const module=source('gift-start.mjs');
 assert.ok(module.includes("$('homeGiftStart').hidden=false"));
 assert.ok(module.includes("$('homeGiftStart').hidden=true"));
});

test('Wishlist navigation has no dangling local anchors or duplicate ids',()=>{
 const html=readFileSync(resolve(root,'tools/wishes/index.html'),'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
 const known=new Set(ids);
 assert.equal(known.size,ids.length,'duplicate HTML ids');
 for(const match of html.matchAll(/href="#([^"]+)"/g))
  assert.ok(known.has(match[1]),'dangling anchor: '+match[1]);
 assert.equal(html.includes('href="#community-heading"'),false);
});

test('private feed retry remains accessible',()=>{
 const html=readFileSync(resolve(root,'tools/wishes/index.html'),'utf8');
 const style=html.match(/<style id="wishlist-simplification-stage1">([\s\S]*?)<\/style>/)?.[1]||'';
 assert.match(html,/id="feed"[^>]*aria-label="Meine privaten Wünsche"/);
 assert.match(html,/id="reloadFeed"/);
 assert.equal(style.split(',').some(selector=>selector.trim()==='#reloadFeed'),false);
 assert.match(source('app.mjs'),/\$\('reloadFeed'\)\.onclick/);
});

test('gift planner and Amazon import references resolve in their own pages',()=>{
 for(const [page,module] of [['planner.html','gift-planner.mjs'],['index.html','amazon-import.mjs']]){
  const html=readFileSync(resolve(root,'tools/wishes',page),'utf8');
  const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]));
  for(const match of source(module).matchAll(/(?:getElementById|\$)\(['"]([^'"]+)['"]\)/g))
   assert.ok(ids.has(match[1]),module+': missing #'+match[1]+' in '+page);
 }
});

test('successful profile and authentication submissions clear their inputs',()=>{
 const app=source('app.mjs');
 assert.ok(app.includes("$('email').value='';report('Angemeldet')"));
 assert.ok(app.includes("$('email').value='';report('Registrierung gestartet"));
 assert.ok(app.includes("for(const id of ['handle','displayName','bio','profileAvatarUrl'])$(id).value=''"));
 assert.ok(app.includes("$('password').value=''"));
});
test('gift planner clears successful inputs and never links other users wishes',()=>{
 const planner=source('gift-planner.mjs');
 assert.ok(planner.includes("$('form').reset()"));
 assert.ok(planner.includes("$('budgetAmount').value=''"));
 assert.ok(planner.includes("$('productQuery').value=''"));
 assert.ok(planner.includes(".eq('user_id',ownerId).in('product_id',ids)"));
 assert.equal(planner.includes(".eq('visibility','public').in('product_id',ids)"),false);
});

test('Amazon import clears fields only after a confirmed save',()=>{
 const code=source('amazon-import.mjs');
 assert.ok(code.includes("snapshot=null;commit.hidden=true;input.value='';name.value=''"));
 assert.ok(code.includes("visibility.value='private';results.replaceChildren()"));
 assert.ok(code.includes("if(error)throw error"));
});
test('gift finder resets questions without clearing generated suggestions',()=>{
 const code=source('gift-finder.mjs');
 assert.ok(code.includes("search();$('giftFinderForm').reset()"));
 assert.ok(code.includes("container.replaceChildren()"));
});
test('list editors reset on success and cancel, preserving error input',()=>{
 const code=source('lists-dashboard.mjs');
 assert.ok(code.includes("$('editListForm').hidden=true;$('editListForm').reset()"));
 assert.ok(code.includes("$('listVisibility').value='private'"));
 assert.ok(code.includes("$('listIcon').selectedIndex=0"));
 assert.ok(code.includes("$('listColor').selectedIndex=0"));
});

test('gift finder explicit reset clears questions and results synchronously',()=>{
 const code=source('gift-finder.mjs');
 assert.ok(code.includes("$('giftFinderReset').addEventListener('click',()=>{$('giftFinderForm').reset()"));
 assert.equal(code.includes('setTimeout(()=>'),false);
});
test('dashboard preferences form reflects confirmed saved settings',()=>{
 const code=source('gift-start.mjs');
 assert.ok(code.includes('render(currentTasks,currentOccasions);restoreSettingsDraft(preferences)'));
});

test('wish cloud extras clear only after confirmed insert or versioned update',()=>{
 const app=source('app.mjs');
 assert.ok(app.includes("function clearSubmittedWishExtras()"));
 assert.ok(app.includes("clearSubmittedWishExtras();feedback.textContent='Zusatzdaten privat in der Cloud gespeichert."));
 assert.ok(app.includes("clearSubmittedWishExtras();feedback.textContent='Private Cloud-Zusatzdaten nach Bestätigung aktualisiert.'"));
 assert.ok(app.includes("if(changed.data?.length!==1)"));
 assert.ok(app.includes("if(result.error)"));
});

test('gift planner rejects blank amounts while allowing explicit zero',()=>{
 const code=source('gift-planner.mjs');
 assert.ok(code.includes("const raw=$(id).value.trim();if(raw==='')return null"));
 assert.ok(code.includes("amount=number('budgetAmount')"));
 assert.ok(code.includes("planned=number('planned')"));
});

test('failed product searches retain previous results and query',()=>{
 const planner=source('gift-planner.mjs');
 const start=planner.indexOf('async function searchProducts()');
 const end=planner.indexOf("$('searchProducts').addEventListener",start);
 assert.ok(start>=0&&end>start);
 const search=planner.slice(start,end);
 assert.equal(search.includes("root.replaceChildren();\n if(q.length<2)"),false);
 assert.ok(search.includes("root.replaceChildren();if($('productQuery').value.trim()===q)$('productQuery').value='';if(!products?.length)"));
 assert.ok(search.includes("}catch{if(revision===productSearchRevision&&user?.id===ownerId&&$('productQuery').value.trim()===q)$('productSearchStatus').textContent='Suche fehlgeschlagen."));
});

test('budget saves preserve newer edits and handle rejected requests',()=>{
 const planner=source('gift-planner.mjs');
 assert.ok(planner.includes("const ownerId=user?.id,submittedAmount=$('budgetAmount').value"));
 assert.ok(planner.includes("if($('budgetOccasion').value===id&&$('budgetAmount').value===submittedAmount)$('budgetAmount').value=''"));
 assert.ok(planner.includes("}catch{\n  if(user?.id===ownerId)feedback('budgetSaveFeedback','Budget konnte nicht gespeichert werden.');"));
 assert.ok(planner.includes("}finally{$('saveBudget').disabled=false}"));
});

test('product search ignores stale session responses and preserves newer query edits',()=>{
 const planner=source('gift-planner.mjs');
 assert.ok(planner.includes('const revision=++productSearchRevision,ownerId=user?.id'));
 assert.ok(planner.includes("if(revision!==productSearchRevision||user?.id!==ownerId||$('productQuery').value.trim()!==q)return"));
 assert.ok(planner.includes("if($('productQuery').value.trim()===q)$('productQuery').value=''"));
 assert.ok(planner.includes('if(revision===productSearchRevision)$(' + "'searchProducts'" + ').disabled=false'));
});

test('product search keeps edits typed during an in-flight request',async()=>{
 const planner=source('gift-planner.mjs');
 const start=planner.indexOf('let productSearchRevision=0;');
 const end=planner.indexOf("$('searchProducts').addEventListener",start);
 assert.ok(start>=0&&end>start);
 const handlers={};
 const fields={
  productQuery:{value:'geschenk'},
  productResults:{items:['previous'],replaceChildren(){this.items=[]}},
  productSearchStatus:{textContent:''},
  searchProducts:{disabled:false}
 };
 let complete;
 const pending=new Promise(resolve=>{complete=resolve});
 const db={from:()=>({select:()=>({ilike:()=>({order:()=>({limit:()=>pending})})})})};
 const run=new Function('$','db','document',`
  let user={id:'owner'},occasions=[],selectedProduct=null;
  const showProductSource=()=>{};
  ${planner.slice(start,end)}
  return searchProducts;
 `)(id=>fields[id],db,{createElement:()=>({})});
 const request=run();
 fields.productQuery.value='neue Suche';
 complete({data:[],error:null});
 await request;
 assert.equal(fields.productQuery.value,'neue Suche');
 assert.equal(fields.productResults.items[0],'previous');
 assert.equal(fields.searchProducts.disabled,false);
});

test('confirmed gift save stays successful when coordination refresh rejects',async()=>{
 const planner=source('gift-planner.mjs');
 const start=planner.indexOf("$('form').addEventListener('submit',async event=>");
 const end=planner.indexOf("$('cancel').addEventListener",start);
 assert.ok(start>=0&&end>start);
 const handlers={};
 const values={occasion:'occasion1',title:'Buch',planned:'15',actual:'',recipient:'',giftStatus:'idea',sourceList:'',notes:''};
 const elements=Object.fromEntries(Object.entries(values).map(([id,value])=>[id,{value}]));
 elements.form={addEventListener:(_,fn)=>handlers.submit=fn};
 elements.save={disabled:false};
 elements.giftFormFeedback={textContent:'',focus(){}};
 const db={from:()=>({insert:()=>({select:()=>({single:async()=>({data:{id:'gift1',source_wish_id:'wish1'},error:null})})})})};
 const body="let user={id:'owner'},editing=null,gifts=[],selectedProduct={wish_id:'wish1',product_id:'product1'};\n"+planner.slice(start,end)+"\nreturn {submit:handlers.submit,getGifts:()=>gifts};";
 const run=new Function('$','db','byId','number','invalid','feedback','reset','render','loadCoordination','handlers',body)(id=>elements[id],db,()=>({id:'occasion1'}),id=>Number(elements[id].value),()=>{},(id,message)=>elements[id].textContent=message,()=>{elements.title.value=''},()=>{},async()=>{throw Error('offline')},handlers);
 await run.submit({preventDefault(){}});
 assert.equal(elements.giftFormFeedback.textContent,'Geschenk gespeichert. Die Abstimmung konnte nicht aktualisiert werden.');
 assert.equal(elements.title.value,'');
 assert.equal(elements.save.disabled,false);
 assert.equal(run.getGifts().length,1);
});

test('list creation preserves selections edited during pending save',()=>{
 const code=source('lists-dashboard.mjs');
 assert.ok(code.includes("submittedIcon=$('listIcon').value,submittedColor=$('listColor').value"));
 assert.ok(code.includes("if($('listVisibility').value===visibility)$('listVisibility').value='private'"));
 assert.ok(code.includes("if($('listIcon').value===submittedIcon)$('listIcon').selectedIndex=0"));
 assert.ok(code.includes("if($('listColor').value===submittedColor)$('listColor').selectedIndex=0"));
});

test('gift save ignores a delayed response after account switch',async()=>{
 const planner=source('gift-planner.mjs');
 const start=planner.indexOf("$('form').addEventListener('submit',async event=>");
 const end=planner.indexOf("$('cancel').addEventListener",start);
 assert.ok(start>=0&&end>start);
 const handlers={},values={occasion:'occasion1',title:'Buch',planned:'15',actual:'',recipient:'',giftStatus:'idea',sourceList:'',notes:''};
 const elements=Object.fromEntries(Object.entries(values).map(([id,value])=>[id,{value}]));
 elements.form={addEventListener:(_,fn)=>handlers.submit=fn};
 elements.save={disabled:false};
 elements.giftFormFeedback={textContent:'',focus(){}};
 let finish;
 const pending=new Promise(resolve=>finish=resolve);
 const db={from:()=>({insert:()=>({select:()=>({single:()=>pending})})})};
 let resets=0;
 const body="let user={id:'first'},editing=null,gifts=[],selectedProduct=null;\n"+planner.slice(start,end)+"\nreturn {submit:handlers.submit,setUser:id=>user={id},getGifts:()=>gifts};";
 const run=new Function('$','db','byId','number','invalid','feedback','reset','render','loadCoordination','handlers',body)(id=>elements[id],db,()=>({id:'occasion1'}),id=>Number(elements[id].value),()=>{},(id,message)=>elements[id].textContent=message,()=>{resets++},()=>{},async()=>{},handlers);
 const request=run.submit({preventDefault(){}});
 run.setUser('second');
 finish({data:{id:'gift1',source_wish_id:null},error:null});
 await request;
 assert.equal(run.getGifts().length,0);
 assert.equal(resets,0);
 assert.equal(elements.title.value,'Buch');
 assert.equal(elements.save.disabled,false);
});

test('coordination refresh errors cannot overwrite another account feedback',async()=>{
 const planner=source('gift-planner.mjs');
 const start=planner.indexOf("$('form').addEventListener('submit',async event=>");
 const end=planner.indexOf("$('cancel').addEventListener",start);
 assert.ok(start>=0&&end>start);
 const handlers={},values={occasion:'occasion1',title:'Buch',planned:'15',actual:'',recipient:'',giftStatus:'idea',sourceList:'',notes:''};
 const elements=Object.fromEntries(Object.entries(values).map(([id,value])=>[id,{value}]));
 elements.form={addEventListener:(_,fn)=>handlers.submit=fn};
 elements.save={disabled:false};
 elements.giftFormFeedback={textContent:'',focus(){}};
 let rejectRefresh;
 const pendingRefresh=new Promise((_,reject)=>rejectRefresh=reject);
 const db={from:()=>({insert:()=>({select:()=>({single:async()=>({data:{id:'gift1',source_wish_id:'wish1'},error:null})})})})};
 const body="let user={id:'first'},editing=null,gifts=[],selectedProduct=null;\n"+planner.slice(start,end)+"\nreturn {submit:handlers.submit,setUser:id=>user={id}};";
 const run=new Function('$','db','byId','number','invalid','feedback','reset','render','loadCoordination','handlers',body)(id=>elements[id],db,()=>({id:'occasion1'}),id=>Number(elements[id].value),()=>{},(id,message)=>elements[id].textContent=message,()=>{},()=>{},()=>pendingRefresh,handlers);
 const request=run.submit({preventDefault(){}});
 await Promise.resolve();
 run.setUser('second');
 elements.giftFormFeedback.textContent='Neue Sitzung';
 rejectRefresh(Error('offline'));
 await request;
 assert.equal(elements.giftFormFeedback.textContent,'Neue Sitzung');
 assert.equal(elements.save.disabled,false);
});

test('coordination RPC errors return failure without overwriting another session',async()=>{
 const planner=source('gift-planner.mjs');
 const start=planner.indexOf('async function loadCoordination()');
 const end=planner.indexOf('async function importReservedWish()',start);
 assert.ok(start>=0&&end>start);
 let complete;
 const pending=new Promise(resolve=>complete=resolve);
 const elements={status:{textContent:'Neue Sitzung'}};
 const body="let user={id:'first'},coordination=new Map();\n"+planner.slice(start,end)+"\nreturn {loadCoordination,setUser:id=>user={id},getCoordination:()=>coordination};";
 const run=new Function('$','db',body)(id=>elements[id],{rpc:()=>pending});
 const request=run.loadCoordination();
 run.setUser('second');
 complete({data:[{plan_id:'old',reservation_state:'reserved'}],error:null});
 assert.equal(await request,false);
 assert.equal(run.getCoordination().size,0);
 assert.equal(elements.status.textContent,'Neue Sitzung');
 const failing=new Function('$','db',"let user={id:'first'},coordination=new Map();\n"+planner.slice(start,end)+"\nreturn loadCoordination;")(id=>elements[id],{rpc:async()=>({error:Error('offline')})});
 assert.equal(await failing(),false);
 assert.equal(elements.status.textContent,'Reservierungsabgleich nicht verfügbar.');
});

test('invalid newer product search re-enables button while older request is pending',async()=>{
 const planner=source('gift-planner.mjs');
 const start=planner.indexOf('let productSearchRevision=0;');
 const end=planner.indexOf("$('searchProducts').addEventListener",start);
 assert.ok(start>=0&&end>start);
 let complete;
 const pending=new Promise(resolve=>complete=resolve);
 const elements={productQuery:{value:'Geschenk'},productResults:{replaceChildren(){}},productSearchStatus:{textContent:''},searchProducts:{disabled:false}};
 const db={from:()=>({select:()=>({ilike:()=>({order:()=>({limit:()=>pending})})})})};
 const body="let user={id:'first'},occasions=[],selectedProduct=null;const showProductSource=()=>{};\n"+planner.slice(start,end)+"\nreturn searchProducts;";
 const search=new Function('$','db','document',body)(id=>elements[id],db,{createElement:()=>({})});
 const first=search();
 assert.equal(elements.searchProducts.disabled,true);
 elements.productQuery.value='x';
 await search();
 assert.equal(elements.searchProducts.disabled,false);
 assert.match(elements.productSearchStatus.textContent,/mindestens zwei Zeichen/);
 complete({data:[],error:null});
 await first;
 assert.equal(elements.searchProducts.disabled,false);
});

test('stale failed product search does not overwrite feedback for newer query',async()=>{
 const planner=source('gift-planner.mjs');
 const start=planner.indexOf('let productSearchRevision=0;');
 const end=planner.indexOf("$('searchProducts').addEventListener",start);
 assert.ok(start>=0&&end>start);
 let finish;
 const pending=new Promise(resolve=>finish=resolve);
 const fields={productQuery:{value:'Geschenk'},productResults:{replaceChildren(){}},productSearchStatus:{textContent:''},searchProducts:{disabled:false}};
 const db={from:()=>({select:()=>({ilike:()=>({order:()=>({limit:()=>pending})})})})};
 const body="let user={id:'owner'},occasions=[],selectedProduct=null;const showProductSource=()=>{};\n"+planner.slice(start,end)+"\nreturn searchProducts;";
 const search=new Function('$','db','document',body)(id=>fields[id],db,{createElement:()=>({})});
 const request=search();
 fields.productQuery.value='Neuer Begriff';
 fields.productSearchStatus.textContent='Neue Eingabe';
 finish({data:null,error:Error('offline')});
 await request;
 assert.equal(fields.productSearchStatus.textContent,'Neue Eingabe');
 assert.equal(fields.productQuery.value,'Neuer Begriff');
 assert.equal(fields.searchProducts.disabled,false);
});
