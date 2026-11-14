// Pure wishlist helpers: no browser, database or network dependencies.
export function eligibleBulkTargets(ids, knownIds, assignedIds, add) {
 const known=new Set(knownIds),seen=new Set();
 return [...ids].filter(id=>{if(seen.has(id)||!known.has(id))return false;seen.add(id);return add?!assignedIds.has(id):assignedIds.has(id)});
}
export function summarizeBulk({targets,completed=[],failed=[],stopped=false}) {
 const done=new Set([...completed,...failed]),remaining=targets.filter(id=>!done.has(id));
 return {total:targets.length,success:completed.length,failed:[...failed],remaining,interrupted:stopped||remaining.length>0};
}
export function bulkContextValid(job,{userId,listId,ready,activeListIds}) {
 return !!job&&!!ready&&job.uid===userId&&job.listId===listId&&activeListIds.has(job.listId);
}
export function bulkErrorHint(error) {
 const code=String(error?.code||''),status=Number(error?.status||0),message=String(error?.message||'').toLowerCase();
 if(message.includes('bereits in einem anderen tab entfernt'))return 'Zuordnung parallel entfernt – bitte Liste aktualisieren.';
 if(message.includes('bereits in einem anderen tab hinzugefügt'))return 'Zuordnungskonflikt mit anderem Tab – bitte Liste aktualisieren.';
 if(code==='23505'||message.includes('duplicate key'))return 'Bereits zugeordnet – bitte Liste aktualisieren.';
 if(status===401||status===403||code==='42501'||message.includes('permission denied'))return 'Keine Berechtigung – bitte Anmeldung und Listenrechte prüfen.';
 if(status===429||message.includes('rate limit'))return 'Zu viele Anfragen – bitte später erneut versuchen.';
 if(message.includes('network')||message.includes('fetch')||message.includes('timeout'))return 'Verbindungsproblem – bitte Verbindung prüfen.';
 return 'Änderung fehlgeschlagen – bitte später erneut versuchen.';
}

export async function fetchAllPages(fetchPage,{pageSize=1000,isCurrent=()=>true}={}) {
 if(!Number.isSafeInteger(pageSize)||pageSize<1)throw new RangeError('pageSize must be a positive integer');
 const rows=[];
 for(let offset=0;;offset+=pageSize){
  if(!isCurrent())return null;
  const response=await fetchPage(offset,offset+pageSize-1);
  if(!isCurrent())return null;
  if(response.error)throw response.error;
  const batch=response.data||[];
  if(!Array.isArray(batch))throw new TypeError('Paginated response must contain an array');
  rows.push(...batch);
  if(batch.length<pageSize)return rows;
 }
}

/** Runs one confirmed bulk job against an injected adapter. Never retries automatically. */
export async function executeBulkJob({targets,write,isCurrent=()=>true,shouldStop=()=>false,onProgress=()=>{}}) {
 const completed=[],failed=[],errors=new Map();
 let interrupted=false,invalidated=false;
 for(const wishId of targets){
  if(!isCurrent()){invalidated=true;interrupted=true;break}
  if(shouldStop()){interrupted=true;break}
  try{
   const response=await write(wishId);
   // The write may have reached the server, but must not update another account's UI.
   if(!isCurrent()){invalidated=true;interrupted=true;break}
   if(response?.error)throw response.error;
   completed.push(wishId);
  }catch(error){
   if(!isCurrent()){invalidated=true;interrupted=true;break}
   failed.push(wishId);
   const reason=bulkErrorHint(error);
   errors.set(reason,(errors.get(reason)||0)+1);
  }
  onProgress({done:completed.length+failed.length,total:targets.length,success:completed.length,failed:failed.length});
 }
 const summary=summarizeBulk({targets,completed,failed,stopped:interrupted});
 return {...summary,completed,errors:[...errors].map(([reason,count])=>({reason,count})),invalidated};
}

/** A reload invalidates membership-dependent controls until a complete snapshot arrives. */
export function bulkControlsEnabled({membershipReady,bulkBusy}) {
 return !!membershipReady&&!bulkBusy;
}

/** Only the latest load for the signed-in account may publish a result or an error. */
export function currentDashboardLoad({requestedUserId,currentUserId,requestedGeneration,currentGeneration}) {
 return !!requestedUserId&&requestedUserId===currentUserId&&requestedGeneration===currentGeneration;
}

/** Fetch the dashboard's initial read-only snapshot through an injected Supabase-like client. */
export async function fetchDashboardBase(db,userId) {
 const [lists,wishes]=await Promise.all([
  db.from('wishlist_lists').select('id,title,description,icon,color,visibility,archived,created_at').eq('user_id',userId).order('created_at',{ascending:false}),
  db.from('wishlist_wishes').select('id,note,priority,created_at,wishlist_products(title,asin,marketplace,image_url,price,description,scraped_at)').eq('user_id',userId).order('created_at',{ascending:false}).order('id',{ascending:false}).range(0,999)
 ]);
 return {lists,wishes};
}

/** Read all membership pages with a read-only injected Supabase-like client. */
export function fetchDashboardMembership(db,userId,{pageSize=1000,isCurrent=()=>true}={}) {
 return fetchAllPages((from,to)=>db.from('wishlist_list_items').select('list_id,wish_id').eq('user_id',userId).order('list_id',{ascending:true}).order('wish_id',{ascending:true}).range(from,to),{pageSize,isCurrent});
}

/** Derive list-specific membership only from a completed, ready snapshot. */
export function membershipForSelectedList({membershipReady,membershipByList,listId}) {
 if(!membershipReady||!listId)return new Set();
 return new Set(membershipByList.get(listId)||[]);
}

/** Status is provisional when a post-write refresh cannot confirm membership. */
export function bulkMoveRefreshStatus(summary,{refreshSucceeded,currentContext}={}) {
 if(!currentContext)return null;
 return refreshSucceeded?summary:'Sammelverschiebung beendet, aber der aktuelle Zuordnungsstand konnte nicht geladen werden. Vorläufiges Ergebnis: '+summary;
}

/** Distinguish errors before any write from uncertain outcomes after a write starts. */
export function moveFailureState({writeStarted=false,contextValid=true}={}) {
 return {uncertain:!!writeStarted,refreshRequired:!!writeStarted&&!!contextValid,mayPublish:!!contextValid};
}

/** Uncertain is an overlapping subset, not an extra number of processed wishes. */
export function bulkMoveCounts({total,moved,failed,uncertain,stopped=false}) {
 if(![total,moved,failed,uncertain].every(n=>Number.isSafeInteger(n)&&n>=0)||moved+failed>total||uncertain>total)throw new RangeError('Invalid bulk move counters');
 return {total,moved,failed,uncertain,unfinished:stopped?total-moved-failed:0,overlapPossible:uncertain>0};
}
