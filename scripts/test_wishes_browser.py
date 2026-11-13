#!/usr/bin/env python3
"""Production-isolated Chrome checks for wishes modules. Localhost only, mocked Supabase."""
import http.server,json,pathlib,re,shutil,subprocess,threading,urllib.parse
from smoke_mocked import ROOT

MOCK=r"""<script>
window.__errors=[];
window.addEventListener('error',e=>window.__errors.push(String(e.message)));
window.addEventListener('unhandledrejection',e=>{window.__errors.push(String(e.reason));e.preventDefault()});
const mode=new URL(location.href).searchParams.get('mode')||'guest';
const user={id:'offline-user'};
const empty={data:[],error:null};
window.__writes=[];
let pendingWrite=null;
const q=new Proxy({}, {get(_t,k){
 if(k==='then')return resolve=>Promise.resolve(mode==='error'?{data:null,error:{message:'offline failure'}}:empty).then(resolve);
 if(k==='single')return async()=>mode==='form-error'?{data:null,error:{message:'synthetic insert failure'}}:{data:{id:'mock-task',...pendingWrite,archived_at:null,created_at:'2026-11-13T00:00:00Z'},error:null};
 if(k==='insert')return payload=>{pendingWrite=payload;window.__writes.push({table:'wishlist_gift_tasks',payload});return q};
 return ()=>q;
}});
window.supabase={createClient:()=>({
 auth:{getUser:async()=>({data:{user:mode==='guest'?null:user},error:null})},
 from:table=>{window.__table=table;return q},rpc:()=>q
})};
window.confirm=()=>true;
window.addEventListener('load',()=>{
 setTimeout(()=>{
  const content=document.getElementById('content'),login=document.getElementById('login'),status=document.getElementById('status');
  if(mode==='form-error'||mode==='form-success'){
   const form=document.getElementById('form');
   document.getElementById('title').value='Offline-Aufgabe';
   form.requestSubmit();
  }
  setTimeout(()=>{
   const report=document.createElement('script');report.type='application/json';report.id='wishes-functional-result';
   report.textContent=JSON.stringify({
    mode,contentVisible:!content.hidden,loginVisible:!login.hidden,
    status:status.textContent,errors:window.__errors,
    emptyTasks:document.getElementById('tasks')?.textContent.includes('Keine Aufgaben'),
    emptyInsights:document.getElementById('giftYearEditor')?.textContent.includes('Keine Geschenke'),
    formStatus:document.getElementById('status').textContent,
    writes:window.__writes,
    renderedTask:[...document.querySelectorAll('#tasks article h3')].map(e=>e.textContent),
    inputReset:document.getElementById('title')?.value===''
   });
   document.documentElement.append(report);
  },350);
 },150);
});
</script>"""
class Handler(http.server.SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*a):pass
 def do_GET(self):
  parsed=urllib.parse.urlsplit(self.path)
  if not parsed.path.endswith('.html'):return super().do_GET()
  file=(ROOT/parsed.path.lstrip('/')).resolve()
  if not file.is_relative_to(ROOT.resolve()) or not file.is_file():return self.send_error(404)
  html=file.read_text(encoding='utf-8')
  html=re.sub(r'<script\b(?=[^>]*\bsrc=["\x27]https?://)[^>]*>\s*</script>','',html,flags=re.I)
  html=re.sub(r'<head(\s[^>]*)?>',lambda m:m.group(0)+MOCK,html,count=1,flags=re.I)
  data=html.encode()
  self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8')
  self.send_header('Content-Security-Policy',"default-src 'self' data: blob: 'unsafe-inline'; connect-src 'none'; form-action 'self'")
  self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
def main():
 chrome=shutil.which('google-chrome') or shutil.which('chromium')
 assert chrome,'Chrome unavailable'
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
 threading.Thread(target=server.serve_forever,daemon=True).start()
 failures=[]
 try:
  for page,mode in [('gift-tasks','guest'),('gift-tasks','empty'),('gift-tasks','error'),('gift-tasks','form-error'),('gift-tasks','form-success'),('gift-analytics','guest'),('gift-analytics','empty'),('gift-analytics','error')]:
   url=f'http://127.0.0.1:{server.server_port}/tools/wishes/{page}.html?mode={mode}'
   cmd=[chrome,'--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--disable-extensions','--no-first-run','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1','--virtual-time-budget=2500','--dump-dom',url]
   p=subprocess.run(cmd,capture_output=True,text=True,timeout=40)
   match=re.search(r'<script[^>]*id="wishes-functional-result"[^>]*>(.*?)</script>',p.stdout,re.S)
   data=json.loads(match.group(1)) if match else {}
   ok=p.returncode==0 and not data.get('errors') and (
    (mode=='guest' and data.get('loginVisible') and not data.get('contentVisible')) or
    (mode=='empty' and data.get('contentVisible') and (data.get('emptyTasks') if page=='gift-tasks' else data.get('emptyInsights'))) or
    (mode=='error' and not data.get('contentVisible') and ('geladen' in data.get('status','') or 'laden' in data.get('status',''))) or
    (mode=='form-error' and data.get('contentVisible') and data.get('formStatus')=='Aufgabe konnte nicht gespeichert werden.') or
    (mode=='form-success' and data.get('contentVisible') and data.get('formStatus')=='Aufgabe gespeichert.' and data.get('renderedTask')==['Offline-Aufgabe'] and data.get('inputReset') and len(data.get('writes',[]))==1 and data['writes'][0]['table']=='wishlist_gift_tasks' and data['writes'][0]['payload']['title']=='Offline-Aufgabe' and data['writes'][0]['payload']['user_id']=='offline-user' and data['writes'][0]['payload']['status']=='open')
   )
   print(('PASS' if ok else 'FAIL')+f' {page} {mode} '+json.dumps(data,ensure_ascii=False),flush=True)
   if not ok:failures.append((page,mode))
  return bool(failures)
 finally:server.shutdown()
if __name__=='__main__':raise SystemExit(main())
