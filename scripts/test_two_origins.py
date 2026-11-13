#!/usr/bin/env python3
"""Single headless Chromium process, two localhost origins via iframe/postMessage.
Synthetic storage only. No network outside localhost, no real user data or app writes."""
import http.server, json, re, shutil, subprocess, tempfile, threading
A="""<!doctype html><meta charset="utf-8"><script>
window.addEventListener('load',()=>{
 const fixtures={hub_favorites:'["synthetic"]',wg_inventory:'["box-a"]',
  'helferlein_cloud_budget_mock-user_pending':'{"unsynced":true}',
  'sb-local-auth-token':'FAKE-SESSION','helferlein-wish-extras:mock-user':'FAKE-EXTRAS'};
 Object.entries(fixtures).forEach(([k,v])=>localStorage.setItem(k,v));
 const frame=document.createElement('iframe');frame.src='http://127.0.0.1:__B__/';
 window.addEventListener('message',e=>{
  if(e.origin!=='http://127.0.0.1:__B__')return;
  if(e.data.phase==='before'){
   if(!e.data.empty)return finish({error:'destination not initially empty'});
   frame.contentWindow.postMessage({phase:'restore',allowed:{hub_favorites:fixtures.hub_favorites,wg_inventory:fixtures.wg_inventory}},e.origin);
  }else if(e.data.phase==='after'){
   const sourcePreserved=Object.entries(fixtures).every(([k,v])=>localStorage.getItem(k)===v);
   finish({differentOrigins:location.origin!==e.origin,sourcePreserved,
    initiallyEmpty:true,destKeys:e.data.keys,destValues:e.data.values});
  }
 });
 document.body.appendChild(frame);
});
function finish(data){const el=document.createElement('pre');el.id='result';el.textContent=JSON.stringify(data);document.body.appendChild(el)}
</script>"""
B="""<!doctype html><meta charset="utf-8"><script>
window.addEventListener('load',()=>{
 parent.postMessage({phase:'before',empty:localStorage.length===0},'http://127.0.0.1:__A__');
 window.addEventListener('message',e=>{
  if(e.origin!=='http://127.0.0.1:__A__'||e.data.phase!=='restore')return;
  Object.entries(e.data.allowed).forEach(([k,v])=>localStorage.setItem(k,v));
  parent.postMessage({phase:'after',keys:Object.keys(localStorage),
   values:{favorites:localStorage.getItem('hub_favorites'),
    pending:localStorage.getItem('helferlein_cloud_budget_mock-user_pending'),
    token:localStorage.getItem('sb-local-auth-token'),extras:localStorage.getItem('helferlein-wish-extras:mock-user')}},e.origin);
 });
});
</script>"""
class Handler(http.server.BaseHTTPRequestHandler):
 def do_GET(self):
  html=(A if self.server.side=='A' else B).replace('__A__',str(self.server.port_a)).replace('__B__',str(self.server.port_b))
  data=html.encode()
  self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8')
  self.send_header('Content-Security-Policy',"default-src 'self' 'unsafe-inline'; connect-src 'none'; frame-src http://127.0.0.1:*; form-action 'none'")
  self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
 def log_message(self,*args):pass
def main():
 chrome=shutil.which('chromium') or shutil.which('google-chrome') or shutil.which('chromium-browser')
 if not chrome:raise RuntimeError('Chromium required')
 servers=[http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler) for _ in range(2)]
 a,b=[s.server_address[1] for s in servers]
 for s,side in zip(servers,'AB'):
  s.side=side;s.port_a=a;s.port_b=b
  threading.Thread(target=s.serve_forever,daemon=True).start()
 try:
  with tempfile.TemporaryDirectory(prefix='toolya-origin-') as profile:
   cmd=[chrome,'--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
    '--disable-background-networking','--disable-extensions','--no-first-run',
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
    '--user-data-dir='+profile,'--virtual-time-budget=4000','--dump-dom',f'http://127.0.0.1:{a}/']
   p=subprocess.run(cmd,capture_output=True,text=True,timeout=45)
   m=re.search(r'<pre id="result">(.*?)</pre>',p.stdout,re.S)
   if p.returncode or not m:raise AssertionError('No browser result: '+p.stderr[-600:])
   x=json.loads(m.group(1).replace('&quot;','"').replace('&amp;','&'))
   assert x['differentOrigins'] and x['sourcePreserved'] and x['initiallyEmpty'],x
   print('PASS distinct browser origins; original synthetic keys retained')
   assert set(x['destKeys'])=={'hub_favorites','wg_inventory'},x
   print('PASS only explicitly allowlisted synthetic keys transferred')
   v=x['destValues'];assert v['favorites']=='["synthetic"]' and v['pending'] is None and v['token'] is None and v['extras'] is None,x
   print('PASS no pending, auth or wishlist extras leaked to second origin')
   print('TOTAL 3')
 finally:
  for s in servers:s.shutdown();s.server_close()
if __name__=='__main__':main()
