#!/usr/bin/env python3
"""Real staged backup functions in Chromium across two isolated localhost origins.

Synthetic fixtures only. No production endpoints, sessions, or browser profiles.
The exported AES-GCM JSON travels as an in-memory postMessage payload, not a
production backup file. The actual staged export/import functions execute.
"""
import http.server
import json
import re
import shutil
import tempfile
import threading
from pathlib import Path
from html import unescape
from chrome_isolation import run_chrome

SOURCE=Path(__file__).resolve().parents[1]/'staging/index.html'
html=SOURCE.read_text(encoding='utf8')
def section(start,end):
    a=html.index(start); b=html.index(end,a+len(start))
    return html[a:b]
backup_js=(section('function isAuthSessionStorageKey(', '// Password input uses a masked dialog')+
           section('async function exportGlobalBackup()', 'async function importGlobalBackup(')+
           section('async function importGlobalBackup(', '// JS Funktionen Global machen'))
# Inline source is the real staged implementation, not a reimplementation.
SHARED="""
const password='synthetic-password-1234';
const alerts=[];
const nativeAlert=window.alert;
window.alert=(message)=>alerts.push(String(message));
window.confirm=()=>true;
window.requestBackupPassword=async()=>password;
window.initFavorites=()=>{};
window.FileReader=class {
  readAsText(file){Promise.resolve().then(()=>this.onload({target:{result:file.content}}))}
};
const nativeCreate=URL.createObjectURL.bind(URL);
URL.createObjectURL=(blob)=>{
  blob.text().then(text=>window.dispatchEvent(new CustomEvent('backup-ready',{detail:JSON.parse(text)})));
  return 'blob:synthetic';
};
URL.revokeObjectURL=()=>{};
"""
A="""
const seed={hub_favorites:'["synthetic-source"]',digital_estate_vault:'synthetic-encrypted-vault',
  'sb-local-auth-token':'SYNTHETIC-SECRET',
  'helferlein-wish-extras:mock':'SYNTHETIC-EXTRAS',
  'helferlein_cloud_budget_mock_pending':'SYNTHETIC-PENDING'};
Object.entries(seed).forEach(([k,v])=>localStorage.setItem(k,v));
window.addEventListener('backup-ready',e=>{
  const encrypted=e.detail;
  if(encrypted.format!=='encrypted-backup-v1')return finish({error:'not encrypted'});
  const frame=document.createElement('iframe');
  frame.src='http://127.0.0.1:__B__/';
  window.addEventListener('message',event=>{
    if(event.origin!=='http://127.0.0.1:__B__')return;
    if(event.data.phase==='ready'){
      frame.contentWindow.postMessage({phase:'restore',encrypted},event.origin);
    }
    if(event.data.phase==='done'){
      const preserved=Object.entries(seed).every(([k,v])=>localStorage.getItem(k)===v);
      finish({...event.data,preserved,encryptedFormat:encrypted.format});
    }
  });
  document.body.appendChild(frame);
});
function finish(x){const pre=document.createElement('pre');pre.id='result';pre.textContent=JSON.stringify(x);document.body.appendChild(pre)}
window.addEventListener('load',()=>exportGlobalBackup(true));
"""
B="""
const destination={
  hub_favorites:'["destination-before"]',
  'sb-local-auth-token':'DEST-SESSION',
  'helferlein-wish-extras:mock':'DEST-EXTRAS',
  'helferlein_cloud_budget_mock_pending':'DEST-PENDING'
};
Object.entries(destination).forEach(([k,v])=>localStorage.setItem(k,v));
window.addEventListener('message',event=>{
  if(event.origin!=='http://127.0.0.1:__A__'||event.data.phase!=='restore')return;
  const encrypted=event.data.encrypted;
  const file={name:'synthetic-encrypted.json',content:JSON.stringify(encrypted),
    size:JSON.stringify(encrypted).length};
  const target={files:[file],value:'selected'};
  importGlobalBackup({target});
  let n=0;
  const poll=()=>{
    if(alerts.length===0&&n++<150){setTimeout(poll,100);return;}
    const values=Object.fromEntries(Object.keys(destination).map(k=>[k,localStorage.getItem(k)]));
    parent.postMessage({phase:'done',values,
      vault:localStorage.getItem('digital_estate_vault'),
      alerts,reset:target.value===''},event.origin);
  };
  poll();
});
window.addEventListener('load',()=>parent.postMessage({phase:'ready'},'http://127.0.0.1:__A__'));
"""
class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        side=self.server.side
        script=SHARED+backup_js+(A if side=='A' else B)
        script=script.replace('__A__',str(self.server.port_a)).replace('__B__',str(self.server.port_b))
        page='<!doctype html><meta charset="utf-8"><body><script>'+script+'</script></body>'
        data=page.encode('utf8')
        self.send_response(200)
        self.send_header('Content-Type','text/html; charset=utf-8')
        self.send_header('Content-Security-Policy',"default-src 'self' 'unsafe-inline' blob:; connect-src 'none'; frame-src http://127.0.0.1:*; form-action 'none'")
        self.send_header('Content-Length',str(len(data)))
        self.end_headers()
        self.wfile.write(data)
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
        with tempfile.TemporaryDirectory(prefix='toolya-real-backup-') as profile:
            cmd=[chrome,'--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
                '--disable-background-networking','--disable-extensions','--no-first-run',
                '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
                '--user-data-dir='+profile,'--virtual-time-budget=12000','--dump-dom',
                f'http://127.0.0.1:{a}/']
            result=run_chrome(cmd,timeout=80,label='real-backup-two-origins')
            if result.timed_out:raise AssertionError('Chromium timeout: '+result.stderr[-400:])
            match=re.search(r'<pre id="result">(.*?)</pre>',result.stdout,re.S)
            if result.returncode or not match:
                raise AssertionError('No actual backup result: '+result.stderr[-700:])
            data=json.loads(unescape(match.group(1)))
            assert data.get('encryptedFormat')=='encrypted-backup-v1',data
            assert data.get('preserved') is True,data
            print('PASS actual staged AES-GCM export preserves source origin')
            assert data.get('values',{}).get('hub_favorites')=='["synthetic-source"]',data
            assert data.get('vault')=='synthetic-encrypted-vault',data
            print('PASS actual staged encrypted import restores allowlisted values on second origin')
            v=data['values']
            assert v['sb-local-auth-token']=='DEST-SESSION',data
            assert v['helferlein-wish-extras:mock']=='DEST-EXTRAS',data
            assert v['helferlein_cloud_budget_mock_pending']=='DEST-PENDING',data
            print('PASS actual staged import preserves destination auth and owner-scoped keys')
            assert data.get('reset') and any('wiederhergestellt' in s.lower() for s in data.get('alerts',[])),data
            print('PASS actual staged import completes and resets file selector')
            print('TOTAL 4')
    finally:
        for s in servers:s.shutdown();s.server_close()
if __name__=='__main__':main()
