// Toolya staging-only smoke test; requires Node >= 20.
const URL='https://yheogmeaosuigyaxkwth.supabase.co';
const key=process.env.TOOLYA_STAGING_PUBLISHABLE_KEY;
if(!key) throw Error('Missing TOOLYA_STAGING_PUBLISHABLE_KEY');
async function call(path,token,method='GET',body){const r=await fetch(URL+path,{method,headers:{apikey:key,Authorization:'Bearer '+(token||key),'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const raw=await r.text();let data;try{data=JSON.parse(raw)}catch{data=raw};return {status:r.status,data};}
const a=await call('/auth/v1/signup',null,'POST',{data:{}});
console.log('Anonymous signup HTTP:',a.status);
if(!a.data?.access_token||!a.data?.user?.id)throw Error('Anonymous login failed: '+JSON.stringify(a.data).slice(0,180));
const b=await call('/auth/v1/signup',null,'POST',{data:{}});
if(!b.data?.access_token||!b.data?.user?.id||a.data.user.id===b.data.user.id)throw Error('Second independent session failed');
console.log('PASS: two distinct anonymous sessions');
for(const [name,session] of [['A',a],['B',b]]){const r=await call('/rest/v1/wishlist_gift_reservations?select=wish_id&limit=1',session.data.access_token);if(!((r.status===403)||(r.status===200&&Array.isArray(r.data)&&r.data.length===0)))throw Error('Direct reservations exposure for '+name+': '+r.status);console.log('PASS: '+name+' cannot read reservations directly');}
const own=await call('/rest/v1/rpc/wishlist_my_gift_reservations',a.data.access_token,'POST',{});
if(own.status!==200||!Array.isArray(own.data))throw Error('Own reservation RPC failed: '+own.status);
const status=await call('/rest/v1/rpc/wishlist_reservation_status',b.data.access_token,'POST',{p_wish_ids:[]});
if(status.status!==200||!Array.isArray(status.data))throw Error('Reservation status RPC failed: '+status.status);
console.log('PASS: reservation RPC smoke checks');
console.log('NOTE: E2E mutation flows require fixture-specific setup; not covered by this smoke runner');
