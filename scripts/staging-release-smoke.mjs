// One-time staging-only release acceptance. Never points to production.
// Creates exactly two anonymous users; all inserted public fixtures are deleted in finally.
// Auth users must be removed by admin after CI, using the logged test UUIDs.
const URL='https://yheogmeaosuigyaxkwth.supabase.co';
const key=process.env.TOOLYA_STAGING_PUBLISHABLE_KEY;
if(!key) throw Error('Missing staging publishable key');
const marker='rc'+Date.now().toString(36);
const ids={};const sessions=[];
async function api(path,session,method='GET',body,extra={}){
 const res=await fetch(URL+path,{method,headers:{apikey:key,Authorization:'Bearer '+(session?.access_token||key),'Content-Type':'application/json',...extra},body:body===undefined?undefined:JSON.stringify(body)});
 const raw=await res.text();let data;try{data=raw?JSON.parse(raw):null}catch{data=raw}
 return {status:res.status,data};
}
function ok(r,context,expected=[200,201,204]){if(!expected.includes(r.status))throw Error(context+' HTTP '+r.status+' '+JSON.stringify(r.data).slice(0,220));return r.data}
async function add(table,session,record){const r=await api('/rest/v1/'+table,session,'POST',record,{Prefer:'return=representation'});const rows=ok(r,'insert '+table,[201]);if(!Array.isArray(rows)||rows.length!==1)throw Error('insert returned no row '+table);return rows[0]}
async function del(table,session,filter){const r=await api('/rest/v1/'+table+'?'+filter,session,'DELETE');ok(r,'cleanup '+table)}
async function rpc(name,session,payload){return api('/rest/v1/rpc/'+name,session,'POST',payload)}
try{
 for(let i=0;i<2;i++){const r=await api('/auth/v1/signup',null,'POST',{data:{}});ok(r,'anonymous signup');if(!r.data?.access_token||!r.data?.user?.id)throw Error('no real auth session');sessions.push(r.data)}
 const [A,B]=sessions;
 if(A.user.id===B.user.id)throw Error('same auth identity');
 console.log('PASS auth: two independent staging sessions');
 console.log('CLEANUP_AUTH_USER_IDS '+sessions.map(s=>s.user.id).join(' '));
 // Owner A publishes a wishlist. B plans and reserves A's public wish.
 ids.profileA=(await add('wishlist_profiles',A,{user_id:A.user.id,handle:marker+'a',display_name:'Release Test A'})).user_id;
 ids.profileB=(await add('wishlist_profiles',B,{user_id:B.user.id,handle:marker+'b',display_name:'Release Test B'})).user_id;
 ids.list=(await add('wishlist_lists',A,{user_id:A.user.id,title:marker,visibility:'public'})).id;
 ids.asin=('T'+String(Date.now()).slice(-9)).padEnd(10,'0');
 ids.product=(await add('wishlist_products',A,{marketplace:'amazon.de',asin:ids.asin,title:'Release candidate fixture'})).id;
 ids.wish=(await add('wishlist_wishes',A,{user_id:A.user.id,product_id:ids.product,visibility:'public'})).id;
 await add('wishlist_list_items',A,{list_id:ids.list,user_id:A.user.id,wish_id:ids.wish});
 ids.occasion=(await add('wishlist_occasions',B,{user_id:B.user.id,title:marker,occasion_date:'2026-12-20'})).id;
 ids.plan=(await add('wishlist_gift_plans',B,{user_id:B.user.id,occasion_id:ids.occasion,title:marker,source_wish_id:ids.wish,source_list_id:ids.list,source_product_id:ids.product})).id;
 console.log('PASS E2E: wishlist, public collection, gift occasion and plan');
 const privateA=ok(await api('/rest/v1/wishlist_occasions?id=eq.'+ids.occasion+'&select=id',A),'cross-user occasion read');
 if(privateA.length!==0)throw Error('A read B private occasion');
 const privateB=ok(await api('/rest/v1/wishlist_gift_plans?id=eq.'+ids.plan+'&select=id',A),'cross-user plan read');
 if(privateB.length!==0)throw Error('A read B gift plan');
 const upd=await api('/rest/v1/wishlist_gift_plans?id=eq.'+ids.plan,A,'PATCH',{title:'cross-user-forbidden'},{Prefer:'return=representation'});
 if(upd.status===200&&Array.isArray(upd.data)&&upd.data.length!==0)throw Error('A changed B gift plan');
 if(![200,204,403].includes(upd.status))throw Error('unexpected cross-user update status '+upd.status);
 const reserved=ok(await rpc('wishlist_reserve_wish',B,{p_wish_id:ids.wish}),'reserve wish');
 if(reserved!=='reserved_by_you')throw Error('reservation state '+JSON.stringify(reserved));
 const status=ok(await rpc('wishlist_reservation_status',B,{p_wish_ids:[ids.wish]}),'reservation status');
 if(!Array.isArray(status)||!status.some(x=>x.wish_id===ids.wish&&x.reservation_state==='reserved_by_you'))throw Error('reservation status mismatch');
 const ownerCannotReserve=await rpc('wishlist_reserve_wish',A,{p_wish_id:ids.wish});
 if(ownerCannotReserve.status<400)throw Error('owner reserved own wish');
 const progress=ok(await rpc('wishlist_update_gift_progress',B,{p_plan_id:ids.plan,p_status:'gifted',p_release_reservation:true}),'gift progress');
 if(progress!=='gifted')throw Error('gift progress state mismatch');
 const after=ok(await rpc('wishlist_reservation_status',B,{p_wish_ids:[ids.wish]}),'released reservation status');
 if(!Array.isArray(after)||!after.some(x=>x.wish_id===ids.wish&&x.reservation_state==='available'))throw Error('reservation not released');
 console.log('PASS RLS/RPC: cross-user private data denied, own reservation and release lifecycle');
 console.log('PASS E2E: reserve -> gifted -> release');
}finally{
 // Always attempt precise fixture cleanup; never bulk-delete other records.
 const [A,B]=sessions;
 if(B&&ids.plan)try{await del('wishlist_gift_plans',B,'id=eq.'+ids.plan)}catch(e){console.error('CLEANUP_ERROR plan '+e.message)}
 if(B&&ids.occasion)try{await del('wishlist_occasions',B,'id=eq.'+ids.occasion)}catch(e){console.error('CLEANUP_ERROR occasion '+e.message)}
 if(A&&ids.list)try{await del('wishlist_lists',A,'id=eq.'+ids.list)}catch(e){console.error('CLEANUP_ERROR list '+e.message)}
 if(A&&ids.wish)try{await del('wishlist_wishes',A,'id=eq.'+ids.wish)}catch(e){console.error('CLEANUP_ERROR wish '+e.message)}
 if(A&&ids.profileA)try{await del('wishlist_profiles',A,'user_id=eq.'+ids.profileA)}catch(e){console.error('CLEANUP_ERROR profileA '+e.message)}
 if(B&&ids.profileB)try{await del('wishlist_profiles',B,'user_id=eq.'+ids.profileB)}catch(e){console.error('CLEANUP_ERROR profileB '+e.message)}
 // Products have no DELETE policy: admin cleanup only by exact ID.
 if(ids.product)console.log('CLEANUP_PRODUCT_ID '+ids.product);
 console.log('CLEANUP_FINISHED');
}
