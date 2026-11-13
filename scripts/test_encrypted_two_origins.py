#!/usr/bin/env python3
"""Actual staged backup functions in two isolated Chromium localhost origins.
Uses synthetic localStorage and real WebCrypto; never contacts production services."""
import http.server, json, re, shutil, tempfile, threading
from pathlib import Path
from chrome_isolation import run_chrome

ROOT=Path(__file__).resolve().parent.parent
html=(ROOT/'staging/index.html').read_text(encoding='utf8')
def section(start,end):
 a=html.index(start); b=html.index(end,a+len(start))
 return html[a:b]
code=(section('function isAuthSessionStorageKey(', '// Password input uses a masked dialog')+
      section('async function exportGlobalBackup()', 'async function importGlobalBackup(')+
      section('async function importGlobalBackup(', '// JS Funktionen Global machen'))
# Actual functions are injected into minimal offline pages, not copied or rewritten.
COMMON="""
const PASS='synthetic-only-password-1234';
const events=[];
window.alert=s=>events.push(String(s));
window.confirm=()=>true;
window.requestBackupPassword=async()=>PASS;
window.initFavorites=()=>{};
window.addEventListener('error',e=>{document.body.dataset.error=e.message});
function report(value){const pre=document.createElement('pre');pre.id='result';pre.textContent=JSON.stringify(value);document.body.append(pre)}
"""
SOURCE="""
async function begin(){document.body.dataset.phase='export-started';
 localStorage.setItem('hub_favorites','[1]');
 localStorage.setItem('digital_estate_vault','synthetic-vault');
 localStorage.setItem('sb-local-auth-token','SECRET-NOT-EXPORTED');
 localStorage.setItem('helferlein-wish-extras:mock','EXTRAS-NOT-EXPORTED');
 const original=URL.createObjectURL;
 URL.createObjectURL=blob=>{blob.text().then(async content=>{
  const target=document.getElementById('dest').contentWindow;
  document.body.dataset.phase='encrypted-blob-ready';target.postMessage({kind:'backup',content},'http://127.0.0.1:__B__');
 });return 'blob:synthetic'};
 URL.revokeObjectURL=()=>{};
 await exportGlobalBackup(true);
}
window.addEventListener('message',e=>{
 if(e.origin!=='http://127.0.0.1:__B__'||e.data.kind!=='done')return;document.body.dataset.phase='destination-done';
 report({sourcePreserved:localStorage.getItem('hub_favorites')==='[1]',
  sourceVault:localStorage.getItem('digital_estate_vault')==='synthetic-vault',
  result:e.data.result,sourceErrors:events});
});
window.addEventListener('load',()=>{const frame=document.createElement('iframe');
 frame.id='dest';frame.src='http://127.0.0.1:__B__/';frame.onload=begin;document.body.append(frame)});
"""
DEST="""
window.addEventListener('message',async e=>{
 if(e.origin!=='http://127.0.0.1:__A__'||e.data.kind!=='backup')return;document.body.dataset.phase='import-started';
 localStorage.setItem('hub_favorites','old-destination');
 localStorage.setItem('sb-local-auth-token','DEST-SESSION');
 localStorage.setItem('helferlein-wish-extras:mock','DEST-EXTRAS');
 const file=new File([e.data.content],'synthetic-backup.json',{type:'application/json'});
 // importGlobalBackup returns after starting FileReader; its async onload continues
 // independently through PBKDF2. Await the real completion signal, not its return.
 const completion=new Promise(resolve=>{
  const previousAlert=window.alert;
  window.alert=message=>{
   previousAlert(message);
   resolve(String(message));
  };
 });
 await importGlobalBackup({target:{files:[file],value:'selected'}});
 await completion;
 const result={favorites:localStorage.getItem('hub_favorites'),
 vault:localStorage.getItem('digital_estate_vault'),
 auth:localStorage.getItem('sb-local-auth-token'),
 extras:localStorage.getItem('helferlein-wish-extras:mock'),
 events,encrypted:JSON.parse(e.data.content).format==='encrypted-backup-v1',
 ciphertextExcludesSecrets:!e.data.content.includes('SECRET-NOT-EXPORTED')&&!e.data.content.includes('EXTRAS-NOT-EXPORTED')};
 parent.postMessage({kind:'done',result},e.origin);
});
"""
class Handler(http.server.BaseHTTPRequestHandler):
 def do_GET(self):
  source=self.server.side=='A'
  js=COMMON+code+(SOURCE if source else DEST)
  js=js.replace('__A__',str(self.server.port_a)).replace('__B__',str(self.server.port_b))
  body=('<html><body><script>'+js+'</script></body></html>').encode()
  self.send_response(200)
  self.send_header('Content-Type','text/html; charset=utf-8')
  self.send_header('Content-Security-Policy',"default-src 'self' 'unsafe-inline' blob:; connect-src 'none'; frame-src http://127.0.0.1:*")
  self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
 def log_message(self,*args):pass
def main():
 chrome=shutil.which('chromium') or shutil.which('google-chrome') or shutil.which('chromium-browser')
 if not chrome:raise RuntimeError('Chromium missing')
 servers=[http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler) for _ in range(2)]
 a,b=[s.server_address[1] for s in servers]
 for s,side in zip(servers,'AB'):
  s.side=side;s.port_a=a;s.port_b=b
  threading.Thread(target=s.serve_forever,daemon=True).start()
 try:
  with tempfile.TemporaryDirectory(prefix='toolya-encrypted-origin-') as profile:
   cmd=[chrome,'--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
    '--disable-background-networking','--disable-extensions','--no-first-run',
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
    '--user-data-dir='+profile,'--virtual-time-budget=120000','--dump-dom',f'http://127.0.0.1:{a}/']
   p=run_chrome(cmd,timeout=120,label='encrypted-two-origins')
   if p.timed_out:raise AssertionError('Chrome timeout: '+p.stderr[-400:])
   m=re.search(r'<pre id="result">(.*?)</pre>',p.stdout,re.S)
   if p.returncode or not m:raise AssertionError('Missing browser result: '+p.stderr[-500:]+p.stdout[-500:])
   import html as html_lib
   result=json.loads(html_lib.unescape(m.group(1)))
   assert result['sourcePreserved'] and result['sourceVault'],result
   print('PASS source origin unchanged')
   dest=result['result']
   assert dest['encrypted'] and dest['ciphertextExcludesSecrets'],result
   print('PASS actual encrypted export with no raw secret leakage')
   assert dest['favorites']=='[1]' and dest['vault']=='synthetic-vault',result
   print('PASS actual decrypted restore on distinct origin')
   assert dest['auth']=='DEST-SESSION' and dest['extras']=='DEST-EXTRAS',result
   print('PASS destination auth and owner-scoped extras untouched')
   assert any('erfolgreich wiederhergestellt' in e for e in dest['events']),result
   print('PASS restore completion reported')
   print('TOTAL 5')
 finally:
  for s in servers:s.shutdown();s.server_close()
if __name__=='__main__':main()
