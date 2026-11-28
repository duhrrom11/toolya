// Account-scoped preferences stored in the same cloud snapshot, never localStorage.
export const categories=Object.freeze(['Lebensmittel','Wohnen','Energie','Auto','Freizeit','Elektronik','Gesundheit','Haustiere','Verträge','Sonstiges']);
const normalize=value=>String(value??'').trim().normalize('NFC').toLowerCase();
const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9-]{1,80}$/.test(id);
function upsert(list,item){
  if(!validId(item.id))throw Error('invalid-id');
  return [...list.filter(x=>x.id!==item.id),item];
}
export function saveProfile(list,profile){
  const name=String(profile.name??'').trim(),source=String(profile.source??'').trim();
  if(!name||name.length>120||!source||source.length>120)throw Error('invalid-profile');
  if(!['utf-8','windows-1252','utf-16le','utf-16be'].includes(profile.encoding)||
     ![';',','].includes(profile.delimiter)||!['de','en'].includes(profile.locale)||
     !['DMY','MDY','ISO'].includes(profile.dateFormat)||!['signed','reverse','split'].includes(profile.mode))throw Error('invalid-profile');
  const mapping={};
  for(const key of ['date','title','amount','debit','credit','transactionId']){
    const v=profile.mapping?.[key];
    if(v!=null&&(!Number.isInteger(v)||v< -1||v>=200))throw Error('invalid-mapping');
    mapping[key]=v??-1;
  }
  if(mapping.date<0||mapping.title<0||(profile.mode==='split'?(mapping.debit<0||mapping.credit<0||mapping.debit===mapping.credit):mapping.amount<0))throw Error('invalid-mapping');
  return upsert(list,{id:profile.id,name,source,encoding:profile.encoding,delimiter:profile.delimiter,locale:profile.locale,dateFormat:profile.dateFormat,mode:profile.mode,mapping});
}
export function saveRule(list,rule){
  const match=String(rule.match??'').trim();
  if(!match||match.length>120||!categories.includes(rule.category))throw Error('invalid-rule');
  return upsert(list,{id:rule.id,match,category:rule.category});
}
// Longest matching literal wins; equal lengths use explicit stable ID order.
export function suggestCategory(title,rules){
  const value=normalize(title);
  return rules.filter(r=>normalize(r.match)&&categories.includes(r.category)&&value.includes(normalize(r.match)))
    .sort((a,b)=>normalize(b.match).length-normalize(a.match).length||(a.id<b.id?-1:a.id>b.id?1:0))[0]?.category??null;
}
export function removePreference(list,id){return list.filter(x=>x.id!==id);}
export function bulkEdit(entries,selectedIds,visibleIds,patch){
  const ids=new Set(selectedIds),visible=new Set(visibleIds);
  if(!ids.size||[...ids].some(id=>!visible.has(id)))throw Error('invalid-selection');
  if(!Object.keys(patch).length||Object.keys(patch).some(k=>!['category','needsReview'].includes(k)))throw Error('invalid-patch');
  if('category'in patch&&!categories.includes(patch.category))throw Error('invalid-category');
  if('needsReview'in patch&&typeof patch.needsReview!=='boolean')throw Error('invalid-status');
  let changed=0;
  const next=entries.map(r=>{
    if(!ids.has(r.id))return r;
    if('category'in patch&&(r.entryType==='einnahme'||r.category==='Einnahme'||r.splits?.length))throw Error('category-protected');
    changed++;return {...r,...patch};
  });
  if(changed!==ids.size)throw Error('missing-booking');
  return {entries:next,changed};
}
