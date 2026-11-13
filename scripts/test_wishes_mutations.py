#!/usr/bin/env python3
"""Isolated task mutation browser contracts: localhost, no external network."""
import json,re,subprocess,shutil,threading,http.server
import test_wishes_browser as base

base.MOCK=r"""<script>
const mode=new URL(location.href).searchParams.get('mode');
const user={id:'offline-user'};
const seed={id:'task-1',title:'Original',occasion_id:null,gift_plan_id:null,due_date:null,reminder_days:3,priority:2,status:'open',notes:null,archived_at:null,created_at:'2026-11-13T00:00:00Z'};
window.__calls=[];window.__errors=[];
window.addEventListener('error',e=>window.__errors.push(e.message));
window.addEventListener('unhandledrejection',e=>{window.__errors.push(String(e.reason));e.preventDefault()});
let operation='',payload=null,filters=[];
function query(table){
 const q=new Proxy({}, {get(_t,key){
  if(key==='then')return resolve=>Promise.resolve({data:table==='wishlist_gift_tasks'?[{...seed}]:[],error:null}).then(resolve);
  if(key==='update'||key==='delete'||key==='insert')return p=>{operation=key;payload=p;filters=[];return q};
  if(key==='eq')return (field,value)=>{if(operation)filters.push([field,value]);return q};
  if(key==='single')return async()=>{
   const denied=mode.endsWith('-error')||mode==='permission';
   window.__calls.push({table,operation,payload,filters});
   return denied?{data:null,error:{message:'synthetic denied'}}:{data:{...seed,...payload,title:payload?.title||seed.title},error:null};
  };
  return (...args)=>q;
 }});
 return q;
}
window.supabase={createClient:()=>({auth:{getUser:async()=>({data:{user:mode==='guest'?null:user},error:null})},from:query,rpc:()=>query('rpc')})};
window.confirm=()=>true;
function controls(){return [...document.querySelectorAll('#tasks article button')]}
window.addEventListener('load',()=>{
 setTimeout(async()=>{
  try{
   const buttons=controls();
   if(mode.startsWith('edit')||mode==='permission'){
    buttons[0].click();document.getElementById('title').value='Changed';
    document.getElementById('form').requestSubmit();
   }else if(mode.startsWith('status'))buttons[1].click();
   else if(mode.startsWith('delete'))buttons[2].click();
  }catch(e){window.__errors.push(String(e))}
  setTimeout(()=>{
   const report=document.createElement('script');report.id='task-mutation-report';report.type='application/json';
   report.textContent=JSON.stringify({
    mode,errors:window.__errors,calls:window.__calls,
    headings:[...document.querySelectorAll('#tasks article h3')].map(x=>x.textContent),
    buttons:controls().map(x=>x.textContent),status:document.getElementById('status').textContent,
    loginVisible:!document.getElementById('login').hidden
   });
   document.documentElement.append(report);
  },350);
 },250);
});
</script>"""

def main():
 chrome=shutil.which('google-chrome') or shutil.which('chromium')
 assert chrome,'Chrome missing'
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),base.Handler)
 threading.Thread(target=server.serve_forever,daemon=True).start()
 failed=[]
 try:
  for mode in ('edit','edit-error','status','status-error','delete','delete-error','permission','guest'):
   url=f'http://127.0.0.1:{server.server_port}/tools/wishes/gift-tasks.html?mode={mode}'
   cmd=[chrome,'--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--disable-extensions','--no-first-run','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1','--virtual-time-budget=2500','--dump-dom',url]
   p=subprocess.run(cmd,capture_output=True,text=True,timeout=40)
   m=re.search(r'<script[^>]*id="task-mutation-report"[^>]*>(.*?)</script>',p.stdout,re.S)
   d=json.loads(m.group(1)) if m else {}
   calls=d.get('calls',[])
   op={'edit':'update','status':'update','delete':'delete','permission':'update'}.get(mode.split('-')[0])
   expected={'edit':'Aufgabe gespeichert.','edit-error':'Aufgabe konnte nicht gespeichert werden.','status':'Aufgabe aktualisiert.','status-error':'Statuswechsel fehlgeschlagen.','delete':'Aufgabe gelöscht.','delete-error':'Löschen fehlgeschlagen.','permission':'Aufgabe konnte nicht gespeichert werden.','guest':'Bitte anmelden.'}[mode]
   expected_head=[] if mode=='delete' else ['Changed'] if mode=='edit' else [] if mode=='guest' else ['Original']
   ok=(p.returncode==0 and not d.get('errors') and d.get('status')==expected and d.get('headings')==expected_head)
   if mode=='guest':ok=ok and d.get('loginVisible') and not calls
   else:
    ok=ok and len(calls)==1 and calls[0]['table']=='wishlist_gift_tasks' and calls[0]['operation']==op
    ok=ok and ['id','task-1'] in calls[0]['filters'] and ['user_id','offline-user'] in calls[0]['filters']
    if mode.startswith('edit') or mode=='permission':ok=ok and calls[0]['payload']['title']=='Changed'
    if mode.startswith('status'):ok=ok and calls[0]['payload']['status']=='done'
   print(('PASS' if ok else 'FAIL')+' task-mutation '+mode+' '+json.dumps(d,ensure_ascii=False),flush=True)
   if not ok:failed.append(mode)
  return bool(failed)
 finally:server.shutdown()
if __name__=='__main__':raise SystemExit(main())
