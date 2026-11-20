/**
 * Toolya Connect source adapters.
 * Sources own their data; the dashboard is only a projection of authorized rows.
 * Every connected source must provide load() and setDone() with the same semantics.
 * Never copy shared WG data into private dashboard tables.
 */
export const connectorKinds = Object.freeze({
  shopping: 'shopping',
  task: 'task'
});
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validItemId = id => (typeof id === 'number' && Number.isSafeInteger(id) && id >= 0) ||
  (typeof id === 'string' && id.length > 0 && id.length <= 120 && /^[a-zA-Z0-9_-]+$/.test(id));
const clean = value => typeof value === 'string' ? value.trim().slice(0,160) : '';
function projectWgRow(row) {
  if (!row || !uuid.test(row.id) || !row.payload || typeof row.payload !== 'object' || Array.isArray(row.payload)) return null;
  const p=row.payload;
  const shopping=Array.isArray(p.shopping) ? p.shopping : [];
  const cleaning=Array.isArray(p.cleaning) ? p.cleaning : [];
  return {
    id: row.id, updated_at: row.updated_at, payload:p,
    shopping:shopping.filter(item => item && validItemId(item.id) && clean(item.title)).map(item=>({
      source:'wg', kind:'shopping', groupId:row.id, itemId:String(item.id), id:'wg:'+row.id+':shopping:'+item.id,
      text:clean(item.title), done:item.done===true, origin:'WG-Organisator', url:'/tools/housemates/?id=secure_'+row.id
    })),
    tasks:cleaning.filter(item => item && validItemId(item.id) && clean(item.task)).map(item=>({
      source:'wg', kind:'task', groupId:row.id, itemId:String(item.id), id:'wg:'+row.id+':task:'+item.id,
      text:clean(item.task), done:item.done===true, origin:'WG-Putzplan',
      assignee:clean(item.assignee), url:'/tools/housemates/?id=secure_'+row.id
    }))
  };
}
export function projectWgSnapshot(row){return projectWgRow(row)}
export function createWgConnect(client) {
  if (!client?.auth?.getUser || !client.from) throw TypeError('Toolya Cloud ist nicht verfügbar.');
  let owner=null, groups=new Map();
  async function verified(){
    const {data,error}=await client.auth.getUser();
    if(error||!data?.user?.id||data.user.is_anonymous)throw Error('Eine bestätigte Toolya-Anmeldung ist erforderlich.');
    return data.user.id;
  }
  async function load() {
    const uid=await verified();
    // RLS limits this query to WGs owned by the user or explicitly shared with them.
    const {data,error}=await client.from('wg_spaces')
      .select('id,owner_id,payload,updated_at').order('updated_at',{ascending:false}).limit(100);
    if(error) throw Error('WG-Einkaufslisten konnten nicht geladen werden: '+error.message);
    if(await verified()!==uid)throw Error('Konto beim Laden gewechselt.');
    const parsed=(data||[]).map(projectWgRow).filter(Boolean);
    groups=new Map(parsed.map(row=>[row.id,row]));
    owner=uid;
    return {shopping:parsed.flatMap(row=>row.shopping),tasks:parsed.flatMap(row=>row.tasks),
      truncated:(data||[]).length===100};
  }
  async function setDone(item,done) {
    const uid=await verified();
    if(uid!==owner)throw Error('WG-Daten müssen zuerst neu geladen werden.');
    const group=groups.get(item.groupId);
    if(!group||!['shopping','task'].includes(item.kind)||!validItemId(item.itemId))
      throw Error('WG-Eintrag nicht mehr verfügbar.');
    const field=item.kind==='shopping'?'shopping':'cleaning';
    const data=structuredClone(group.payload);
    if(!Array.isArray(data[field]))throw Error('WG-Listenformat ist ungültig.');
    const match=data[field].find(x=>x && String(x.id)===String(item.itemId));
    if(!match)throw Error('Eintrag wurde in der WG geändert.');
    if(Boolean(match.done)===Boolean(done))return load();
    match.done=Boolean(done);
    const previous=Date.parse(group.updated_at);
    if(!Number.isFinite(previous))throw Error('WG-Versionsstand ist ungültig.');
    const revision=new Date(Math.max(Date.now(),previous+1)).toISOString();
    if(await verified()!==uid)throw Error('Konto beim Speichern gewechselt.');
    const {data:written,error}=await client.from('wg_spaces')
      .update({payload:data,updated_at:revision})
      .eq('id',group.id).eq('updated_at',group.updated_at)
      .select('id,updated_at').maybeSingle();
    if(error)throw Error('WG-Speichern fehlgeschlagen: '+error.message);
    if(!written)throw Error('WG-Konflikt: Die Liste wurde auf einem anderen Gerät bearbeitet. Bitte neu laden.');
    if(await verified()!==uid)throw Error('Konto beim Speichern gewechselt.');
    return load();
  }
  return Object.freeze({load,setDone});
}
