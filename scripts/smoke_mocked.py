#!/usr/bin/env python3
"""Offline mock-CDN browser smoke: no external requests, no real Supabase client.

This is a diagnostic, not a functional integration test. Production HTML is never edited.
"""
from __future__ import annotations
from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import partial
import http.server
import json
import pathlib
import re
import shutil
import subprocess
from chrome_isolation import run_chrome
import threading

ROOT = pathlib.Path(__file__).resolve().parent.parent / "staging"
# A no-op thenable prevents unhandled async failures from offline auth/database requests.
MOCK = r"""<script>
window.__toolyaMock = true;
window.__mockErrors = [];
window.addEventListener('error',e=>{if(e.target===window)window.__mockErrors.push(String(e.message));},true);
window.addEventListener('unhandledrejection',e=>{window.__mockErrors.push('rejection:'+String(e.reason));e.preventDefault();});
const noop = ()=>{};
const result = {data:null,error:null,count:0};
const query = new Proxy({}, {get(t,k){
 if(k==='then')return (resolve)=>Promise.resolve(result).then(resolve);
 if(k==='catch')return ()=>query;
 if(k==='finally')return ()=>query;
 return (...args)=>query;
}});
const auth = {getSession:async()=>({data:{session:null},error:null}),
 getUser:async()=>({data:{user:null},error:null}),
 onAuthStateChange:()=>({data:{subscription:{unsubscribe:noop}}}),
 signOut:async()=>({error:null})};
const client = {auth,from:()=>query,storage:{from:()=>query},rpc:()=>query,
 channel:()=>({on:()=>({subscribe:noop}),subscribe:noop}),removeChannel:noop};
window.supabase={createClient:()=>client};
window.supabaseClient=client;
window.tailwind={config:{}};
window.lucide={createIcons:noop,icons:{}};
window.Chart=class{constructor(){this.data={datasets:[{data:[]},{data:[]}],labels:[]}}destroy(){}update(){}};
window.jspdf={jsPDF:class{save(){}text(){}autoTable(){}}};
window.QRCode=class{constructor(){}};
window.Tesseract={recognize:async()=>({data:{text:''}})};
window.Html5Qrcode=class{start(){return Promise.resolve()}stop(){return Promise.resolve()}};
window.addEventListener('load',()=>{
 const el=document.createElement('script');el.id='toolya-mock-report';el.type='application/json';
 el.textContent=JSON.stringify({errors:window.__mockErrors,mocked:true});
 document.documentElement.appendChild(el);
});
</script>"""
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,*args):
        pass
    def do_GET(self):
        rel=self.path.split('?',1)[0].split('#',1)[0].lstrip('/') or 'index.html'
        if not rel.endswith('.html'):
            return super().do_GET()
        file=(ROOT/rel).resolve()
        if not file.is_relative_to(ROOT.resolve()) or not file.is_file():
            return self.send_error(404)
        content=file.read_text(encoding='utf-8')
        # Strip only remote script tags in the test response, preserving their order elsewhere.
        content=re.sub(r'<script\b(?=[^>]*\bsrc=["\x27]https?://)[^>]*>\s*</script>', '', content, flags=re.I)
        content=re.sub(r'<head(\s[^>]*)?>',lambda m:m.group(0)+MOCK,content,count=1,flags=re.I)
        data=content.encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type','text/html; charset=utf-8')
        self.send_header('Content-Security-Policy',"default-src 'self' data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'none'; form-action 'none'; frame-src 'none'")
        self.send_header('Content-Length',str(len(data)))
        self.end_headers()
        self.wfile.write(data)

def main():
    chrome=shutil.which('google-chrome') or shutil.which('chromium') or shutil.which('chromium-browser')
    if not chrome:
        print('FAIL: Chrome not installed')
        return 1
    pages=sorted(p.relative_to(ROOT).as_posix() for p in ROOT.rglob('*.html'))
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    base=f'http://127.0.0.1:{server.server_port}/'
    failures=[]
    try:
        def check(page):
            cmd=[chrome,'--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
                 '--disable-background-networking','--disable-extensions','--no-first-run',
                 '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
                 '--virtual-time-budget=1800','--dump-dom',base+page]
            p=run_chrome(cmd,timeout=45,label=page)
            if p.timed_out:
                return {'page':page,'error':'timeout','elapsed_seconds':round(p.elapsed_seconds,1),'stderr':p.stderr[-400:]}
            match=re.search(r'<script[^>]*id="toolya-mock-report"[^>]*>(.*?)</script>',p.stdout,re.S)
            if p.returncode or not match:
                return {'page':page,'error':'render or mock report missing','exit':p.returncode}
            try:
                errors=json.loads(match.group(1)).get('errors',[])
            except ValueError:
                return {'page':page,'error':'invalid mock report'}
            return {'page':page,'errors':errors[:8]} if errors else None
        with ThreadPoolExecutor(max_workers=1) as pool:
            jobs={pool.submit(check,page):page for page in pages}
            for future in as_completed(jobs):
                issue=future.result()
                print(('MOCK-WARNING' if issue else 'MOCK-PASS')+': '+jobs[future],flush=True)
                if issue:failures.append(issue)
        print(json.dumps({'pages':len(pages),'mock_warnings':failures},ensure_ascii=False,indent=2))
        # Mock warnings are diagnostic: do not mistake mock-incompatible app code for migration breakage.
        return 0
    finally:
        server.shutdown()
if __name__=='__main__':
    raise SystemExit(main())
