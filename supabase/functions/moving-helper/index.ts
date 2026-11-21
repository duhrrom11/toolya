// Toolya Moving Control – explicit authorisation at every operation.
// Public helper tokens are opaque, short-lived and stored only as SHA-256 hashes.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";
const SUPABASE_URL=Deno.env.get('SUPABASE_URL')??'';
const KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??'';
if(!SUPABASE_URL||!KEY)throw Error('Supabase server configuration missing');
const db=createClient(SUPABASE_URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const SITE='https://toolya.app';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const states=['planned','packed','loaded','arrived','unpacked'];
const isUuid=(v:unknown)=>typeof v==='string'&&uuid.test(v);
const isObject=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
function cors(origin:string|null){return {'Access-Control-Allow-Origin':origin===SITE?SITE:(origin?.startsWith('http://127.0.0.1:')||origin?.startsWith('http://localhost:')?origin:''),'Vary':'Origin','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'};}
function result(status:number,data:unknown,origin:string|null){return new Response(JSON.stringify(data),{status,headers:{...cors(origin),'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});}
function fail(status:number,message:string,origin:string|null){return result(status,{error:message},origin);}
async function digest(value:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,'0')).join('');}
async function owner(req:Request){const auth=req.headers.get('Authorization')||'';if(!auth.startsWith('Bearer '))return null;const token=auth.slice(7);if(!token||token.startsWith('sb_'))return null;const {data,error}=await db.auth.getUser(token);return error||!data?.user?.id||data.user.is_anonymous?null:data.user.id;}
async function source(ownerId:string,projectId:string){const {data,error}=await db.from('user_data').select('data').eq('user_id',ownerId).eq('tool','umzugskisten-inventar').maybeSingle();if(error)throw Error('CLOUD_READ');const s=data?.data;if(!isObject(s)||!Array.isArray(s.boxes)||!isObject(s.moving))return null;const p=Array.isArray(s.moving.projects)?s.moving.projects.find((p:unknown)=>isObject(p)&&p.id===projectId&&p.status==='active'):null;if(!p)return null;const assignments=Array.isArray(s.moving.assignments)?s.moving.assignments.filter((a:unknown)=>isObject(a)&&a.projectId===projectId):[];const rooms=Array.isArray(s.moving.rooms)?s.moving.rooms.filter((r:unknown)=>isObject(r)&&r.projectId===projectId):[];return {p,assignments,rooms,boxes:s.boxes};}
async function activeGrant(token:string){if(typeof token!=='string'||!/^[A-Za-z0-9_-]{40,100}$/.test(token))return null;const hashed=await digest(token);const {data,error}=await db.from('moving_helper_grants').select('id,owner_id,project_id,helper_label,scope,expires_at').eq('token_hash',hashed).is('revoked_at',null).gt('expires_at',new Date().toISOString()).maybeSingle();if(error)throw Error('GRANT_READ');return data?{...data,hashed}:null;}
async function list(ownerId:string,projectId:string){const [s,v,g]=await Promise.all([
 db.from('moving_transport_state').select('assignment_id,status,version').eq('owner_id',ownerId).eq('project_id',projectId),
 db.from('moving_public_box_views').select('assignment_id,display_label,room_label,priority').eq('owner_id',ownerId).eq('project_id',projectId),
 db.from('moving_helper_grants').select('id,helper_label,expires_at,revoked_at,created_at').eq('owner_id',ownerId).eq('project_id',projectId).order('created_at',{ascending:false})
]);if(s.error||v.error||g.error)throw Error('LIST_READ');const views=new Map((v.data||[]).map((x)=>[x.assignment_id,x]));return {boxes:(s.data||[]).map(x=>({assignmentId:x.assignment_id,status:x.status,version:x.version,label:views.get(x.assignment_id)?.display_label||'Kiste',room:views.get(x.assignment_id)?.room_label||'',priority:views.get(x.assignment_id)?.priority||'normal'})),grants:g.data||[]};}
async function sync(ownerId:string,projectId:string){const src=await source(ownerId,projectId);if(!src)return null;if(src.assignments.length>1500)throw Error('TOO_MANY');const boxMap=new Map(src.boxes.filter(isObject).map((b)=>[b.id,b]));const roomMap=new Map(src.rooms.filter(isObject).map((r)=>[r.id,r]));const initial=[];const publicRows=[];for(const a of src.assignments){if(!isObject(a)||!isUuid(a.id)||!Number.isSafeInteger(a.boxId))continue;const b=boxMap.get(a.boxId);if(!b)continue;const r=roomMap.get(a.targetRoomId);initial.push({owner_id:ownerId,project_id:projectId,assignment_id:a.id,box_id:a.boxId,status:states.includes(String(a.status))?a.status:'planned'});publicRows.push({owner_id:ownerId,project_id:projectId,assignment_id:a.id,display_label:String(b.name||'Kiste').slice(0,100),room_label:String(r?.name||'').slice(0,80),priority:['normal','important','first_day'].includes(String(a.priority))?a.priority:'normal'});}
 // Never overwrite a server status/version after initial import.
 if(initial.length){const ids=initial.map(x=>x.assignment_id);const {data:existing,error:lookupError}=await db.from('moving_transport_state').select('assignment_id').eq('owner_id',ownerId).eq('project_id',projectId).in('assignment_id',ids);if(lookupError)throw Error('STATE_READ');const exists=new Set((existing||[]).map(x=>x.assignment_id));const missing=initial.filter(x=>!exists.has(x.assignment_id));if(missing.length){const {error}=await db.from('moving_transport_state').upsert(missing,{onConflict:'owner_id,project_id,assignment_id',ignoreDuplicates:true});if(error)throw Error('STATE_WRITE');}const {error:projectionError}=await db.from('moving_public_box_views').upsert(publicRows,{onConflict:'owner_id,project_id,assignment_id'});if(projectionError)throw Error('PROJECTION_WRITE');}
 return list(ownerId,projectId);
}
function allowedOrigin(origin:string|null){return !origin||origin===SITE||origin.startsWith('http://127.0.0.1:')||origin.startsWith('http://localhost:');}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('Origin');
 if(!allowedOrigin(origin))return fail(403,'Origin not allowed',origin);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(origin)});
 if(req.method!=='POST')return fail(405,'Use POST',origin);
 if(Number(req.headers.get('Content-Length')||0)>16384)return fail(413,'Request too large',origin);
 try{
  const raw=await req.text();if(raw.length>16384)return fail(413,'Request too large',origin);
  const payload=JSON.parse(raw);if(!isObject(payload))return fail(400,'Invalid request',origin);
  const action=payload.action;
  if(['view','transition'].includes(String(action))){
    const grant=await activeGrant(String(payload.token||''));if(!grant)return fail(401,'Link invalid or expired',origin);
    const src=await source(grant.owner_id,grant.project_id);if(!src)return fail(403,'Project not active',origin);
    if(action==='view'){const current=await list(grant.owner_id,grant.project_id);const allowed=new Set(src.assignments.filter(isObject).map(a=>a.id));return result(200,{helperLabel:grant.helper_label,projectName:String(src.p.name||'Umzug').slice(0,100),boxes:current.boxes.filter(b=>allowed.has(b.assignmentId))},origin);}
    if(!isUuid(payload.assignmentId)||!isUuid(payload.requestId)||!Number.isSafeInteger(payload.expectedVersion)||!states.includes(String(payload.status))||!src.assignments.some(a=>isObject(a)&&a.id===payload.assignmentId))return fail(400,'Invalid change',origin);
    const {data,error}=await db.rpc('moving_helper_transition',{p_token_hash:grant.hashed,p_assignment_id:payload.assignmentId,p_expected_version:payload.expectedVersion,p_next_status:payload.status,p_request_id:payload.requestId});if(error)return fail(error.code==='40001'?409:error.code==='42501'?403:400,'Status not saved; reload before retrying',origin);return result(200,data,origin);
  }
  const userId=await owner(req);if(!userId)return fail(401,'Sign in required',origin);
  if(!isUuid(payload.projectId))return fail(400,'Invalid project',origin);
  const projectId=String(payload.projectId);
  const src=await source(userId,projectId);if(!src)return fail(403,'Project not active',origin);
  if(action==='sync'){const data=await sync(userId,projectId);return result(200,data,origin);}
  if(action==='state'){return result(200,await list(userId,projectId),origin);}
  if(action==='create'){
    const label=String(payload.label||'').trim(),hours=Number(payload.hours);
    if(label.length<1||label.length>80||!Number.isInteger(hours)||hours<1||hours>72)return fail(400,'Invalid grant details',origin);
    await sync(userId,projectId);
    const secret=new Uint8Array(32);crypto.getRandomValues(secret);const token=btoa(String.fromCharCode(...secret)).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');
    const hash=await digest(token);const expires=new Date(Date.now()+hours*3600000).toISOString();
    const {data,error}=await db.from('moving_helper_grants').insert({owner_id:userId,project_id:projectId,helper_label:label,token_hash:hash,expires_at:expires}).select('id,helper_label,expires_at').single();if(error)throw Error('GRANT_WRITE');
    return result(200,{grant:data,token},origin);
  }
  if(action==='revoke'){
    if(!isUuid(payload.grantId))return fail(400,'Invalid grant ID',origin);
    const {data,error}=await db.from('moving_helper_grants').update({revoked_at:new Date().toISOString()}).eq('id',payload.grantId).eq('owner_id',userId).eq('project_id',projectId).is('revoked_at',null).select('id');if(error)throw Error('GRANT_REVOKE');return result(200,{revoked:(data||[]).length===1},origin);
  }
  if(action==='owner-transition'){
    if(!isUuid(payload.assignmentId)||!isUuid(payload.requestId)||!Number.isSafeInteger(payload.expectedVersion)||!states.includes(String(payload.status))||!src.assignments.some(a=>isObject(a)&&a.id===payload.assignmentId))return fail(400,'Invalid change',origin);
    const {data,error}=await db.rpc('moving_owner_transition',{p_owner_id:userId,p_project_id:projectId,p_assignment_id:payload.assignmentId,p_expected_version:payload.expectedVersion,p_next_status:payload.status,p_request_id:payload.requestId});if(error)return fail(error.code==='40001'?409:400,'Status not saved; reload before retrying',origin);return result(200,data,origin);
  }
  return fail(400,'Unknown action',origin);
 }catch(e){console.error('moving helper operation failed',e instanceof Error?e.message:'unknown');return fail(500,'Service temporarily unavailable',origin);}
});
