// Pure helpers for the future opt-in, owner-scoped wishlist extras migration.
// This module performs no database, network or browser-storage operations.
export function normalizeWishExtras(value) {
 if(!value || typeof value!=='object' || Array.isArray(value)) return null;
 const imageUrl=typeof value.imageUrl==='string'?value.imageUrl.trim():'';
 if(imageUrl){try{if(new URL(imageUrl).protocol!=='https:')return null}catch{return null}}
 const price=value.price==null||value.price===''?null:Number(value.price);
 if(price!==null&&(!Number.isFinite(price)||price<0||price>999999))return null;
 const quantity=Number(value.quantity??1);
 if(!Number.isInteger(quantity)||quantity<1||quantity>999)return null;
 const status=value.status??'open';
 if(!['open','planned','fulfilled'].includes(status))return null;
 return {imageUrl,price,quantity,status};
}
export function planWishExtrasImport(localEntries,remoteEntries,ownedWishIds) {
 const owned=new Set([...ownedWishIds].map(String));
 const remote=remoteEntries&&typeof remoteEntries==='object'&&!Array.isArray(remoteEntries)?remoteEntries:{};
 const local=localEntries&&typeof localEntries==='object'&&!Array.isArray(localEntries)?localEntries:{};
 const toCreate={},conflicts=[],invalid=[];
 for(const [id,value] of Object.entries(local)){
  if(!owned.has(id))continue;
  const normalized=normalizeWishExtras(value);
  if(!normalized){invalid.push(id);continue}
  // Existing remote data is authoritative; never silently overwrite it.
  if(Object.hasOwn(remote,id)){conflicts.push(id);continue}
  toCreate[id]=normalized;
 }
 return {toCreate,conflicts,invalid};
}
