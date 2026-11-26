/* Toolya shared browser account client. Keep the existing project/session key.
 * The anonymous directory uses a separate explicitly configured client; never
 * route it through this singleton. Never accept a secret/service-role key. */
(function(root){
 'use strict';
 const URL='https://yheogmeaosuigyaxkwth.supabase.co';
 const KEY='sb_publishable_PK20oOPzG3AB-bd95Ji9Tg_C-MIUgyv';
 let account=null,identity=null;
 function get(url,key){
  const config=root.HELPERLEIN_SUPABASE_CONFIG;
  if(url===undefined)url=config?.url||URL;
  if(key===undefined)key=config?.publishableKey||KEY;
  const production=url===URL&&key===KEY&&(!config||(config.mode==='production'&&config.url===URL&&config.publishableKey===KEY));
  const preview=config?.mode==='preview'&&url===config.url&&key===config.publishableKey&&url!==URL&&key!==KEY&&/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)&&typeof key==='string'&&key.startsWith('sb_publishable_');
  if(!production&&!preview)throw new Error('Invalid Toolya account configuration');
  if(!root.supabase?.createClient)return null;
  if(account){
   if(identity.url!==url||identity.key!==key)throw new Error('Toolya account project changed during page lifetime');
   return account;
  }
  account=root.supabase.createClient(url,key);
  identity={url,key};
  return account;
 }
 async function deadline(operation,ms=10000){
  let timer;
  try{return await Promise.race([Promise.resolve().then(operation),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Account check timed out')),ms)})]);}
  finally{clearTimeout(timer);}
 }
 // Account operations preserve SDK response shapes and caller-specific UI/security.
 // No automatic retry of mutations: a timeout does not prove the server rejected a request.
 const services=new WeakMap();
 function forClient(client){
  if(!client?.auth)throw new Error('Toolya account unavailable');
  if(services.has(client))return services.get(client);
  const call=(method,args)=>Promise.resolve().then(()=>client.auth[method](...args));
  const service=Object.freeze({
   signInWithPassword:(...args)=>call('signInWithPassword',args),
   signUp:(...args)=>call('signUp',args),
   signOut:(...args)=>call('signOut',args),
   resetPasswordForEmail:(...args)=>call('resetPasswordForEmail',args),
   updateUser:(...args)=>call('updateUser',args),
   getUser:(...args)=>call('getUser',args),
   getSession:(...args)=>call('getSession',args),
   // Preserve synchronous notification semantics; adapters must defer SDK reentry.
   onAuthStateChange:(...args)=>client.auth.onAuthStateChange(...args)
  });
  services.set(client,service);
  return service;
 }
 root.toolyaAuth=Object.freeze({get,deadline,forClient});
})(typeof window==='undefined'?globalThis:window);
