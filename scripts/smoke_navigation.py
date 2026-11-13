#!/usr/bin/env python3
"""Safe real-anchor navigation checks, using the mocked localhost-only browser harness."""
from __future__ import annotations
from functools import partial
import http.server
import json
import pathlib
import re
import shutil
import subprocess
import threading
import urllib.parse
from smoke_mocked import Handler as MockHandler, ROOT

ROUTES = [
 ("index.html","tools/wishes/index.html"),
 ("index.html","tools/budget/index.html"),
 ("index.html","tools/estate/index.html"),
 ("index.html","tools/baking/index.html"),
 ("tools/wishes/index.html","tools/wishes/dashboard.html"),
 ("tools/wishes/index.html","tools/wishes/planner.html"),
 ("tools/wishes/index.html","tools/wishes/notifications.html"),
 ("tools/wishes/index.html","index.html"),
 ("tools/wishes/dashboard.html","tools/wishes/reservations.html"),
 ("tools/wishes/dashboard.html","tools/wishes/gift-tasks.html"),
 ("tools/wishes/dashboard.html","tools/wishes/gift-analytics.html"),
 ("tools/wishes/assistant.html","tools/wishes/gift-tasks.html"),
 ("tools/wishes/assistant.html","tools/wishes/gift-analytics.html"),
 ("tools/wishes/cockpit.html","tools/wishes/gift-tasks.html"),
 ("tools/wishes/planner.html","tools/wishes/occasions.html"),
 ("tools/wishes/occasions.html","tools/wishes/index.html"),
]
MARKER = "toolya-nav-result"
class Handler(MockHandler):
    def do_GET(self):
        parsed=urllib.parse.urlsplit(self.path)
        if not parsed.path.endswith(".html") and parsed.path!="/":
            return super().do_GET()
        rel=urllib.parse.unquote(parsed.path).lstrip("/") or "index.html"
        file=(ROOT/rel).resolve()
        if not file.is_relative_to(ROOT.resolve()) or not file.is_file():
            return self.send_error(404)
        content=file.read_text(encoding="utf-8")
        # Reuse the same test-only CDN stripping and mock script as the 32-page smoke.
        from smoke_mocked import MOCK
        content=re.sub(r'<script\b(?=[^>]*\bsrc=["\x27]https?://)[^>]*>\s*</script>', '', content, flags=re.I)
        target=urllib.parse.parse_qs(parsed.query).get("__nav_target",[None])[0]
        # A genuine anchor.click() triggers browser navigation; no forms or data-changing controls.
        js="""<script>
window.addEventListener('load',()=>{
 const target=__TARGET__;
 if(target){
   const link=[...document.querySelectorAll('a[href]')].find(a=>{
     try {return new URL(a.getAttribute('href'),location.href).pathname === '/'+target}
     catch(e){return false}
   });
   if(!link){document.documentElement.setAttribute('data-nav-failed','anchor-not-found');return}
   const u=new URL(link.href);u.hash='toolya-nav-check';
   link.href=u.href;
   link.click();
 } else if(location.hash==='#toolya-nav-check'){
   const e=document.createElement('script');e.type='application/json';e.id='toolya-nav-result';
   e.textContent=JSON.stringify({path:location.pathname,hash:location.hash});
   document.documentElement.appendChild(e);
 }
});
</script>""".replace("__TARGET__",json.dumps(target))
        content=re.sub(r'<head(\s[^>]*)?>',lambda m:m.group(0)+MOCK+js,content,count=1,flags=re.I)
        payload=content.encode()
        self.send_response(200)
        self.send_header("Content-Type","text/html; charset=utf-8")
        self.send_header("Content-Security-Policy","default-src 'self' data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'none'; form-action 'none'; frame-src 'none'")
        self.send_header("Content-Length",str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

def main():
    chrome=shutil.which('google-chrome') or shutil.which('chromium') or shutil.which('chromium-browser')
    if not chrome:
        print("FAIL: Chrome unavailable")
        return 1
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    failures=[]
    try:
        for source,target in ROUTES:
            url=f'http://127.0.0.1:{server.server_port}/{source}?'+urllib.parse.urlencode({'__nav_target':target})
            cmd=[chrome,'--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
                 '--disable-background-networking','--disable-extensions','--no-first-run',
                 '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
                 '--virtual-time-budget=2000','--dump-dom',url]
            try:
                p=subprocess.run(cmd,capture_output=True,text=True,timeout=30)
                match=re.search(r'<script[^>]*id="toolya-nav-result"[^>]*>(.*?)</script>',p.stdout,re.S)
                data=json.loads(match.group(1)) if match else {}
                ok=p.returncode==0 and data.get('path')=='/'+target and data.get('hash')=='#toolya-nav-check'
            except (subprocess.TimeoutExpired,ValueError):
                ok=False
            print(f'{"PASS" if ok else "FAIL"}: {source} -> {target}',flush=True)
            if not ok:failures.append({'source':source,'target':target})
        print(json.dumps({'routes':len(ROUTES),'failures':failures},indent=2))
        return 1 if failures else 0
    finally:
        server.shutdown()
if __name__=='__main__':
    raise SystemExit(main())
