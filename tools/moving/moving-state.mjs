// Toolya Move Planner - isolated, additive snapshot model.
export const statuses=['planned','packed','loaded','arrived','unpacked'];
export const priorities=['normal','important','first_day'];
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const uuid=()=>crypto.randomUUID();
export const emptyMoving=()=>({schemaVersion:1,projects:[],rooms:[],assignments:[]});
export function readMoving(data){
  if(!object(data)||!Array.isArray(data.locations)||!Array.isArray(data.boxes))throw Error('Ungültiges Inventar');
  const moving=data.moving??emptyMoving();
  validateMoving(data);
  return moving;
}
export function validateMoving(data){
  if(!object(data)||!Array.isArray(data.locations)||!Array.isArray(data.boxes))throw Error('Ungültiges Inventar');
  if(data.moving===undefined)return data;
  const m=data.moving;
  if(!object(m)||m.schemaVersion!==1||!['projects','rooms','assignments'].every(k=>Array.isArray(m[k])))throw Error('Unbekannte oder beschädigte Umzugsdaten');
  const unique=(arr,key)=>new Set(arr.map(x=>x[key])).size===arr.length;
  const ids=a=>a.every(x=>object(x)&&typeof x.id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x.id))&&unique(a,'id');
  if(!ids(m.projects)||!ids(m.rooms)||!ids(m.assignments))throw Error('Doppelte oder ungültige Projekt-ID');
  const projects=new Set(m.projects.map(p=>p.id)),rooms=new Map(m.rooms.map(r=>[r.id,r]));
  const boxIds=new Set(data.boxes.map(b=>b.id));
  if(!m.projects.every(p=>typeof p.name==='string'&&p.name.trim().length>0&&p.name.length<=100&&['draft','active','completed','archived'].includes(p.status)&&(!p.moveDate||/^\d{4}-\d{2}-\d{2}$/.test(p.moveDate))))throw Error('Ungültiges Projekt');
  if(m.projects.filter(p=>p.status==='active').length>1)throw Error('Nur ein aktiver Umzug erlaubt');
  if(!m.rooms.every(r=>projects.has(r.projectId)&&typeof r.name==='string'&&r.name.trim().length>0&&r.name.length<=80))throw Error('Ungültiger Zielraum');
  if(!m.assignments.every(a=>projects.has(a.projectId)&&(boxIds.has(a.boxId)||m.projects.find(p=>p.id===a.projectId)?.status!=='active')&&Number.isSafeInteger(a.boxId)&&(!a.targetRoomId||(rooms.has(a.targetRoomId)&&rooms.get(a.targetRoomId).projectId===a.projectId))&&statuses.includes(a.status)&&priorities.includes(a.priority)))throw Error('Ungültige Kistenzuordnung');
  if(!unique(m.assignments.filter(a=>m.projects.find(p=>p.id===a.projectId)?.status==='active'),'boxId')||!unique(m.assignments,'id'))throw Error('Mehrfachzuordnung erkannt');
  return data;
}
export function editMoving(snapshot,editor){
  const next=structuredClone(snapshot);
  next.moving??=emptyMoving();
  editor(next.moving,next);
  validateMoving(next);
  return next;
}
export const createProject=(snapshot,name,date='')=>editMoving(snapshot,m=>{
  if(!name?.trim())throw Error('Projektname fehlt');
  if(m.projects.some(p=>p.status==='active'))throw Error('Bitte zuerst den bisherigen Umzug abschließen');
  const now=new Date().toISOString();
  m.projects.push({id:uuid(),name:name.trim().slice(0,100),moveDate:date||null,originLabel:'',destinationLabel:'',status:'active',createdAt:now,updatedAt:now,completedAt:null});
});
export const createRoom=(snapshot,projectId,name,floor='')=>editMoving(snapshot,m=>{
  if(!m.projects.some(p=>p.id===projectId&&p.status==='active'))throw Error('Projekt nicht aktiv');
  if(!name?.trim())throw Error('Raumname fehlt');
  m.rooms.push({id:uuid(),projectId,name:name.trim().slice(0,80),floor:floor.trim().slice(0,30),sortOrder:m.rooms.filter(r=>r.projectId===projectId).length,archived:false});
});
export const assignBox=(snapshot,projectId,boxId,targetRoomId=null,priority='normal')=>editMoving(snapshot,m=>{
  const project=m.projects.find(p=>p.id===projectId);
  if(!project||project.status!=='active')throw Error('Projekt nicht aktiv');
  const existing=m.assignments.find(a=>a.projectId===projectId&&a.boxId===boxId);
  if(existing){existing.targetRoomId=targetRoomId;existing.priority=priority;existing.updatedAt=new Date().toISOString();}
  else m.assignments.push({id:uuid(),projectId,boxId,targetRoomId,priority,status:'planned',statusHistory:[],fragile:false,noStack:false,notes:'',updatedAt:new Date().toISOString()});
});
export const updateStatus=(snapshot,id,status)=>editMoving(snapshot,m=>{
  const a=m.assignments.find(a=>a.id===id);
  if(!a)throw Error('Kistenzuordnung fehlt');
  const p=m.projects.find(p=>p.id===a.projectId);
  if(p?.status!=='active')throw Error('Projekt ist abgeschlossen');
  const old=statuses.indexOf(a.status),next=statuses.indexOf(status);
  if(next<0||Math.abs(next-old)!==1)throw Error('Statuswechsel nicht erlaubt');
  const at=new Date().toISOString();
  a.statusHistory??=[];
  a.statusHistory.push({from:a.status,to:status,at});
  a.status=status;a.updatedAt=at;
});
export const finishProject=(snapshot,id)=>editMoving(snapshot,m=>{
  const p=m.projects.find(p=>p.id===id&&p.status==='active');
  if(!p)throw Error('Projekt nicht aktiv');
  p.status='completed';p.updatedAt=p.completedAt=new Date().toISOString();
});
export function priorityList(snapshot,projectId){
  const m=readMoving(snapshot);
  const ranking={first_day:0,important:1,normal:2};
  return m.assignments.filter(a=>a.projectId===projectId&&a.status!=='unpacked')
    .sort((a,b)=>ranking[a.priority]-ranking[b.priority]||(snapshot.boxes.find(x=>x.id===a.boxId)?.name||'').localeCompare(snapshot.boxes.find(x=>x.id===b.boxId)?.name||'','de'));
}
