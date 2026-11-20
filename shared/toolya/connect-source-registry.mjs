/**
 * Toolya Connect provider contract for future tasks and shopping lists.
 *
 * Register ONLY first-party reviewed providers. A provider must read its own
 * authorized Cloud data, return [{source,kind,id,text,done,origin,url}], and
 * write acknowledgements to the ORIGINAL source with its own conflict checks.
 * Never deduplicate different source IDs based on a matching article title:
 * two identical names may be intentional distinct purchases.
 */
export function createConnectRegistry(providers) {
  if(!Array.isArray(providers) || !providers.length)throw TypeError('Mindestens ein Connector erforderlich.');
  const map=new Map();
  for(const provider of providers){
    if(!provider||typeof provider.id!=='string'||!/^[a-z][a-z0-9_-]{0,39}$/.test(provider.id)||
       typeof provider.load!=='function'||typeof provider.setDone!=='function'||map.has(provider.id))
      throw TypeError('Ungültiger oder doppelter Toolya-Connect-Adapter.');
    map.set(provider.id,provider);
  }
  async function load(){
    const result=await Promise.all([...map.values()].map(async provider=>{
      try{
        const data=await provider.load();
        if(!data||!Array.isArray(data.shopping)||!Array.isArray(data.tasks))throw Error('Ungültige Listenquelle.');
        const valid=item=>item&&item.source===provider.id&&['shopping','task'].includes(item.kind)
          &&typeof item.id==='string'&&item.id.length<=255&&typeof item.text==='string'
          &&typeof item.done==='boolean'&&typeof item.origin==='string';
        if(![...data.shopping,...data.tasks].every(valid))throw Error('Ungültiger Datensatz einer Listenquelle.');
        return {data,error:null};
      }catch(error){return {data:null,error};}
    }));
    return {shopping:result.flatMap(r=>r.data?.shopping||[]),
      tasks:result.flatMap(r=>r.data?.tasks||[]),
      partial:result.some(r=>r.error||r.data?.truncated)};
  }
  async function setDone(item,done){
    const provider=map.get(item?.source);
    if(!provider||typeof done!=='boolean')throw Error('Unbekannte Toolya-Connect-Quelle.');
    return provider.setDone(item,done);
  }
  return Object.freeze({load,setDone,sources:Object.freeze([...map.keys()])});
}
