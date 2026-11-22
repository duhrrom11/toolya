/**
 * One normalized view across dashboard-owned items and authorized Toolya source adapters.
 * Tools keep ownership of their data. This module never writes snapshots into another table.
 */
import {createWgConnect} from '../../shared/toolya/connect-wg-lists.mjs';
import {createDueSource} from '../../shared/toolya/connect-due-sources.mjs';
import {createConnectRegistry} from '../../shared/toolya/connect-source-registry.mjs';
const TABLE='dashboard_shopping_items';
const normalizeTitle = title => {
  if(typeof title!=='string'||!title.trim()||title.trim().length>160||
     /[\u0000-\u001f\u007f]/.test(title))throw Error('Bitte eine Artikelbezeichnung mit maximal 160 Zeichen eingeben.');
  return title.trim();
};
export function projectDashboardShopping(rows,userId) {
  return (rows||[]).filter(r=>r?.user_id===userId&&!r.deleted_at).map(r=>({
    source:'dashboard',kind:'shopping',id:r.id,itemId:r.id,text:r.title,done:r.completed===true,
    revision:r.revision,origin:'Mein Dashboard',url:'/dashboard/'
  }));
}
export function createUnifiedShopping(client) {
  if(!client?.auth?.getUser || !client.from)throw TypeError('Supabase nicht verfügbar.');
  const wg=createWgConnect(client);
  const dueSources=['loans','car','pet'].map(id=>({id,...createDueSource(client,id)}));
  const registry=createConnectRegistry([{id:'wg',load:()=>wg.load(),setDone:(item,done)=>wg.setDone(item,done)},...dueSources]);
  let owner=null,rows=[],shopping=[],tasks=[],partial=false;
  async function user() {
    const {data,error}=await client.auth.getUser();
    if(error||!data?.user?.id||data.user.is_anonymous)throw Error('Für die gemeinsame Einkaufsliste ist eine Anmeldung nötig.');
    return data.user.id;
  }
  async function load() {
    const uid=await user();
    const [ownResult,sourceResult]=await Promise.all([
      client.from(TABLE).select('id,user_id,title,completed,revision,deleted_at,created_at')
        .eq('user_id',uid).is('deleted_at',null).order('created_at',{ascending:true}).limit(1000),
      registry.load().then(value=>({data:value,error:null}),error=>({data:null,error}))
    ]);
    if(await user()!==uid)throw Error('Konto während des Ladens gewechselt.');
    if(ownResult.error)throw Error('Dashboard-Einkaufsliste nicht verfügbar: '+ownResult.error.message);
    rows=ownResult.data||[];
    owner=uid;
    partial=Boolean(sourceResult.error)||rows.length===1000||Boolean(sourceResult.data?.partial);
    shopping=[
      ...projectDashboardShopping(rows,uid),
      ...(sourceResult.data?.shopping||[])
    ];
    tasks=sourceResult.data?.tasks||[];
    return snapshot();
  }
  function snapshot() {return {userId:owner,shopping:[...shopping],tasks:[...tasks],partial};}
  async function guard() {
    const uid=await user();
    if(!owner||owner!==uid)throw Error('Bitte die gemeinsame Liste nach dem Kontowechsel neu laden.');
    return uid;
  }
  async function add(title) {
    const uid=await guard();
    const value=normalizeTitle(title);
    const {data,error}=await client.from(TABLE)
      .insert({user_id:uid,title:value,completed:false}).select('id,user_id,title,completed,revision,deleted_at,created_at').single();
    if(error)throw Error('Artikel konnte nicht gespeichert werden: '+error.message);
    if(await user()!==uid)throw Error('Konto während des Speicherns gewechselt.');
    if(!data || data.user_id!==uid)throw Error('Cloud-Speicherung nicht bestätigt.');
    return load();
  }
  async function setDone(item,done) {
    const uid=await guard();
    if(item?.source==='wg'||['loans','car','pet'].includes(item?.source)) {
      if(item.kind!=='shopping'&&item.kind!=='task')throw Error('Ungültiger Connect-Eintrag.');
      await registry.setDone(item,Boolean(done));
      if(await user()!==uid)throw Error('Konto während des Connect-Speicherns gewechselt.');
      return load();
    }
    if(item?.source!=='dashboard'||item.kind!=='shopping')throw Error('Unbekannte Einkaufslisten-Quelle.');
    const row=rows.find(r=>r.id===item.id&&r.user_id===uid);
    if(!row)throw Error('Artikel ist nicht mehr in der Liste.');
    if(Boolean(row.completed)===Boolean(done))return snapshot();
    const {data,error}=await client.from(TABLE).update({completed:Boolean(done),revision:row.revision+1,
      updated_at:new Date().toISOString()})
      .eq('id',row.id).eq('user_id',uid).eq('revision',row.revision).is('deleted_at',null)
      .select('id,user_id,title,completed,revision,deleted_at,created_at');
    if(error)throw Error('Artikel konnte nicht aktualisiert werden: '+error.message);
    if(data?.length!==1)throw Error('Speicherkonflikt: Artikel wurde auf einem anderen Gerät geändert.');
    if(await user()!==uid)throw Error('Konto während des Speicherns gewechselt.');
    return load();
  }
  async function remove(item) {
    const uid=await guard();
    if(item?.source!=='dashboard'||item.kind!=='shopping')throw Error('Nur eigene Dashboard-Artikel können hier entfernt werden.');
    const row=rows.find(r=>r.id===item.id&&r.user_id===uid);
    if(!row)throw Error('Artikel wurde bereits entfernt.');
    const {data,error}=await client.from(TABLE).update({revision:row.revision+1,
      deleted_at:new Date().toISOString(),updated_at:new Date().toISOString()})
      .eq('id',row.id).eq('user_id',uid).eq('revision',row.revision).is('deleted_at',null).select('id');
    if(error)throw Error('Artikel konnte nicht entfernt werden: '+error.message);
    if(data?.length!==1)throw Error('Speicherkonflikt: Artikel wurde inzwischen bearbeitet.');
    if(await user()!==uid)throw Error('Konto während des Speicherns gewechselt.');
    return load();
  }
  return Object.freeze({load,add,setDone,remove,snapshot});
}
