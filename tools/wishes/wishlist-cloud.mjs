// The cloud is a small, shuffled discovery preview, not the complete search index.
export function sampleCloud(entries,limit=42,random=Math.random){
 const unique=new Map();
 for(const row of Array.isArray(entries)?entries:[]){
  if(!row||typeof row.display_name!=='string'||!row.display_name.trim()
   ||typeof row.user_id!=='string'||!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(row.user_id))continue;
  if(!unique.has(row.user_id))unique.set(row.user_id,{user_id:row.user_id,display_name:row.display_name.trim()});
 }
 const shuffled=[...unique.values()];
 for(let i=shuffled.length-1;i>0;i--){
  const n=Number(random()),j=Math.min(i,Math.max(0,Math.floor((Number.isFinite(n)?n:0)* (i+1))));
  [shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];
 }
 return shuffled.slice(0,Math.max(0,Math.min(60,Math.floor(limit))));
}
