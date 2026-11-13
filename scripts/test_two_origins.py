#!/usr/bin/env python3
"""Two disposable localhost browser origins; synthetic storage only, no app/backend requests."""
import http.server, json, pathlib, re, shutil, subprocess, tempfile, threading, urllib.parse
PAGE="""<!doctype html><meta charset="utf-8"><script>
const mode=new URLSearchParams(location.search).get('mode');
const output=(value)=>{const el=document.createElement('pre');el.id='result';el.textContent=JSON.stringify(value);document.body.appendChild(el)};
const allowed={hub_favorites:'["synthetic"]',wg_inventory:'["box-a"]'};
if(mode==='seed'){
 Object.entries({...allowed,'helferlein_cloud_budget_mock-user_pending':'{"unsynced":true}',
  'sb-local-auth-token':'FAKE-SESSION','helferlein-wish-extras:mock-user':'FAKE-EXTRAS'}).forEach(([k,v])=>localStorage.setItem(k,v));
 output({origin:location.origin,keys:Object.keys(localStorage),seeded:true});
}else if(mode==='before'){
 output({origin:location.origin,keys:Object.keys(localStorage),empty:localStorage.length===0});
}else if(mode==='restore'){
 // A deliberate, explicit transfer of allowlisted fixture values; NOT an automatic browser-origin copy.
 Object.entries(allowed).forEach(([k,v])=>localStorage.setItem(k,v));
 output({origin:location.origin,keys:Object.keys(localStorage),restored:true});
}else{
 output({origin:location.origin,keys:Object.keys(localStorage),
  favorites:localStorage.getItem('hub_favorites'),pending:localStorage.getItem('helferlein_cloud_budget_mock-user_pending'),
  token:localStorage.getItem('sb-local-auth-token'),extras:localStorage.getItem('helferlein-wish-extras:mock-user')});
}
</script>"""
class Handler(http.server.BaseHTTPRequestHandler):
 def do_GET(self):
  data=PAGE.encode()
  self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8')
  self.send_header('Content-Security-Policy',"default-src 'self' 'unsafe-inline'; connect-src 'none'; form-action 'none'")
  self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
 def log_message(self,*args):pass
def main():
 chrome=shutil.which('chromium') or shutil.which('google-chrome') or shutil.which('chromium-browser')
 if not chrome:raise RuntimeError('Chromium required')
 servers=[http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler) for _ in range(2)]
 for server in servers:threading.Thread(target=server.serve_forever,daemon=True).start()
 try:
  with tempfile.TemporaryDirectory(prefix='toolya-origins-') as profile:
   def check(port,mode):
    url=f'http://127.0.0.1:{port}/?mode={mode}'
    p=subprocess.run([chrome,'--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
      '--disable-background-networking','--disable-extensions','--no-first-run','--no-default-browser-check',
      '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1','--user-data-dir='+profile,
      '--virtual-time-budget=1500','--dump-dom',url],capture_output=True,text=True,timeout=35)
    match=re.search(r'<pre id="result">(.*?)</pre>',p.stdout,re.S)
    if p.returncode or not match:raise AssertionError(f'Browser result missing for {mode}: {p.stderr[-500:]}')
    return json.loads(match.group(1).replace('&quot;','"').replace('&amp;','&'))
   a,b=[x.server_address[1] for x in servers]
   seeded=check(a,'seed');print('PASS source synthetic fixtures')
   before=check(b,'before');assert before['empty'];print('PASS second browser origin initially isolated')
   after=check(b,'restore');assert set(after['keys'])=={'hub_favorites','wg_inventory'}
   print('PASS explicit synthetic allowlist restore excludes auth, wishlist extras and cloud pending')
   source=check(a,'inspect');assert source['pending'] and source['token'] and source['extras']
   print('PASS source origin pending data and session fixture retained')
   dest=check(b,'inspect');assert dest['favorites']=='["synthetic"]' and dest['pending'] is None and dest['token'] is None
   print('PASS destination has only explicitly restored synthetic data')
   assert seeded['origin']!=before['origin'];print('TOTAL 5')
 finally:
  for server in servers:server.shutdown();server.server_close()
if __name__=='__main__':main()
