/**
 * Toolya Connect: gift planner tasks belong to wishlist_gift_tasks.
 * This adapter never copies or deletes tasks; it only updates the source status.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const day=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v);
export function projectGiftTasks(rows,userId){
  return (rows||[]).filter(row=>row&&row.user_id===userId&&UUID.test(row.id)&&
    !row.archived_at&&['open','in_progress','done'].includes(row.status)&&
    typeof row.title==='string'&&row.title.trim()).map(row=>({
      source:'gift',kind:'task',id:'gift:'+row.id,itemId:row.id,
      text:row.title.trim().slice(0,160),done:row.status==='done',
      due:day(row.due_date)?row.due_date:null,origin:'Geschenkeplaner',
      url:'/tools/wishes/gift-tasks.html'
    }));
}
export function createGiftTasksConnect(client){
  if(!client?.auth?.getUser||!client.from)throw TypeError('Toolya Cloud nicht verfügbar.');
  let owner=null,known=new Map(),truncated=false;
  async function verified(){
    const {data,error}=await client.auth.getUser();
    if(error||!data?.user?.id||data.user.is_anonymous)throw Error('Bestätigte Anmeldung erforderlich.');
    return data.user.id;
  }
  async function load(){
    const uid=await verified();
    const {data,error}=await client.from('wishlist_gift_tasks')
      .select('id,user_id,title,due_date,status,archived_at,updated_at')
      .eq('user_id',uid).is('archived_at',null)
      .order('updated_at',{ascending:false}).limit(1000);
    if(error)throw Error('Geschenkeaufgaben nicht verfügbar: '+error.message);
    if(await verified()!==uid)throw Error('Konto während des Ladens gewechselt.');
    const rows=(data||[]).filter(r=>r.user_id===uid);
    known=new Map(rows.filter(r=>UUID.test(r.id)).map(r=>[r.id,r]));
    owner=uid;truncated=rows.length===1000;
    return {shopping:[],tasks:projectGiftTasks(rows,uid),truncated};
  }
  async function setDone(item,done){
    const uid=await verified();
    if(uid!==owner||item?.source!=='gift'||item.kind!=='task'||!UUID.test(item.itemId))
      throw Error('Geschenkeaufgabe muss zuerst neu geladen werden.');
    const row=known.get(item.itemId);
    if(!row||row.user_id!==uid||!['open','in_progress','done'].includes(row.status)||
       !row.updated_at||row.archived_at)throw Error('Aufgabe ist nicht mehr verfügbar.');
    if((row.status==='done')===Boolean(done))return load();
    const next=done?'done':'open';
    // Optimistic concurrency protects against stale dashboard edits.
    const {data,error}=await client.from('wishlist_gift_tasks')
      .update({status:next,updated_at:new Date().toISOString()})
      .eq('id',row.id).eq('user_id',uid).eq('updated_at',row.updated_at)
      .is('archived_at',null).eq('status',row.status)
      .select('id,user_id,status,updated_at');
    if(error)throw Error('Geschenkeaufgabe konnte nicht gespeichert werden: '+error.message);
    if(!Array.isArray(data)||data.length!==1)throw Error('Konflikt: Geschenkeaufgabe wurde bereits geändert. Bitte neu laden.');
    if(await verified()!==uid)throw Error('Konto während des Speicherns gewechselt.');
    return load();
  }
  return Object.freeze({load,setDone});
}
